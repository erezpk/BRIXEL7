
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Calendar,
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  Edit,
  Trash2,
  GripVertical
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

const PRIORITY_COLORS = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800'
};

const PRIORITY_LABELS = {
  low: 'נמוכה',
  medium: 'בינונית',
  high: 'גבוהה'
};

const STATUS_COLORS = {
  todo: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  review: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800'
};

const STATUS_LABELS = {
  todo: 'לביצוע',
  in_progress: 'בתהליך',
  review: 'בבדיקה',
  completed: 'הושלם'
};

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high';
    status: string;
    dueDate: string;
    createdAt: string;
    assigneeId?: string;
    projectId?: string;
  };
  projects?: Array<{ id: string; name: string }>;
  users?: Array<{ id: string; name: string; email?: string }>;
  onEdit?: (task: any) => void;
  onDelete?: (taskId: string) => void;
}

export function TaskCard({ task, projects = [], users = [], onEdit, onDelete }: TaskCardProps) {
  const project = projects.find(p => p.id === task.projectId);
  const assignee = users.find(u => u.id === task.assigneeId);
  
  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed';
  const dueInDays = Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24));

  return (
    <Card className="group hover:shadow-md transition-all duration-200 bg-white border-r-4 border-r-blue-500">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
            <h3 className="font-semibold text-sm line-clamp-2 flex-1 text-right">
              {task.title}
            </h3>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onEdit(task)}
                className="h-6 w-6 p-0"
              >
                <Edit className="h-3 w-3" />
              </Button>
            )}
            {onDelete && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onDelete(task.id)}
                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 text-right mt-1">
            {task.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Priority and Status */}
          <div className="flex gap-2 justify-end">
            <Badge className={`text-xs px-2 py-1 ${PRIORITY_COLORS[task.priority]}`}>
              {PRIORITY_LABELS[task.priority]}
            </Badge>
            <Badge className={`text-xs px-2 py-1 ${STATUS_COLORS[task.status]}`}>
              {STATUS_LABELS[task.status]}
            </Badge>
          </div>

          {/* Due Date */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground justify-end">
            <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
              {formatDistanceToNow(new Date(task.dueDate), { 
                addSuffix: true, 
                locale: he 
              })}
            </span>
            <Calendar className="h-3 w-3" />
          </div>

          {/* Project */}
          {project && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground justify-end">
              <span>{project.name}</span>
              <div className="h-2 w-2 rounded-full bg-blue-500" />
            </div>
          )}

          {/* Assignee */}
          {assignee && (
            <div className="flex items-center gap-2 text-xs justify-end">
              <span className="text-muted-foreground">{assignee.name}</span>
              <Avatar className="h-6 w-6">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${assignee.name}`} />
                <AvatarFallback className="text-xs">
                  {assignee.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          )}

          {/* Warning indicators */}
          {isOverdue && (
            <div className="flex items-center gap-1 text-red-600 text-xs justify-end">
              <span>באיחור</span>
              <AlertTriangle className="h-3 w-3" />
            </div>
          )}
          
          {dueInDays <= 2 && dueInDays > 0 && task.status !== 'completed' && (
            <div className="flex items-center gap-1 text-orange-600 text-xs justify-end">
              <span>דחוף</span>
              <Clock className="h-3 w-3" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
