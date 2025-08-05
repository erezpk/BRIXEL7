import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Send, CheckCircle, AlertTriangle, Settings, TestTube, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { rtlClass } from "@/lib/rtl";
import { apiRequest } from "@/lib/queryClient";

export default function EmailSettings() {
  const [testForm, setTestForm] = useState({
    to: "",
    subject: "",
    message: ""
  });

  const [welcomeForm, setWelcomeForm] = useState({
    to: "",
    userName: ""
  });

  const { toast } = useToast();

  // Get email service status
  const { data: emailStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['/api/email/status'],
  }) as { data: { configured: boolean; message: string } | undefined, refetch: () => void };

  // Test email mutation
  const testEmailMutation = useMutation({
    mutationFn: async (data: typeof testForm) => {
      return await apiRequest({
        url: '/api/email/test',
        method: 'POST',
        body: data,
      });
    },
    onSuccess: () => {
      toast({
        title: "הצלחה",
        description: "אימייל הבדיקה נשלח בהצלחה!"
      });
      setTestForm({ to: "", subject: "", message: "" });
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה",
        description: error.message || "שגיאה בשליחת אימייל הבדיקה",
        variant: "destructive"
      });
    }
  });

  // Welcome email mutation
  const welcomeEmailMutation = useMutation({
    mutationFn: async (data: typeof welcomeForm) => {
      return await apiRequest({
        url: '/api/email/welcome',
        method: 'POST',
        body: data,
      });
    },
    onSuccess: () => {
      toast({
        title: "הצלחה",
        description: "אימייל ברוכים הבאים נשלח בהצלחה!"
      });
      setWelcomeForm({ to: "", userName: "" });
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה",
        description: error.message || "שגיאה בשליחת אימייל ברוכים הבאים",
        variant: "destructive"
      });
    }
  });

  const handleTestEmail = () => {
    if (!testForm.to) {
      toast({
        title: "שגיאה",
        description: "אנא הכנס כתובת אימייל",
        variant: "destructive"
      });
      return;
    }
    testEmailMutation.mutate(testForm);
  };

  const handleWelcomeEmail = () => {
    if (!welcomeForm.to || !welcomeForm.userName) {
      toast({
        title: "שגיאה",
        description: "אנא מלא את כל השדות",
        variant: "destructive"
      });
      return;
    }
    welcomeEmailMutation.mutate(welcomeForm);
  };

  return (
    <div className={cn("space-y-6", rtlClass())}>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">הגדרות אימייל</h1>
        <p className="text-muted-foreground">
          נהל והגדר את שירות האימייל של המערכת
        </p>
      </div>

      {/* Email Service Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            סטטוס שירות האימייל
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {emailStatus?.configured ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">שירות פעיל</p>
                    <p className="text-sm text-muted-foreground">האימיילים יישלחו בהצלחה</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="font-medium">שירות לא מוגדר</p>
                    <p className="text-sm text-muted-foreground">יש להגדיר משתני סביבה לשליחת אימיילים</p>
                  </div>
                </>
              )}
            </div>
            <Badge variant={emailStatus?.configured ? "default" : "secondary"}>
              {emailStatus?.configured ? "מוגדר" : "לא מוגדר"}
            </Badge>
          </div>

          {!emailStatus?.configured && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">להגדרת שירות האימייל:</p>
                  <div className="text-sm space-y-1">
                    <p><strong>אפשרות 1 - Gmail:</strong></p>
                    <p>הגדר: GMAIL_USER ו-GMAIL_APP_PASSWORD</p>
                    <p><strong>אפשרות 2 - SMTP כללי:</strong></p>
                    <p>הגדר: SMTP_HOST, SMTP_USER, SMTP_PASSWORD</p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Email Testing and Templates */}
      <Tabs defaultValue="test" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="test">בדיקת אימייל</TabsTrigger>
          <TabsTrigger value="welcome">ברוכים הבאים</TabsTrigger>
          <TabsTrigger value="templates">תבניות</TabsTrigger>
        </TabsList>

        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                בדיקת שליחת אימייל
              </CardTitle>
              <CardDescription>
                שלח אימייל בדיקה כדי לוודא שהשירות עובד כראוי
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="test-to">כתובת אימייל יעד *</Label>
                <Input
                  id="test-to"
                  type="email"
                  placeholder="example@domain.com"
                  value={testForm.to}
                  onChange={(e) => setTestForm({ ...testForm, to: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="test-subject">נושא (אופציונלי)</Label>
                <Input
                  id="test-subject"
                  placeholder="נושא האימייל..."
                  value={testForm.subject}
                  onChange={(e) => setTestForm({ ...testForm, subject: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="test-message">תוכן ההודעה (אופציונלי)</Label>
                <Textarea
                  id="test-message"
                  placeholder="תוכן האימייל..."
                  rows={4}
                  value={testForm.message}
                  onChange={(e) => setTestForm({ ...testForm, message: e.target.value })}
                />
              </div>

              <Button 
                onClick={handleTestEmail}
                disabled={testEmailMutation.isPending || !emailStatus?.configured}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {testEmailMutation.isPending ? "שולח..." : "שלח בדיקה"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="welcome">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                אימייל ברוכים הבאים
              </CardTitle>
              <CardDescription>
                שלח אימייל ברוכים הבאים למשתמש חדש
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="welcome-to">כתובת אימייל *</Label>
                <Input
                  id="welcome-to"
                  type="email"
                  placeholder="user@domain.com"
                  value={welcomeForm.to}
                  onChange={(e) => setWelcomeForm({ ...welcomeForm, to: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="welcome-name">שם המשתמש *</Label>
                <Input
                  id="welcome-name"
                  placeholder="שם המשתמש"
                  value={welcomeForm.userName}
                  onChange={(e) => setWelcomeForm({ ...welcomeForm, userName: e.target.value })}
                />
              </div>

              <Button 
                onClick={handleWelcomeEmail}
                disabled={welcomeEmailMutation.isPending || !emailStatus?.configured}
                className="flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                {welcomeEmailMutation.isPending ? "שולח..." : "שלח ברוכים הבאים"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>תבניות אימייל זמינות</CardTitle>
              <CardDescription>
                רשימת התבניות הזמינות במערכת
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium">ברוכים הבאים</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    תבנית לברך משתמשים חדשים במערכת
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium">ליד חדש</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    הודעה על ליד חדש שהתקבל במערכת
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium">עדכון פרויקט</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    הודעה על עדכון בסטטוס פרויקט
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium">איפוס סיסמה</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    קישור לאיפוס סיסמה עבור משתמש
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium">הקצאת משימה</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    הודעה על משימה חדשה שהוקצתה
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium">פרטי התחברות</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    שליחת פרטי התחברות ללקוח חדש
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}