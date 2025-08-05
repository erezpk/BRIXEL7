
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Mail, User } from "lucide-react";

interface InviteTeamMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InviteTeamMemberModal({ open, onOpenChange }: InviteTeamMemberModalProps) {
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    role: "team_member" as "agency_admin" | "team_member",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const inviteMemberMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest({
        url: '/api/team/invite',
        method: 'POST',
        body: {
          ...data,
          password: Math.random().toString(36).slice(-8), // Generate temporary password
        },
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/team'] });
      toast({
        title: "הזמנה נשלחה בהצלחה",
        description: "חבר הצוות החדש יוכל להתחבר למערכת",
      });
      onOpenChange(false);
      setFormData({ email: "", fullName: "", role: "team_member" });
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה בשליחת הזמנה",
        description: error?.message || "אירעה שגיאה לא צפויה",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim() || !formData.fullName.trim()) {
      toast({
        title: "שגיאה",
        description: "יש למלא את כל השדות הנדרשים",
        variant: "destructive",
      });
      return;
    }

    if (!formData.email.includes('@')) {
      toast({
        title: "שגיאה",
        description: "כתובת אימייל לא תקינה",
        variant: "destructive",
      });
      return;
    }

    inviteMemberMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="invite-member-modal">
        <DialogHeader>
          <DialogTitle className="text-right">הזמן חבר צוות חדש</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-right flex items-center space-x-reverse space-x-2">
              <User className="h-4 w-4" />
              <span>שם מלא</span>
            </Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              placeholder="הכנס שם מלא"
              className="text-right"
              data-testid="input-full-name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-right flex items-center space-x-reverse space-x-2">
              <Mail className="h-4 w-4" />
              <span>כתובת אימייל</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="הכנס כתובת אימייל"
              className="text-right"
              data-testid="input-email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="text-right">תפקיד</Label>
            <Select value={formData.role} onValueChange={(value: "agency_admin" | "team_member") => handleInputChange('role', value)}>
              <SelectTrigger data-testid="select-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="team_member">חבר צוות</SelectItem>
                <SelectItem value="agency_admin">מנהל סוכנות</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-reverse space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel"
            >
              ביטול
            </Button>
            <Button
              type="submit"
              disabled={inviteMemberMutation.isPending}
              data-testid="button-invite"
            >
              {inviteMemberMutation.isPending ? "שולח הזמנה..." : "שלח הזמנה"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
