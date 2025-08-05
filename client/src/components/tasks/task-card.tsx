import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { type Task, type User, type Project } from '@shared/schema';
import { Clock, AlertTriangle, Calendar, User as UserIcon, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface TaskCardProps {
  task: Task;
  users: User[];
  projects: Project[];
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  isTableView?: boolean;
  isSelected?: boolean;
  onSelect?: (taskId: string, selected: boolean) => void;
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

export function TaskCard({ task, users, projects, onEdit, onDelete, isTableView = false, isSelected = false, onSelect }: TaskCardProps) {
  const assignedUser = users.find(user => user.id === task.assignedTo);
  const project = projects.find(p => p.id === task.projectId);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Table view selection and actions */}
          {isTableView && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => onSelect?.(task.id, !!checked)}
                />
              </div>
              <div className="flex items-center gap-1">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(task);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(task.id);
                    }}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Kanban view actions */}
          {!isTableView && (onEdit || onDelete) && (
            <div className="flex justify-end gap-1">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(task);
                  }}
                  className="h-6 w-6 p-0"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(task.id);
                  }}
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
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