import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";
import { signInWithGoogle, handleGoogleRedirect } from "@/lib/firebase";
import { useMutation } from "@tanstack/react-query";

export default function Login() {
  const [, setLocation] = useLocation();
  const { user, isLoading, login, isLoginLoading, loginError, loginMutation } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      setLocation("/dashboard");
    }
  }, [user, isLoading, setLocation]);

  // Handle Google redirect on page load
  useEffect(() => {
    handleGoogleRedirect()
      .then((result) => {
        if (result) {
          toast({
            title: "התחברות הצליחה",
            description: "ברוכים הבאים למערכת",
          });
          setLocation("/dashboard");
        }
      })
      .catch((error) => {
        console.error('Google auth error:', error);
        toast({
          title: "שגיאה באימות Google",
          description: "אנא נסה שוב",
          variant: "destructive",
        });
      });
  }, [toast, setLocation]);

  const googleLoginMutation = useMutation({
    mutationFn: async () => {
      await signInWithGoogle();
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה באימות Google",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGoogleLogin = () => {
    googleLoginMutation.mutate();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await loginMutation.mutateAsync({
        email: formData.email,
        password: formData.password,
      });
      
      if (result?.user) {
        toast({
          title: "התחברות הצליחה",
          description: "ברוכים הבאים למערכת",
        });
        // רגע קצר לפני הפניה כדי שהמערכת תעדכן את הסטטוס
        setTimeout(() => {
          setLocation("/dashboard");
        }, 100);
      }
    } catch (error: any) {
      toast({
        title: "שגיאה בהתחברות",
        description: error?.message || "אימייל או סיסמה שגויים",
        variant: "destructive",
      });
      console.error('Login error:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-bl from-blue-50 to-white p-4" dir="rtl">
      <Card className="w-full max-w-md shadow-2xl" data-testid="login-card">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900 font-rubik" data-testid="login-title">
            כניסה למערכת
          </CardTitle>
          <CardDescription data-testid="login-description">
            הכנסו את פרטי החשבון שלכם כדי להתחבר
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" data-testid="label-email">אימייל</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="הכנס את האימייל שלך"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="text-right"
                data-testid="input-email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" data-testid="label-password">סיסמה</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="הכנס את הסיסמה שלך"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="text-right pl-10"
                  data-testid="input-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="toggle-password-visibility"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-reverse space-x-2">
                <Checkbox
                  id="rememberMe"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, rememberMe: checked as boolean }))
                  }
                  data-testid="checkbox-remember-me"
                />
                <Label htmlFor="rememberMe" className="text-sm text-gray-600">
                  זכור אותי
                </Label>
              </div>
              <Link href="/forgot-password">
                <Button variant="link" className="text-sm text-primary hover:text-primary/80 p-0" data-testid="link-forgot-password">
                  שכחת סיסמה?
                </Button>
              </Link>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoginLoading}
              data-testid="button-submit"
            >
              {isLoginLoading ? "מתחבר..." : "כניסה"}
            </Button>
            
            {loginError && (
              <div className="text-sm text-red-600 text-center" data-testid="login-error">
                שגיאה בהתחברות. אנא נסה שוב.
              </div>
            )}
          </form>

          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">או</span>
              </div>
            </div>
            
            <Button
              type="button"
              variant="outline"
              className="w-full mt-4"
              onClick={handleGoogleLogin}
              disabled={googleLoginMutation.isPending}
            >
              <svg className="ml-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {googleLoginMutation.isPending ? "מתחבר..." : "כניסה עם Google"}
            </Button>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              אין לך חשבון?{" "}
              <Link href="/signup">
                <Button variant="link" className="text-primary hover:text-primary/80 font-medium p-0" data-testid="link-signup">
                  הרשם כאן
                </Button>
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
