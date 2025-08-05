
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
    bio: user?.bio || "",
    avatar: user?.avatar || null
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
      bio: user?.bio || "",
      avatar: user?.avatar || null
    });
    setIsEditing(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "שגיאה",
          description: "גודל הקובץ חייב להיות קטן מ-5MB",
          variant: "destructive",
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "שגיאה", 
          description: "ניתן להעלות רק קבצי תמונה",
          variant: "destructive",
        });
        return;
      }

      // Create canvas for compression
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Set max dimensions
        const maxWidth = 300;
        const maxHeight = 300;
        
        let { width, height } = img;
        
        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        
        setFormData(prev => ({ ...prev, avatar: compressedDataUrl }));
        toast({
          title: "תמונה הועלתה",
          description: "תמונת הפרופיל עודכנה"
        });
      };
      
      img.src = URL.createObjectURL(file);
    }
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
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={formData.avatar || user?.avatar || undefined} alt={user?.fullName} />
                  <AvatarFallback className="text-xl font-medium">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <button 
                    onClick={() => document.getElementById('profile-avatar-upload')?.click()}
                    className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 transition-colors"
                  >
                    <Edit className="h-3 w-3" />
                  </button>
                )}
                <input
                  id="profile-avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
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
