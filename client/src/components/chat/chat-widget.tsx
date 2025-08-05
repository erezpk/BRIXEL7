import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, X, MinusIcon } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  messageType: 'text' | 'image' | 'file';
  createdAt: string;
  isOwnMessage: boolean;
}

interface Conversation {
  id: string;
  title: string;
  unreadCount: number;
  lastMessageAt: string;
  participants: {
    userId: string;
    name: string;
    avatar?: string;
  }[];
}

interface ChatWidgetProps {
  currentUserId: string;
  currentUserName: string;
  position?: 'bottom-right' | 'bottom-left';
  isAdmin?: boolean;
}

export default function ChatWidget({ 
  currentUserId, 
  currentUserName, 
  position = 'bottom-right',
  isAdmin = false 
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch conversations
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ['/api/chat/conversations'],
    enabled: isOpen
  });

  // Fetch messages for selected conversation
  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ['/api/chat/conversations', selectedConversation, 'messages'],
    enabled: !!selectedConversation
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { content: string; conversationId: string }) => {
      const response = await fetch(`/api/chat/conversations/${messageData.conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: messageData.content,
          messageType: 'text'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'שגיאה בשליחת הודעה');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations', selectedConversation, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
      setNewMessage("");
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה בשליחת הודעה",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Create new conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (conversationData: { title: string; clientId?: string }) => {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conversationData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'שגיאה ביצירת שיחה');
      }

      return response.json();
    },
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
      setSelectedConversation(newConversation.id);
    }
  });

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    sendMessageMutation.mutate({
      content: newMessage,
      conversationId: selectedConversation
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      fetch(`/api/chat/conversations/${selectedConversation}/read`, {
        method: 'PUT'
      });
    }
  }, [selectedConversation]);

  const totalUnreadCount = conversations.reduce((total, conv) => total + conv.unreadCount, 0);

  const positionClasses = position === 'bottom-right' 
    ? 'bottom-4 right-4' 
    : 'bottom-4 left-4';

  if (!isOpen) {
    return (
      <div className={`fixed ${positionClasses} z-50`}>
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-14 h-14 shadow-lg relative"
          size="icon"
        >
          <MessageCircle className="w-6 h-6" />
          {totalUnreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-6 h-6 flex items-center justify-center rounded-full">
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed ${positionClasses} z-50`}>
      <Card className={`w-80 h-96 shadow-xl transition-all duration-200 ${isMinimized ? 'h-12' : ''}`}>
        <CardHeader className="p-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              {selectedConversation ? 
                conversations.find(c => c.id === selectedConversation)?.title || 'שיחה' :
                'הודעות'
              }
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-6 w-6 p-0"
              >
                <MinusIcon className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0 h-80 flex flex-col">
            {!selectedConversation ? (
              // Conversations list
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-sm text-gray-500">
                    אין שיחות
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className="p-3 border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedConversation(conversation.id)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{conversation.title}</span>
                        {conversation.unreadCount > 0 && (
                          <Badge className="bg-blue-500 text-white text-xs">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(conversation.lastMessageAt).toLocaleDateString('he')}
                      </div>
                    </div>
                  ))
                )}
                
                {isAdmin && (
                  <div className="p-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => createConversationMutation.mutate({ title: 'שיחה חדשה' })}
                    >
                      שיחה חדשה
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              // Messages view
              <>
                <div className="p-2 border-b">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedConversation(null)}
                    className="text-xs"
                  >
                    ← חזור לשיחות
                  </Button>
                </div>

                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-3">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs p-2 rounded-lg text-sm ${
                          message.isOwnMessage 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {!message.isOwnMessage && (
                            <div className="text-xs font-medium mb-1 text-gray-600">
                              {message.senderName}
                            </div>
                          )}
                          <div>{message.content}</div>
                          <div className={`text-xs mt-1 ${
                            message.isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {new Date(message.createdAt).toLocaleTimeString('he', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <div className="p-3 border-t">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="הקלד הודעה..."
                      className="flex-1 text-sm"
                      disabled={sendMessageMutation.isPending}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendMessageMutation.isPending}
                      size="sm"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}