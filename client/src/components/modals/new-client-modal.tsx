import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type InsertClient } from "@shared/schema";

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewClientModal({ isOpen, onClose }: NewClientModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: "",
    contactName: "",
    email: "",
    phone: "",
    industry: "",
    status: "active" as const,
    notes: "",
  });

  const createClientMutation = useMutation({
    mutationFn: async (data: Omit<InsertClient, 'agencyId'>) => {
      const response = await apiRequest('/api/clients', 'POST', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      toast({
        title: "לקוח נוצר בהצלחה",
        description: "הלקוח החדש נוסף למערכת",
      });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה ביצירת לקוח",
        description: error?.message || "אירעה שגיאה לא צפויה",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      contactName: "",
      email: "",
      phone: "",
      industry: "",
      status: "active",
      notes: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: "שגיאה",
        description: "שם הלקוח הוא שדה חובה",
        variant: "destructive",
      });
      return;
    }
    createClientMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto" data-testid="new-client-modal" aria-describedby="new-client-description">
        <DialogHeader>
          <DialogTitle className="text-right font-rubik">לקוח חדש</DialogTitle>
          <DialogDescription id="new-client-description" className="text-right">
            הוסף פרטי לקוח חדש למערכת
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-right">שם הלקוח *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="הכנס שם הלקוח"
              className="text-right"
              required
              data-testid="input-client-name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contactName" className="text-right">איש קשר</Label>
            <Input
              id="contactName"
              value={formData.contactName}
              onChange={(e) => handleInputChange('contactName', e.target.value)}
              placeholder="שם איש הקשר"
              className="text-right"
              data-testid="input-contact-name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-right">אימייל</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="כתובת אימייל"
              className="text-right"
              data-testid="input-email"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-right">טלפון</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="מספר טלפון"
              className="text-right"
              data-testid="input-phone"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="industry" className="text-right">תחום עיסוק</Label>
            <Select value={formData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
              <SelectTrigger data-testid="select-industry">
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
          
          <div className="space-y-2">
            <Label htmlFor="status" className="text-right">סטטוס</Label>
            <Select value={formData.status} onValueChange={(value: "active" | "inactive" | "pending") => handleInputChange('status', value)}>
              <SelectTrigger data-testid="select-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">פעיל</SelectItem>
                <SelectItem value="pending">ממתין</SelectItem>
                <SelectItem value="inactive">לא פעיל</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-right">הערות</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="הערות נוספות על הלקוח"
              className="text-right"
              rows={3}
              data-testid="textarea-notes"
            />
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
              disabled={createClientMutation.isPending}
              data-testid="button-create"
            >
              {createClientMutation.isPending ? "יוצר..." : "צור לקוח"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
