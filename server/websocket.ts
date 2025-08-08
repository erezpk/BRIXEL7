import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { parse } from 'url';
import type { DatabaseStorage } from './storage';
import { ChatService } from './chatService';

export interface SocketMessage {
  type: string;
  data?: any;
  conversationId?: string;
  messageId?: string;
}

export function setupWebSocketServer(server: Server, storage: DatabaseStorage) {
  const wss = new WebSocketServer({ 
    server,
    path: '/ws'
  });

  const chatService = new ChatService(storage);

  wss.on('connection', async (ws: WebSocket, req) => {
    let userId: string | null = null;
    let agencyId: string | null = null;
    let userRole: string | null = null;

    // Extract user info from session (you'll need to implement session parsing)
    try {
      // TODO: Parse session from request to get authenticated user
      // For now, we'll handle authentication through messages
      console.log('New WebSocket connection established');
    } catch (error) {
      console.error('WebSocket authentication error:', error);
      ws.close(1008, 'Authentication failed');
      return;
    }

    // Handle incoming messages
    ws.on('message', async (rawMessage: Buffer) => {
      try {
        const message: SocketMessage = JSON.parse(rawMessage.toString());
        
        switch (message.type) {
          case 'chat:auth':
            // Handle authentication
            if (message.data?.userId && message.data?.agencyId && message.data?.role) {
              userId = message.data.userId;
              agencyId = message.data.agencyId;
              userRole = message.data.role;
              
              chatService.addUser(userId, agencyId, userRole, ws);
              
              ws.send(JSON.stringify({
                type: 'chat:auth_success',
                data: { userId, agencyId }
              }));
            } else {
              ws.send(JSON.stringify({
                type: 'chat:auth_error',
                data: { message: 'נתוני אימות לא תקינים' }
              }));
            }
            break;

          case 'chat:join':
            if (userId && message.conversationId) {
              const canAccess = await chatService.canUserAccessConversation(
                userId, 
                message.conversationId, 
                'read'
              );
              
              if (canAccess) {
                chatService.joinConversation(userId, message.conversationId);
                
                // Send recent messages
                const messages = await storage.getChatMessages(message.conversationId, 50);
                ws.send(JSON.stringify({
                  type: 'chat:conversation_history',
                  data: { conversationId: message.conversationId, messages }
                }));
              } else {
                ws.send(JSON.stringify({
                  type: 'chat:error',
                  data: { message: 'אין הרשאה לגשת לשיחה זו' }
                }));
              }
            }
            break;

          case 'chat:leave':
            if (userId && message.conversationId) {
              chatService.leaveConversation(userId, message.conversationId);
            }
            break;

          case 'chat:message':
            if (userId && message.conversationId && message.data?.content) {
              const sentMessage = await chatService.sendMessage(
                message.conversationId,
                userId,
                message.data.content,
                message.data.type || 'text',
                message.data.metadata
              );

              if (!sentMessage) {
                ws.send(JSON.stringify({
                  type: 'chat:error',
                  data: { message: 'שליחת ההודעה נכשלה' }
                }));
              }
            }
            break;

          case 'chat:typing':
            if (userId && message.conversationId) {
              // Broadcast typing indicator to other participants
              const conversation = await storage.getChatConversation(message.conversationId);
              if (conversation) {
                const participants = conversation.participants.filter(p => p !== userId);
                
                participants.forEach(participantId => {
                  // Send typing indicator to connected participants
                  // Implementation depends on how you track connected users
                });
              }
            }
            break;

          case 'chat:read':
            if (userId && message.messageId) {
              // Mark message as read
              await storage.markMessageAsRead(message.messageId, userId);
            }
            break;

          case 'chat:ai_assistant':
            if (userId && agencyId && message.data?.message) {
              // Check if user has permission to use AI assistant
              const user = await storage.getUserById(userId);
              if (user?.role === 'agency_admin') {
                const response = await chatService.processAIAssistant(
                  message.conversationId!,
                  message.data.message,
                  agencyId
                );
                
                if (response) {
                  // Send AI response as a system message
                  await chatService.sendMessage(
                    message.conversationId!,
                    'system',
                    response,
                    'ai_response',
                    { aiModel: 'gpt-4' }
                  );
                }
              }
            }
            break;

          case 'chat:support_bot':
            if (userId && agencyId && message.data?.message) {
              const response = await chatService.processClientSupportBot(
                message.data.message,
                agencyId
              );
              
              // Send bot response
              await chatService.sendMessage(
                message.conversationId!,
                'system',
                response,
                'bot',
                { botName: 'עוזר התמיכה' }
              );
            }
            break;

          default:
            ws.send(JSON.stringify({
              type: 'chat:error',
              data: { message: 'סוג הודעה לא נתמך' }
            }));
        }
      } catch (error) {
        console.error('WebSocket message processing error:', error);
        ws.send(JSON.stringify({
          type: 'chat:error',
          data: { message: 'שגיאה בעיבוד ההודעה' }
        }));
      }
    });

    // Handle connection close
    ws.on('close', () => {
      if (userId) {
        chatService.removeUser(userId);
        console.log(`User ${userId} disconnected from WebSocket`);
      }
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Send ping every 30 seconds to keep connection alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      } else {
        clearInterval(pingInterval);
      }
    }, 30000);
  });

  console.log('✅ WebSocket server initialized on /ws');
  return wss;
}