import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { type Task, type User, type Project } from '@shared/schema';
import { Clock, AlertTriangle, Calendar, User as UserIcon, Edit, Trash2, Play, Pause, RotateCcw, Timer } from 'lucide-react';
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
  onTaskTimer?: (taskId: string, action: 'start' | 'pause' | 'stop') => void;
  activeTimers?: Record<string, number>;
}

interface TimeEntry {
  id: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

const PRIORITY_COLORS = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
  urgent: 'bg-red-100 text-red-800',
} as const;

const PRIORITY_LABELS = {
  low: 'נמוכה',
  medium: 'בינונית',
  high: 'גבוהה',
  urgent: 'דחופה',
} as const;

export function TaskCard({ task, users, projects, onEdit, onDelete, isTableView = false, isSelected = false, onSelect, onTaskTimer, activeTimers = {} }: TaskCardProps) {
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([
    // Mock data - in real app this would come from backend
    {
      id: '1',
      startTime: Date.now() - 3600000,
      endTime: Date.now() - 1800000,
      duration: 1800000
    },
    {
      id: '2',
      startTime: Date.now() - 1200000,
      endTime: Date.now() - 600000,
      duration: 600000
    }
  ]);

  const assignedUser = users.find(user => user.id === task.assignedTo);
  const project = projects.find(p => p.id === task.projectId);

  const isActive = activeTimers[task.id];
  const isCompleted = task.status === 'completed';

  const handleTimerAction = (action: 'start' | 'pause' | 'stop') => {
    if (action === 'start') {
      const startTime = Date.now();
      setTimeEntries(prev => [...prev, {
        id: Date.now().toString(),
        startTime,
      }]);
    } else if (action === 'stop') {
      setTimeEntries(prev => prev.map(entry => 
        !entry.endTime ? {
          ...entry,
          endTime: Date.now(),
          duration: Date.now() - entry.startTime
        } : entry
      ));
    }
    onTaskTimer?.(task.id, action);
  };

  const formatDuration = (duration: number) => {
    const hours = Math.floor(duration / 3600000);
    const minutes = Math.floor((duration % 3600000) / 60000);
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  const formatActiveTimer = (startTime: number) => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTotalTime = () => {
    const completedTime = timeEntries
      .filter(entry => entry.duration)
      .reduce((total, entry) => total + (entry.duration || 0), 0);

    const activeTime = isActive ? Date.now() - isActive : 0;
    return completedTime + activeTime;
  };

  return (
    <>
      <Card 
        className="hover:shadow-md transition-shadow cursor-pointer" 
        onClick={() => setShowTimeModal(true)}
      >
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
            <div className="flex items-center justify-between gap-2">
              {task.estimatedHours && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{task.estimatedHours} שעות משוערות</span>
                </div>
              )}

              
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Tracking Modal */}
      <Dialog open={showTimeModal} onOpenChange={setShowTimeModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-right font-rubik">מעקב זמן - {task.title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Current Status */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-right">סטטוס נוכחי</h3>
                <Badge className={`${PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS]}`}>
                  {PRIORITY_LABELS[task.priority as keyof typeof PRIORITY_LABELS]}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatDuration(getTotalTime())}
                  </div>
                  <div className="text-sm text-muted-foreground">זמן כולל</div>
                </div>

                {task.estimatedHours && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {task.estimatedHours}h
                    </div>
                    <div className="text-sm text-muted-foreground">זמן משוער</div>
                  </div>
                )}
              </div>

              {/* Timer Controls */}
              {!isCompleted && (
                <div className="flex justify-center gap-3">
                  {isActive ? (
                    <>
                      <div className="flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg">
                        <Timer className="h-4 w-4" />
                        <span className="font-mono">{formatActiveTimer(isActive)}</span>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => handleTimerAction('pause')}
                        className="flex items-center gap-2"
                      >
                        <Pause className="h-4 w-4" />
                        השהה
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleTimerAction('stop')}
                        className="flex items-center gap-2"
                      >
                        <RotateCcw className="h-4 w-4" />
                        עצור
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => handleTimerAction('start')}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    >
                      <Play className="h-4 w-4" />
                      התחל משימה
                    </Button>
                  )}
                </div>
              )}

              {isCompleted && (
                <div className="text-center py-4">
                  <Badge className="bg-green-100 text-green-800">
                    המשימה הושלמה
                  </Badge>
                </div>
              )}
            </div>

            {/* Time History */}
            <div>
              <h3 className="font-medium text-right mb-3">היסטוריית זמנים</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {timeEntries.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    עדיין לא נרשמו זמנים למשימה זו
                  </div>
                ) : (
                  timeEntries.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {format(new Date(entry.startTime), 'dd/MM/yyyy HH:mm', { locale: he })}
                        </div>
                        {entry.endTime && (
                          <div className="text-xs text-muted-foreground">
                            עד {format(new Date(entry.endTime), 'HH:mm', { locale: he })}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {entry.duration ? (
                          <Badge variant="secondary">
                            {formatDuration(entry.duration)}
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800">
                            פעיל כעת
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}