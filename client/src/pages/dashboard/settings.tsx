
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Settings as SettingsIcon, 
  Bell, 
  Globe, 
  Shield, 
  Moon,
  Sun,
  Monitor,
  Save
} from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      marketing: false,
      projectUpdates: true,
      taskReminders: true,
    },
    appearance: {
      theme: 'system',
      language: 'he',
      fontSize: 'medium',
    },
    privacy: {
      profileVisible: true,
      activityVisible: false,
      dataSharing: false,
    },
    account: {
      twoFactor: false,
      sessionTimeout: '24h',
    }
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: typeof settings) => {
      return await apiRequest({
        url: "/api/auth/settings",
        method: "PUT",
        body: data,
      });
    },
    onSuccess: () => {
      toast({
        title: "הגדרות נשמרו בהצלחה",
        description: "השינויים שלך נשמרו במערכת",
      });
    },
    onError: () => {
      toast({
        title: "שגיאה בשמירת הגדרות",
        description: "נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateSettingsMutation.mutate(settings);
  };

  const updateNotificationSetting = (key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }));
  };

  const updateAppearanceSetting = (key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      appearance: {
        ...prev.appearance,
        [key]: value
      }
    }));
  };

  const updatePrivacySetting = (key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: value
      }
    }));
  };

  const updateAccountSetting = (key: string, value: boolean | string) => {
    setSettings(prev => ({
      ...prev,
      account: {
        ...prev.account,
        [key]: value
      }
    }));
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 font-rubik">הגדרות</h1>
        <Button 
          onClick={handleSave}
          disabled={updateSettingsMutation.isPending}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          שמור הגדרות
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Notifications Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              התראות
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notifications">התראות אימייל</Label>
                <p className="text-sm text-gray-500">קבל התראות באימייל על פעילות חשובה</p>
              </div>
              <Switch
                id="email-notifications"
                checked={settings.notifications.email}
                onCheckedChange={(checked) => updateNotificationSetting('email', checked)}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push-notifications">התראות דחיפה</Label>
                <p className="text-sm text-gray-500">קבל התראות בדפדפן</p>
              </div>
              <Switch
                id="push-notifications"
                checked={settings.notifications.push}
                onCheckedChange={(checked) => updateNotificationSetting('push', checked)}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="project-updates">עדכוני פרויקטים</Label>
                <p className="text-sm text-gray-500">קבל התראות על שינויים בפרויקטים</p>
              </div>
              <Switch
                id="project-updates"
                checked={settings.notifications.projectUpdates}
                onCheckedChange={(checked) => updateNotificationSetting('projectUpdates', checked)}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="task-reminders">תזכורות משימות</Label>
                <p className="text-sm text-gray-500">קבל תזכורות על משימות שצריך להשלים</p>
              </div>
              <Switch
                id="task-reminders"
                checked={settings.notifications.taskReminders}
                onCheckedChange={(checked) => updateNotificationSetting('taskReminders', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              מראה
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="theme">ערכת נושא</Label>
                <Select 
                  value={settings.appearance.theme} 
                  onValueChange={(value) => updateAppearanceSetting('theme', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">בהיר</SelectItem>
                    <SelectItem value="dark">כהה</SelectItem>
                    <SelectItem value="system">לפי המערכת</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="language">שפה</Label>
                <Select 
                  value={settings.appearance.language} 
                  onValueChange={(value) => updateAppearanceSetting('language', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="he">עברית</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="fontSize">גודל גופן</Label>
                <Select 
                  value={settings.appearance.fontSize} 
                  onValueChange={(value) => updateAppearanceSetting('fontSize', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">קטן</SelectItem>
                    <SelectItem value="medium">בינוני</SelectItem>
                    <SelectItem value="large">גדול</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              פרטיות ואבטחה
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="profile-visible">פרופיל גלוי</Label>
                <p className="text-sm text-gray-500">אפשר לחברי צוות אחרים לראות את הפרופיל שלך</p>
              </div>
              <Switch
                id="profile-visible"
                checked={settings.privacy.profileVisible}
                onCheckedChange={(checked) => updatePrivacySetting('profileVisible', checked)}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="two-factor">אימות דו-שלבי</Label>
                <p className="text-sm text-gray-500">הפעל אימות דו-שלבי לאבטחה מוגברת</p>
              </div>
              <Switch
                id="two-factor"
                checked={settings.account.twoFactor}
                onCheckedChange={(checked) => updateAccountSetting('twoFactor', checked)}
              />
            </div>
            
            <Separator />
            
            <div>
              <Label htmlFor="session-timeout">תפוגת הפעלה</Label>
              <p className="text-sm text-gray-500 mb-2">בחר כמה זמן להישאר מחובר</p>
              <Select 
                value={settings.account.sessionTimeout} 
                onValueChange={(value) => updateAccountSetting('sessionTimeout', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">שעה אחת</SelectItem>
                  <SelectItem value="8h">8 שעות</SelectItem>
                  <SelectItem value="24h">24 שעות</SelectItem>
                  <SelectItem value="7d">שבוע</SelectItem>
                  <SelectItem value="30d">חודש</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
