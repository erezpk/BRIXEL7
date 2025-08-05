
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Calendar, 
  MessageSquare,
  Download,
  Eye,
  User,
  LogOut,
  Bell,
  Settings,
  Home,
  FolderOpen,
  Activity,
  Send
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  progress?: number;
  clientId?: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  projectId: string;
}

interface DigitalAsset {
  id: string;
  name: string;
  type: string;
  value: string;
  expiryDate?: string;
  projectId: string;
}

interface ClientMessage {
  id: string;
  content: string;
  timestamp: string;
  isFromClient: boolean;
  projectId: string;
}

export default function ClientDashboard() {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');

  // Get client ID from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const clientId = urlParams.get('clientId');
  const projectId = urlParams.get('projectId');

  const { data: clientProjects = [] } = useQuery<Project[]>({
    queryKey: ['/api/client/projects', clientId],
    enabled: isAuthenticated && !!clientId,
  });

  const { data: clientTasks = [] } = useQuery<Task[]>({
    queryKey: ['/api/client/tasks', clientId],
    enabled: isAuthenticated && !!clientId,
  });

  const { data: clientAssets = [] } = useQuery<DigitalAsset[]>({
    queryKey: ['/api/client/assets', clientId],
    enabled: isAuthenticated && !!clientId,
  });

  const { data: messages = [] } = useQuery<ClientMessage[]>({
    queryKey: ['/api/client/messages', clientId],
    enabled: isAuthenticated && !!clientId,
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // כאן נוסיף לוגיקת התחברות מול השרת
    // לעת עתה נחשב את זה כהתחברות מוצלחת
    if (loginForm.email && loginForm.password) {
      setIsAuthenticated(true);
      toast({
        title: "התחברות מוצלחת",
        description: "ברוך הבא לפורטל הלקוח שלך",
      });
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedProjectId) {
      // כאן נוסיף API call לשליחת הודעה
      toast({
        title: "הודעה נשלחה",
        description: "ההודעה נשלחה לצוות הסוכנות",
      });
      setNewMessage('');
      setShowMessageModal(false);
    }
  };

  const getProjectProgress = (project: Project) => {
    const projectTasks = clientTasks.filter(task => task.projectId === project.id);
    if (projectTasks.length === 0) return 0;
    
    const completedTasks = projectTasks.filter(task => task.status === 'completed');
    return Math.round((completedTasks.length / projectTasks.length) * 100);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'planning': { label: 'תכנון', color: 'bg-blue-100 text-blue-800' },
      'in_progress': { label: 'בתהליך', color: 'bg-yellow-100 text-yellow-800' },
      'review': { label: 'בבדיקה', color: 'bg-orange-100 text-orange-800' },
      'completed': { label: 'הושלם', color: 'bg-green-100 text-green-800' },
      'on_hold': { label: 'מושהה', color: 'bg-gray-100 text-gray-800' },
    }[status] || { label: status, color: 'bg-gray-100 text-gray-800' };

    return (
      <Badge className={statusConfig.color} variant="secondary">
        {statusConfig.label}
      </Badge>
    );
  };

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'review':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  // אם המשתמש לא מחובר, הצג מסך התחברות
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center" dir="rtl">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">פורטל הלקוח</CardTitle>
            <p className="text-muted-foreground">התחבר כדי לגשת לפרויקטים שלך</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">אימייל</Label>
                <Input
                  id="email"
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  placeholder="הכנס אימייל"
                  className="text-right"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">סיסמה</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="הכנס סיסמה"
                  className="text-right"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                התחבר
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Home className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-800">פורטל הלקוח שלי</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsAuthenticated(false)}
              >
                <LogOut className="h-4 w-4 ml-2" />
                התנתק
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">פרויקטים פעילים</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clientProjects.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">משימות פתוחות</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {clientTasks.filter(task => task.status !== 'completed').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">נכסים דיגיטליים</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clientAssets.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">הודעות חדשות</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {messages.filter(msg => !msg.isFromClient).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Project Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {clientProjects.map((project) => {
            const progress = getProjectProgress(project);
            const projectTasks = clientTasks.filter(task => task.projectId === project.id);
            const completedTasks = projectTasks.filter(task => task.status === 'completed').length;

            return (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg font-semibold text-right flex-1">
                      {project.name}
                    </CardTitle>
                    {getStatusBadge(project.status)}
                  </div>
                  <p className="text-sm text-muted-foreground text-right line-clamp-2">
                    {project.description}
                  </p>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">התקדמות</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {/* Task Summary */}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">משימות</span>
                    <span className="font-medium">
                      {completedTasks} מתוך {projectTasks.length}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="h-4 w-4 ml-1" />
                      פרטים
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSelectedProjectId(project.id);
                        setShowMessageModal(true);
                      }}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Tabs defaultValue="tasks" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tasks">משימות אחרונות</TabsTrigger>
            <TabsTrigger value="assets">נכסים דיגיטליים</TabsTrigger>
            <TabsTrigger value="files">קבצים</TabsTrigger>
            <TabsTrigger value="messages">הודעות</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-right">משימות בפרויקטים שלך</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {clientTasks.slice(0, 10).map((task) => {
                    const project = clientProjects.find(p => p.id === task.projectId);
                    
                    return (
                      <div key={task.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex-shrink-0">
                          {getTaskStatusIcon(task.status)}
                        </div>
                        
                        <div className="flex-1 text-right">
                          <h4 className="font-medium">{task.title}</h4>
                          {project && (
                            <p className="text-sm text-muted-foreground">
                              פרויקט: {project.name}
                            </p>
                          )}
                          {task.dueDate && (
                            <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>יעד: {new Date(task.dueDate).toLocaleDateString('he-IL')}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex-shrink-0">
                          {getStatusBadge(task.status)}
                        </div>
                      </div>
                    );
                  })}

                  {clientTasks.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>אין משימות פעילות כרגע</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-right">הנכסים הדיגיטליים שלך</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {clientAssets.map((asset) => (
                    <div key={asset.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-right">{asset.name}</h4>
                        <Badge variant="outline">{asset.type}</Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">{asset.value}</p>
                      
                      {asset.expiryDate && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>פוגה: {new Date(asset.expiryDate).toLocaleDateString('he-IL')}</span>
                        </div>
                      )}
                    </div>
                  ))}

                  {clientAssets.length === 0 && (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>אין נכסים דיגיטליים רשומים</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="files" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-right">קבצים והחזקות</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "תיק עיצוב לוגו - גרסה סופית.zip", size: "2.4 MB", date: "2024-01-15" },
                    { name: "מסמכי פרויקט אתר.pdf", size: "847 KB", date: "2024-01-12" },
                    { name: "הצעת מחיר עדכנית.pdf", size: "245 KB", date: "2024-01-10" }
                  ].map((file, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50">
                      <FileText className="h-8 w-8 text-blue-600 flex-shrink-0" />
                      
                      <div className="flex-1 text-right">
                        <h4 className="font-medium">{file.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {file.size} • {new Date(file.date).toLocaleDateString('he-IL')}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            <Card>
              <CardHeader className="flex justify-between items-center">
                <CardTitle className="text-right">תקשורת עם הסוכנות</CardTitle>
                <Button onClick={() => setShowMessageModal(true)}>
                  <Send className="h-4 w-4 ml-2" />
                  הודעה חדשה
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className={`p-4 rounded-lg ${
                      message.isFromClient ? 'bg-blue-50 mr-8' : 'bg-gray-50 ml-8'
                    }`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-muted-foreground">
                          {new Date(message.timestamp).toLocaleString('he-IL')}
                        </span>
                        <Badge variant={message.isFromClient ? 'default' : 'secondary'}>
                          {message.isFromClient ? 'אתה' : 'הסוכנות'}
                        </Badge>
                      </div>
                      <p className="text-right">{message.content}</p>
                    </div>
                  ))}

                  {messages.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>אין הודעות עדיין. שלח הודעה ראשונה!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Message Modal */}
      <Dialog open={showMessageModal} onOpenChange={setShowMessageModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right">שלח הודעה לסוכנות</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-right">תוכן ההודעה</Label>
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="כתוב את ההודעה שלך כאן..."
                className="text-right min-h-[100px]"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowMessageModal(false)}>
                ביטול
              </Button>
              <Button onClick={handleSendMessage}>
                <Send className="h-4 w-4 ml-2" />
                שלח
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
