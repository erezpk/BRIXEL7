import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import TaskCard from "@/components/tasks/task-card";
import NewTaskModal from "@/components/modals/new-task-modal";
import { Plus, Search, CheckSquare } from "lucide-react";
import { type Task, type Client, type User as UserType } from "@shared/schema";

interface TaskWithRelations extends Task {
  client?: Client;
  assignedUser?: UserType;
  project?: { name: string };
}

export default function Tasks() {
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");

  const { data: tasks, isLoading } = useQuery<TaskWithRelations[]>({
    queryKey: ['/api/tasks'],
    staleTime: 30000, // 30 seconds
  });

  const { data: teamMembers } = useQuery<UserType[]>({
    queryKey: ['/api/team'],
  });

  const filteredTasks = tasks?.filter(task => {
    const matchesSearch = !searchQuery || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.client?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesAssignee = assigneeFilter === "all" || task.assignedTo === assigneeFilter;
    
    return matchesSearch && matchesStatus && matchesAssignee;
  });

  const handleViewTask = (task: Task) => {
    // TODO: Implement task details view
    console.log('View task:', task);
  };

  const handleEditTask = (task: Task) => {
    // TODO: Implement edit task modal
    console.log('Edit task:', task);
  };

  const handleDeleteTask = (task: Task) => {
    // TODO: Implement delete task confirmation
    console.log('Delete task:', task);
  };

  return (
    <div className="space-y-6" data-testid="tasks-page">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-rubik" data-testid="tasks-title">
            ניהול משימות
          </h1>
          <p className="text-gray-600 mt-1">
            עקבו אחר כל המשימות והתקדמות הצוות
          </p>
        </div>
        <Button 
          onClick={() => setShowNewTaskModal(true)}
          className="flex items-center space-x-reverse space-x-2"
          data-testid="button-new-task"
        >
          <Plus className="h-4 w-4" />
          <span>משימה חדשה</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="חיפוש משימות..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 text-right"
            data-testid="search-tasks"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48" data-testid="filter-status">
            <SelectValue placeholder="סינון לפי סטטוס" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הסטטוסים</SelectItem>
            <SelectItem value="new">חדש</SelectItem>
            <SelectItem value="in_progress">בביצוע</SelectItem>
            <SelectItem value="completed">הושלם</SelectItem>
            <SelectItem value="cancelled">בוטל</SelectItem>
          </SelectContent>
        </Select>

        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
          <SelectTrigger className="w-full sm:w-48" data-testid="filter-assignee">
            <SelectValue placeholder="סינון לפי חבר צוות" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל חברי הצוות</SelectItem>
            {teamMembers?.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tasks List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-reverse space-x-3 mb-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-12 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-3/4 mb-3" />
                  <div className="flex items-center space-x-reverse space-x-4">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
                <div className="flex space-x-reverse space-x-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-8" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
              <div className="border-t pt-4">
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          ))}
        </div>
      ) : !filteredTasks || filteredTasks.length === 0 ? (
        <div className="text-center py-12" data-testid="no-tasks">
          <CheckSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchQuery || statusFilter !== "all" || assigneeFilter !== "all" 
              ? "לא נמצאו משימות" 
              : "אין משימות עדיין"
            }
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || statusFilter !== "all" || assigneeFilter !== "all"
              ? "נסה לשנות את החיפוש או הסינון"
              : "התחל על ידי יצירת המשימה הראשונה שלך"
            }
          </p>
          {!searchQuery && statusFilter === "all" && assigneeFilter === "all" && (
            <Button onClick={() => setShowNewTaskModal(true)} data-testid="button-add-first-task">
              <Plus className="h-4 w-4 ml-2" />
              הוסף משימה ראשונה
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onView={handleViewTask}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
            />
          ))}
        </div>
      )}

      {/* New Task Modal */}
      <NewTaskModal
        isOpen={showNewTaskModal}
        onClose={() => setShowNewTaskModal(false)}
      />
    </div>
  );
}
