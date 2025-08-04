import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Eye, Edit, MoreHorizontal, MessageCircle, Calendar, User, Building } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Task } from "@shared/schema";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface TaskCardProps {
  task: Task & {
    assignedUser?: { fullName: string };
    client?: { name: string };
    project?: { name: string };
  };
  onView: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export default function TaskCard({ task, onView, onEdit, onDelete }: TaskCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-gray-100 text-gray-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new':
        return 'חדש';
      case 'in_progress':
        return 'בביצוע';
      case 'completed':
        return 'הושלם';
      case 'cancelled':
        return 'בוטל';
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-blue-100 text-blue-800';
      case 'medium':
        return 'bg-gray-100 text-gray-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'נמוך';
      case 'medium':
        return 'בינוני';
      case 'high':
        return 'גבוה';
      case 'urgent':
        return 'דחוף';
      default:
        return priority;
    }
  };

  const getTaskBorderClass = (status: string) => {
    switch (status) {
      case 'new':
        return 'task-status-new';
      case 'in_progress':
        return 'task-status-progress';
      case 'completed':
        return 'task-status-completed';
      default:
        return '';
    }
  };

  // Calculate progress based on status
  const getProgress = () => {
    switch (task.status) {
      case 'new':
        return 0;
      case 'in_progress':
        return 50;
      case 'completed':
        return 100;
      default:
        return 0;
    }
  };

  return (
    <Card className={`card-hover ${getTaskBorderClass(task.status)}`} data-testid={`task-card-${task.id}`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-reverse space-x-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900" data-testid="task-title">
                {task.title}
              </h3>
              <Badge className={getStatusColor(task.status)} data-testid="task-status">
                {getStatusText(task.status)}
              </Badge>
              {task.priority !== 'medium' && (
                <Badge className={getPriorityColor(task.priority)} data-testid="task-priority">
                  {getPriorityText(task.priority)}
                </Badge>
              )}
            </div>
            {task.description && (
              <p className="text-sm text-gray-600 mb-3" data-testid="task-description">
                {task.description}
              </p>
            )}
            <div className="flex items-center space-x-reverse space-x-4 text-sm text-gray-600">
              {task.assignedUser && (
                <div className="flex items-center space-x-reverse space-x-1">
                  <User className="h-4 w-4" />
                  <span data-testid="task-assigned-user">{task.assignedUser.fullName}</span>
                </div>
              )}
              {task.client && (
                <div className="flex items-center space-x-reverse space-x-1">
                  <Building className="h-4 w-4" />
                  <span data-testid="task-client">{task.client.name}</span>
                </div>
              )}
              {task.dueDate && (
                <div className="flex items-center space-x-reverse space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span data-testid="task-due-date">
                    עד: {format(new Date(task.dueDate), 'dd/MM/yyyy', { locale: he })}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-reverse space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(task)}
              data-testid="task-view"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" data-testid="task-menu">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(task)} data-testid="task-view-details">
                  <Eye className="ml-2 h-4 w-4" />
                  צפה בפרטים
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(task)} data-testid="task-edit">
                  <Edit className="ml-2 h-4 w-4" />
                  ערוך
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(task)} 
                  className="text-red-600"
                  data-testid="task-delete"
                >
                  מחק
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>התקדמות</span>
            <span data-testid="task-progress-percentage">{getProgress()}%</span>
          </div>
          <Progress value={getProgress()} className="h-2" data-testid="task-progress-bar" />
        </div>

        {/* Comments Preview */}
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center space-x-reverse space-x-2 text-sm text-gray-600">
            <MessageCircle className="h-4 w-4" />
            <span data-testid="task-comments-count">0 תגובות</span>
            <span>•</span>
            <span data-testid="task-updated">
              עודכן {format(new Date(task.updatedAt), 'dd/MM/yyyy', { locale: he })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
