import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { type InsertProject, type Client, type User } from "@shared/schema";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { CalendarIcon, ArrowRight } from "lucide-react";

export default function NewProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useNavigate();
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "planning" as const,
    priority: "medium" as const,
    clientId: "none",
    assignedTo: "none",
    startDate: null as Date | null,
    endDate: null as Date | null,
    budget: "",
  });

  // Fetch clients
  const { data: clients } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
  });

  // Fetch team members
  const { data: teamMembers } = useQuery<User[]>({
    queryKey: ['/api/team'],
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: Omit<InsertProject, 'agencyId' | 'createdBy'>) => {
      const response = await apiRequest('POST', '/api/projects', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "פרויקט נוצר בהצלחה",
        description: "הפרויקט החדש נוסף למערכת",
      });
      navigate('/dashboard/projects');
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה ביצירת פרויקט",
        description: error?.message || "אירעה שגיאה לא צפויה",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: "שגיאה",
        description: "שם הפרויקט הוא שדה חובה",
        variant: "destructive",
      });
      return;
    }

    if (formData.clientId === "none") {
      toast({
        title: "שגיאה",
        description: "יש לבחור לקוח לפרויקט",
        variant: "destructive",
      });
      return;
    }

    const projectData: Omit<InsertProject, 'agencyId' | 'createdBy'> = {
      name: formData.name,
      description: formData.description || undefined,
      status: formData.status,
      priority: formData.priority,
      clientId: formData.clientId,
      assignedTo: formData.assignedTo === "none" ? undefined : formData.assignedTo,
      startDate: formData.startDate ? formData.startDate.toISOString().split('T')[0] : undefined,
      endDate: formData.endDate ? formData.endDate.toISOString().split('T')[0] : undefined,
      budget: formData.budget ? parseInt(formData.budget) * 100 : undefined, // Convert to agorot
    };

    createProjectMutation.mutate(projectData);
  };

  const handleInputChange = (field: keyof typeof formData, value: string | Date | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center space-x-reverse space-x-4 mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard/projects')}
          className="flex items-center space-x-reverse space-x-2"
        >
          <ArrowRight className="h-4 w-4" />
          <span>חזרה לפרויקטים</span>
        </Button>
        <div className="border-r border-gray-300 h-6"></div>
        <h1 className="text-2xl font-bold text-gray-900 font-rubik">פרויקט חדש</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-right font-rubik">פרטי הפרויקט</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-right">שם הפרויקט *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="הכנס שם לפרויקט"
                  className="text-right"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="clientId" className="text-right">לקוח *</Label>
                <Select value={formData.clientId} onValueChange={(value) => handleInputChange('clientId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר לקוח" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">בחר לקוח</SelectItem>
                    {clients?.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-right">תיאור הפרויקט</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="תיאור מפורט של הפרויקט"
                className="text-right"
                rows={4}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="status" className="text-right">סטטוס</Label>
                <Select value={formData.status} onValueChange={(value: "planning" | "active" | "completed" | "cancelled") => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">תכנון</SelectItem>
                    <SelectItem value="active">פעיל</SelectItem>
                    <SelectItem value="completed">הושלם</SelectItem>
                    <SelectItem value="cancelled">בוטל</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priority" className="text-right">עדיפות</Label>
                <Select value={formData.priority} onValueChange={(value: "low" | "medium" | "high" | "urgent") => handleInputChange('priority', value)}>
                  <SelectTrigger>
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="assignedTo" className="text-right">אחראי פרויקט</Label>
                <Select value={formData.assignedTo} onValueChange={(value) => handleInputChange('assignedTo', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר אחראי" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">ללא הקצאה</SelectItem>
                    {teamMembers?.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="budget" className="text-right">תקציב (₪)</Label>
                <Input
                  id="budget"
                  type="number"
                  value={formData.budget}
                  onChange={(e) => handleInputChange('budget', e.target.value)}
                  placeholder="תקציב בשקלים"
                  className="text-right"
                  min="0"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-right">תאריך התחלה</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-right"
                    >
                      <CalendarIcon className="ml-2 h-4 w-4" />
                      {formData.startDate ? (
                        format(formData.startDate, "dd/MM/yyyy", { locale: he })
                      ) : (
                        "בחר תאריך התחלה"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.startDate || undefined}
                      onSelect={(date) => handleInputChange('startDate', date || null)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label className="text-right">תאריך סיום</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-right"
                    >
                      <CalendarIcon className="ml-2 h-4 w-4" />
                      {formData.endDate ? (
                        format(formData.endDate, "dd/MM/yyyy", { locale: he })
                      ) : (
                        "בחר תאריך סיום"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.endDate || undefined}
                      onSelect={(date) => handleInputChange('endDate', date || null)}
                      disabled={(date) => formData.startDate ? date < formData.startDate : false}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="flex space-x-reverse space-x-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard/projects')}
              >
                ביטול
              </Button>
              <Button
                type="submit"
                disabled={createProjectMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createProjectMutation.isPending ? "יוצר פרויקט..." : "צור פרויקט"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}