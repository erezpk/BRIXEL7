import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Upload, MessageCircle, FileText, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";

interface ClientActivityItem {
  id: string;
  action: string;
  entityType: string;
  details: Record<string, any>;
  createdAt: string;
  user: {
    fullName: string;
  };
}

export default function ClientActivity() {
  const { data: activities, isLoading } = useQuery<ClientActivityItem[]>({
    queryKey: ['/api/client/activity'],
    staleTime: 30000, // 30 seconds
  });

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'uploaded':
        return <Upload className="h-4 w-4 text-blue-600" />;
      case 'commented':
        return <MessageCircle className="h-4 w-4 text-yellow-600" />;
      case 'updated':
        return <FileText className="h-4 w-4 text-purple-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityText = (activity: ClientActivityItem) => {
    const { action, details, user } = activity;
    
    switch (action) {
      case 'completed':
        return `${user.fullName} השלים את ${details.itemName || 'הפריט'}`;
      case 'uploaded':
        return `${user.fullName} העלה קבצים חדשים`;
      case 'commented':
        return `${user.fullName} הגיב על ${details.itemName || 'הפריט'}`;
      case 'updated':
        return `${user.fullName} עדכן את ${details.itemName || 'הפריט'}`;
      default:
        return `${user.fullName} ביצע פעולה`;
    }
  };

  if (isLoading) {
    return (
      <Card data-testid="client-activity-loading">
        <CardHeader>
          <CardTitle>עדכונים אחרונים</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start space-x-reverse space-x-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4 mb-1" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="client-activity">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          עדכונים אחרונים
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!activities || activities.length === 0 ? (
          <div className="text-center py-8" data-testid="no-client-activity">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">אין עדכונים אחרונים</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-start space-x-reverse space-x-3"
                data-testid={`client-activity-${activity.id}`}
              >
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  {getActivityIcon(activity.action)}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900" data-testid="activity-text">
                    {getActivityText(activity)}
                  </p>
                  <p className="text-xs text-gray-500" data-testid="activity-time">
                    {formatDistanceToNow(new Date(activity.createdAt), { 
                      addSuffix: true, 
                      locale: he 
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
