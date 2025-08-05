
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { 
  Building2, 
  Users, 
  BarChart3, 
  Shield, 
  CheckCircle, 
  Star,
  ArrowLeft,
  Zap,
  Globe,
  Smartphone,
  TrendingUp,
  Clock,
  Award
} from "lucide-react";

export default function Homepage() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    if (!isLoading && user) {
      setLocation("/dashboard");
    }
  }, [user, isLoading, setLocation]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-bl from-blue-50 via-white to-purple-50" dir="rtl">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrollY > 50 ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-rubik">
                AgencyCRM
              </div>
              <div className="hidden md:flex items-center space-x-6 space-x-reverse mr-8">
                <a href="#features" className="text-gray-700 hover:text-blue-600 transition-colors">תכונות</a>
                <a href="#pricing" className="text-gray-700 hover:text-blue-600 transition-colors">מחירים</a>
                <a href="#testimonials" className="text-gray-700 hover:text-blue-600 transition-colors">המלצות</a>
              </div>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse">
              <Button
                onClick={() => setLocation("/login")}
                variant="ghost"
                className="hover:bg-blue-50"
              >
                התחברות
              </Button>
              <Button
                onClick={() => setLocation("/register")}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
              >
                התחל בחינם
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="mb-8">
            <div className="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Star className="w-4 h-4 ml-2" />
              המערכת המובילה בישראל לסוכנויות דיגיטליות
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 font-rubik leading-tight">
              <span className="block">נהל את הסוכנות שלך</span>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                בצורה מקצועית
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              פתרון CRM מתקדם הבנוי במיוחד לסוכנויות דיגיטליות בישראל. 
              נהל לקוחות, פרויקטים ומשימות במקום אחד עם ממשק בעברית וחוויית משתמש מעולה.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <Button
              onClick={() => setLocation("/register")}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg px-10 py-6 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              <Zap className="w-5 h-5 ml-2" />
              התחל בחינם עכשיו
            </Button>
            <Button
              onClick={() => setLocation("/login")}
              variant="outline"
              size="lg"
              className="text-lg px-10 py-6 rounded-xl border-2 hover:bg-gray-50 transition-all duration-300"
            >
              התחבר למערכת
              <ArrowLeft className="w-5 h-5 mr-2" />
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">500+</div>
              <div className="text-gray-600">סוכנויות פעילות</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-purple-600 mb-2">10K+</div>
              <div className="text-gray-600">פרויקטים מנוהלים</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">99.9%</div>
              <div className="text-gray-600">זמינות מערכת</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-orange-600 mb-2">24/7</div>
              <div className="text-gray-600">תמיכה טכנית</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-rubik">
              כל מה שסוכנות דיגיטלית צריכה
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              פתרון מקיף הכולל את כל הכלים הנחוצים לניהול סוכנות דיגיטלית מודרנית
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            <Card className="p-8 hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-0 shadow-lg">
              <CardHeader>
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                  <Building2 className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl font-rubik mb-4">ניהול פרויקטים</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-lg leading-relaxed">
                  עקוב אחר כל הפרויקטים שלך עם לוחות זמנים, תקציבים ומעקב התקדמות בזמן אמת
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-0 shadow-lg">
              <CardHeader>
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
                <CardTitle className="text-2xl font-rubik mb-4">ניהול לקוחות</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-lg leading-relaxed">
                  מאגר לקוחות מפורט עם היסטוריית פעילות, מסמכים ויכולות תקשורת מתקדמות
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-0 shadow-lg">
              <CardHeader>
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                  <BarChart3 className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl font-rubik mb-4">דוחות ואנליטיקה</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-lg leading-relaxed">
                  דוחות מפורטים על ביצועים, רווחיות ותהליכי עבודה עם גרפים אינטראקטיביים
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-0 shadow-lg">
              <CardHeader>
                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-6">
                  <Globe className="w-8 h-8 text-orange-600" />
                </div>
                <CardTitle className="text-2xl font-rubik mb-4">ניהול נכסים דיגיטליים</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-lg leading-relaxed">
                  נהל דומיינים, אחסון, חשבונות רשתות חברתיות וכל הנכסים הדיגיטליים של הלקוחות
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-0 shadow-lg">
              <CardHeader>
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
                  <Clock className="w-8 h-8 text-red-600" />
                </div>
                <CardTitle className="text-2xl font-rubik mb-4">מעקב זמן ומשימות</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-lg leading-relaxed">
                  עקוב אחר זמן עבודה, משימות והתקדמות עם כלי Kanban מתקדם ותזכורות אוטומטיות
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-0 shadow-lg">
              <CardHeader>
                <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6">
                  <Shield className="w-8 h-8 text-indigo-600" />
                </div>
                <CardTitle className="text-2xl font-rubik mb-4">אבטחת מידע</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-lg leading-relaxed">
                  הגנה מתקדמת על המידע שלך עם הצפנה, גיבויים אוטומטיים ובקרת גישה מפורטת
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-rubik">
              מה הלקוחות שלנו אומרים
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-8 border-0 shadow-lg">
              <CardContent>
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 text-lg">
                  "המערכת שינתה לנו את הדרך בה אנחנו מנהלים את הסוכנות. הכל מסודר, נגיש וקל לשימוש."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                    א
                  </div>
                  <div>
                    <div className="font-semibold">אליה כהן</div>
                    <div className="text-gray-500">מנכ"ל, דיגיטל בוטיק</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-8 border-0 shadow-lg">
              <CardContent>
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 text-lg">
                  "הממשק בעברית והתמיכה המקצועית הם בדיוק מה שחיפשנו. מומלץ בחום!"
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                    ד
                  </div>
                  <div>
                    <div className="font-semibold">דנה לוי</div>
                    <div className="text-gray-500">מייסדת, קריאייטיב סטודיו</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-8 border-0 shadow-lg">
              <CardContent>
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 text-lg">
                  "חסכנו שעות רבות בניהול והארגון. המערכת פשוט עובדת!"
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                    מ
                  </div>
                  <div>
                    <div className="font-semibold">מיכאל רוזן</div>
                    <div className="text-gray-500">שותף, מרקטינג פרו</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 font-rubik">
            מוכן לקחת את הסוכנות שלך
            <br />
            לשלב הבא?
          </h2>
          <p className="text-xl text-blue-100 mb-12 max-w-3xl mx-auto">
            הצטרף לסוכנויות דיגיטליות רבות שכבר משתמשות במערכת שלנו 
            וחווה ניהול מקצועי וחכם של הפעילות העסקית
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
            <Button
              onClick={() => setLocation("/register")}
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-10 py-6 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              <Zap className="w-5 h-5 ml-2" />
              התחל בחינם עכשיו
            </Button>
            <Button
              onClick={() => setLocation("/login")}
              variant="outline"
              size="lg"
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600 text-lg px-10 py-6 rounded-xl transition-all duration-300"
            >
              יש לך חשבון? התחבר
            </Button>
          </div>

          <div className="flex items-center justify-center space-x-8 space-x-reverse text-blue-100">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 ml-2" />
              ללא מחויבות
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 ml-2" />
              התחלה מיידית
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 ml-2" />
              תמיכה 24/7
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent font-rubik mb-4">
                AgencyCRM
              </div>
              <p className="text-gray-400 text-lg mb-6 max-w-md">
                פתרון CRM מתקדם לסוכנויות דיגיטליות בישראל. 
                נהל את העסק שלך בצורה חכמה ומקצועית.
              </p>
              <div className="flex space-x-4 space-x-reverse">
                <Button variant="outline" size="sm" className="border-gray-600 text-gray-400 hover:text-white">
                  Facebook
                </Button>
                <Button variant="outline" size="sm" className="border-gray-600 text-gray-400 hover:text-white">
                  LinkedIn
                </Button>
                <Button variant="outline" size="sm" className="border-gray-600 text-gray-400 hover:text-white">
                  Twitter
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">המוצר</h3>
              <div className="space-y-2">
                <a href="#features" className="block text-gray-400 hover:text-white transition-colors">תכונות</a>
                <a href="#pricing" className="block text-gray-400 hover:text-white transition-colors">מחירים</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">API</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">אבטחה</a>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">תמיכה</h3>
              <div className="space-y-2">
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">מרכז עזרה</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">צור קשר</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">סטטוס מערכת</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">הדרכות</a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-400">
              © 2025 AgencyCRM. כל הזכויות שמורות. | 
              <a href="#" className="hover:text-white mx-2">תנאי שימוש</a> | 
              <a href="#" className="hover:text-white mx-2">מדיניות פרטיות</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
