import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Projector, Clock, CheckCircle } from "lucide-react";

interface ClientStats {
  activeProjects: number;
  tasksInProgress: number;
  completedTasks: number;
}

export default function ClientStats() {
  const { data: stats, isLoading } = useQuery<ClientStats>({
    queryKey: ['/api/client/stats'],
    staleTime: 60000, // 1 minute
  });

  const statsCards = [
    {
      title: "פרויקטים פעילים",
      value: stats?.activeProjects || 0,
      icon: Projector,
      iconColor: "text-primary",
      bgColor: "bg-primary/20",
    },
    {
      title: "משימות בתהליך",
      value: stats?.tasksInProgress || 0,
      icon: Clock,
      iconColor: "text-yellow-600",
      bgColor: "bg-yellow-200",
    },
    {
      title: "משימות הושלמו",
      value: stats?.completedTasks || 0,
      icon: CheckCircle,
      iconColor: "text-green-600",
      bgColor: "bg-green-200",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6" data-testid="client-stats">
      {isLoading ? (
        [...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-reverse space-x-3">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div>
                  <Skeleton className="h-8 w-8 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        statsCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="card-hover" data-testid={`client-stat-${index}`}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-reverse space-x-3">
                  <div className={`w-12 h-12 ${card.bgColor} rounded-xl flex items-center justify-center`}>
                    <Icon className={`${card.iconColor} text-xl`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900" data-testid="stat-value">
                      {card.value}
                    </p>
                    <p className="text-sm text-gray-600" data-testid="stat-title">
                      {card.title}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
