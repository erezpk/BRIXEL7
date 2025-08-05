import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Mail, Send, Settings, CheckCircle, XCircle, Info } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface EmailConfig {
  user: string;
  password: string;
}

interface TestEmailData {
  to: string;
  subject: string;
  body: string;
}

export default function EmailSetup() {
  const [config, setConfig] = useState<EmailConfig>({ user: '', password: '' });
  const [testEmail, setTestEmail] = useState<TestEmailData>({
    to: '',
    subject: 'בדיקת שירות אימייל - AgencyCRM',
    body: 'זהו אימייל בדיקה מהמערכת. אם אתה רואה את ההודעה הזו, שירות האימייל עובד בהצלחה!'
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Test connection
  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/email/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Connection test failed');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ החיבור הצליח",
        description: "שירות האימייל מוכן לשימוש"
      });
    },
    onError: () => {
      toast({
        title: "❌ החיבור נכשל",
        description: "בדוק את פרטי ההתחברות",
        variant: "destructive"
      });
    }
  });

  // Send test email
  const sendTestEmailMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/email/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(testEmail)
      });
      if (!response.ok) throw new Error('Failed to send test email');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "📧 האימייל נשלח",
        description: `אימייל בדיקה נשלח ל-${testEmail.to}`
      });
    },
    onError: () => {
      toast({
        title: "❌ שליחת האימייל נכשלה",
        description: "בדוק את הגדרות האימייל",
        variant: "destructive"
      });
    }
  });

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <Mail className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">הגדרות אימייל</h1>
      </div>

      {/* Gmail Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            הוראות הגדרה - Gmail SMTP
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold">כדי להפעיל שירות אימייל, יש צורך בהגדרת משתני סביבה:</p>
                <ol className="list-decimal list-inside space-y-1 mr-4">
                  <li>היכנס לחשבון הגוגל שלך</li>
                  <li>עבור לביטחון → אימות דו-שלבי</li>
                  <li>גלול למטה ל"סיסמאות אפליקציות"</li>
                  <li>בחר "צור סיסמת אפליקציה" → "דואר"</li>
                  <li>העתק את הסיסמה בת 16 התווים</li>
                </ol>
                <div className="bg-gray-100 p-3 rounded-md font-mono text-sm">
                  <p>GMAIL_USER=your-email@gmail.com</p>
                  <p>GMAIL_APP_PASSWORD=your-16-character-password</p>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Connection Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            בדיקת חיבור
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => testConnectionMutation.mutate()}
            disabled={testConnectionMutation.isPending}
            className="w-full"
          >
            {testConnectionMutation.isPending ? 'בודק חיבור...' : 'בדוק חיבור אימייל'}
          </Button>
          
          {testConnectionMutation.isSuccess && (
            <Alert className="mt-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                שירות האימייל מחובר ומוכן לשימוש
              </AlertDescription>
            </Alert>
          )}
          
          {testConnectionMutation.isError && (
            <Alert variant="destructive" className="mt-4">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                החיבור נכשל - בדוק את משתני הסביבה GMAIL_USER ו-GMAIL_APP_PASSWORD
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Test Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            שליחת אימייל בדיקה
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="test-email-to">כתובת יעד</Label>
              <Input
                id="test-email-to"
                type="email"
                value={testEmail.to}
                onChange={(e) => setTestEmail(prev => ({ ...prev, to: e.target.value }))}
                placeholder="test@example.com"
              />
            </div>
            
            <div>
              <Label htmlFor="test-email-subject">נושא</Label>
              <Input
                id="test-email-subject"
                value={testEmail.subject}
                onChange={(e) => setTestEmail(prev => ({ ...prev, subject: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="test-email-body">תוכן ההודעה</Label>
              <Textarea
                id="test-email-body"
                value={testEmail.body}
                onChange={(e) => setTestEmail(prev => ({ ...prev, body: e.target.value }))}
                rows={4}
              />
            </div>
          </div>

          <Button 
            onClick={() => sendTestEmailMutation.mutate()}
            disabled={sendTestEmailMutation.isPending || !testEmail.to}
            className="w-full"
          >
            {sendTestEmailMutation.isPending ? 'שולח...' : 'שלח אימייל בדיקה'}
          </Button>
        </CardContent>
      </Card>

      {/* Email Features */}
      <Card>
        <CardHeader>
          <CardTitle>תכונות אימייל זמינות</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Badge variant="secondary">אימיילי ברוכים הבאים</Badge>
              <p className="text-sm text-muted-foreground">אימייל אוטומטי למשתמשים חדשים</p>
            </div>
            
            <div className="space-y-2">
              <Badge variant="secondary">התראות לידים</Badge>
              <p className="text-sm text-muted-foreground">הודעות על לידים חדשים מפייסבוק וגוגל</p>
            </div>
            
            <div className="space-y-2">
              <Badge variant="secondary">עדכוני פרויקטים</Badge>
              <p className="text-sm text-muted-foreground">הודעות על שינויים בפרויקטים</p>
            </div>
            
            <div className="space-y-2">
              <Badge variant="secondary">איפוס סיסמה</Badge>
              <p className="text-sm text-muted-foreground">אימיילי איפוס סיסמה</p>
            </div>
            
            <div className="space-y-2">
              <Badge variant="secondary">פרטי גישה ללקוחות</Badge>
              <p className="text-sm text-muted-foreground">שליחת פרטי התחברות ללקוחות</p>
            </div>
            
            <div className="space-y-2">
              <Badge variant="secondary">הטמעת משימות</Badge>
              <p className="text-sm text-muted-foreground">הודעות על משימות חדשות</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}