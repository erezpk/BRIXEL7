import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { type Task, type User, type Project } from '@shared/schema';
import { Clock, AlertTriangle, Calendar, User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface TaskCardProps {
  task: Task;
  users: User[];
  projects: Project[];
}

const PRIORITY_COLORS = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
} as const;

const PRIORITY_LABELS = {
  low: 'נמוכה',
  medium: 'בינונית',
  high: 'גבוהה',
} as const;

export function TaskCard({ task, users, projects }: TaskCardProps) {
  const assignedUser = users.find(user => user.id === task.assignedTo);
  const project = projects.find(p => p.id === task.projectId);

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Title */}
          <h4 className="font-medium text-sm text-right leading-tight">
            {task.title}
          </h4>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-muted-foreground text-right line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Project */}
          {project && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                {project.name}
              </span>
            </div>
          )}

          {/* Priority */}
          <div className="flex items-center justify-between">
            <Badge 
              className={`text-xs ${PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS]}`}
              variant="secondary"
            >
              {PRIORITY_LABELS[task.priority as keyof typeof PRIORITY_LABELS]}
            </Badge>

            {/* Assigned user */}
            {assignedUser && (
              <div className="flex items-center gap-1">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={assignedUser.avatar || ''} />
                  <AvatarFallback className="text-xs">
                    {assignedUser.fullName?.split(' ').map(n => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">
                  {assignedUser.fullName?.split(' ')[0] || 'משתמש'}
                </span>
              </div>
            )}
          </div>

          {/* Due date */}
          {task.dueDate && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>
                {format(new Date(task.dueDate), 'dd/MM/yyyy', { locale: he })}
              </span>
            </div>
          )}

          {/* Time tracking */}
          {task.estimatedHours && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{task.estimatedHours} שעות משוערות</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}