import { useState } from 'react';
import { MessageCircle, X, Send, Settings, Bot } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useChatWebSocket } from '@/hooks/useChatWebSocket';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  messageType: 'user' | 'ai' | 'system';
  createdAt: string;
  isRead: boolean;
}

interface ChatConversation {
  id: string;
  title: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
}

export function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'settings'>('chat');
  const [newMessage, setNewMessage] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // WebSocket hook for real-time messaging
  const { sendMessage, isConnected } = useChatWebSocket({
    onMessageReceived: (message) => {
      queryClient.setQueryData(['chat-messages', message.conversationId], (old: ChatMessage[] = []) => {
        return [message, ...old];
      });
    }
  });

  // Fetch conversations
  const { data: conversations = [] } = useQuery<ChatConversation[]>({
    queryKey: ['chat-conversations'],
    queryFn: async () => {
      const res = await fetch('/api/chat/conversations');
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isOpen,
    retry: false
  });

  // Fetch messages for selected conversation
  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ['chat-messages', selectedConversation],
    queryFn: async () => {
      const res = await fetch(`/api/chat/conversations/${selectedConversation}/messages`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedConversation,
    retry: false
  });

  // Fetch chat settings
  const { data: settings } = useQuery({
    queryKey: ['chat-settings'],
    queryFn: async () => {
      const res = await fetch('/api/chat/settings');
      if (!res.ok) return { aiEnabled: false, allowFileSharing: true };
      return res.json();
    },
    enabled: isOpen,
    retry: false
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { conversationId: string; content: string; messageType: 'user' | 'ai' }) => {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: (newMessage) => {
      queryClient.setQueryData(['chat-messages', selectedConversation], (old: ChatMessage[] = []) => {
        return [newMessage, ...old];
      });
      sendMessage(newMessage); // Send via WebSocket for real-time updates
    }
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: any) => {
      const response = await fetch('/api/chat/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-settings'] });
    }
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (title: string) => {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, conversationType: 'general' })
      });
      return response.json();
    },
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
      setSelectedConversation(conversation.id);
    }
  });

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    sendMessageMutation.mutate({
      conversationId: selectedConversation,
      content: newMessage,
      messageType: 'user'
    });

    setNewMessage('');

    // If AI is enabled, send AI response
    if (settings?.aiEnabled) {
      setTimeout(() => {
        sendMessageMutation.mutate({
          conversationId: selectedConversation,
          content: 'זוהי תגובה אוטומטית מהעוזר הדיגיטלי. איך אוכל לעזור לך?',
          messageType: 'ai'
        });
      }, 1000);
    }
  };

  const startNewConversation = () => {
    createConversationMutation.mutate('שיחה חדשה');
  };

  const totalUnreadMessages = Array.isArray(conversations) ? conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0) : 0;

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-6 left-6 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-full w-14 h-14 shadow-lg bg-blue-600 hover:bg-blue-700 text-white"
          size="icon"
        >
          {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
          {totalUnreadMessages > 0 && (
            <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-[1.25rem] h-5 flex items-center justify-center">
              {totalUnreadMessages > 99 ? '99+' : totalUnreadMessages}
            </Badge>
          )}
        </Button>
      </div>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 left-6 z-40 w-80 h-96">
          <Card className="w-full h-full shadow-xl">
            <CardHeader className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-right">צ'אט צוות</h3>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab(activeTab === 'chat' ? 'settings' : 'chat')}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex gap-2 mt-2">
                <Button
                  variant={activeTab === 'chat' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('chat')}
                >
                  שיחות
                </Button>
                <Button
                  variant={activeTab === 'settings' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('settings')}
                >
                  הגדרות
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0 h-full">
              {activeTab === 'chat' ? (
                <div className="flex h-full">
                  {/* Conversations List */}
                  <div className="w-1/3 border-r bg-gray-50">
                    <div className="p-3 border-b">
                      <Button
                        size="sm"
                        onClick={startNewConversation}
                        className="w-full text-xs"
                      >
                        שיחה חדשה
                      </Button>
                    </div>
                    <ScrollArea className="h-48">
                      {Array.isArray(conversations) && conversations.map((conv) => (
                        <div
                          key={conv.id}
                          className={`p-3 cursor-pointer hover:bg-gray-100 border-b ${
                            selectedConversation === conv.id ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => setSelectedConversation(conv.id)}
                        >
                          <div className="text-sm font-medium text-right truncate">
                            {conv.title}
                          </div>
                          <div className="text-xs text-gray-500 text-right truncate">
                            {conv.lastMessage}
                          </div>
                          {conv.unreadCount > 0 && (
                            <Badge className="float-left bg-blue-500 text-white text-xs">
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </ScrollArea>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 flex flex-col">
                    {selectedConversation ? (
                      <>
                        <ScrollArea className="flex-1 p-3">
                          <div className="space-y-3">
                            {Array.isArray(messages) && messages.map((message) => (
                              <div
                                key={message.id}
                                className={`flex ${message.messageType === 'user' ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-[80%] p-2 rounded-lg text-sm ${
                                    message.messageType === 'user'
                                      ? 'bg-blue-500 text-white'
                                      : message.messageType === 'ai'
                                      ? 'bg-purple-100 text-purple-800'
                                      : 'bg-gray-200 text-gray-800'
                                  }`}
                                >
                                  {message.messageType === 'ai' && (
                                    <div className="flex items-center gap-1 mb-1">
                                      <Bot className="h-3 w-3" />
                                      <span className="text-xs font-medium">עוזר דיגיטלי</span>
                                    </div>
                                  )}
                                  <div className="text-right">{message.content}</div>
                                  <div className="text-xs opacity-70 mt-1 text-right">
                                    {new Date(message.createdAt).toLocaleTimeString('he-IL')}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>

                        {/* Message Input */}
                        <div className="p-3 border-t">
                          <div className="flex gap-2">
                            <Button
                              onClick={handleSendMessage}
                              disabled={!newMessage.trim() || sendMessageMutation.isPending}
                              size="sm"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                            <Input
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              placeholder="הקלד הודעה..."
                              className="text-right"
                              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-gray-500">
                        בחר שיחה כדי להתחיל
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Settings Tab */
                <div className="p-4 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">עוזר דיגיטלי AI</span>
                      <Switch
                        checked={settings?.aiEnabled || false}
                        onCheckedChange={(checked) =>
                          updateSettingsMutation.mutate({ ...settings, aiEnabled: checked })
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">שיתוף קבצים</span>
                      <Switch
                        checked={settings?.allowFileSharing || false}
                        onCheckedChange={(checked) =>
                          updateSettingsMutation.mutate({ ...settings, allowFileSharing: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm">התראות</span>
                      <Switch
                        checked={settings?.notificationsEnabled || true}
                        onCheckedChange={(checked) =>
                          updateSettingsMutation.mutate({ ...settings, notificationsEnabled: checked })
                        }
                      />
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 text-right">
                    <p>עוזר דיגיטלי: כאשר מופעל, העוזר הדיגיטלי יעזור בשאלות ומשימות שונות</p>
                    <p className="mt-2">מצב חיבור: {isConnected ? 'מחובר' : 'מנותק'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}