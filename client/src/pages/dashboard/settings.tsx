import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Bell, Building, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { rtlClass } from "@/lib/rtl";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function Settings() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("team");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      tasks: false
    }
  });

  // Fetch team members
  const { data: teamMembers = [], isLoading: isLoadingTeam } = useQuery({
    queryKey: ['/api/team'],
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: typeof settings) => {
      return await apiRequest("/api/settings", "PUT", data);
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

  return (
    <div className={cn("container mx-auto py-6 space-y-6 max-w-7xl", rtlClass())}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">הגדרות</h1>
          <p className="text-muted-foreground">
            נהל את הגדרות הצוות והתראות שלך
          </p>
        </div>
        <Button 
          onClick={() => setLocation('/dashboard/agency-templates')}
          className="flex items-center gap-2"
        >
          <Building className="h-4 w-4" />
          הגדרות סוכנות וטמפלטים
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="team">ניהול צוות</TabsTrigger>
          <TabsTrigger value="notifications">התראות</TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                חברי הצוות
              </CardTitle>
              <CardDescription>
                נהל את חברי הצוות וההרשאות שלהם
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingTeam ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">טוען...</p>
                </div>
              ) : teamMembers.length > 0 ? (
                <div className="space-y-4">
                  {teamMembers.map((member: any) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          {member.name?.charAt(0)?.toUpperCase() || member.email?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-medium">{member.name || member.email}</h4>
                          <p className="text-sm text-muted-foreground">{member.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {member.isActive ? "פעיל" : "לא פעיל"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">אין חברי צוות</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    הזמן חברי צוות חדשים כדי להתחיל לעבוד יחד
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                הגדרות התראות
              </CardTitle>
              <CardDescription>
                נהל את ההתראות שאתה מקבל מהמערכת
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">התראות אימייל</h4>
                    <p className="text-sm text-muted-foreground">קבל התראות באימייל על פעילות במערכת</p>
                  </div>
                  <Switch
                    checked={settings.notifications.email}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, email: checked }
                      }))
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">התראות פוש</h4>
                    <p className="text-sm text-muted-foreground">קבל התראות בדפדפן על אירועים חשובים</p>
                  </div>
                  <Switch
                    checked={settings.notifications.push}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, push: checked }
                      }))
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">התראות משימות</h4>
                    <p className="text-sm text-muted-foreground">קבל התראות על משימות חדשות ותזכורות</p>
                  </div>
                  <Switch
                    checked={settings.notifications.tasks || false}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, tasks: checked }
                      }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button 
          onClick={() => updateSettingsMutation.mutate(settings)} 
          disabled={updateSettingsMutation.isPending}
        >
          {updateSettingsMutation.isPending ? "שומר..." : "שמור הגדרות"}
        </Button>
      </div>
    </div>
  );
}