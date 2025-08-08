
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Mail } from "lucide-react";

export default function ForgotPassword() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "שגיאה",
        description: "יש להזין כתובת אימייל",
        variant: "destructive",
      });
      return;
    }

    if (!email.includes('@')) {
      toast({
        title: "שגיאה",
        description: "כתובת אימייל לא תקינה",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const result = await response.json();

      if (response.ok) {
        setIsEmailSent(true);
        toast({
          title: "נשלח בהצלחה",
          description: "קישור לאיפוס סיסמה נשלח לאימייל שלך",
        });
      } else {
        toast({
          title: "שגיאה",
          description: result.message || "שגיאה בשליחת קישור איפוס סיסמה",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "שגיאה בחיבור לשרת. אנא נסה שוב",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-bl from-blue-50 to-white p-4" dir="rtl">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 font-rubik">
              אימייל נשלח
            </CardTitle>
            <CardDescription>
              קישור לאיפוס סיסמה נשלח לכתובת {email}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                בדוק את תיבת האימייל שלך (כולל תיקיית הספאם) ולחץ על הקישור לאיפוס הסיסמה.
              </p>
            </div>
            
            <div className="flex flex-col space-y-2">
              <Button 
                onClick={() => setIsEmailSent(false)}
                variant="outline"
                className="w-full"
              >
                שלח שוב
              </Button>
              
              <Link href="/login">
                <Button variant="ghost" className="w-full">
                  חזור להתחברות
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-bl from-blue-50 to-white p-4" dir="rtl">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900 font-rubik">
            איפוס סיסמה
          </CardTitle>
          <CardDescription>
            הזן את כתובת האימייל שלך ונשלח לך קישור לאיפוס הסיסמה
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">כתובת אימייל</Label>
              <Input
                id="email"
                type="email"
                placeholder="הכנס את כתובת האימייל שלך"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-right"
                disabled={isLoading}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? "שולח..." : "שלח קישור איפוס"}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <Link href="/login">
              <Button variant="link" className="text-primary hover:text-primary/80 p-0">
                <ArrowRight className="h-4 w-4 ml-2" />
                חזור להתחברות
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
