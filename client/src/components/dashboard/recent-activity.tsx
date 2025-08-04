import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle,
  UserPlus,
  MessageCircle,
  FileText,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";

interface ActivityItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, any>;
  createdAt: string;
  user?: {
    fullName?: string;
  };
}

export default function RecentActivity() {
  const {
    data: activities = [],
    isLoading,
    isError,
    error,
  } = useQuery<ActivityItem[]>({
    queryKey: ["/api/dashboard/activity"],
    queryFn: () =>
      fetch("/api/dashboard/activity").then((res) => {
        if (!res.ok) throw new Error("Fetch failed");
        return res.json();
      }),
    staleTime: 30_000,
  });

  const getActivityIcon = (action: string) => {
    switch (action) {
      case "created":
        return <UserPlus className="h-4 w-4 text-blue-600" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "commented":
        return <MessageCircle className="h-4 w-4 text-yellow-600" />;
      case "updated":
        return <FileText className="h-4 w-4 text-purple-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityText = (activity: ActivityItem) => {
    const fullName = activity.user?.fullName ?? "משתמש";
    const details = activity.details || {};

    switch (activity.action) {
      case "created":
        if (activity.entityType === "client") {
          return `${fullName} הוסיף לקוח חדש: ${details.clientName ?? "-"}`;
        } else if (activity.entityType === "project") {
          return `${fullName} יצר פרויקט חדש: ${details.projectName ?? "-"}`;
        } else if (activity.entityType === "task") {
          return `${fullName} יצר משימה חדשה: ${details.taskTitle ?? "-"}`;
        }
        break;

      case "completed":
        return `${fullName} השלים את המשימה: ${details.taskTitle ?? "-"}`;

      case "commented":
        return `${fullName} הגיב על המשימה: ${details.taskTitle ?? "-"}`;

      case "updated":
        if (activity.entityType === "client") {
          return `${fullName} עדכן את הלקוח: ${details.clientName ?? "-"}`;
        } else if (activity.entityType === "project") {
          return `${fullName} עדכן את הפרויקט: ${details.projectName ?? "-"}`;
        } else if (activity.entityType === "task") {
          return `${fullName} עדכן את המשימה: ${details.taskTitle ?? "-"}`;
        }
        break;
    }

    return `${fullName} ביצע פעולה`;
  };

  const getActivityBadgeColor = (action: string) => {
    switch (action) {
      case "created":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "commented":
        return "bg-yellow-100 text-yellow-800";
      case "updated":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <Card data-testid="recent-activity-loading">
        <CardHeader>
          <CardTitle>פעילות אחרונה</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-start space-x-reverse space-x-3"
              >
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card data-testid="recent-activity-error">
        <CardHeader>
          <CardTitle>שגיאה בטעינת פעילות</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{(error as Error).message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="recent-activity">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          פעילות אחרונה
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8" data-testid="no-activity">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">אין פעילות אחרונה</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-reverse space-x-3"
                data-testid={`activity-item-${activity.id}`}
              >
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  {getActivityIcon(activity.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 font-medium">
                    {getActivityText(activity)}
                  </p>
                  <div className="flex items-center space-x-reverse space-x-2 mt-1">
                    <Badge
                      variant="secondary"
                      className={`text-xs ${getActivityBadgeColor(activity.action)}`}
                    >
                      {activity.action === "created"
                        ? "נוצר"
                        : activity.action === "completed"
                          ? "הושלם"
                          : activity.action === "commented"
                            ? "תגובה"
                            : activity.action === "updated"
                              ? "עודכן"
                              : activity.action}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(activity.createdAt), {
                        addSuffix: true,
                        locale: he,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
