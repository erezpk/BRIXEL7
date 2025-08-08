import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type InsertTask, type Client, type Project, type User, type Task } from "@shared/schema";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTask?: Task | null;
}

export default function NewTaskModal({ isOpen, onClose, editingTask }: NewTaskModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "new" as const,
    priority: "medium" as const,
    clientId: "none",
    projectId: "none",
    assignedTo: "none",
    dueDate: null as Date | null,
    estimatedHours: "",
  });

  // Initialize form with editing task data
  useEffect(() => {
    if (editingTask) {
      setFormData({
        title: editingTask.title || "",
        description: editingTask.description || "",
        status: editingTask.status as any || "new",
        priority: editingTask.priority as any || "medium",
        clientId: editingTask.clientId || "none",
        projectId: editingTask.projectId || "none",
        assignedTo: editingTask.assignedTo || "none",
        dueDate: editingTask.dueDate ? new Date(editingTask.dueDate) : null,
        estimatedHours: editingTask.estimatedHours?.toString() || "",
      });
    } else {
      setFormData({
        title: "",
        description: "",
        status: "new",
        priority: "medium",
        clientId: "none",
        projectId: "none",
        assignedTo: "none",
        dueDate: null,
        estimatedHours: "",
      });
    }
  }, [editingTask, isOpen]);

  // Fetch clients
  const { data: clients } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
  });

  // Fetch projects (filtered by selected client if any)
  const { data: projects } = useQuery<Project[]>({
    queryKey: ['/api/projects', formData.clientId],
    queryFn: async () => {
      const url = formData.clientId && formData.clientId !== "none" ? `/api/projects?clientId=${formData.clientId}` : '/api/projects';
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch projects');
      return response.json();
    },
  });

  // Fetch team members
  const { data: teamMembers } = useQuery<User[]>({
    queryKey: ['/api/team'],
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: Omit<InsertTask, 'agencyId' | 'createdBy'>) => {
      return apiRequest('/api/tasks', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "משימה נוצרה בהצלחה",
        description: "המשימה החדשה נוספה למערכת",
      });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה ביצירת משימה",
        description: error?.message || "אירעה שגיאה לא צפויה",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      status: "new",
      priority: "medium",
      clientId: "none",
      projectId: "none",
      assignedTo: "none",
      dueDate: null,
      estimatedHours: "",
    });
  };

  // Reset project when client changes
  useEffect(() => {
    if (formData.clientId && formData.clientId !== "none") {
      setFormData(prev => ({ ...prev, projectId: "none" }));
    }
  }, [formData.clientId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast({
        title: "שגיאה",
        description: "כותרת המשימה היא שדה חובה",
        variant: "destructive",
      });
      return;
    }

    const taskData: Omit<InsertTask, 'agencyId' | 'createdBy'> = {
      title: formData.title,
      description: formData.description || undefined,
      status: formData.status,
      priority: formData.priority,
      clientId: formData.clientId === "none" ? undefined : formData.clientId || undefined,
      projectId: formData.projectId === "none" ? undefined : formData.projectId || undefined,
      assignedTo: formData.assignedTo === "none" ? undefined : formData.assignedTo || undefined,
      dueDate: formData.dueDate ? formData.dueDate.toISOString().split('T')[0] : undefined,
      estimatedHours: formData.estimatedHours ? parseInt(formData.estimatedHours) : undefined,
    };

    createTaskMutation.mutate(taskData);
  };

  const handleInputChange = (field: keyof typeof formData, value: string | Date | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" data-testid="new-task-modal">
        <DialogHeader>
          <DialogTitle className="text-right font-rubik">משימה חדשה</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-right">כותרת המשימה *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="הכנס כותרת למשימה"
              className="text-right"
              required
              data-testid="input-task-title"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="text-right">תיאור</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="תיאור המשימה"
              className="text-right"
              rows={3}
              data-testid="textarea-task-description"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status" className="text-right">סטטוס</Label>
              <Select value={formData.status} onValueChange={(value: "new" | "in_progress" | "completed" | "cancelled") => handleInputChange('status', value)}>
                <SelectTrigger data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">חדש</SelectItem>
                  <SelectItem value="in_progress">בביצוע</SelectItem>
                  <SelectItem value="completed">הושלם</SelectItem>
                  <SelectItem value="cancelled">בוטל</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-right">עדיפות</Label>
              <Select value={formData.priority} onValueChange={(value: "low" | "medium" | "high" | "urgent") => handleInputChange('priority', value)}>
                <SelectTrigger data-testid="select-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">נמוך</SelectItem>
                  <SelectItem value="medium">בינוני</SelectItem>
                  <SelectItem value="high">גבוה</SelectItem>
                  <SelectItem value="urgent">דחוף</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="clientId" className="text-right">לקוח</Label>
            <Select value={formData.clientId} onValueChange={(value) => handleInputChange('clientId', value)}>
              <SelectTrigger data-testid="select-client">
                <SelectValue placeholder="בחר לקוח" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-client">ללא לקוח</SelectItem>
                {clients?.map((client) => (
                  <SelectItem key={client.id} value={client.id || "none"}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {formData.clientId && formData.clientId !== "none" && (
            <div className="space-y-2">
              <Label htmlFor="projectId" className="text-right">פרויקט</Label>
              <Select value={formData.projectId} onValueChange={(value) => handleInputChange('projectId', value)}>
                <SelectTrigger data-testid="select-project">
                  <SelectValue placeholder="בחר פרויקט" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-project">ללא פרויקט</SelectItem>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id || "none"}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="assignedTo" className="text-right">הקצה ל</Label>
            <Select value={formData.assignedTo} onValueChange={(value) => handleInputChange('assignedTo', value)}>
              <SelectTrigger data-testid="select-assigned-to">
                <SelectValue placeholder="בחר חבר צוות" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">ללא הקצאה</SelectItem>
                {teamMembers?.map((member) => (
                  <SelectItem key={member.id} value={member.id || "none"}>
                    {member.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-right">תאריך יעד</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-right"
                    data-testid="button-due-date"
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {formData.dueDate ? (
                      format(formData.dueDate, "dd/MM/yyyy", { locale: he })
                    ) : (
                      "בחר תאריך"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.dueDate || undefined}
                    onSelect={(date) => handleInputChange('dueDate', date || null)}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="estimatedHours" className="text-right">שעות משוערות</Label>
              <Input
                id="estimatedHours"
                type="number"
                value={formData.estimatedHours}
                onChange={(e) => handleInputChange('estimatedHours', e.target.value)}
                placeholder="מספר שעות"
                className="text-right"
                min="0"
                data-testid="input-estimated-hours"
              />
            </div>
          </div>
          
          <div className="flex space-x-reverse space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-testid="button-cancel"
            >
              ביטול
            </Button>
            <Button
              type="submit"
              disabled={createTaskMutation.isPending}
              data-testid="button-create"
            >
              {createTaskMutation.isPending ? "יוצר..." : "צור משימה"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
