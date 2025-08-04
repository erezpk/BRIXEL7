import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import StatsCard from "@/components/dashboard/stats-card";
import QuickActions from "@/components/dashboard/quick-actions";
import RecentActivity from "@/components/dashboard/recent-activity";
import NewClientModal from "@/components/modals/new-client-modal";
import NewTaskModal from "@/components/modals/new-task-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Calendar, CheckSquare, Clock, Projector, PoundSterling, Users } from "lucide-react";

interface DashboardStats {
  activeProjects: number;
  tasksToday: number;
  activeClients: number;
  completedTasksThisMonth: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
    staleTime: 60000, // 1 minute
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
      <QuickActions
        onNewClient={() => setShowNewClientModal(true)}
        onNewProject={() => {
          // TODO: Implement new project modal
          console.log('New project modal');
        }}
        onNewTask={() => setShowNewTaskModal(true)}
        onInviteTeam={() => {
          // TODO: Implement team invite modal
          console.log('Team invite modal');
        }}
      />

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

      {/* Modals */}
      <NewClientModal
        isOpen={showNewClientModal}
        onClose={() => setShowNewClientModal(false)}
      />
      
      <NewTaskModal
        isOpen={showNewTaskModal}
        onClose={() => setShowNewTaskModal(false)}
      />
    </div>
  );
}
