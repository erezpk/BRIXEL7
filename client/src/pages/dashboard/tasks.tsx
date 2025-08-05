
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { TaskCard } from '@/components/tasks/task-card';
import { NewTaskModal } from '@/components/modals/new-task-modal';
import {
  Plus,
  Search,
  Filter,
  CheckSquare,
  Clock,
  AlertTriangle,
  CheckCircle
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
  const [draggedTask, setDraggedTask] = useState(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['/api/tasks'],
  });

  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects'],
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, status }) => {
      const response = await apiRequest('PUT', `/api/tasks/${taskId}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "המשימה עודכנה בהצלחה",
        description: "הסטטוס של המשימה השתנה",
      });
    },
    onError: (error) => {
      toast({
        title: "שגיאה בעדכון המשימה",
        description: error?.message || "אירעה שגיאה לא צפויה",
        variant: "destructive",
      });
    },
  });

  const filteredTasks = React.useMemo(() => {
    if (!tasks) return [];
    
    return tasks.filter((task) => {
      const matchesSearch = searchQuery === "" || 
        task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      const matchesAssignee = assigneeFilter === "all" || task.assigneeId === assigneeFilter;
      
      return matchesSearch && matchesStatus && matchesAssignee;
    });
  }, [tasks, searchQuery, statusFilter, assigneeFilter]);

  const groupedTasks = React.useMemo(() => {
    const grouped = {};
    TASK_STATUSES.forEach(status => {
      grouped[status.value] = filteredTasks.filter(task => task.status === status.value);
    });
    return grouped;
  }, [filteredTasks]);

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedTask(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    
    if (draggedTask && draggedTask.status !== newStatus) {
      updateTaskMutation.mutate({
        taskId: draggedTask.id,
        status: newStatus
      });
    }
  };

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
          <Button onClick={() => setShowNewTaskModal(true)}>
            <Plus className="h-4 w-4 ml-2" />
            משימה חדשה
          </Button>
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
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {TASK_STATUSES.map((statusConfig) => {
          const StatusIcon = statusConfig.icon;
          const statusTasks = groupedTasks[statusConfig.value] || [];
          
          return (
            <div 
              key={statusConfig.value}
              className="flex flex-col"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, statusConfig.value)}
            >
              <Card className={`${statusConfig.color} border-2 border-dashed min-h-[600px]`}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <StatusIcon className="h-4 w-4" />
                    {statusConfig.label}
                    <Badge variant="secondary" className="mr-auto">
                      {statusTasks.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-3">
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
                        <TaskCard 
                          task={task} 
                          projects={projects}
                          users={users}
                        />
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      <NewTaskModal 
        open={showNewTaskModal} 
        onOpenChange={setShowNewTaskModal}
      />
    </div>
  );
}
