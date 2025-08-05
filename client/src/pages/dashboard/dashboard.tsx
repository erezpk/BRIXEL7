import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import StatsCard from "@/components/dashboard/stats-card";
import QuickActions from "@/components/dashboard/quick-actions";
import RecentActivity from "@/components/dashboard/recent-activity";
import NewClientModal from "@/components/modals/new-client-modal";
import NewTaskModal from "@/components/modals/new-task-modal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AlertCircle, Calendar, CheckSquare, Clock, Projector, PoundSterling, Users, Plus, FolderOpen } from "lucide-react";
import { type Client, type InsertClient, type InsertProject, type InsertTask } from "@shared/schema";

interface DashboardStats {
  activeProjects: number;
  tasksToday: number;
  activeClients: number;
  completedTasksThisMonth: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [showNewClientModal, setShowClientModal] = useState(false);
  const [showNewProjectModal, setShowProjectModal] = useState(false);
  const [showNewTaskModal, setShowTaskModal] = useState(false);
  const [showInviteTeamModal, setShowInviteTeamModal] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [clientData, setClientData] = useState<Omit<InsertClient, 'agencyId'>>({
    name: "",
    contactName: "",
    email: "",
    phone: "",
    industry: "",
    status: "active",
    notes: "",
  });

  const [projectData, setProjectData] = useState<Omit<InsertProject, 'agencyId' | 'createdBy'>>({
    name: "",
    description: "",
    clientId: "",
  });

  const [taskData, setTaskData] = useState<Omit<InsertTask, 'agencyId' | 'createdBy'>>({
    title: "",
    description: "",
    priority: "medium",
    projectId: "",
  });

