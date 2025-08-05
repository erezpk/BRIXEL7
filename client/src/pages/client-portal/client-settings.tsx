
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { 
  Settings as SettingsIcon, 
  Facebook, 
  Chrome,
  Link,
  Unlink,
  Save,
  AlertCircle,
  CheckCircle
} from "lucide-react";

interface AdAccount {
  id: string;
  name: string;
  accountId: string;
  isConnected: boolean;
  lastSync?: string;
}

export default function ClientSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    leadSync: {
      enabled: true,
      autoAssign: true,
      emailNotifications: true
    },
    adAccounts: {
      facebook: [] as AdAccount[],
      google: [] as AdAccount[]
    }
  });

  const [facebookConnection, setFacebookConnection] = useState({
    isConnected: false,
    accessToken: '',
    userId: '',
    userName: ''
  });

  const [googleConnection, setGoogleConnection] = useState({
    isConnected: false,
    accessToken: '',
    refreshToken: '',
    email: ''
  });

  const [newFacebookAccount, setNewFacebookAccount] = useState({
    accountId: '',
    accessToken: ''
  });

  const [newGoogleAccount, setNewGoogleAccount] = useState({
    customerId: '',
    refreshToken: ''
  });

  // Connect Facebook Ads
  const connectFacebookMutation = useMutation({
    mutationFn: async () => {
      // In real implementation, this would use Facebook SDK
      const response = await fetch('/api/client/integrations/facebook/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          accessToken: newFacebookAccount.accessToken,
          accountId: newFacebookAccount.accountId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'שגיאה בחיבור לפייסבוק אדס');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setFacebookConnection({
        isConnected: true,
        accessToken: data.accessToken,
        userId: data.userId,
        userName: data.userName
      });
      setSettings(prev => ({
        ...prev,
        adAccounts: {
          ...prev.adAccounts,
          facebook: [...prev.adAccounts.facebook, {
            id: data.accountId,
            name: data.accountName,
            accountId: data.accountId,
            isConnected: true,
            lastSync: new Date().toISOString()
          }]
        }
      }));
      toast({
        title: "חיבור לפייסבוק אדס הצליח",
        description: "החשבון חובר בהצלחה ולידים יסונכרנו אוטומטית"
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "שגיאה בחיבור לפייסבוק אדס",
        description: error.message
      });
    }
  });

  // Connect Google Ads
  const connectGoogleMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/client/integrations/google/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          customerId: newGoogleAccount.customerId,
          refreshToken: newGoogleAccount.refreshToken
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'שגיאה בחיבור לגוגל אדס');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setGoogleConnection({
        isConnected: true,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        email: data.email
      });
      setSettings(prev => ({
        ...prev,
        adAccounts: {
          ...prev.adAccounts,
          google: [...prev.adAccounts.google, {
            id: data.customerId,
            name: data.customerName,
            accountId: data.customerId,
            isConnected: true,
            lastSync: new Date().toISOString()
          }]
        }
      }));
      toast({
        title: "חיבור לגוגל אדס הצליח",
        description: "החשבון חובר בהצלחה ולידים יסונכרנו אוטומטית"
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "שגיאה בחיבור לגוגל אדס",
        description: error.message
      });
    }
  });

  // Save settings
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: typeof settings) => {
      const response = await fetch('/api/client/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'שגיאה בשמירת הגדרות');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "הגדרות נשמרו בהצלחה",
        description: "השינויים שלך נשמרו במערכת"
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "שגיאה בשמירת הגדרות",
        description: error.message
      });
    }
  });

  const handleSave = () => {
    saveSettingsMutation.mutate(settings);
  };

  const disconnectFacebook = (accountId: string) => {
    setSettings(prev => ({
      ...prev,
      adAccounts: {
        ...prev.adAccounts,
        facebook: prev.adAccounts.facebook.filter(acc => acc.id !== accountId)
      }
    }));
    if (settings.adAccounts.facebook.length === 1) {
      setFacebookConnection({
        isConnected: false,
        accessToken: '',
        userId: '',
        userName: ''
      });
    }
  };

  const disconnectGoogle = (accountId: string) => {
    setSettings(prev => ({
      ...prev,
      adAccounts: {
        ...prev.adAccounts,
        google: prev.adAccounts.google.filter(acc => acc.id !== accountId)
      }
    }));
    if (settings.adAccounts.google.length === 1) {
      setGoogleConnection({
        isConnected: false,
        accessToken: '',
        refreshToken: '',
        email: ''
      });
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 font-rubik">הגדרות</h1>
        <Button 
          onClick={handleSave}
          disabled={saveSettingsMutation.isPending}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          שמור הגדרות
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Lead Management Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              ניהול לידים
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="lead-sync">סנכרון לידים אוטומטי</Label>
                <p className="text-sm text-gray-500">סנכרן לידים מפלטפורמות הפרסום אוטומטית</p>
              </div>
              <Switch
                id="lead-sync"
                checked={settings.leadSync.enabled}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  leadSync: { ...prev.leadSync, enabled: checked }
                }))}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-assign">הקצאה אוטומטית</Label>
                <p className="text-sm text-gray-500">הקצה לידים אוטומטית לחברי צוות</p>
              </div>
              <Switch
                id="auto-assign"
                checked={settings.leadSync.autoAssign}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  leadSync: { ...prev.leadSync, autoAssign: checked }
                }))}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notifications">התראות אימייל</Label>
                <p className="text-sm text-gray-500">קבל התראות על לידים חדשים באימייל</p>
              </div>
              <Switch
                id="email-notifications"
                checked={settings.leadSync.emailNotifications}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  leadSync: { ...prev.leadSync, emailNotifications: checked }
                }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Facebook Ads Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Facebook className="h-5 w-5 text-blue-600" />
              פייסבוק אדס
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!facebookConnection.isConnected ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">חבר את חשבון הפייסבוק אדס שלך</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    חיבור החשבון יאפשר סנכרון אוטומטי של לידים ממסעות הפרסום שלך
                  </p>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="fb-account-id">מזהה חשבון פרסום</Label>
                    <Input
                      id="fb-account-id"
                      value={newFacebookAccount.accountId}
                      onChange={(e) => setNewFacebookAccount(prev => ({
                        ...prev,
                        accountId: e.target.value
                      }))}
                      placeholder="act_1234567890"
                      className="text-right"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="fb-access-token">טוקן גישה</Label>
                    <Input
                      id="fb-access-token"
                      type="password"
                      value={newFacebookAccount.accessToken}
                      onChange={(e) => setNewFacebookAccount(prev => ({
                        ...prev,
                        accessToken: e.target.value
                      }))}
                      placeholder="Access Token"
                      className="text-right"
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={() => connectFacebookMutation.mutate()}
                  disabled={!newFacebookAccount.accountId || !newFacebookAccount.accessToken || connectFacebookMutation.isPending}
                  className="w-full"
                >
                  <Link className="h-4 w-4 ml-2" />
                  {connectFacebookMutation.isPending ? 'מתחבר...' : 'חבר חשבון פייסבוק אדס'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800">חובר בהצלחה</span>
                  </div>
                  <p className="text-sm text-green-700">
                    משתמש: {facebookConnection.userName}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">חשבונות פרסום מחוברים:</h4>
                  {settings.adAccounts.facebook.map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{account.name}</p>
                        <p className="text-sm text-gray-500">ID: {account.accountId}</p>
                        <p className="text-xs text-gray-400">
                          סונכרן לאחרונה: {account.lastSync ? new Date(account.lastSync).toLocaleString('he-IL') : 'מעולם לא'}
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => disconnectFacebook(account.id)}
                      >
                        <Unlink className="h-4 w-4 ml-1" />
                        נתק
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Google Ads Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Chrome className="h-5 w-5 text-green-600" />
              גוגל אדס
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!googleConnection.isConnected ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800">חבר את חשבון הגוגל אדס שלך</span>
                  </div>
                  <p className="text-sm text-green-700">
                    חיבור החשבון יאפשר סנכרון אוטומטי של לידים ממסעות הפרסום שלך
                  </p>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="google-customer-id">מזהה לקוח</Label>
                    <Input
                      id="google-customer-id"
                      value={newGoogleAccount.customerId}
                      onChange={(e) => setNewGoogleAccount(prev => ({
                        ...prev,
                        customerId: e.target.value
                      }))}
                      placeholder="123-456-7890"
                      className="text-right"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="google-refresh-token">Refresh Token</Label>
                    <Input
                      id="google-refresh-token"
                      type="password"
                      value={newGoogleAccount.refreshToken}
                      onChange={(e) => setNewGoogleAccount(prev => ({
                        ...prev,
                        refreshToken: e.target.value
                      }))}
                      placeholder="Refresh Token"
                      className="text-right"
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={() => connectGoogleMutation.mutate()}
                  disabled={!newGoogleAccount.customerId || !newGoogleAccount.refreshToken || connectGoogleMutation.isPending}
                  className="w-full"
                >
                  <Link className="h-4 w-4 ml-2" />
                  {connectGoogleMutation.isPending ? 'מתחבר...' : 'חבר חשבון גוגל אדס'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800">חובר בהצלחה</span>
                  </div>
                  <p className="text-sm text-green-700">
                    אימייל: {googleConnection.email}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">חשבונות פרסום מחוברים:</h4>
                  {settings.adAccounts.google.map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{account.name}</p>
                        <p className="text-sm text-gray-500">ID: {account.accountId}</p>
                        <p className="text-xs text-gray-400">
                          סונכרן לאחרונה: {account.lastSync ? new Date(account.lastSync).toLocaleString('he-IL') : 'מעולם לא'}
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => disconnectGoogle(account.id)}
                      >
                        <Unlink className="h-4 w-4 ml-1" />
                        נתק
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
