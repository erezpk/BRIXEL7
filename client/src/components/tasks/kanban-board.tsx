import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TaskCard } from './task-card';
import { type Task, type User, type Project } from '@shared/schema';
import { Clock, Play, Pause, RotateCcw, CheckCircle, CheckSquare, AlertTriangle } from 'lucide-react';

const TASK_STATUSES = [
  { value: 'new', label: 'חדש', color: 'bg-gray-100 text-gray-800', icon: Clock },
  { value: 'in_progress', label: 'בתהליך', color: 'bg-blue-100 text-blue-800', icon: AlertTriangle },
  { value: 'review', label: 'בבדיקה', color: 'bg-yellow-100 text-yellow-800', icon: CheckSquare },
  { value: 'completed', label: 'הושלם', color: 'bg-green-100 text-green-800', icon: CheckCircle }
];

interface KanbanBoardProps {
  tasks: Task[];
  users: User[];
  projects: Project[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskTimer?: (taskId: string, action: 'start' | 'pause' | 'stop') => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
}

export function KanbanBoard({ tasks, users, projects, onTaskUpdate, onTaskTimer, onEditTask, onDeleteTask }: KanbanBoardProps) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [activeTimers, setActiveTimers] = useState<Record<string, number>>({});

  const formatActiveTimer = (startTime: number) => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const groupedTasks = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    TASK_STATUSES.forEach(status => {
      grouped[status.value] = tasks.filter(task => task.status === status.value);
    });
    return grouped;
  }, [tasks]);

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    (e.target as HTMLElement).style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = '1';
    setDraggedTask(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();

    if (draggedTask && draggedTask.status !== newStatus) {
      onTaskUpdate(draggedTask.id, { status: newStatus });
    }
  };

  const handleTimerAction = (taskId: string, action: 'start' | 'pause' | 'stop') => {
    if (action === 'start') {
      const startTime = Date.now();
      setActiveTimers(prev => ({ ...prev, [taskId]: startTime }));
    } else if (action === 'pause' || action === 'stop') {
      setActiveTimers(prev => {
        const newTimers = { ...prev };
        delete newTimers[taskId];
        return newTimers;
      });
    }

    onTaskTimer?.(taskId, action);
  };

  // Update timers every second
  React.useEffect(() => {
    const interval = setInterval(() => {
      setActiveTimers(prev => ({ ...prev }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {TASK_STATUSES.map((status) => {
        const statusTasks = groupedTasks[status.value] || [];
        const StatusIcon = status.icon;

        return (
          <div
            key={status.value}
            onDrop={(e) => handleDrop(e, status.value)}
            onDragOver={handleDragOver}
            className="flex flex-col"
          >
            <Card className="flex-1 min-h-[500px]">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <StatusIcon className="h-5 w-5" />
                  <span>{status.label}</span>
                  <Badge variant="secondary" className="mr-auto">
                    {statusTasks.length}
                  </Badge>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3 flex-1">
                {statusTasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">אין משימות</p>
                  </div>
                ) : (
                  statusTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      onDragEnd={handleDragEnd}
                      className="cursor-move"
                    >
                      <div className="relative">
                        <TaskCard
                          key={task.id}
                          task={task}
                          users={users}
                          projects={projects}
                          onEdit={onEditTask}
                          onDelete={onDeleteTask}
                          onTaskTimer={onTaskTimer}
                          activeTimers={activeTimers}
                        />

                        {/* Timer Controls */}
                        <div className="absolute bottom-2 left-2 flex items-center gap-1">
                          {activeTimers[task.id] ? (
                            <>
                              <div className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
                                {formatActiveTimer(activeTimers[task.id])}
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleTimerAction(task.id, 'pause')}
                                className="h-6 w-6 p-0"
                              >
                                <Pause className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleTimerAction(task.id, 'stop')}
                                className="h-6 w-6 p-0"
                              >
                                <RotateCcw className="h-3 w-3" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleTimerAction(task.id, 'start')}
                              className="h-6 w-6 p-0"
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}