
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
  Briefcase
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function TeamDashboard() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ['/api/team/stats'],
    staleTime: 30000,
  });

  const { data: myTasks } = useQuery({
    queryKey: ['/api/tasks', { assignedTo: user?.id }],
    staleTime: 30000,
  });

  const { data: recentActivity } = useQuery({
    queryKey: ['/api/team/activity'],
    staleTime: 30000,
  });

  const statsCards = [
    {
      title: "המשימות שלי",
      value: myTasks?.filter((t: any) => t.status !== 'completed').length || 0,
      subtitle: "משימות פעילות",
      icon: CheckSquare,
      color: "text-blue-600",
    },
    {
      title: "משימות דחופות",
      value: myTasks?.filter((t: any) => t.priority === 'high' && t.status !== 'completed').length || 0,
      subtitle: "דורשות טיפול מיידי",
      icon: Clock,
      color: "text-red-600",
    },
    {
      title: "פרויקטים",
      value: stats?.projectsCount || 0,
      subtitle: "פרויקטים שאני מעורב בהם",
      icon: Briefcase,
      color: "text-green-600",
    },
    {
      title: "השבוע",
      value: myTasks?.filter((t: any) => {
        if (!t.dueDate) return false;
        const dueDate = new Date(t.dueDate);
        const now = new Date();
        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        return dueDate <= weekFromNow && dueDate >= now;
      }).length || 0,
      subtitle: "משימות השבוע",
      icon: Calendar,
      color: "text-purple-600",
    },
  ];

  const urgentTasks = myTasks?.filter((task: any) => 
    task.priority === 'high' && task.status !== 'completed'
  ).slice(0, 3) || [];

  const upcomingDeadlines = myTasks?.filter((task: any) => {
    if (!task.dueDate || task.status === 'completed') return false;
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    return dueDate <= threeDaysFromNow && dueDate >= now;
  }).slice(0, 3) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'new': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6" data-testid="team-dashboard">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
        <div className="flex items-center space-x-reverse space-x-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <User className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              שלום {user?.fullName}!
            </h1>
            <p className="text-gray-600">
              ברוך הבא לדאשבורד שלך כחבר צוות
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stat.subtitle}
                  </p>
                </div>
                <div className={`p-3 rounded-full bg-gray-50`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Urgent Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-reverse space-x-2">
              <Bell className="h-5 w-5 text-red-600" />
              <span>משימות דחופות</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {urgentTasks.length === 0 ? (
              <div className="text-center py-8">
                <CheckSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">אין משימות דחופות כרגע</p>
                <p className="text-sm text-gray-400">עבודה מצוינת! 👏</p>
              </div>
            ) : (
              <div className="space-y-3">
                {urgentTasks.map((task: any) => (
                  <div key={task.id} className="border border-red-200 p-4 rounded-lg bg-red-50">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{task.title}</h4>
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority === 'high' ? 'דחוף' : task.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge className={getStatusColor(task.status)}>
                        {task.status === 'new' ? 'חדש' : 
                         task.status === 'in_progress' ? 'בתהליך' : 'הושלם'}
                      </Badge>
                      {task.dueDate && (
                        <span className="text-xs text-red-600">
                          תאריך יעד: {new Date(task.dueDate).toLocaleDateString('he-IL')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-reverse space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span>דדליינים מתקרבים</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingDeadlines.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">אין דדליינים קרובים</p>
                <p className="text-sm text-gray-400">זמן מצוין לתכנון קדימה</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingDeadlines.map((task: any) => (
                  <div key={task.id} className="border p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{task.title}</h4>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status === 'new' ? 'חדש' : 
                         task.status === 'in_progress' ? 'בתהליך' : 'הושלם'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority === 'high' ? 'דחוף' : 
                         task.priority === 'medium' ? 'בינוני' : 'נמוך'}
                      </Badge>
                      <span className="text-sm text-orange-600">
                        {new Date(task.dueDate).toLocaleDateString('he-IL')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>פעולות מהירות</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center space-y-2"
              onClick={() => window.location.href = '/dashboard/tasks'}
            >
              <CheckSquare className="h-6 w-6" />
              <span>המשימות שלי</span>
            </Button>

            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center space-y-2"
              onClick={() => window.location.href = '/dashboard/projects'}
            >
              <Briefcase className="h-6 w-6" />
              <span>פרויקטים</span>
            </Button>

            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center space-y-2"
              onClick={() => window.location.href = '/dashboard/reports'}
            >
              <BarChart3 className="h-6 w-6" />
              <span>דוחות</span>
            </Button>

            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center space-y-2"
              onClick={() => window.location.href = '/dashboard/profile'}
            >
              <User className="h-6 w-6" />
              <span>פרופיל</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
