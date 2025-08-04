import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Users, Projector, CheckSquare, UserPlus } from "lucide-react";

interface QuickActionsProps {
  onNewClient: () => void;
  onNewProject: () => void;
  onNewTask: () => void;
  onInviteTeam: () => void;
}

export default function QuickActions({ 
  onNewClient, 
  onNewProject, 
  onNewTask, 
  onInviteTeam 
}: QuickActionsProps) {
  const actions = [
    {
      title: "לקוח חדש",
      icon: Users,
      onClick: onNewClient,
      testId: "quick-action-new-client"
    },
    {
      title: "פרויקט חדש",
      icon: Plus,
      onClick: onNewProject,
      testId: "quick-action-new-project"
    },
    {
      title: "משימה חדשה",
      icon: CheckSquare,
      onClick: onNewTask,
      testId: "quick-action-new-task"
    },
    {
      title: "הזמן חבר צוות",
      icon: UserPlus,
      onClick: onInviteTeam,
      testId: "quick-action-invite-team"
    },
  ];

  return (
    <Card data-testid="quick-actions">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          פעולות מהירות
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.title}
                variant="outline"
                className="flex flex-col items-center p-4 h-auto space-y-2 hover:border-primary hover:bg-primary/5 transition-colors"
                onClick={action.onClick}
                data-testid={action.testId}
              >
                <Icon className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium text-gray-700">
                  {action.title}
                </span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
