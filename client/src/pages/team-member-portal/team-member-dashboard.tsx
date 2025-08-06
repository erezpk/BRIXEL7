
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckSquare, 
  Clock, 
  Users, 
  Calendar,
  BarChart3,
  FileText,
  Bell,
  User,
  Briefcase,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Play,
  Pause,
  Square,
  Edit,
  Eye
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { type Task, type Project, type Client, type ActivityLog } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { KanbanBoard } from "@/components/tasks/kanban-board";

export default function TeamMemberDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeView, setActiveView] = useState('overview');

  // קבלת נתונים של משימות חבר הצוות
  const { data: myTasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['/api/team-member/my-tasks'],
    staleTime: 30000,
  });

  // קבלת נתונים של פרויקטים שחבר הצוות עובד עליהם
  const { data: myProjects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['/api/team-member/my-projects'],
    staleTime: 30000,
  });

  // קבלת לקוחות הקשורים לפרויקטים של חבר הצוות
  const { data: myClients, isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ['/api/team-member/my-clients'],
    staleTime: 30000,
  });

  // קבלת פעילות אחרונה של חבר הצוות
  const { data: myActivity, isLoading: activityLoading } = useQuery<ActivityLog[]>({
    queryKey: ['/api/team-member/my-activity'],
    staleTime: 30000,
  });

  // סטטיסטיקות של חבר הצוות
  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    activeProjects: number;
  }>({
    queryKey: ['/api/team-member/stats'],
    staleTime: 30000,
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: Partial<Task> }) => {
      const response = await apiRequest('PUT', `/api/tasks/${taskId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/team-member/my-tasks'] });
      toast({
        title: "המשימה עודכנה בהצלחה",
        description: "המשימה עודכנה בהצלחה",
      });
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה בעדכון המשימה",
        description: error?.message || "אירעה שגיאה לא צפויה",
        variant: "destructive",
      });
    },
  });

  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    updateTaskMutation.mutate({ taskId, updates });
  };

  const handleTaskTimer = (taskId: string, action: 'start' | 'pause' | 'stop') => {
    // Timer functionality - could be expanded with actual time tracking
    toast({
      title: "טיימר משימה",
      description: action === 'start' ? "הטיימר התחיל" : action === 'pause' ? "הטיימר הושהה" : "הטיימר הופסק",
    });
  };

  const completionRate = stats ? Math.round((stats.completedTasks / stats.totalTasks) * 100) || 0 : 0;

  // משימות לפי סטטוס
  const todayTasks = myTasks?.filter(task => {
    const today = new Date();
    const taskDate = new Date(task.dueDate || '');
    return taskDate.toDateString() === today.toDateString();
  }) || [];

  const urgentTasks = myTasks?.filter(task => 
    task.priority === 'high' && task.status !== 'completed'
  ) || [];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* כרטיסי סטטיסטיקה */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סך משימות</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTasks || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeProjects || 0} פרויקטים פעילים
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">משימות הושלמו</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completedTasks || 0}</div>
            <p className="text-xs text-muted-foreground">
              {completionRate}% אחוז השלמה
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">משימות ממתינות</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingTasks || 0}</div>
            <p className="text-xs text-muted-foreground">
              {todayTasks.length} משימות היום
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">משימות דחופות</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{urgentTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.overdueTasks || 0} משימות באיחור
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* משימות אחרונות */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              המשימות שלי
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {myTasks?.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1 flex-1">
                    <p className="text-sm font-medium leading-none">{task.title}</p>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {task.dueDate ? format(new Date(task.dueDate), 'dd/MM/yyyy', { locale: he }) : 'ללא מועד'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTaskTimer(task.id, 'start')}
                        className="h-8 w-8 p-0"
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTaskTimer(task.id, 'pause')}
                        className="h-8 w-8 p-0"
                      >
                        <Pause className="h-3 w-3" />
                      </Button>
                    </div>
                    <Badge 
                      variant={
                        task.priority === 'high' ? 'destructive' : 
                        task.priority === 'medium' ? 'default' : 'secondary'
                      }
                    >
                      {task.priority === 'high' ? 'גבוה' : 
                       task.priority === 'medium' ? 'בינוני' : 'נמוך'}
                    </Badge>
                  </div>
                </div>
              ))}
              
              {(!myTasks || myTasks.length === 0) && (
                <div className="text-center py-6 text-muted-foreground">
                  <Target className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>אין משימות פתוחות</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* פעילות אחרונה */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              פעילות אחרונה
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {myActivity?.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm leading-none">
                      {activity.action === 'created' && 'יצר'}
                      {activity.action === 'updated' && 'עדכן'}
                      {activity.action === 'completed' && 'השלים'}
                      {activity.action === 'assigned' && 'הוקצה ל'}
                      {' '}
                      {activity.entityType === 'task' && 'משימה'}
                      {activity.entityType === 'project' && 'פרויקט'}
                      {activity.entityType === 'client' && 'לקוח'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(activity.createdAt), 'dd/MM/yyyy HH:mm', { locale: he })}
                    </p>
                  </div>
                </div>
              ))}
              
              {(!myActivity || myActivity.length === 0) && (
                <div className="text-center py-4 text-muted-foreground">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">אין פעילות אחרונה</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderTasks = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">המשימות שלי</h2>
        <div className="flex gap-2">
          <Badge variant="outline">{myTasks?.length || 0} משימות</Badge>
        </div>
      </div>
      
      {myTasks && myTasks.length > 0 ? (
        <KanbanBoard
          tasks={myTasks}
          users={[]}
          projects={myProjects || []}
          onTaskUpdate={handleTaskUpdate}
          onTaskTimer={handleTaskTimer}
          onEditTask={() => {}}
          onDeleteTask={() => {}}
          readOnly={false}
        />
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-medium mb-2">אין משימות</h3>
            <p className="text-muted-foreground">כרגע אין לך משימות מוקצות</p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderClients = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">הלקוחות שלי</h2>
        <Badge variant="outline">{myClients?.length || 0} לקוחות</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {myClients?.map((client) => (
          <Card key={client.id}>
            <CardHeader>
              <CardTitle className="text-lg">{client.name}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                {client.contactName}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>אמייל:</strong> {client.email}</p>
                <p><strong>טלפון:</strong> {client.phone}</p>
                <p><strong>תעשייה:</strong> {client.industry}</p>
                <div className="flex justify-between items-center mt-4">
                  <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                    {client.status === 'active' ? 'פעיל' : 'לא פעיל'}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4 ml-1" />
                    צפייה
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!myClients || myClients.length === 0) && (
          <div className="col-span-full text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-medium mb-2">אין לקוחות</h3>
            <p className="text-muted-foreground">כרגע אין לך לקוחות מקושרים</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderProjects = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">הפרויקטים שלי</h2>
        <Badge variant="outline">{myProjects?.length || 0} פרויקטים</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {myProjects?.map((project) => (
          <Card key={project.id} className="border-l-4 border-l-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{project.name}</CardTitle>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {project.description}
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <Badge variant={
                  project.status === 'completed' ? 'secondary' :
                  project.status === 'in_progress' ? 'default' : 'outline'
                }>
                  {project.status === 'completed' ? 'הושלם' :
                   project.status === 'in_progress' ? 'בביצוע' : 'ממתין'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {project.budget ? `₪${project.budget.toLocaleString()}` : ''}
                </span>
              </div>
              
              {project.startDate && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  התחיל: {format(new Date(project.startDate), 'dd/MM/yyyy', { locale: he })}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {(!myProjects || myProjects.length === 0) && (
          <div className="col-span-full text-center py-12">
            <Briefcase className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-medium mb-2">אין פרויקטים</h3>
            <p className="text-muted-foreground">כרגע אין לך פרויקטים מוקצים</p>
          </div>
        )}
      </div>
    </div>
  );

  if (tasksLoading || projectsLoading || statsLoading) {
    return (
      <div className="flex h-screen" dir="rtl">
        <div className="w-64 bg-white shadow-sm border-l border-gray-100">
          <div className="p-6 border-b">
            <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="p-4 space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
        <div className="flex-1 p-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded animate-pulse"></div>
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 h-64 bg-gray-100 rounded animate-pulse"></div>
            <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen" dir="rtl">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-l border-gray-100 flex-shrink-0">
        <div className="p-6 border-b">
          <h1 className="text-lg font-bold text-primary">דאשבורד חבר צוות</h1>
          <p className="text-sm text-muted-foreground">{user?.fullName}</p>
        </div>
        
        <nav className="p-4">
          <div className="space-y-1">
            <Button
              variant={activeView === 'overview' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveView('overview')}
            >
              <BarChart3 className="h-4 w-4 ml-2" />
              סקירה כללית
            </Button>
            
            <Button
              variant={activeView === 'tasks' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveView('tasks')}
            >
              <CheckSquare className="h-4 w-4 ml-2" />
              המשימות שלי
              <Badge variant="outline" className="mr-auto">
                {myTasks?.length || 0}
              </Badge>
            </Button>
            
            <Button
              variant={activeView === 'clients' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveView('clients')}
            >
              <Users className="h-4 w-4 ml-2" />
              הלקוחות שלי
              <Badge variant="outline" className="mr-auto">
                {myClients?.length || 0}
              </Badge>
            </Button>
            
            <Button
              variant={activeView === 'projects' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveView('projects')}
            >
              <Briefcase className="h-4 w-4 ml-2" />
              הפרויקטים שלי
              <Badge variant="outline" className="mr-auto">
                {myProjects?.length || 0}
              </Badge>
            </Button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {activeView === 'overview' && renderOverview()}
          {activeView === 'tasks' && renderTasks()}
          {activeView === 'clients' && renderClients()}
          {activeView === 'projects' && renderProjects()}
        </div>
      </div>
    </div>
  );
}
