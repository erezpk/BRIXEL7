import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowRight, Plus } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { type Client, type InsertClient, type InsertProject } from "@shared/schema";
import { useLocation } from 'wouter'; // Fixed import for navigation

export default function NewProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectType, setProjectType] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [showNewClientModal, setShowNewClientModal] = useState(false);

  // New client form state
  const [newClientData, setNewClientData] = useState({
    name: "",
    contactName: "",
    email: "",
    phone: "",
    industry: "",
    status: "active" as const,
    notes: "",
  });

  // Fetch clients
  const { data: clients, isLoading: isLoadingClients } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
    staleTime: 30000,
  });

  // Create new client mutation
  const createClientMutation = useMutation({
    mutationFn: async (data: Omit<InsertClient, 'agencyId'>) => {
      const response = await apiRequest('POST', '/api/clients', data);
      return response.json();
    },
    onSuccess: (newClient) => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      setSelectedClientId(newClient.id);
      setShowNewClientModal(false);
      resetNewClientForm();
      toast({
        title: "לקוח נוצר בהצלחה",
        description: "הלקוח החדש נוסף למערכת ונבחר לפרויקט",
      });
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה ביצירת לקוח",
        description: error?.message || "אירעה שגיאה לא צפויה",
        variant: "destructive",
      });
    },
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: Omit<InsertProject, 'agencyId'>) => {
      const response = await apiRequest('POST', '/api/projects', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({
        title: "פרויקט נוצר בהצלחה",
        description: "הפרויקט החדש נוסף למערכת",
      });
      resetProjectForm();
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה ביצירת פרויקט",
        description: error?.message || "אירעה שגיאה לא צפויה",
        variant: "destructive",
      });
    },
  });

  const resetProjectForm = () => {
    setProjectName('');
    setProjectDescription('');
    setProjectType('');
    setSelectedClientId('');
  };

  const resetNewClientForm = () => {
    setNewClientData({
      name: "",
      contactName: "",
      email: "",
      phone: "",
      industry: "",
      status: "active",
      notes: "",
    });
  };

  const handleProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      toast({
        title: "שגיאה",
        description: "שם הפרויקט הוא שדה חובה",
        variant: "destructive",
      });
      return;
    }

    const projectData = {
      name: projectName,
      description: projectDescription,
      type: projectType,
      clientId: selectedClientId === "none" ? null : selectedClientId || null,
      status: 'planning' as const,
      createdBy: user?.id || '',
    };

    createProjectMutation.mutate(projectData);
  };

  const handleNewClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientData.name.trim()) {
      toast({
        title: "שגיאה",
        description: "שם הלקוח הוא שדה חובה",
        variant: "destructive",
      });
      return;
    }
    createClientMutation.mutate(newClientData);
  };

  const handleNewClientInputChange = (field: keyof typeof newClientData, value: string) => {
    setNewClientData(prev => ({ ...prev, [field]: value }));
  };

  // Placeholder for Drag & Drop related state and functions
  const [tasks] = useState([]); // Example state for tasks
  const [columns] = useState([
    { id: 'todo', name: 'ממתין' },
    { id: 'in-progress', name: 'בביצוע' },
    { id: 'done', name: 'הושלם' },
  ]);

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-right">פרויקט חדש</CardTitle>
          <CardDescription className="text-right">
            צור פרויקט חדש עבור הלקוח שלך
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProjectSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="projectName" className="text-right block">
                שם הפרויקט *
              </Label>
              <Input
                id="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="הכנס שם פרויקט"
                className="text-right"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectDescription" className="text-right block">
                תיאור הפרויקט
              </Label>
              <Textarea
                id="projectDescription"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="תאר את הפרויקט"
                className="text-right min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectType" className="text-right block">
                סוג הפרויקט
              </Label>
              <Select value={projectType} onValueChange={setProjectType}>
                <SelectTrigger className="text-right">
                  <SelectValue placeholder="בחר סוג פרויקט" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="website">אתר אינטרנט</SelectItem>
                  <SelectItem value="mobile-app">אפליקציית מובייל</SelectItem>
                  <SelectItem value="web-app">אפליקציית ווב</SelectItem>
                  <SelectItem value="ecommerce">חנות מקוונת</SelectItem>
                  <SelectItem value="other">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-right block">
                לקוח
              </Label>
              <div className="flex gap-2">
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger className="flex-1 text-right">
                    <SelectValue placeholder="בחר לקוח" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">ללא לקוח</SelectItem>
                    {clients?.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewClientModal(true)}
                  className="px-3"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={createProjectMutation.isPending}
            >
              {createProjectMutation.isPending ? "יוצר פרויקט..." : "צור פרויקט"}
              <ArrowRight className="mr-2 h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Tasks Section - Placeholder for Drag & Drop */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-right mb-4">משימות</h2>
        {/* This is where the Drag & Drop task board will be implemented */}
        <div className="flex gap-4 overflow-x-auto">
          {columns.map((column) => (
            <div key={column.id} className="w-64 flex-shrink-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-right">{column.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Placeholder for Task Cards */}
                  {/* In a real implementation, tasks would be mapped here and filtered by column.id */}
                  <div className="min-h-[100px] bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                    <p>גרור ושחרר משימות לכאן</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* New Client Modal */}
      <Dialog open={showNewClientModal} onOpenChange={setShowNewClientModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right font-rubik">לקוח חדש</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleNewClientSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clientName" className="text-right">שם הלקוח *</Label>
              <Input
                id="clientName"
                value={newClientData.name}
                onChange={(e) => handleNewClientInputChange('name', e.target.value)}
                placeholder="הכנס שם הלקוח"
                className="text-right"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactName" className="text-right">איש קשר</Label>
              <Input
                id="contactName"
                value={newClientData.contactName}
                onChange={(e) => handleNewClientInputChange('contactName', e.target.value)}
                placeholder="שם איש הקשר"
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-right">אימייל</Label>
              <Input
                id="email"
                type="email"
                value={newClientData.email}
                onChange={(e) => handleNewClientInputChange('email', e.target.value)}
                placeholder="כתובת אימייל"
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-right">טלפון</Label>
              <Input
                id="phone"
                value={newClientData.phone}
                onChange={(e) => handleNewClientInputChange('phone', e.target.value)}
                placeholder="מספר טלפון"
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry" className="text-right">תחום עיסוק</Label>
              <Select value={newClientData.industry} onValueChange={(value) => handleNewClientInputChange('industry', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר תחום עיסוק" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technology">טכנולוגיה</SelectItem>
                  <SelectItem value="healthcare">בריאות</SelectItem>
                  <SelectItem value="education">חינוך</SelectItem>
                  <SelectItem value="finance">פיננסים</SelectItem>
                  <SelectItem value="retail">קמעונאות</SelectItem>
                  <SelectItem value="food">מזון ומשקאות</SelectItem>
                  <SelectItem value="real-estate">נדל"ן</SelectItem>
                  <SelectItem value="legal">משפטים</SelectItem>
                  <SelectItem value="consulting">ייעוץ</SelectItem>
                  <SelectItem value="other">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex space-x-reverse space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewClientModal(false)}
              >
                ביטול
              </Button>
              <Button
                type="submit"
                disabled={createClientMutation.isPending}
              >
                {createClientMutation.isPending ? "יוצר..." : "צור לקוח"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}