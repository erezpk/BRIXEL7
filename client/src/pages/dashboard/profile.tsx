
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Edit,
  Save,
  X
} from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    company: user?.company || "",
    bio: user?.bio || ""
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest({
        url: "/api/auth/profile",
        method: "PUT",
        body: data,
      });
    },
    onSuccess: () => {
      toast({
        title: "הפרופיל עודכן בהצלחה",
        description: "הפרטים שלך נשמרו במערכת",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: () => {
      toast({
        title: "שגיאה בעדכון הפרופיל",
        description: "נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      fullName: user?.fullName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      company: user?.company || "",
      bio: user?.bio || ""
    });
    setIsEditing(false);
  };

  const getUserInitials = () => {
    if (!user?.fullName) return "U";
    return user.fullName
      .split(" ")
      .map(name => name.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleInHebrew = (role: string) => {
    switch (role) {
      case 'agency_admin': return 'מנהל סוכנות';
      case 'team_member': return 'חבר צוות';
      case 'client': return 'לקוח';
      default: return 'משתמש';
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 font-rubik">הפרופיל שלי</h1>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            ערוך פרופיל
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user?.avatar || undefined} alt={user?.fullName} />
                <AvatarFallback className="text-xl font-medium">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="text-xl">{user?.fullName}</CardTitle>
            <Badge variant="secondary" className="mx-auto">
              {getRoleInHebrew(user?.role || '')}
            </Badge>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Mail className="h-4 w-4" />
              {user?.email}
            </div>
            {user?.phone && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <Phone className="h-4 w-4" />
                {user.phone}
              </div>
            )}
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              חבר מאז {new Date(user?.createdAt || '').toLocaleDateString('he-IL')}
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              פרטים אישיים
              {isEditing && (
                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    form="profile-form"
                    disabled={updateProfileMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    שמור
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleCancel}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    ביטול
                  </Button>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form id="profile-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="fullName">שם מלא</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    disabled={!isEditing}
                    className="text-right"
                  />
                </div>
                <div>
                  <Label htmlFor="email">כתובת אימייל</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    disabled={!isEditing}
                    className="text-right"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">טלפון</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    disabled={!isEditing}
                    className="text-right"
                  />
                </div>
                <div>
                  <Label htmlFor="company">חברה</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                    disabled={!isEditing}
                    className="text-right"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="bio">אודות</Label>
                <textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  disabled={!isEditing}
                  className="w-full p-2 border border-gray-300 rounded-md text-right resize-none h-24 disabled:bg-gray-50"
                  placeholder="ספר על עצמך..."
                />
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
