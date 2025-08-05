import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  Paperclip, 
  Image, 
  Smile, 
  MoreHorizontal,
  Check,
  CheckCheck
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface Message {
  id: string;
  content: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  timestamp: Date;
  isRead: boolean;
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
  }>;
}

interface ProjectChatProps {
  projectId: string;
  currentUserId: string;
}

export function ProjectChat({ projectId, currentUserId }: ProjectChatProps) {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ['/api/projects', projectId, 'messages'],
    refetchInterval: 5000, // Poll for new messages every 5 seconds
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest('POST', `/api/projects/${projectId}/messages`, {
        content,
        userId: currentUserId
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'messages'] });
      setMessage("");
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessageMutation.mutate(message.trim());
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('he-IL', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const messageDate = new Date(date);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return 'היום';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'אתמול';
    }
    
    return new Intl.DateTimeFormat('he-IL', {
      day: 'numeric',
      month: 'long'
    }).format(messageDate);
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach(message => {
      const date = new Date(message.timestamp).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  };

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="text-right">צ'אט פרויקט</span>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            פעיל
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 py-4">
            {Object.entries(groupedMessages).map(([date, dayMessages]) => (
              <div key={date}>
                {/* Date Separator */}
                <div className="flex items-center justify-center my-4">
                  <Separator className="flex-1" />
                  <span className="px-3 text-xs text-muted-foreground bg-background">
                    {formatDate(new Date(date))}
                  </span>
                  <Separator className="flex-1" />
                </div>

                {/* Messages for this date */}
                <div className="space-y-3">
                  {dayMessages.map((msg) => {
                    const isCurrentUser = msg.userId === currentUserId;
                    
                    return (
                      <div
                        key={msg.id}
                        className={`flex items-end gap-2 ${isCurrentUser ? 'justify-start' : 'justify-end'}`}
                      >
                        {!isCurrentUser && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={msg.userAvatar} />
                            <AvatarFallback className="text-xs">
                              {msg.userName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div className={`max-w-[70%] ${isCurrentUser ? 'order-first' : ''}`}>
                          {!isCurrentUser && (
                            <div className="text-xs text-muted-foreground mb-1 text-right">
                              {msg.userName}
                            </div>
                          )}
                          
                          <div
                            className={`rounded-lg px-3 py-2 ${
                              isCurrentUser
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm text-right whitespace-pre-wrap">
                              {msg.content}
                            </p>
                            
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {msg.attachments.map((attachment) => (
                                  <div
                                    key={attachment.id}
                                    className="flex items-center gap-2 p-2 bg-white/10 rounded text-xs"
                                  >
                                    <Paperclip className="h-3 w-3" />
                                    <span>{attachment.name}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <div className={`flex items-center gap-1 mt-1 text-xs text-muted-foreground ${isCurrentUser ? 'justify-start' : 'justify-end'}`}>
                            <span>{formatTime(msg.timestamp)}</span>
                            {isCurrentUser && (
                              <div className="flex">
                                {msg.isRead ? (
                                  <CheckCheck className="h-3 w-3 text-blue-500" />
                                ) : (
                                  <Check className="h-3 w-3" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {isCurrentUser && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={msg.userAvatar} />
                            <AvatarFallback className="text-xs">
                              {msg.userName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            
            {messages.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-4xl mb-4">💬</div>
                <p>עדיין אין הודעות בצ'אט הזה</p>
                <p className="text-sm">שלח הודעה ראשונה כדי להתחיל שיחה</p>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Typing Indicator */}
        {isTyping && (
          <div className="px-4 py-2 text-sm text-muted-foreground text-right">
            מישהו כותב...
          </div>
        )}

        {/* Message Input */}
        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="p-2"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="p-2"
              >
                <Image className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="p-2"
              >
                <Smile className="h-4 w-4" />
              </Button>
            </div>
            
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="כתוב הודעה..."
              className="flex-1 text-right"
              dir="rtl"
            />
            
            <Button
              type="submit"
              disabled={!message.trim() || sendMessageMutation.isPending}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}