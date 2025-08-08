import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, FileText, Upload, Download, Edit, Trash2, Star, StarOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { rtlClass } from "@/lib/rtl";
import { apiRequest } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";

interface ContractTemplate {
  id: string;
  name: string;
  description?: string;
  type: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

const contractTypes = [
  { value: "service_agreement", label: "הסכם שירותים" },
  { value: "work_contract", label: "חוזה עבודה" },
  { value: "nda", label: "הסכם סודיות (NDA)" },
  { value: "terms_of_service", label: "תנאי השירות" },
  { value: "consulting", label: "הסכם ייעוץ" },
  { value: "maintenance", label: "הסכם תחזוקה" },
  { value: "other", label: "אחר" },
];

export default function ContractTemplates() {
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "service_agreement",
    fileUrl: "",
  });

  // Fetch contract templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['/api/contract-templates'],
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("/api/contract-templates", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contract-templates'] });
      setIsNewDialogOpen(false);
      resetForm();
      toast({
        title: "תבנית נוצרה בהצלחה",
        description: "תבנית החוזה החדשה נשמרה במערכת",
      });
    },
    onError: () => {
      toast({
        title: "שגיאה ביצירת תבנית",
        description: "נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      return await apiRequest(`/api/contract-templates/${id}`, "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contract-templates'] });
      setEditingTemplate(null);
      resetForm();
      toast({
        title: "תבנית עודכנה בהצלחה",
        description: "השינויים נשמרו במערכת",
      });
    },
    onError: () => {
      toast({
        title: "שגיאה בעדכון תבנית",
        description: "נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/contract-templates/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contract-templates'] });
      toast({
        title: "תבנית נמחקה בהצלחה",
        description: "התבנית הוסרה מהמערכת",
      });
    },
    onError: () => {
      toast({
        title: "שגיאה במחיקת תבנית",
        description: "נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    },
  });

  const toggleDefaultMutation = useMutation({
    mutationFn: async ({ id, isDefault }: { id: string; isDefault: boolean }) => {
      return await apiRequest(`/api/contract-templates/${id}/default`, "PUT", { isDefault });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contract-templates'] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "service_agreement",
      fileUrl: "",
    });
  };

  const handleEdit = (template: ContractTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || "",
      type: template.type,
      fileUrl: template.fileUrl || "",
    });
  };

  const handleSubmit = () => {
    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, data: formData });
    } else {
      createTemplateMutation.mutate(formData);
    }
  };

  const getUploadParameters = async () => {
    const response = await apiRequest("/api/objects/upload", "POST");
    return {
      method: "PUT" as const,
      url: response.uploadURL,
    };
  };

  const handleUploadComplete = (result: any) => {
    if (result.successful && result.successful[0]) {
      const uploadedFile = result.successful[0];
      setFormData(prev => ({
        ...prev,
        fileUrl: uploadedFile.uploadURL,
      }));
      toast({
        title: "קובץ הועלה בהצלחה",
        description: "הקובץ נשמר במערכת",
      });
    }
  };

  const getTypeLabel = (type: string) => {
    return contractTypes.find(t => t.value === type)?.label || type;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className={cn("container mx-auto py-6 space-y-6 max-w-7xl", rtlClass())}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">תבניות חוזים</h1>
          <p className="text-muted-foreground">
            נהל תבניות חוזים והסכמים להצעות מחיר
          </p>
        </div>
        <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              תבנית חדשה
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>תבנית חוזה חדשה</DialogTitle>
              <DialogDescription>
                צור תבנית חוזה חדשה שניתן לצרף להצעות מחיר
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">שם התבנית</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="הזן שם לתבנית"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">סוג החוזה</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר סוג חוזה" />
                  </SelectTrigger>
                  <SelectContent>
                    {contractTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">תיאור</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="תיאור התבנית (אופציונלי)"
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label>קובץ PDF</Label>
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={10485760} // 10MB
                  onGetUploadParameters={getUploadParameters}
                  onComplete={handleUploadComplete}
                  buttonClassName="w-full"
                >
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    {formData.fileUrl ? "שנה קובץ PDF" : "העלה קובץ PDF"}
                  </div>
                </ObjectUploader>
                {formData.fileUrl && (
                  <p className="text-sm text-green-600">קובץ הועלה בהצלחה</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={handleSubmit} 
                disabled={createTemplateMutation.isPending || !formData.name}
              >
                {createTemplateMutation.isPending ? "יוצר..." : "צור תבנית"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">טוען תבניות...</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template: ContractTemplate) => (
            <Card key={template.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {template.name}
                      {template.isDefault && (
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">
                        {getTypeLabel(template.type)}
                      </Badge>
                      <Badge variant={template.isActive ? "default" : "secondary"}>
                        {template.isActive ? "פעיל" : "לא פעיל"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {template.description && (
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                )}
                
                {template.fileUrl && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4" />
                      <span>{template.fileName || "קובץ PDF"}</span>
                      {template.fileSize && (
                        <span className="text-muted-foreground">
                          ({formatFileSize(template.fileSize)})
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleDefaultMutation.mutate({ 
                      id: template.id, 
                      isDefault: !template.isDefault 
                    })}
                    disabled={toggleDefaultMutation.isPending}
                  >
                    {template.isDefault ? (
                      <StarOff className="h-4 w-4" />
                    ) : (
                      <Star className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(template)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {template.fileUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(template.fileUrl, '_blank')}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteTemplateMutation.mutate(template.id)}
                    disabled={deleteTemplateMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {templates.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">אין תבניות חוזים</h3>
          <p className="text-muted-foreground mb-4">
            צור תבנית חוזה ראשונה כדי להתחיל
          </p>
          <Button onClick={() => setIsNewDialogOpen(true)}>
            <Plus className="h-4 w-4 me-2" />
            צור תבנית ראשונה
          </Button>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>ערוך תבנית חוזה</DialogTitle>
            <DialogDescription>
              עדכן את פרטי תבנית החוזה
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">שם התבנית</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="הזן שם לתבנית"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-type">סוג החוזה</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר סוג חוזה" />
                </SelectTrigger>
                <SelectContent>
                  {contractTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">תיאור</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="תיאור התבנית (אופציונלי)"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label>קובץ PDF</Label>
              <ObjectUploader
                maxNumberOfFiles={1}
                maxFileSize={10485760} // 10MB
                onGetUploadParameters={getUploadParameters}
                onComplete={handleUploadComplete}
                buttonClassName="w-full"
              >
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  {formData.fileUrl ? "שנה קובץ PDF" : "העלה קובץ PDF"}
                </div>
              </ObjectUploader>
              {formData.fileUrl && (
                <p className="text-sm text-green-600">קובץ קיים/הועלה</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleSubmit} 
              disabled={updateTemplateMutation.isPending || !formData.name}
            >
              {updateTemplateMutation.isPending ? "מעדכן..." : "עדכן תבנית"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}