  const [inviteData, setInviteData] = useState({
    email: "",
    fullName: "",
    role: "team_member",
  });

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
    staleTime: 60000, // 1 minute
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
    staleTime: 30000,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects'],
    staleTime: 30000,
  });

  // Create client mutation
  const createClientMutation = useMutation({
    mutationFn: async (data: Omit<InsertClient, 'agencyId'>) => {
      const response = await apiRequest('POST', '/api/clients', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      setShowClientModal(false);
      resetClientForm();
      toast({
        title: "לקוח נוצר בהצלחה",
        description: "הלקוח החדש נוסף למערכת",
      });
    },
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: Omit<InsertProject, 'agencyId' | 'createdBy'>) => {
      const response = await apiRequest('POST', '/api/projects', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      setShowProjectModal(false);
      resetProjectForm();
      toast({
        title: "פרויקט נוצר בהצלחה",
        description: "הפרויקט החדש נוסף למערכת",
      });
    },
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: Omit<InsertTask, 'agencyId' | 'createdBy'>) => {
      const response = await apiRequest('POST', '/api/tasks', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      setShowTaskModal(false);
      resetTaskForm();
      toast({
        title: "משימה נוצרה בהצלחה",
        description: "המשימה החדשה נוספה למערכת",
      });
    },
  });

  const resetClientForm = () => {
    setClientData({
      name: "",
      contactName: "",
      email: "",
      phone: "",
      industry: "",
      status: "active",
      notes: "",
    });
  };

  const resetProjectForm = () => {
    setProjectData({
      name: "",
      description: "",
      clientId: "",
    });
  };

  const resetTaskForm = () => {
    setTaskData({
      title: "",
      description: "",
      priority: "medium",
      projectId: "",
    });
  };

  const resetInviteForm = () => {
    setInviteData({
      email: "",
      fullName: "",
      role: "team_member",
    });
  };

  // Invite team member mutation
  const inviteTeamMutation = useMutation({
    mutationFn: async (data: typeof inviteData) => {
      const response = await apiRequest('POST', '/api/team/invite', data);
      return response.json();
    },
    onSuccess: () => {
      setShowInviteTeamModal(false);
      resetInviteForm();
      toast({
        title: "הזמנה נשלחה בהצלחה",
        description: "הזמנה נשלחה לחבר הצוות החדש",
      });
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה בשליחת הזמנה",
        description: error?.message || "אירעה שגיאה לא צפויה",
        variant: "destructive",
      });
    },
  });


  const statsCards = [
    {
      title: "פרויקטים פעילים",
      value: stats?.activeProjects || 0,
      change: "+12% מהחודש הקודם",
      changeType: "positive" as const,
      icon: Projector,
      iconColor: "text-primary",
    },
    {
      title: "משימות להיום",
      value: stats?.tasksToday || 0,
      change: "3 דחופות",
      changeType: "neutral" as const,
      icon: Clock,
      iconColor: "text-yellow-600",
    },
    {
      title: "לקוחות פעילים",
      value: stats?.activeClients || 0,
      change: "+5 החודש",
      changeType: "positive" as const,
      icon: Users,
      iconColor: "text-green-600",
    },
    {
      title: "משימות הושלמו החודש",
      value: stats?.completedTasksThisMonth || 0,
      change: "+8% מהחודש הקודם",
      changeType: "positive" as const,
      icon: CheckSquare,
      iconColor: "text-blue-600",
    },
  ];

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 font-rubik" data-testid="dashboard-welcome">
          שלום, {user?.fullName}!
        </h1>
        <p className="text-gray-600" data-testid="dashboard-subtitle">
          ברוכים הבאים לדשבורד הסוכנות שלכם
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading ? (
          [...Array(4)].map((_, i) => (
            <Card key={i} data-testid={`stats-skeleton-${i}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="w-12 h-12 rounded-xl" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          statsCards.map((card, index) => (
            <StatsCard key={index} {...card} />
          ))
        )}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">פעולות מהירות</CardTitle>
          <CardDescription className="text-right">
            גישה מהירה לפעולות נפוצות
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={() => setShowClientModal(true)}
              className="h-20 flex flex-col items-center space-y-2"
              variant="outline"
            >
              <Users className="h-6 w-6" />
              <span>לקוח חדש</span>
            </Button>

            <Button
              onClick={() => setShowProjectModal(true)}
              className="h-20 flex flex-col items-center space-y-2"
              variant="outline"
            >
              <FolderOpen className="h-6 w-6" />
              <span>פרויקט חדש</span>
            </Button>

            <Button
              onClick={() => setShowTaskModal(true)}
              className="h-20 flex flex-col items-center space-y-2"
              variant="outline"
            >
              <CheckSquare className="h-6 w-6" />
              <span>משימה חדשה</span>
            </Button>

            <Button
              onClick={() => setShowInviteTeamModal(true)}
              className="h-20 flex flex-col items-center space-y-2"
              variant="outline"
            >
              <Plus className="h-6 w-6" />
              <span>הזמן חבר צוות</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity & Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity />

        {/* Upcoming Deadlines */}
        <Card data-testid="upcoming-deadlines">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              דדליינים מתקרבים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <div className="flex items-center space-x-reverse space-x-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-600">דחוף - עוד יום</span>
                </div>
                <h4 className="font-medium text-gray-900 mb-1">גמר עיצוב האתר</h4>
                <p className="text-sm text-gray-600">לקוח: חברת ABC</p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <div className="flex items-center space-x-reverse space-x-2 mb-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-600">עוד 3 ימים</span>
                </div>
                <h4 className="font-medium text-gray-900 mb-1">הגשת תוכן לבלוג</h4>
                <p className="text-sm text-gray-600">לקוח: מסעדת שף</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <div className="flex items-center space-x-reverse space-x-2 mb-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-600">עוד שבוע</span>
                </div>
                <h4 className="font-medium text-gray-900 mb-1">חידוש דומיין</h4>
                <p className="text-sm text-gray-600">לקוח: רופא שיניים</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Client Modal */}
      <Dialog open={showNewClientModal} onOpenChange={setShowClientModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right">לקוח חדש</DialogTitle>
          </DialogHeader>

          <form onSubmit={(e) => { e.preventDefault(); createClientMutation.mutate(clientData); }} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-right">שם הלקוח *</Label>
              <Input
                value={clientData.name}
                onChange={(e) => setClientData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="הכנס שם הלקוח"
                className="text-right"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-right">איש קשר</Label>
              <Input
                value={clientData.contactName}
                onChange={(e) => setClientData(prev => ({ ...prev, contactName: e.target.value }))}
                placeholder="שם איש הקשר"
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-right">אימייל</Label>
              <Input
                type="email"
                value={clientData.email}
                onChange={(e) => setClientData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="כתובת אימייל"
                className="text-right"
              />
            </div>

            <div className="flex space-x-reverse space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowClientModal(false)}>
                ביטול
              </Button>
              <Button type="submit" disabled={createClientMutation.isPending}>
                {createClientMutation.isPending ? "יוצר..." : "צור לקוח"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Project Modal */}
      <Dialog open={showNewProjectModal} onOpenChange={setShowProjectModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right">פרויקט חדש</DialogTitle>
          </DialogHeader>

          <form onSubmit={(e) => {
            e.preventDefault();
            createProjectMutation.mutate({
              ...projectData,
              status: 'planning',
              clientId: projectData.clientId === "none" ? null : projectData.clientId || null,
            });
          }} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-right">שם הפרויקט *</Label>
              <Input
                value={projectData.name}
                onChange={(e) => setProjectData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="הכנס שם פרויקט"
                className="text-right"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-right">תיאור</Label>
              <Textarea
                value={projectData.description}
                onChange={(e) => setProjectData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="תאר את הפרויקט"
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-right">לקוח</Label>
              <Select value={projectData.clientId} onValueChange={(value) => setProjectData(prev => ({ ...prev, clientId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר לקוח" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ללא לקוח</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex space-x-reverse space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowProjectModal(false)}>
                ביטול
              </Button>
              <Button type="submit" disabled={createProjectMutation.isPending}>
                {createProjectMutation.isPending ? "יוצר..." : "צור פרויקט"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Task Modal */}
      <Dialog open={showNewTaskModal} onOpenChange={setShowTaskModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right">משימה חדשה</DialogTitle>
          </DialogHeader>

          <form onSubmit={(e) => {
            e.preventDefault();
            createTaskMutation.mutate({
              ...taskData,
              status: 'new',
              projectId: taskData.projectId === "none" ? null : taskData.projectId || null,
            });
          }} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-right">כותרת המשימה *</Label>
              <Input
                value={taskData.title}
                onChange={(e) => setTaskData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="הכנס כותרת למשימה"
                className="text-right"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-right">תיאור</Label>
              <Textarea
                value={taskData.description}
                onChange={(e) => setTaskData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="תאר את המשימה"
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-right">פרויקט</Label>
              <Select value={taskData.projectId} onValueChange={(value) => setTaskData(prev => ({ ...prev, projectId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר פרויקט" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ללא פרויקט</SelectItem>
                  {projects.map((project: any) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex space-x-reverse space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowTaskModal(false)}>
                ביטול
              </Button>
              <Button type="submit" disabled={createTaskMutation.isPending}>
                {createTaskMutation.isPending ? "יוצר..." : "צור משימה"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Invite Team Member Modal */}
      <Dialog open={showInviteTeamModal} onOpenChange={setShowInviteTeamModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right">הזמן חבר צוות</DialogTitle>
          </DialogHeader>

          <form onSubmit={(e) => {
            e.preventDefault();
            inviteTeamMutation.mutate(inviteData);
          }} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-right">שם מלא *</Label>
              <Input
                value={inviteData.fullName}
                onChange={(e) => setInviteData(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="הכנס שם מלא"
                className="text-right"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-right">אימייל *</Label>
              <Input
                type="email"
                value={inviteData.email}
                onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="הכנס כתובת אימייל"
                className="text-right"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-right">תפקיד</Label>
              <Select value={inviteData.role} onValueChange={(value) => setInviteData(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר תפקיד" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="team_member">חבר צוות</SelectItem>
                  <SelectItem value="agency_admin">מנהל סוכנות</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex space-x-reverse space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowInviteTeamModal(false)}>
                ביטול
              </Button>
              <Button type="submit" disabled={inviteTeamMutation.isPending}>
                {inviteTeamMutation.isPending ? "שולח..." : "שלח הזמנה"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}