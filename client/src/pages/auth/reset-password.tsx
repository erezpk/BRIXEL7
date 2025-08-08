import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string>("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Extract token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      toast({
        title: "שגיאה",
        description: "טוקן איפוס סיסמה לא נמצא",
        variant: "destructive",
      });
      setLocation("/login");
    }
  }, [toast, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "שגיאה",
        description: "הסיסמאות לא תואמות",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "שגיאה",
        description: "הסיסמה חייבת להכיל לפחות 6 תווים",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      await apiRequest('/api/auth/reset-password', 'POST', {
        token,
        password,
      });
      
      toast({
        title: "הסיסמה שונתה בהצלחה",
        description: "אתה יכול עכשיו להתחבר עם הסיסמה החדשה",
      });
      
      setLocation("/login");
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error?.message || "אירעה שגיאה בשינוי הסיסמה",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-bl from-blue-50 to-white p-4" dir="rtl">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p>טוען...</p>
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
            הכנס סיסמה חדשה עבור החשבון שלך
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">סיסמה חדשה</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="הכנס סיסמה חדשה"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">אישור סיסמה</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="הכנס שוב את הסיסמה החדשה"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !password || !confirmPassword}
            >
              {isLoading ? "משנה סיסמה..." : "שנה סיסמה"}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <Button
              variant="link"
              onClick={() => setLocation("/login")}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              חזרה להתחברות
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}