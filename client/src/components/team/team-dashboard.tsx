import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  MessageCircle, 
  CheckSquare, 
  Calendar,
  Plus,
  Filter,
  MoreVertical,
  Star,
  Clock
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface TeamMember {
  id: string;
  fullName: string;
  email: string;
  role: string;
  avatar?: string;
  isActive: boolean;
  tasksCount: number;
  completedTasks: number;
  messagesCount: number;
  lastActivity: string;
}

interface TeamTask {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assignedTo: string;
  assignedToName: string;
  dueDate?: string;
  clientName?: string;
  projectName?: string;
  createdAt: string;
}

export default function TeamDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ['/api/team']
  });

  const { data: teamTasks = [] } = useQuery<TeamTask[]>({
    queryKey: ['/api/tasks'],
    select: (data: any[]) => data.filter(task => task.assignedTo)
  });

  const filteredTasks = teamTasks.filter(task => {
    if (statusFilter === "all") return true;
    return task.status === statusFilter;
  });

  const getTaskStats = () => {
    const total = teamTasks.length;
    const completed = teamTasks.filter(t => t.status === 'completed').length;
    const inProgress = teamTasks.filter(t => t.status === 'in_progress').length;
    const todo = teamTasks.filter(t => t.status === 'todo').length;
    
    return { total, completed, inProgress, todo };
  };

  const getTeamStats = () => {
    const activeMembers = teamMembers.filter(m => m.isActive).length;
    const totalTasks = teamMembers.reduce((sum, m) => sum + m.tasksCount, 0);
    const completedTasks = teamMembers.reduce((sum, m) => sum + m.completedTasks, 0);
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    return { activeMembers, totalTasks, completedTasks, completionRate };
  };

  const getPriorityBadge = (priority: string) => {
    const config = {
      low: { label: 'נמוך', variant: 'secondary' as const },
      medium: { label: 'בינוני', variant: 'default' as const },
      high: { label: 'גבוה', variant: 'destructive' as const }
    };
    
    const { label, variant } = config[priority as keyof typeof config] || config.medium;
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const config = {
      todo: { label: 'לביצוע', variant: 'outline' as const },
      in_progress: { label: 'בתהליך', variant: 'default' as const },
      completed: { label: 'הושלם', variant: 'default' as const }
    };
    
    const { label, variant } = config[status as keyof typeof config] || config.todo;
    return <Badge variant={variant}>{label}</Badge>;
  };

  const taskStats = getTaskStats();
  const teamStats = getTeamStats();

  return (
    <div className="space-y-6">
      {/* Team Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{teamStats.activeMembers}</div>
                <div className="text-sm text-gray-500">חברי צוות פעילים</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckSquare className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{taskStats.total}</div>
                <div className="text-sm text-gray-500">משימות פעילות</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Star className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{Math.round(teamStats.completionRate)}%</div>
                <div className="text-sm text-gray-500">שיעור השלמה</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{teamTasks.filter(t => t.status === 'in_progress').length}</div>
                <div className="text-sm text-gray-500">משימות בתהליך</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">סקירה כללית</TabsTrigger>
          <TabsTrigger value="tasks">משימות</TabsTrigger>
          <TabsTrigger value="members">חברי צוות</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Task Progress Chart */}
            <Card>
              <CardHeader>
                <CardTitle>התקדמות משימות</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>הושלם</span>
                    <span>{taskStats.completed}/{taskStats.total}</span>
                  </div>
                  <Progress value={(taskStats.completed / taskStats.total) * 100} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>בתהליך</span>
                    <span>{taskStats.inProgress}</span>
                  </div>
                  <Progress value={(taskStats.inProgress / taskStats.total) * 100} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>לביצוע</span>
                    <span>{taskStats.todo}</span>
                  </div>
                  <Progress value={(taskStats.todo / taskStats.total) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle>חברי צוות מובילים</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {teamMembers
                  .filter(m => m.isActive)
                  .sort((a, b) => b.completedTasks - a.completedTasks)
                  .slice(0, 5)
                  .map((member) => (
                    <div key={member.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>
                            {member.fullName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">{member.fullName}</div>
                          <div className="text-xs text-gray-500">{member.role}</div>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {member.completedTasks} משימות
                      </Badge>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>

          {/* Recent Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>משימות אחרונות</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teamTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{task.title}</div>
                      <div className="text-sm text-gray-500">
                        {task.assignedToName} • {task.clientName}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPriorityBadge(task.priority)}
                      {getStatusBadge(task.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>ניהול משימות צוות</CardTitle>
                <div className="flex items-center gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="all">כל הסטטוסים</option>
                    <option value="todo">לביצוע</option>
                    <option value="in_progress">בתהליך</option>
                    <option value="completed">הושלם</option>
                  </select>
                  <Button size="sm">
                    <Plus className="w-4 h-4 ml-2" />
                    משימה חדשה
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="font-medium">{task.title}</div>
                        {getPriorityBadge(task.priority)}
                        {getStatusBadge(task.status)}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {task.assignedToName} • {task.clientName}
                        {task.dueDate && (
                          <span className="ml-2">
                            <Clock className="w-3 h-3 inline ml-1" />
                            {new Date(task.dueDate).toLocaleDateString('he')}
                          </span>
                        )}
                      </div>
                      {task.description && (
                        <div className="text-sm text-gray-600 mt-1">{task.description}</div>
                      )}
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>חברי צוות</CardTitle>
                <Button size="sm">
                  <Plus className="w-4 h-4 ml-2" />
                  הזמן חבר צוות
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamMembers.map((member) => (
                  <Card key={member.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar>
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>
                            {member.fullName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium">{member.fullName}</div>
                          <div className="text-sm text-gray-500">{member.role}</div>
                        </div>
                        <Badge variant={member.isActive ? "default" : "secondary"}>
                          {member.isActive ? "פעיל" : "לא פעיל"}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>משימות פעילות</span>
                          <span>{member.tasksCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>הושלמו</span>
                          <span>{member.completedTasks}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>הודעות</span>
                          <span>{member.messagesCount}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          פעיל לאחרונה: {new Date(member.lastActivity).toLocaleDateString('he')}
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <Progress 
                          value={member.tasksCount > 0 ? (member.completedTasks / member.tasksCount) * 100 : 0} 
                          className="h-2" 
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}