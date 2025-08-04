import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Projector, User } from "lucide-react";
import { type Project, type User as UserType } from "@shared/schema";

interface ClientProject extends Project {
  assignedUser?: UserType;
}

export default function ClientProjects() {
  const { data: projects, isLoading } = useQuery<ClientProject[]>({
    queryKey: ['/api/client/projects'],
    staleTime: 30000, // 30 seconds
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-primary text-white';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'planning':
        return 'תכנון';
      case 'active':
        return 'בתהליך';
      case 'completed':
        return 'הושלם';
      default:
        return status;
    }
  };

  const getProgress = (status: string) => {
    switch (status) {
      case 'planning':
        return 10;
      case 'active':
        return 75;
      case 'completed':
        return 100;
      default:
        return 0;
    }
  };

  if (isLoading) {
    return (
      <Card data-testid="client-projects-loading">
        <CardHeader>
          <CardTitle>הפרויקטים שלי</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-3/4 mb-3" />
                <div className="mb-3">
                  <div className="flex justify-between mb-1">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                </div>
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="client-projects">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          הפרויקטים שלי
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!projects || projects.length === 0 ? (
          <div className="text-center py-8" data-testid="no-client-projects">
            <Projector className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">אין פרויקטים פעילים</p>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <div 
                key={project.id} 
                className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
                data-testid={`client-project-${project.id}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-900" data-testid="project-name">
                    {project.name}
                  </h4>
                  <Badge className={getStatusColor(project.status)} data-testid="project-status">
                    {getStatusText(project.status)}
                  </Badge>
                </div>
                {project.description && (
                  <p className="text-sm text-gray-600 mb-3" data-testid="project-description">
                    {project.description}
                  </p>
                )}
                <div className="mb-3">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>התקדמות</span>
                    <span data-testid="project-progress-text">{getProgress(project.status)}%</span>
                  </div>
                  <Progress value={getProgress(project.status)} className="h-2" data-testid="project-progress-bar" />
                </div>
                {project.assignedUser && (
                  <div className="text-sm text-gray-600">
                    <div className="flex items-center space-x-reverse space-x-1">
                      <User className="h-4 w-4" />
                      <span data-testid="project-assigned-user">אחראי: {project.assignedUser.fullName}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
