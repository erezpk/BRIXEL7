import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Building2, Users, BarChart3, Shield } from "lucide-react";

export default function Homepage() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && user) {
      setLocation("/dashboard");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-bl from-blue-50 to-white" dir="rtl">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-2xl font-bold text-blue-600 font-rubik">
              AgencyCRM
            </div>
            <div className="flex items-center space-x-4 space-x-reverse">
              <Button
                onClick={() => setLocation("/login")}
                variant="outline"
              >
                התחברות
              </Button>
              <Button
                onClick={() => setLocation("/register")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                הרשמה
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 font-rubik">
            מערכת CRM מתקדמת
            <br />
            <span className="text-blue-600">לסוכנויות דיגיטליות</span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            נהל את הלקוחות, הפרויקטים והמשימות שלך במקום אחד. 
            פתרון CRM מקצועי המותאם במיוחד לסוכנויות דיגיטליות בישראל.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={() => setLocation("/register")}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4"
            >
              התחל בחינם
            </Button>
            <Button
              onClick={() => setLocation("/login")}
              variant="outline"
              size="lg"
              className="text-lg px-8 py-4"
            >
              התחבר למערכת
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-rubik">
            למה לבחור ב-AgencyCRM?
          </h2>
          <p className="text-xl text-gray-600">
            פתרון מקצועי ומותאם לצרכים של סוכנויות דיגיטליות
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="text-center">
            <CardHeader>
              <Building2 className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <CardTitle className="font-rubik">ניהול פרויקטים</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                נהל את כל הפרויקטים שלך במקום אחד עם מעקב התקדמות בזמן אמת
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <CardTitle className="font-rubik">ניהול לקוחות</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                מאגר לקוחות מפורט עם היסטוריית פעילות ומידע רלוונטי
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <BarChart3 className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <CardTitle className="font-rubik">דוחות ואנליטיקה</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                דוחות מפורטים על ביצועים, רווחיות ותהליכי עבודה
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <CardTitle className="font-rubik">אבטחת מידע</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                הגנה מתקדמת על המידע שלך עם גיבויים אוטומטיים
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 font-rubik">
            מוכן להתחיל?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            הצטרף לסוכנויות דיגיטליות רבות שכבר משתמשות במערכת שלנו לניהול הפעילות
          </p>
          <Button
            onClick={() => setLocation("/register")}
            size="lg"
            variant="secondary"
            className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4"
          >
            התחל בחינם עכשיו
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-2xl font-bold mb-4 font-rubik">AgencyCRM</div>
          <p className="text-gray-400">
            © 2025 AgencyCRM. כל הזכויות שמורות.
          </p>
        </div>
      </footer>
    </div>
  );
}