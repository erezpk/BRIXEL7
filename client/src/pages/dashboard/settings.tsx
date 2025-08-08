import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Bell, Building, Users, Facebook, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { rtlClass } from "@/lib/rtl";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

// Mock data and types for demonstration
// In a real application, these would be fetched from your API
const mockAdAccounts = [
  { id: '1', platform: 'facebook', status: 'connected', name: 'My Facebook Ad Account' },
  { id: '2', platform: 'google', status: 'not_connected', name: 'My Google Ads Account' },
];

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

  // Fetch connected ad accounts (mocked)
  const { data: adAccounts = mockAdAccounts, isLoading: isLoadingAdAccounts } = useQuery({
    queryKey: ['/api/ads/accounts'],
    initialData: mockAdAccounts, // Use mocked data initially
  });

  // Mutation to connect Facebook account
  const connectFacebookMutation = useMutation({
    mutationFn: async () => {
      // This function would typically initiate the OAuth flow on the server
      // For this example, we'll simulate it by redirecting the client
      return await apiRequest("/api/ads/facebook/oauth", "GET");
    },
    onSuccess: (data) => {
      // Handle success, e.g., refresh ad accounts or show a success message
      toast({
        title: "Facebook Connected",
        description: "Your Facebook Ads account has been successfully connected.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ads/accounts'] }); // Refresh ad accounts
    },
    onError: (error) => {
      toast({
        title: "Facebook Connection Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="team">ניהול צוות</TabsTrigger>
          <TabsTrigger value="agency">הגדרות סוכנות</TabsTrigger>
          <TabsTrigger value="notifications">התראות</TabsTrigger>
          <TabsTrigger value="integrations">אינטגרציות</TabsTrigger>
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

        <TabsContent value="agency" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                הגדרות סוכנות וטמפלטים
              </CardTitle>
              <CardDescription>
                נהל את פרטי הסוכנות, לוגו וטמפלטים להצעות מחיר
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">עמוד הגדרות סוכנות וטמפלטים</h3>
                <p className="text-muted-foreground mb-4">
                  עדכן פרטי סוכנות, העלה לוגו, ערוך טמפלטים להצעות מחיר ועוד
                </p>
                <Button
                  onClick={() => setLocation('/dashboard/agency-templates')}
                  className="flex items-center gap-2"
                >
                  <Building className="h-4 w-4" />
                  פתח הגדרות סוכנות וטמפלטים
                </Button>
              </div>
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

        {/* New Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <img src="/icons/integration.svg" alt="Integration Icon" className="h-5 w-5" />
                אינטגרציות
              </CardTitle>
              <CardDescription>
                חבר את השירותים החיצוניים שלך לסנכרון נתונים
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Facebook Ads Integration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Facebook className="h-5 w-5 text-blue-600" />
                    פייסבוק אדס
                  </CardTitle>
                  <CardDescription>
                    חבר את חשבון הפייסבוק אדס שלך כדי לסנכרן קמפיינים ולידים אוטומטית
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">סטטוס חיבור</h4>
                      <p className="text-sm text-muted-foreground">
                        {adAccounts.some(acc => acc.platform === 'facebook' && acc.status === 'connected')
                          ? 'מחובר' : 'לא מחובר'}
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        // Redirect to Facebook OAuth
                        window.location.href = '/api/ads/facebook/oauth';
                      }}
                      disabled={connectFacebookMutation.isPending}
                    >
                      <Facebook className="w-4 h-4 mr-2" />
                      {connectFacebookMutation.isPending ? 'מתחבר...' : 'חבר חשבון פייסבוק'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Add other integrations here */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <img src="/icons/google-ads.svg" alt="Google Ads Icon" className="h-5 w-5" />
                    גוגל אדס
                  </CardTitle>
                  <CardDescription>
                    חבר את חשבון הגוגל אדס שלך לסנכרון אוטומטי
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">סטטוס חיבור</h4>
                      <p className="text-sm text-muted-foreground">
                        {adAccounts.some(acc => acc.platform === 'google' && acc.status === 'connected')
                          ? 'מחובר' : 'לא מחובר'}
                      </p>
                    </div>
                    <Button className="flex items-center gap-2">
                      <img src="/icons/google-ads.svg" alt="Google Ads Icon" className="w-4 h-4" />
                      חבר חשבון גוגל אדס
                    </Button>
                  </div>
                </CardContent>
              </Card>
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