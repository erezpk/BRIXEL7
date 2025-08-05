import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type Task, type User, type Project } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { TaskCard } from '@/components/tasks/task-card';
import { KanbanBoard } from '@/components/tasks/kanban-board';
import NewTaskModal from '@/components/modals/new-task-modal';
import {
  Plus,
  Search,
  Filter,
  CheckSquare,
  Clock,
  AlertTriangle,
  CheckCircle,
  Trash2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TASK_STATUSES = [
  { value: 'todo', label: 'לביצוע', color: 'bg-gray-100', icon: Clock },
  { value: 'in_progress', label: 'בתהליך', color: 'bg-blue-100', icon: AlertTriangle },
  { value: 'review', label: 'בבדיקה', color: 'bg-yellow-100', icon: CheckSquare },
  { value: 'completed', label: 'הושלם', color: 'bg-green-100', icon: CheckCircle }
];

export default function Tasks() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: Partial<Task> }) => {
      const response = await apiRequest('PUT', `/api/tasks/${taskId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "המשימה עודכנה בהצלחה",
        description: "המשימה עודכנה בהצלחה",
      });
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה בעדכון המשימה",
        description: error?.message || "אירעה שגיאה לא צפויה",
        variant: "destructive",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await apiRequest('DELETE', `/api/tasks/${taskId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "המשימה נמחקה בהצלחה",
        description: "המשימה נמחקה בהצלחה",
      });
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה במחיקת המשימה",
        description: error?.message || "אירעה שגיאה לא צפויה",
        variant: "destructive",
      });
    },
  });

  const deleteMultipleTasksMutation = useMutation({
    mutationFn: async (taskIds: string[]) => {
      const response = await apiRequest('POST', '/api/tasks/delete-multiple', { taskIds });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      setSelectedTasks([]);
      toast({
        title: "המשימות נמחקו בהצלחה",
        description: "המשימות הנבחרות נמחקו בהצלחה",
      });
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה במחיקת המשימות",
        description: error?.message || "אירעה שגיאה לא צפויה",
        variant: "destructive",
      });
    },
  });

  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    updateTaskMutation.mutate({ taskId, updates });
  };

  const handleTaskTimer = (taskId: string, action: 'start' | 'pause' | 'stop') => {
    // Timer functionality - could be expanded with actual time tracking
    toast({
      title: "טיימר משימה",
      description: action === 'start' ? "הטיימר התחיל" : action === 'pause' ? "הטיימר הושהה" : "הטיימר הופסק",
    });
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowNewTaskModal(true);
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק את המשימה?')) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  const handleTaskSelection = (taskId: string, selected: boolean) => {
    if (selected) {
      setSelectedTasks(prev => [...prev, taskId]);
    } else {
      setSelectedTasks(prev => prev.filter(id => id !== taskId));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedTasks.length === 0) return;

    if (confirm(`האם אתה בטוח שברצונך למחוק ${selectedTasks.length} משימות?`)) {
      deleteMultipleTasksMutation.mutate(selectedTasks);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTasks(filteredTasks.map(task => task.id));
    } else {
      setSelectedTasks([]);
    }
  };

  const filteredTasks = React.useMemo(() => {
    if (!tasks) return [];

    return tasks.filter((task: Task) => {
      const matchesSearch = searchQuery === "" ||
        task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      const matchesAssignee = assigneeFilter === "all" || task.assignedTo === assigneeFilter;

      return matchesSearch && matchesStatus && matchesAssignee;
    });
  }, [tasks, searchQuery, statusFilter, assigneeFilter]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="flex gap-4 mb-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">משימות</h1>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'outline'}
              onClick={() => setViewMode('kanban')}
              size="sm"
            >
              לוח משימות
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              onClick={() => setViewMode('table')}
              size="sm"
            >
              טבלה
            </Button>
            <Button onClick={() => setShowNewTaskModal(true)}>
              <Plus className="h-4 w-4 ml-2" />
              משימה חדשה
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="חיפוש משימות..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="סנן לפי סטטוס" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הסטטוסים</SelectItem>
              {TASK_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="סנן לפי מבצע" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל המבצעים</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id || "none"}>
                  {user.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <KanbanBoard
          tasks={filteredTasks}
          users={users}
          projects={projects}
          onTaskUpdate={handleTaskUpdate}
          onTaskTimer={handleTaskTimer}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
        />
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>משימות - תצוגת טבלה</CardTitle>
              {selectedTasks.length > 0 && (
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-sm text-muted-foreground">
                    {selectedTasks.length} משימות נבחרו
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteSelected}
                    disabled={deleteMultipleTasksMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 ml-1" />
                    מחק נבחרות
                  </Button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedTasks.length === filteredTasks.length && filteredTasks.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">בחר הכל</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  users={users || []}
                  projects={projects || []}
                  isTableView={true}
                  isSelected={selectedTasks.includes(task.id)}
                  onSelect={handleTaskSelection}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                  onTaskTimer={handleTaskTimer}
                  activeTimers={{}}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <NewTaskModal
        isOpen={showNewTaskModal}
        onClose={() => {
          setShowNewTaskModal(false);
          setEditingTask(null);
        }}
        editingTask={editingTask}
      />
    </div>
  );
}