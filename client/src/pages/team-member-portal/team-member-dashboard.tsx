import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Calendar, 
  User, 
  Briefcase, 
  Target,
  MessageSquare,
  FileText,
  TrendingUp
} from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { type Task, type Project, type Client, type ActivityLog } from "@shared/schema";

export default function TeamMemberDashboard() {
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

  if (tasksLoading || projectsLoading || statsLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* כותרת וברכה */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">דאשבורד חבר צוות</h1>
          <p className="text-muted-foreground">סקירת המשימות והפרויקטים שלך</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <User className="w-3 h-3" />
            חבר צוות
          </Badge>
        </div>
      </div>

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
            <CardDescription>
              משימות אחרונות שהוקצו לך
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {myTasks?.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{task.title}</p>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {task.dueDate ? format(new Date(task.dueDate), 'dd/MM/yyyy', { locale: he }) : 'ללא מועד'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={
                        task.priority === 'high' ? 'destructive' : 
                        task.priority === 'medium' ? 'default' : 'secondary'
                      }
                    >
                      {task.priority === 'high' ? 'גבוה' : 
                       task.priority === 'medium' ? 'בינוני' : 'נמוך'}
                    </Badge>
                    <Badge 
                      variant={
                        task.status === 'completed' ? 'secondary' :
                        task.status === 'in_progress' ? 'default' : 'outline'
                      }
                    >
                      {task.status === 'completed' ? 'הושלם' :
                       task.status === 'in_progress' ? 'בביצוע' : 'ממתין'}
                    </Badge>
                  </div>
                </div>
              ))}
              
              {(!myTasks || myTasks.length === 0) && (
                <div className="text-center py-6 text-muted-foreground">
                  <Target className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>אין משימות פתוחות</p>
                  <p className="text-sm">כל המשימות הושלמו בהצלחה!</p>
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
            <CardDescription>
              פעולות שביצעת לאחרונה
            </CardDescription>
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
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">אין פעילות אחרונה</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* פרויקטים פעילים */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            הפרויקטים שלי
          </CardTitle>
          <CardDescription>
            פרויקטים שאתה עובד עליהם כעת
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {myProjects?.map((project) => (
              <Card key={project.id} className="border-l-4 border-l-primary">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {project.description}
                  </CardDescription>
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
                  
                  {project.endDate && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      יסתיים: {format(new Date(project.endDate), 'dd/MM/yyyy', { locale: he })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {(!myProjects || myProjects.length === 0) && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>אין פרויקטים פעילים</p>
                <p className="text-sm">פרויקטים חדשים יופיעו כאן כאשר יוקצו לך</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}