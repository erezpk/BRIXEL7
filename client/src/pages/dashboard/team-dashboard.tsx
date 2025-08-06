
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  Clock, 
  Users, 
  FolderOpen, 
  BarChart3,
  Timer,
  Play,
  Pause,
  Square,
  Calendar,
  FileText,
  Home,
  CheckSquare
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

const MENU_ITEMS = [
  { id: 'dashboard', label: 'לוח בקרה', icon: Home },
  { id: 'tasks', label: 'המשימות שלי', icon: CheckSquare },
  { id: 'projects', label: 'הפרויקטים שלי', icon: FolderOpen },
  { id: 'clients', label: 'הלקוחות שלי', icon: Users },
  { id: 'reports', label: 'דוחות', icon: BarChart3 },
];

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  projectId: string;
  projectName: string;
  clientName: string;
  dueDate: string;
  timeSpent: number;
  estimatedTime: number;
  assignedAt: string;
}

interface Project {
  id: string;
  name: string;
  clientName: string;
  status: 'active' | 'completed' | 'on_hold';
  progress: number;
  tasksCount: number;
  completedTasks: number;
  startDate: string;
  dueDate: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  projectsCount: number;
  status: 'active' | 'inactive';
}

interface Stats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  totalProjects: number;
  hoursWorked: number;
  efficiency: number;
}

