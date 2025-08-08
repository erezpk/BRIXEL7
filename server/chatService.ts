import OpenAI from 'openai';
import { WebSocket } from 'ws';
import { Request } from 'express';
import type { DatabaseStorage } from './storage';
import * as schema from '@shared/schema';

export interface ChatUser {
  id: string;
  agencyId: string;
  role: string;
  socket: WebSocket;
  lastSeen: Date;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId?: string;
  content: string;
  type: 'text' | 'file' | 'system' | 'bot' | 'ai_response';
  metadata?: Record<string, any>;
  createdAt: Date;
}

export class ChatService {
  private openai: OpenAI | null = null;
  private connectedUsers = new Map<string, ChatUser>();
  private conversationParticipants = new Map<string, Set<string>>();
  private rateLimiter = new Map<string, { count: number; resetTime: number }>();

  constructor(private storage: DatabaseStorage) {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  // User connection management
  addUser(userId: string, agencyId: string, role: string, socket: WebSocket) {
    const user: ChatUser = {
      id: userId,
      agencyId,
      role,
      socket,
      lastSeen: new Date(),
    };
    
    this.connectedUsers.set(userId, user);
    this.broadcastPresence(userId, agencyId, 'online');
  }

  removeUser(userId: string) {
    const user = this.connectedUsers.get(userId);
    if (user) {
      this.broadcastPresence(userId, user.agencyId, 'offline');
      this.connectedUsers.delete(userId);
    }
  }

  // Permission validation
  async canUserAccessConversation(userId: string, conversationId: string, action: 'read' | 'write'): Promise<boolean> {
    try {
      const user = await this.storage.getUserById(userId);
      if (!user) return false;

      const conversation = await this.storage.getChatConversation(conversationId);
      if (!conversation || conversation.agencyId !== user.agencyId) return false;

      // Check if user is participant
      if (!conversation.participants.includes(userId)) {
        // Agency Admin can access all conversations
        if (user.role === 'agency_admin') return true;
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking conversation access:', error);
      return false;
    }
  }

  // Rate limiting
  checkRateLimit(userId: string, action: 'message' | 'file'): boolean {
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const limits = { message: 20, file: 10 };
    
    const key = `${userId}:${action}`;
    const current = this.rateLimiter.get(key);
    
    if (!current || now > current.resetTime) {
      this.rateLimiter.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (current.count >= limits[action]) {
      return false;
    }
    
    current.count++;
    return true;
  }

  // Message sending
  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    type: 'text' | 'file' = 'text',
    metadata?: Record<string, any>
  ): Promise<ChatMessage | null> {
    try {
      // Check permissions
      if (!await this.canUserAccessConversation(senderId, conversationId, 'write')) {
        throw new Error('אין הרשאה לשלוח הודעה בשיחה זו');
      }

      // Check rate limit
      if (!this.checkRateLimit(senderId, type === 'file' ? 'file' : 'message')) {
        throw new Error('חריגה ממגבלת השליחה. נסה שוב מאוחר יותר');
      }

      // Store message in database
      const message = await this.storage.createChatMessage({
        conversationId,
        senderId,
        content,
        type,
        metadata: metadata || {},
        readBy: { [senderId]: new Date().toISOString() },
      });

      // Update conversation last message time
      await this.storage.updateChatConversation(conversationId, {
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      });

      // Broadcast to participants
      await this.broadcastToConversation(conversationId, {
        type: 'chat:message',
        data: message,
      });

      // Audit log
      await this.storage.createChatAuditLog({
        agencyId: (await this.storage.getChatConversation(conversationId))?.agencyId || '',
        userId: senderId,
        conversationId,
        messageId: message.id,
        action: 'send',
        metadata: { type, contentLength: content.length },
      });

      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  }

  // AI Assistant
  async processAIAssistant(conversationId: string, userMessage: string, agencyId: string): Promise<string | null> {
    if (!this.openai) {
      return 'שירות העוזר הדיגיטלי אינו זמין כרגע';
    }

    try {
      const settings = await this.storage.getChatSettings(agencyId);
      const aiConfig = settings?.aiAssistantConfig;

      if (!aiConfig?.enabled) {
        return null;
      }

      // Get conversation context
      const messages = await this.storage.getChatMessages(conversationId, 10);
      const context = messages
        .filter(m => m.type === 'text' && !m.isDeleted)
        .slice(-5)
        .map(m => `${m.senderId === 'ai' ? 'Assistant' : 'User'}: ${m.content}`)
        .join('\n');

      const systemPrompt = `${aiConfig.systemPrompt}

קונטקסט השיחה האחרונה:
${context}

הנחיות:
- ענה באופן מקצועי ובעברית
- השתמש במידע הסוכנות אם זמין
- אם אינך יודע משהו, הודה על כך
- הצע פתרונות מעשיים`;

      const completion = await this.openai.chat.completions.create({
        model: aiConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: aiConfig.temperature,
        max_tokens: aiConfig.maxTokens,
      });

      return completion.choices[0]?.message?.content || 'מצטער, לא הצלחתי לעבד את הבקשה';
    } catch (error) {
      console.error('AI Assistant error:', error);
      return 'אירעה שגיאה בעוזר הדיגיטלי. נסה שוב מאוחר יותר';
    }
  }

  // Client Support Bot
  async processClientSupportBot(message: string, agencyId: string): Promise<string> {
    const settings = await this.storage.getChatSettings(agencyId);
    const botConfig = settings?.botConfig;

    if (!botConfig?.enabled) {
      return 'שירות התמיכה אינו זמין כרגע';
    }

    // Simple keyword-based responses for now
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('שלום') || lowerMessage.includes('היי')) {
      return botConfig.welcomeMessage;
    }
    
    if (lowerMessage.includes('תמיכה') || lowerMessage.includes('עזרה')) {
      return 'אני כאן לעזור! באיזה תחום תרצה סיוע?\n• שאלות טכניות\n• מידע על שירותים\n• תמיכה כללית\n\nלחילופין, תוכל לדבר עם נציג אנושי';
    }
    
    if (lowerMessage.includes('נציג') || lowerMessage.includes('אדם')) {
      return 'מעביר אותך לנציג אנושי. אנא המתן רגע...';
    }

    return 'לא הבנתי את הבקשה. האם תוכל לנסח אותה מחדש? או לחלופין תוכל לדבר עם נציג אנושי';
  }

  // Broadcasting
  private async broadcastToConversation(conversationId: string, message: any) {
    const conversation = await this.storage.getChatConversation(conversationId);
    if (!conversation) return;

    const participants = this.conversationParticipants.get(conversationId) || new Set();
    
    participants.forEach(userId => {
      const user = this.connectedUsers.get(userId);
      if (user && user.socket.readyState === WebSocket.OPEN) {
        user.socket.send(JSON.stringify(message));
      }
    });
  }

  private broadcastPresence(userId: string, agencyId: string, status: 'online' | 'offline') {
    // Broadcast to all users in the same agency
    for (const [, user] of this.connectedUsers) {
      if (user.agencyId === agencyId && user.socket.readyState === WebSocket.OPEN) {
        user.socket.send(JSON.stringify({
          type: 'chat:presence',
          data: { userId, status, timestamp: new Date().toISOString() },
        }));
      }
    }
  }

  // Conversation management
  joinConversation(userId: string, conversationId: string) {
    if (!this.conversationParticipants.has(conversationId)) {
      this.conversationParticipants.set(conversationId, new Set());
    }
    this.conversationParticipants.get(conversationId)!.add(userId);
  }

  leaveConversation(userId: string, conversationId: string) {
    const participants = this.conversationParticipants.get(conversationId);
    if (participants) {
      participants.delete(userId);
      if (participants.size === 0) {
        this.conversationParticipants.delete(conversationId);
      }
    }
  }
}