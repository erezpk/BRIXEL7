import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";

export default function Signup() {
  const [, setLocation] = useLocation();
  const { signup, isSignupLoading, signupError } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    agencyName: "",
    industry: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "שם מלא הוא שדה חובה";
    }

    if (!formData.email.trim()) {
      newErrors.email = "אימייל הוא שדה חובה";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "אימייל לא תקין";
    }

    if (!formData.agencyName.trim()) {
      newErrors.agencyName = "שם הסוכנות הוא שדה חובה";
    }

    if (!formData.password) {
      newErrors.password = "סיסמה היא שדה חובה";
    } else if (formData.password.length < 6) {
      newErrors.password = "סיסמה חייבת להכיל לפחות 6 תווים";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "הסיסמאות אינן תואמות";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      signup({
        fullName: formData.fullName,
        email: formData.email,
        agencyName: formData.agencyName,
        industry: formData.industry,
        password: formData.password,
      }, {
        onSuccess: () => {
          toast({
            title: "הרשמה הצליחה",
            description: "חשבונך נוצר בהצלחה. מעביר אותך לדשבורד...",
          });
          setLocation("/dashboard");
        },
        onError: (error: any) => {
          toast({
            title: "שגיאה בהרשמה",
            description: error?.message || "שגיאה ביצירת החשבון",
            variant: "destructive",
          });
        },
      });
    } catch (error) {
      console.error('Signup error:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleIndustryChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      industry: value,
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-bl from-blue-50 to-white p-4" dir="rtl">
      <Card className="w-full max-w-md shadow-2xl" data-testid="signup-card">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900 font-rubik" data-testid="signup-title">
            הרשמה למערכת
          </CardTitle>
          <CardDescription data-testid="signup-description">
            צור חשבון חדש ותתחיל לנהל את הסוכנות שלך
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" data-testid="label-full-name">שם מלא</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="הכנס את השם המלא שלך"
                value={formData.fullName}
                onChange={handleInputChange}
                className={`text-right ${errors.fullName ? 'border-red-500' : ''}`}
                data-testid="input-full-name"
              />
              {errors.fullName && (
                <p className="text-sm text-red-600" data-testid="error-full-name">{errors.fullName}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" data-testid="label-email">אימייל</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="הכנס את האימייל שלך"
                value={formData.email}
                onChange={handleInputChange}
                className={`text-right ${errors.email ? 'border-red-500' : ''}`}
                data-testid="input-email"
              />
              {errors.email && (
                <p className="text-sm text-red-600" data-testid="error-email">{errors.email}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="agencyName" data-testid="label-agency-name">שם הסוכנות</Label>
              <Input
                id="agencyName"
                name="agencyName"
                type="text"
                placeholder="הכנס את שם הסוכנות"
                value={formData.agencyName}
                onChange={handleInputChange}
                className={`text-right ${errors.agencyName ? 'border-red-500' : ''}`}
                data-testid="input-agency-name"
              />
              {errors.agencyName && (
                <p className="text-sm text-red-600" data-testid="error-agency-name">{errors.agencyName}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="industry" data-testid="label-industry">תחום עיסוק (אופציונלי)</Label>
              <Select value={formData.industry} onValueChange={handleIndustryChange}>
                <SelectTrigger data-testid="select-industry">
                  <SelectValue placeholder="בחר תחום עיסוק" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="marketing">שיווק דיגיטלי</SelectItem>
                  <SelectItem value="design">עיצוב גרפי</SelectItem>
                  <SelectItem value="web-development">פיתוח אתרים</SelectItem>
                  <SelectItem value="video-editing">עריכת וידאו</SelectItem>
                  <SelectItem value="social-media">רשתות חברתיות</SelectItem>
                  <SelectItem value="seo">קידום אתרים</SelectItem>
                  <SelectItem value="therapy">טיפול ופסיכולוגיה</SelectItem>
                  <SelectItem value="consulting">ייעוץ עסקי</SelectItem>
                  <SelectItem value="other">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" data-testid="label-password">סיסמה</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="בחר סיסמה חזקה"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`text-right pl-10 ${errors.password ? 'border-red-500' : ''}`}
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
              {errors.password && (
                <p className="text-sm text-red-600" data-testid="error-password">{errors.password}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" data-testid="label-confirm-password">אישור סיסמה</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="הכנס את הסיסמה שוב"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`text-right pl-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  data-testid="input-confirm-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  data-testid="toggle-confirm-password-visibility"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-600" data-testid="error-confirm-password">{errors.confirmPassword}</p>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSignupLoading}
              data-testid="button-submit"
            >
              {isSignupLoading ? "יוצר חשבון..." : "צור חשבון"}
            </Button>
            
            {signupError && (
              <div className="text-sm text-red-600 text-center" data-testid="signup-error">
                שגיאה ביצירת החשבון. אנא נסה שוב.
              </div>
            )}
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              יש לך כבר חשבון?{" "}
              <Link href="/login">
                <Button variant="link" className="text-primary hover:text-primary/80 font-medium p-0" data-testid="link-login">
                  כניסה כאן
                </Button>
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
