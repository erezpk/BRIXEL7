import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, FileText, Settings } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertClientCardTemplateSchema, type ClientCardTemplate, type InsertClientCardTemplate } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ClientCardTemplateBuilder from "@/components/client-card-builder/template-builder";

const industryOptions = [
  { value: "technology", label: "טכנולוגיה" },
  { value: "healthcare", label: "בריאות" },
  { value: "finance", label: "פיננסים" },
  { value: "retail", label: "קמעונאות" },
  { value: "construction", label: "בנייה" },
  { value: "consulting", label: "ייעוץ" },
  { value: "education", label: "חינוך" },
  { value: "real_estate", label: "נדל\"ן" },
  { value: "food_beverage", label: "מזון ומשקאות" },
  { value: "beauty", label: "יופי ואסתטיקה" },
  { value: "automotive", label: "רכב" },
  { value: "legal", label: "משפטים" },
  { value: "other", label: "אחר" }
];

export default function ClientTemplatesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ClientCardTemplate | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ClientCardTemplate | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['/api/client-card-templates'],
  });

  const createTemplateMutation = useMutation({
    mutationFn: (data: InsertClientCardTemplate) => 
      apiRequest('/api/client-card-templates', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/client-card-templates'] });
      setIsDialogOpen(false);
      toast({ title: "תבנית נוצרה בהצלחה" });
    },
    onError: () => {
      toast({ title: "שגיאה ביצירת תבנית", variant: "destructive" });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertClientCardTemplate> }) =>
      apiRequest(`/api/client-card-templates/${id}`, { method: 'PUT', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/client-card-templates'] });
      setIsDialogOpen(false);
      setEditingTemplate(null);
      toast({ title: "תבנית עודכנה בהצלחה" });
    },
    onError: () => {
      toast({ title: "שגיאה בעדכון תבנית", variant: "destructive" });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id: string) => 
      apiRequest(`/api/client-card-templates/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/client-card-templates'] });
      toast({ title: "תבנית נמחקה בהצלחה" });
    },
    onError: () => {
      toast({ title: "שגיאה במחיקת תבנית", variant: "destructive" });
    },
  });

  const form = useForm<InsertClientCardTemplate>({
    resolver: zodResolver(insertClientCardTemplateSchema.omit({ agencyId: true, createdBy: true })),
    defaultValues: {
      name: "",
      description: "",
      industry: "",
      fields: [],
      isPublic: false,
    },
  });

  const onSubmit = (data: InsertClientCardTemplate) => {
    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, data });
    } else {
      createTemplateMutation.mutate(data);
    }
  };

  const handleEdit = (template: ClientCardTemplate) => {
    setEditingTemplate(template);
    form.reset({
      name: template.name,
      description: template.description || "",
      industry: template.industry || "",
      fields: template.fields,
      isPublic: template.isPublic,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("האם אתה בטוח שברצונך למחוק תבנית זו?")) {
      deleteTemplateMutation.mutate(id);
    }
  };

  const handleBuilderOpen = (template: ClientCardTemplate) => {
    setSelectedTemplate(template);
    setShowBuilder(true);
  };

  const handleBuilderSave = (fields: any[]) => {
    if (selectedTemplate) {
      updateTemplateMutation.mutate({
        id: selectedTemplate.id,
        data: { fields }
      });
      setShowBuilder(false);
      setSelectedTemplate(null);
    }
  };

  const handleNewTemplate = () => {
    setEditingTemplate(null);
    form.reset({
      name: "",
      description: "",
      industry: "",
      fields: [],
      isPublic: false,
    });
    setIsDialogOpen(true);
  };

  if (showBuilder && selectedTemplate) {
    return (
      <ClientCardTemplateBuilder
        template={selectedTemplate}
        onSave={handleBuilderSave}
        onCancel={() => {
          setShowBuilder(false);
          setSelectedTemplate(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">תבניות כרטיסי לקוח</h1>
          <p className="text-gray-600 mt-2">
            נהל תבניות מותאמות אישית לכרטיסי לקוח עבור תחומי תעשייה שונים
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewTemplate}>
              <Plus className="h-4 w-4 ml-2" />
              תבנית חדשה
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-xl font-bold">
                {editingTemplate ? "עריכת תבנית" : "תבנית חדשה"}
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                צור תבנית מותאמת אישית לכרטיסי לקוח עבור תחום תעשייה ספציפי
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">שם התבנית</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="למשל: תבנית לקוחות עסקיים" 
                              className="mt-1"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">תיאור התבנית</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="תאר את מטרת התבנית ואיך היא תשמש את הצוות שלך"
                              className="mt-1 min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="industry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">תחום תעשייה</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="בחר את התחום הרלוונטי ביותר" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {industryOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="isPublic"
                      render={({ field }) => (
                        <FormItem className="flex items-start justify-between rounded-lg border p-4 shadow-sm bg-gray-50/50">
                          <div className="space-y-1 flex-1 pl-4">
                            <FormLabel className="text-base font-semibold">תבנית ציבורית</FormLabel>
                            <p className="text-sm text-gray-600 leading-relaxed">
                              כאשר מופעלת, תבנית זו תהיה זמינה גם לסוכנויות אחרות במערכת
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-6 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      className="px-6"
                    >
                      ביטול
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                      className="px-6"
                    >
                      {createTemplateMutation.isPending || updateTemplateMutation.isPending 
                        ? "שומר..." 
                        : editingTemplate ? "עדכן תבנית" : "צור תבנית"
                      }
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              אין תבניות עדיין
            </h3>
            <p className="text-gray-600 mb-4">
              צור את התבנית הראשונה שלך לכרטיסי לקוח
            </p>
            <Button onClick={handleNewTemplate}>
              <Plus className="h-4 w-4 ml-2" />
              צור תבנית חדשה
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template: ClientCardTemplate) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {template.description}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleBuilderOpen(template)}
                      title="עריכת שדות"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(template)}
                      title="עריכה"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(template.id)}
                      title="מחיקה"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {template.industry && (
                    <Badge variant="secondary">
                      {industryOptions.find(opt => opt.value === template.industry)?.label || template.industry}
                    </Badge>
                  )}
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{template.fields.length}</span> שדות מותאמים
                  </div>
                  {template.isPublic && (
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      תבנית ציבורית
                    </Badge>
                  )}
                  <div className="text-xs text-gray-500">
                    נוצר: {new Date(template.createdAt).toLocaleDateString('he-IL')}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}