export default function TeamDashboard() {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [activeTimers, setActiveTimers] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch team member data
  const { data: stats } = useQuery<Stats>({
    queryKey: ['team-member-stats'],
    queryFn: async () => {
      const response = await fetch('/api/team-member/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    }
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['team-member-tasks'],
    queryFn: async () => {
      const response = await fetch('/api/team-member/my-tasks');
      if (!response.ok) throw new Error('Failed to fetch tasks');
      return response.json();
    }
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['team-member-projects'],
    queryFn: async () => {
      const response = await fetch('/api/team-member/my-projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      return response.json();
    }
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['team-member-clients'],
    queryFn: async () => {
      const response = await fetch('/api/team-member/my-clients');
      if (!response.ok) throw new Error('Failed to fetch clients');
      return response.json();
    }
  });

  const { data: activity = [] } = useQuery({
    queryKey: ['team-member-activity'],
    queryFn: async () => {
      const response = await fetch('/api/team-member/my-activity');
      if (!response.ok) throw new Error('Failed to fetch activity');
      return response.json();
    }
  });

  // Update task status mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Failed to update task');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-member-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['team-member-stats'] });
      toast({
        title: "סטטוס עודכן",
        description: "סטטוס המשימה עודכן בהצלחה"
      });
    }
  });

  // Time tracking mutation
  const trackTimeMutation = useMutation({
    mutationFn: async ({ taskId, timeSpent }: { taskId: string; timeSpent: number }) => {
      const response = await fetch(`/api/tasks/${taskId}/time`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeSpent })
      });
      if (!response.ok) throw new Error('Failed to track time');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-member-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['team-member-stats'] });
    }
  });

  const toggleTimer = (taskId: string) => {
    setActiveTimers(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
    
    if (!activeTimers[taskId]) {
      toast({
        title: "טיימר הופעל",
        description: "זמן העבודה נרשם עבור המשימה"
      });
    } else {
      // Stop timer and track time (simulate 1 hour for demo)
      trackTimeMutation.mutate({ taskId, timeSpent: 60 });
      toast({
        title: "טיימר הופסק",
        description: "הזמן נרשם בהצלחה"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'todo': return <Badge variant="outline">ממתין</Badge>;
      case 'in_progress': return <Badge variant="secondary">בביצוע</Badge>;
      case 'done': return <Badge variant="default">הושלם</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <Badge variant="destructive">דחוף</Badge>;
      case 'medium': return <Badge variant="secondary">בינוני</Badge>;
      case 'low': return <Badge variant="outline">נמוך</Badge>;
      default: return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סך המשימות</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTasks || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">הושלמו</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completedTasks || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">שעות עבודה</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.hoursWorked || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">יעילות</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.efficiency || 0}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>המשימות הקרובות</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tasks.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{task.title}</h4>
                  <p className="text-sm text-muted-foreground">{task.projectName} • {task.clientName}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {getStatusBadge(task.status)}
                    {getPriorityBadge(task.priority)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={activeTimers[task.id] ? "destructive" : "outline"}
                    onClick={() => toggleTimer(task.id)}
                  >
                    {activeTimers[task.id] ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    {activeTimers[task.id] ? 'הפסק' : 'התחל'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>פעילות אחרונה</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activity.slice(0, 5).map((item: any) => (
              <div key={item.id} className="flex items-start space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{item.type === 'task' ? 'T' : 'P'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <p className="text-sm">{item.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: he })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTasks = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">המשימות שלי</h2>
      </div>

      <div className="grid gap-4">
        {tasks.map((task) => (
          <Card key={task.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{task.title}</h3>
                  <p className="text-muted-foreground mt-1">{task.description}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-sm text-muted-foreground">פרויקט: {task.projectName}</span>
                    <span className="text-sm text-muted-foreground">לקוח: {task.clientName}</span>
                    {task.dueDate && (
                      <span className="text-sm text-muted-foreground">
                        תאריך יעד: {new Date(task.dueDate).toLocaleDateString('he-IL')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    {getStatusBadge(task.status)}
                    {getPriorityBadge(task.priority)}
                  </div>
                  {task.estimatedTime > 0 && (
                    <div className="mt-3">
                      <div className="flex justify-between text-sm">
                        <span>התקדמות זמן</span>
                        <span>{task.timeSpent}/{task.estimatedTime} שעות</span>
                      </div>
                      <Progress value={(task.timeSpent / task.estimatedTime) * 100} className="mt-1" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant={activeTimers[task.id] ? "destructive" : "outline"}
                    onClick={() => toggleTimer(task.id)}
                  >
                    {activeTimers[task.id] ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    {activeTimers[task.id] ? 'הפסק' : 'התחל'}
                  </Button>
                  <select
                    value={task.status}
                    onChange={(e) => updateTaskMutation.mutate({ taskId: task.id, status: e.target.value })}
                    className="px-3 py-1 border rounded text-sm"
                  >
                    <option value="todo">ממתין</option>
                    <option value="in_progress">בביצוע</option>
                    <option value="done">הושלם</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderProjects = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">הפרויקטים שלי</h2>
      </div>

      <div className="grid gap-4">
        {projects.map((project) => (
          <Card key={project.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{project.name}</h3>
                  <p className="text-muted-foreground mt-1">לקוח: {project.clientName}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                      {project.status === 'active' ? 'פעיל' : project.status === 'completed' ? 'הושלם' : 'מושהה'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {project.completedTasks}/{project.tasksCount} משימות
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-sm">
                      <span>התקדמות</span>
                      <span>{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="mt-1" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderClients = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">הלקוחות שלי</h2>
      </div>

      <div className="grid gap-4">
        {clients.map((client) => (
          <Card key={client.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{client.name}</h3>
                  <p className="text-muted-foreground">{client.email}</p>
                  <p className="text-muted-foreground">{client.phone}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                      {client.status === 'active' ? 'פעיל' : 'לא פעיל'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {client.projectsCount} פרויקטים
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">הדוחות שלי</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>ביצועים חודשיים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>משימות שהושלמו</span>
                <span className="font-bold">{stats?.completedTasks || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>שעות עבודה</span>
                <span className="font-bold">{stats?.hoursWorked || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>יעילות</span>
                <span className="font-bold">{stats?.efficiency || 0}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>התפלגות משימות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>ממתינות</span>
                <span className="font-bold">{tasks.filter(t => t.status === 'todo').length}</span>
              </div>
              <div className="flex justify-between">
                <span>בביצוע</span>
                <span className="font-bold">{tasks.filter(t => t.status === 'in_progress').length}</span>
              </div>
              <div className="flex justify-between">
                <span>הושלמו</span>
                <span className="font-bold">{tasks.filter(t => t.status === 'done').length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard': return renderDashboard();
      case 'tasks': return renderTasks();
      case 'projects': return renderProjects();
      case 'clients': return renderClients();
      case 'reports': return renderReports();
      default: return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm border-l">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900">דאשבורד חבר צוות</h2>
          </div>
          <nav className="mt-6">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveMenu(item.id)}
                  className={`w-full flex items-center px-6 py-3 text-right hover:bg-gray-50 transition-colors ${
                    activeMenu === item.id ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700' : 'text-gray-700'
                  }`}
                >
                  <Icon className="h-5 w-5 ml-3" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
