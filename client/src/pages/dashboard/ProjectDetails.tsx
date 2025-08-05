import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowRight, 
  Edit, 
  MessageCircle, 
  Users, 
  Calendar,
  DollarSign,
  Clock,
  Eye,
  Send,
  Paperclip,
  CheckSquare
} from "lucide-react";
import { type Project, type Task, type User, type DigitalAsset, type TaskComment } from "@shared/schema";
import { format } from "date-fns";
import { he } from "date-fns/locale";

export default function ProjectDetails() {
  const [, params] = useRoute("/dashboard/projects/:id");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const [isViewingAsClient, setIsViewingAsClient] = useState(false);

  const projectId = params?.id;

  // Fetch project details
  const { data: project, isLoading } = useQuery<Project>({
    queryKey: ['/api/projects', projectId],
    enabled: !!projectId,
  });

  // Fetch project tasks
  const { data: tasks } = useQuery<Task[]>({
    queryKey: ['/api/tasks', { projectId }],
    queryFn: async () => {
      const response = await fetch(`/api/tasks?projectId=${projectId}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch tasks');
      return response.json();
    },
    enabled: !!projectId,
  });

  // Fetch project chat/comments
  const { data: projectComments } = useQuery<TaskComment[]>({
    queryKey: ['/api/projects', projectId, 'comments'],
    queryFn: async () => {
      // For now, return empty array - this would be a separate API endpoint
      return [];
    },
    enabled: !!projectId,
  });

  // Fetch digital assets for this project
  const { data: assets } = useQuery<DigitalAsset[]>({
    queryKey: ['/api/digital-assets', { projectId }],
    queryFn: async () => {
      // For now, return empty array - this would be a separate API endpoint
      return [];
    },
    enabled: !!projectId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      // This would be implemented as a project message/comment system
      const response = await apiRequest('POST', `/api/projects/${projectId}/messages`, {
        content: message
      });
      return response.json();
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'comments'] });
      toast({
        title: "הודעה נשלחה",
        description: "ההודעה נוספה לפרויקט",
      });
    },
    onError: () => {
      toast({
        title: "שגיאה",
        description: "לא ניתן לשלוח הודעה כרגע",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    sendMessageMutation.mutate(newMessage);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-medium text-gray-600">פרויקט לא נמצא</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-reverse space-x-4">
          <Button 
            variant="ghost" 
            onClick={() => window.history.back()}
            className="flex items-center space-x-reverse space-x-2"
          >
            <ArrowRight className="h-4 w-4" />
            <span>חזרה</span>
          </Button>
          <div className="border-r border-gray-300 h-6"></div>
          <h1 className="text-2xl font-bold text-gray-900 font-rubik">{project.name}</h1>
        </div>

        <div className="flex items-center space-x-reverse space-x-2">
          <Button
            variant={isViewingAsClient ? "default" : "outline"}
            onClick={() => setIsViewingAsClient(!isViewingAsClient)}
            className="flex items-center space-x-reverse space-x-2"
          >
            <Eye className="h-4 w-4" />
            <span>{isViewingAsClient ? "תצוגת סוכנות" : "תצוגת לקוח"}</span>
          </Button>
          <Button variant="outline" className="flex items-center space-x-reverse space-x-2">
            <Edit className="h-4 w-4" />
            <span>עריכת פרויקט</span>
          </Button>
        </div>
      </div>

      {/* Project Info Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">סטטוס</h3>
              <Badge className={getStatusColor(project.status)}>
                {project.status === 'planning' && 'תכנון'}
                {project.status === 'active' && 'פעיל'}
                {project.status === 'completed' && 'הושלם'}
                {project.status === 'cancelled' && 'בוטל'}
              </Badge>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">עדיפות</h3>
              <Badge className={getPriorityColor(project.priority)}>
                {project.priority === 'low' && 'נמוך'}
                {project.priority === 'medium' && 'בינוני'}
                {project.priority === 'high' && 'גבוה'}
                {project.priority === 'urgent' && 'דחוף'}
              </Badge>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">תאריך התחלה</h3>
              <div className="flex items-center space-x-reverse space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>
                  {project.startDate 
                    ? format(new Date(project.startDate), "dd/MM/yyyy", { locale: he })
                    : "לא נקבע"
                  }
                </span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">תקציב</h3>
              <div className="flex items-center space-x-reverse space-x-2">
                <DollarSign className="h-4 w-4 text-gray-400" />
                <span>
                  {project.budget 
                    ? `₪${(project.budget / 100).toLocaleString()}`
                    : "לא נקבע"
                  }
                </span>
              </div>
            </div>
          </div>
          
          {project.description && (
            <div className="mt-4 pt-4 border-t">
              <h3 className="text-sm font-medium text-gray-500 mb-2">תיאור הפרויקט</h3>
              <p className="text-gray-700 text-right">{project.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tasks">משימות</TabsTrigger>
          <TabsTrigger value="chat">התכתבות</TabsTrigger>
          <TabsTrigger value="assets">נכסים דיגיטליים</TabsTrigger>
          <TabsTrigger value="team">צוות</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>משימות הפרויקט</span>
                <Badge variant="secondary">{tasks?.length || 0} משימות</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tasks && tasks.length > 0 ? (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-reverse space-x-3">
                        <CheckSquare className="h-4 w-4 text-gray-400" />
                        <div>
                          <h4 className="font-medium text-right">{task.title}</h4>
                          {task.description && (
                            <p className="text-sm text-gray-500 text-right">{task.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-reverse space-x-2">
                        <Badge className={getStatusColor(task.status)}>
                          {task.status === 'new' && 'חדש'}
                          {task.status === 'in_progress' && 'בביצוע'}
                          {task.status === 'completed' && 'הושלם'}
                          {task.status === 'cancelled' && 'בוטל'}
                        </Badge>
                        {task.dueDate && (
                          <span className="text-xs text-gray-500">
                            {format(new Date(task.dueDate), "dd/MM", { locale: he })}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>אין משימות בפרויקט זה</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-reverse space-x-2">
                <MessageCircle className="h-5 w-5" />
                <span>התכתבות פרויקט</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Chat Messages */}
                <div className="h-96 border rounded-lg p-4 overflow-y-auto bg-gray-50">
                  {projectComments && projectComments.length > 0 ? (
                    <div className="space-y-3">
                      {projectComments.map((comment, index) => (
                        <div key={index} className="flex items-start space-x-reverse space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {user?.fullName?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 bg-white rounded-lg p-3 shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{user?.fullName}</span>
                              <span className="text-xs text-gray-500">
                                {format(new Date(comment.createdAt), "HH:mm dd/MM", { locale: he })}
                              </span>
                            </div>
                            <p className="text-sm text-right">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>אין הודעות עדיין</p>
                      <p className="text-sm">התחל שיחה עם הצוות והלקוח</p>
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="flex items-center space-x-reverse space-x-2">
                  <Button variant="outline" size="sm">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="כתוב הודעה..."
                    className="flex-1 text-right"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                    size="sm"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>נכסים דיגיטליים</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>ניהול נכסים דיגיטליים יתווסף בקרוב</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-reverse space-x-2">
                <Users className="h-5 w-5" />
                <span>צוות הפרויקט</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>ניהול צוות הפרויקט יתווסף בקרוב</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}