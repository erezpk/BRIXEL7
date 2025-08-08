import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle, Bell, Facebook, Chrome, Settings as SettingsIcon, Shield, Users, Palette, Zap, Plus, ExternalLink, Trash2, CheckCircle, RefreshCw, Mail, ArrowLeft, Upload, Image, Building, FileText } from "lucide-react";
import { ObjectUploader } from '@/components/ObjectUploader';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { rtlClass } from "@/lib/rtl";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface AdAccount {
  id: string;
  name: string;
  platform: 'facebook' | 'google';
  status: 'connected' | 'error' | 'pending';
  lastSync?: string;
  leadCount?: number;
}

interface FacebookConnectionForm {
  appId: string;
  appSecret: string;
  accessToken: string;
}

interface GoogleConnectionForm {
  clientId: string;
  clientSecret: string;
  customerId: string;
  refreshToken: string;
}

export default function Settings() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("team");
  const [agencyLogo, setAgencyLogo] = useState<string | null>(null);
  const [isFacebookDialogOpen, setIsFacebookDialogOpen] = useState(false);
  const [isGoogleDialogOpen, setIsGoogleDialogOpen] = useState(false);

  // Get current agency details
  const { data: agency } = useQuery({
    queryKey: ['/api/agencies/current'],
    queryFn: async () => {
      const response = await fetch('/api/agencies/current', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch agency');
      return response.json();
    }
  });

  // Set agency logo when data loads
  useEffect(() => {
    if (agency?.logo) {
      setAgencyLogo(agency.logo);
    }
  }, [agency]);
  const [facebookForm, setFacebookForm] = useState<FacebookConnectionForm>({
    appId: "",
    appSecret: "",
    accessToken: ""
  });
  const [googleForm, setGoogleForm] = useState<GoogleConnectionForm>({
    clientId: "",
    clientSecret: "",
    customerId: "",
    refreshToken: ""
  });
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      leadSync: true,
      autoAssign: false
    },
    leadSync: {
      enabled: true,
      frequency: 'hourly',
      autoConvert: false,
      minScore: 50
    }
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock data for connected accounts - in real implementation, this would come from the API
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([
    {
      id: "facebook_123456",
      name: "סוכנות הדיגיטל - Facebook Ads",
      platform: "facebook",
      status: "connected",
      lastSync: "2025-01-05T20:30:00Z",
      leadCount: 45
    },
    {
      id: "google_789012",
      name: "Google Ads Account (123-456-7890)",
      platform: "google", 
      status: "error",
      lastSync: "2025-01-05T18:15:00Z",
      leadCount: 23
    }
  ]);

  const connectFacebookMutation = useMutation({
    mutationFn: async (data: FacebookConnectionForm) => {
      const response = await fetch('/api/ads/facebook/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to connect Facebook');
      return response.json();
    },
    onSuccess: (data) => {
      const newAccount: AdAccount = {
        id: `facebook_${Date.now()}`,
        name: data.name || "Facebook Ads Account",
        platform: "facebook",
        status: "connected",
        lastSync: new Date().toISOString(),
        leadCount: 0
      };
      setAdAccounts(prev => [...prev, newAccount]);
      setIsFacebookDialogOpen(false);
      setFacebookForm({ appId: "", appSecret: "", accessToken: "" });
      toast({
        title: "חיבור פייסבוק אדס הושלם",
        description: "החשבון חובר בהצלחה ומוכן לסנכרון לידים"
      });
    },
    onError: () => {
      toast({
        title: "שגיאה בחיבור פייסבוק",
        description: "אנא בדוק את פרטי החיבור ונסה שוב",
        variant: "destructive"
      });
    }
  });

  const connectGoogleMutation = useMutation({
    mutationFn: async (data: GoogleConnectionForm) => {
      const response = await fetch('/api/ads/google/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to connect Google');
      return response.json();
    },
    onSuccess: (data) => {
      const newAccount: AdAccount = {
        id: `google_${Date.now()}`,
        name: data.customerName || "Google Ads Account",
        platform: "google",
        status: "connected",
        lastSync: new Date().toISOString(),
        leadCount: 0
      };
      setAdAccounts(prev => [...prev, newAccount]);
      setIsGoogleDialogOpen(false);
      setGoogleForm({ clientId: "", clientSecret: "", customerId: "", refreshToken: "" });
      toast({
        title: "חיבור גוגל אדס הושלם",
        description: "החשבון חובר בהצלחה ומוכן לסנכרון לידים"
      });
    },
    onError: () => {
      toast({
        title: "שגיאה בחיבור גוגל אדס",
        description: "אנא בדוק את פרטי החיבור ונסה שוב",
        variant: "destructive"
      });
    }
  });

  const syncAccountMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const account = adAccounts.find(a => a.id === accountId);
      if (!account) throw new Error('Account not found');

      const endpoint = account.platform === 'facebook' ? '/api/ads/facebook/sync' : '/api/ads/google/sync';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: 'mock-token' })
      });

      if (!response.ok) throw new Error('Sync failed');
      return response.json();
    },
    onSuccess: (data, accountId) => {
      setAdAccounts(prev => prev.map(account => 
        account.id === accountId 
          ? { ...account, lastSync: new Date().toISOString(), status: 'connected' as const }
          : account
      ));
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      toast({
        title: "סנכרון הושלם",
        description: data.message || "לידים סונכרנו בהצלחה"
      });
    },
    onError: (error, accountId) => {
      setAdAccounts(prev => prev.map(account => 
        account.id === accountId 
          ? { ...account, status: 'error' as const }
          : account
      ));
      toast({
        title: "שגיאה בסנכרון",
        description: "לא הצלחנו לסנכרן לידים",
        variant: "destructive"
      });
    }
  });

  const disconnectAccount = (accountId: string) => {
    setAdAccounts(prev => prev.filter(account => account.id !== accountId));
    toast({
      title: "חשבון נותק",
      description: "החשבון נותק בהצלחה מהמערכת"
    });
  };

  const getStatusBadge = (status: AdAccount['status']) => {
    switch (status) {
      case 'connected':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 me-1" />מחובר</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 me-1" />שגיאה</Badge>;
      case 'pending':
        return <Badge variant="secondary"><RefreshCw className="h-3 w-3 me-1" />ממתין</Badge>;
    }
  };

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
                <Building className="h-5 w-5" />
                הגדרות סוכנות
              </CardTitle>
              <CardDescription>
                עדכן פרטי הסוכנות ולוגו שיופיע בהצעות מחיר
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>לוגו סוכנות</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    העלה לוגו שיופיע בהצעות מחיר ובמסמכים הרשמיים
                  </p>
                  {agencyLogo && (
                    <div className="mb-4">
                      <img 
                        src={agencyLogo} 
                        alt="לוגו סוכנות" 
                        className="max-w-48 max-h-24 object-contain border rounded-lg p-2"
                      />
                    </div>
                  )}
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={5 * 1024 * 1024} // 5MB
                    onGetUploadParameters={async () => {
                      const response = await fetch('/api/agencies/current/upload-logo', {
                        method: 'POST',
                        credentials: 'include'
                      });
                      if (!response.ok) throw new Error('Failed to get upload URL');
                      const data = await response.json();
                      return {
                        method: 'PUT' as const,
                        url: data.uploadURL,
                      };
                    }}
                    onComplete={async (result) => {
                      if (result.successful && result.successful[0]) {
                        const uploadURL = result.successful[0].uploadURL;
                        try {
                          const response = await fetch('/api/agencies/current/logo', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ logoURL: uploadURL }),
                            credentials: 'include'
                          });

                          if (response.ok) {
                            setAgencyLogo(uploadURL || null);
                            toast({
                              title: "לוגו הועלה בהצלחה",
                              description: "הלוגו יופיע בהצעות מחיר החדשות"
                            });
                          }
                        } catch (error) {
                          toast({
                            title: "שגיאה בשמירת לוגו",
                            description: "נסה שוב מאוחר יותר",
                            variant: "destructive"
                          });
                        }
                      }
                    }}
                  >
                    <Upload className="h-4 w-4 me-2" />
                    העלה לוגו
                  </ObjectUploader>
                </div>
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
      </Tabs>

      <div className="flex justify-end">
        <Button 
          onClick={() => updateSettingsMutation.mutate(settings)} 
          disabled={updateSettingsMutation.isPending}
        >
          {updateSettingsMutation.isPending ? "שומר..." : "שמור הגדרות"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Facebook className="h-5 w-5 text-blue-600" />
            חיבורי פלטפורמות פרסום
          </CardTitle>
          <CardDescription>
            חבר את חשבונות הפייסבוק אדס וגוגל אדס שלך כדי לסנכרן לידים
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-end mb-4">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/api/ads/facebook/oauth'}
                className="bg-blue-50 hover:bg-blue-100 border-blue-200"
              >
                <Facebook className="h-4 w-4 me-2" />
                חיבור מהיר עם פייסבוק
                <span className="text-xs text-blue-600 ms-1">(Powered by Brixel7)</span>
              </Button>

              <Dialog open={isFacebookDialogOpen} onOpenChange={setIsFacebookDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    חיבור ידני
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>חיבור פייסבוק אדס (ידני)</DialogTitle>
                    <DialogDescription>
                      הזן את פרטי החיבור של הפייסבוק אדס שלך
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="app-id">App ID</Label>
                      <Input
                        id="app-id"
                        value={facebookForm.appId}
                        onChange={(e) => setFacebookForm(prev => ({ ...prev, appId: e.target.value }))}
                        placeholder="הזן App ID"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="app-secret">App Secret</Label>
                      <Input
                        id="app-secret"
                        type="password"
                        value={facebookForm.appSecret}
                        onChange={(e) => setFacebookForm(prev => ({ ...prev, appSecret: e.target.value }))}
                        placeholder="הזן App Secret"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="access-token">Access Token</Label>
                      <Input
                        id="access-token"
                        value={facebookForm.accessToken}
                        onChange={(e) => setFacebookForm(prev => ({ ...prev, accessToken: e.target.value }))}
                        placeholder="הזן Access Token"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      onClick={() => connectFacebookMutation.mutate(facebookForm)} 
                      disabled={connectFacebookMutation.isPending || !facebookForm.appId || !facebookForm.accessToken}
                    >
                      {connectFacebookMutation.isPending ? "מחבר..." : "חבר חשבון"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isGoogleDialogOpen} onOpenChange={setIsGoogleDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Chrome className="h-4 w-4 me-2" />
                    חבר גוגל אדס
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>חיבור גוגל אדס</DialogTitle>
                    <DialogDescription>
                      הזן את פרטי חשבון הגוגל אדס שלך
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="client-id">Client ID</Label>
                      <Input
                        id="client-id"
                        value={googleForm.clientId}
                        onChange={(e) => setGoogleForm(prev => ({ ...prev, clientId: e.target.value }))}
                        placeholder="הזן Client ID"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="client-secret">Client Secret</Label>
                      <Input
                        id="client-secret"
                        type="password"
                        value={googleForm.clientSecret}
                        onChange={(e) => setGoogleForm(prev => ({ ...prev, clientSecret: e.target.value }))}
                        placeholder="הזן Client Secret"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="customer-id">Customer ID</Label>
                      <Input
                        id="customer-id"
                        value={googleForm.customerId}
                        onChange={(e) => setGoogleForm(prev => ({ ...prev, customerId: e.target.value }))}
                        placeholder="הזן Customer ID (123-456-7890)"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="refresh-token">Refresh Token</Label>
                      <Input
                        id="refresh-token"
                        value={googleForm.refreshToken}
                        onChange={(e) => setGoogleForm(prev => ({ ...prev, refreshToken: e.target.value }))}
                        placeholder="הזן Refresh Token"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      onClick={() => connectGoogleMutation.mutate(googleForm)} 
                      disabled={connectGoogleMutation.isPending || !googleForm.clientId || !googleForm.customerId}
                    >
                      {connectGoogleMutation.isPending ? "מחבר..." : "חבר חשבון"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="space-y-4">
            {adAccounts.map((account) => (
              <Card key={account.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {account.platform === 'facebook' ? (
                        <Facebook className="h-8 w-8 text-blue-600" />
                      ) : (
                        <Chrome className="h-8 w-8 text-blue-500" />
                      )}
                      <div>
                        <h4 className="font-medium">{account.name}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {getStatusBadge(account.status)}
                          {account.lastSync && (
                            <span>
                              סונכרן לאחרונה: {new Date(account.lastSync).toLocaleDateString('he-IL')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {account.leadCount !== undefined && (
                        <Badge variant="outline">
                          {account.leadCount} לידים
                        </Badge>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => syncAccountMutation.mutate(account.id)}
                        disabled={syncAccountMutation.isPending}
                      >
                        {syncAccountMutation.isPending ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => disconnectAccount(account.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {adAccounts.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">עדיין לא חיברת חשבונות פרסום</p>
                <p className="text-sm text-muted-foreground mt-1">
                  חבר את חשבונות הפייסבוק אדס ו/או גוגל אדס שלך כדי להתחיל לסנכרן לידים
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="email" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="team">ניהול צוות</TabsTrigger>
          <TabsTrigger value="notifications">התראות</TabsTrigger>
          <TabsTrigger value="email">אימייל</TabsTrigger>
          <TabsTrigger value="leads">לידים</TabsTrigger>
          <TabsTrigger value="account">חשבון</TabsTrigger>
        </TabsList>
        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                הגדרות סוכנות
              </CardTitle>
              <CardDescription>
                עדכן פרטי הסוכנות ולוגו שיופיע בהצעות מחיר
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>לוגו סוכנות</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    העלה לוגו שיופיע בהצעות מחיר ובמסמכים הרשמיים
                  </p>
                  {agencyLogo && (
                    <div className="mb-4">
                      <img 
                        src={agencyLogo} 
                        alt="לוגו סוכנות" 
                        className="max-w-48 max-h-24 object-contain border rounded-lg p-2"
                      />
                    </div>
                  )}
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={5 * 1024 * 1024} // 5MB
                    onGetUploadParameters={async () => {
                      const response = await fetch('/api/agencies/current/upload-logo', {
                        method: 'POST',
                        credentials: 'include'
                      });
                      if (!response.ok) throw new Error('Failed to get upload URL');
                      const data = await response.json();
                      return {
                        method: 'PUT' as const,
                        url: data.uploadURL,
                      };
                    }}
                    onComplete={async (result) => {
                      if (result.successful && result.successful[0]) {
                        const uploadURL = result.successful[0].uploadURL;
                        try {
                          const response = await fetch('/api/agencies/current/logo', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ logoURL: uploadURL }),
                            credentials: 'include'
                          });

                          if (response.ok) {
                            setAgencyLogo(uploadURL || null);
                            toast({
                              title: "לוגו הועלה בהצלחה",
                              description: "הלוגו יופיע בהצעות מחיר החדשות"
                            });
                          }
                        } catch (error) {
                          toast({
                            title: "שגיאה בשמירת לוגו",
                            description: "נסה שוב מאוחר יותר",
                            variant: "destructive"
                          });
                        }
                      }
                    }}
                  >
                    <Upload className="h-4 w-4 me-2" />
                    העלה לוגו
                  </ObjectUploader>
                </div>
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
                    <h4 className="font-medium">סנכרון לידים</h4>
                    <p className="text-sm text-muted-foreground">קבל התראות כשלידים חדשים מסונכרנים</p>
                  </div>
                  <Switch
                    checked={settings.notifications.leadSync}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, leadSync: checked }
                      }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                הגדרות אימייל
              </CardTitle>
              <CardDescription>
                נהל את שירות האימייל ובדוק את החיבור למערכת
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-medium">שירות אימייל</h3>
                    <p className="text-sm text-muted-foreground">
                      בדוק והגדר את שירות האימייל למערכת
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => setLocation('/dashboard/settings/email')}
                  className="flex items-center gap-2"
                >
                  <SettingsIcon className="h-4 w-4" />
                  הגדרות מתקדמות
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </div>



              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">תבניות זמינות</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• אימייל ברוכים הבאים</p>
                    <p>• הודעות על לידים חדשים</p>
                    <p>• עדכוני פרויקטים</p>
                    <p>• איפוס סיסמה</p>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">אפשרויות תמיכה</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• Gmail SMTP</p>
                    <p>• SMTP כללי</p>
                    <p>• בדיקת חיבור</p>
                    <p>• שליחת אימיילי בדיקה</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leads" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                הגדרות לידים
              </CardTitle>
              <CardDescription>
                נהל את הגדרות הסנכרון והטיפול בלידים
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">סנכרון אוטומטי</h4>
                    <p className="text-sm text-muted-foreground">סנכרן לידים מחשבונות הפרסום באופן אוטומטי</p>
                  </div>
                  <Switch
                    checked={settings.leadSync.enabled}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({
                        ...prev,
                        leadSync: { ...prev.leadSync, enabled: checked }
                      }))
                    }
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>תדירות סנכרון</Label>
                  <select
                    value={settings.leadSync.frequency}
                    onChange={(e) =>
                      setSettings(prev => ({
                        ...prev,
                        leadSync: { ...prev.leadSync, frequency: e.target.value }
                      }))
                    }
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="hourly">כל שעה</option>
                    <option value="daily">יומי</option>
                    <option value="weekly">שבועי</option>
                  </select>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">המרה אוטומטית</h4>
                    <p className="text-sm text-muted-foreground">המר לידים איכותיים ללקוחות באופן אוטומטי</p>
                  </div>
                  <Switch
                    checked={settings.leadSync.autoConvert}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({
                        ...prev,
                        leadSync: { ...prev.leadSync, autoConvert: checked }
                      }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                הגדרות חשבון
              </CardTitle>
              <CardDescription>
                נהל את הגדרות האבטחה והפרטיות שלך
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">אימות דו-שלבי</h4>
                    <p className="text-sm text-muted-foreground">הוסף שכבת אבטחה נוספת לחשבון שלך</p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>משך זמן פג תוקף הסשן</Label>
                  <select className="w-full p-2 border rounded-md">
                    <option value="1h">שעה</option>
                    <option value="8h">8 שעות</option>
                    <option value="24h">24 שעות</option>
                    <option value="7d">שבוע</option>
                  </select>
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