import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  Projector,
  BarChart3,
  Globe,
  Shield,
  Settings,
  ChevronLeft,
  Menu,
  X,
} from "lucide-react";

export default function Homepage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div
      className="min-h-screen bg-gradient-to-bl from-blue-50 to-white"
      dir="rtl"
    >
      {/* Navigation */}
      <nav
        className="bg-white shadow-sm border-b border-gray-100"
        data-testid="main-navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo on left */}
            <div className="flex items-center space-x-4">
              <div
                className="text-2xl font-bold text-primary font-rubik"
                data-testid="logo"
              >
                BRIXEL7
              </div>
            </div>

            {/* Desktop Menu on right */}
            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#features"
                className="text-gray-600 hover:text-primary transition-colors"
                data-testid="nav-features"
              >
                תכונות
              </a>
              <a
                href="#pricing"
                className="text-gray-600 hover:text-primary transition-colors"
                data-testid="nav-pricing"
              >
                מחירים
              </a>
              <a
                href="#contact"
                className="text-gray-600 hover:text-primary transition-colors"
                data-testid="nav-contact"
              >
                צור קשר
              </a>
              <Link href="/login">
                <Button variant="ghost" data-testid="nav-login">
                  כניסה
                </Button>
              </Link>
              <Link href="/signup">
                <Button data-testid="nav-signup">הרשמה</Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                data-testid="mobile-menu-toggle"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div
              className="md:hidden border-t border-gray-100 py-4"
              data-testid="mobile-menu"
            >
              <div className="flex flex-col space-y-4">
                <a
                  href="#features"
                  className="text-gray-600 hover:text-primary transition-colors"
                >
                  תכונות
                </a>
                <a
                  href="#pricing"
                  className="text-gray-600 hover:text-primary transition-colors"
                >
                  מחירים
                </a>
                <a
                  href="#contact"
                  className="text-gray-600 hover:text-primary transition-colors"
                >
                  צור קשר
                </a>
                <div className="flex flex-col space-y-2 pt-4 border-t border-gray-100">
                  <Link href="/login">
                    <Button variant="ghost" className="w-full justify-center">
                      כניסה
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button className="w-full justify-center">הרשמה</Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20" data-testid="hero-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-right animate-fade-in">
              <h1
                className="text-5xl font-bold text-gray-900 mb-6 font-rubik"
                data-testid="hero-title"
              >
                מערכת CRM מתקדמת
                <span className="text-primary block">לסוכנויות דיגיטליות</span>
              </h1>
              <p
                className="text-xl text-gray-600 mb-8 leading-relaxed"
                data-testid="hero-description"
              >
                נהלו את הלקוחות, הפרויקטים והמשימות שלכם במקום אחד. פתרון מקצועי
                עם תמיכה מלאה בעברית וממשק מותאם לסוכנויות.
              </p>
              <div className="flex space-x-reverse space-x-4">
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="bg-primary text-white px-8 py-4 rounded-xl font-semibold hover:bg-primary/90 transition-all transform hover:scale-105"
                    data-testid="hero-cta-signup"
                  >
                    התחילו חינם
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  className="px-8 py-4 rounded-xl font-semibold"
                  data-testid="hero-cta-demo"
                >
                  צפו בהדגמה
                </Button>
              </div>
            </div>

            <div className="relative animate-fade-in">
              {/* Dashboard preview mockup */}
              <Card
                className="transform rotate-3 hover:rotate-0 transition-transform duration-500 shadow-2xl"
                data-testid="dashboard-preview"
              >
                <div className="bg-primary h-8 flex items-center justify-start px-4 space-x-reverse space-x-2 rounded-t-lg">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
                <CardContent className="p-6 bg-gradient-to-bl from-blue-50 to-purple-50">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      דשבורד הסוכנות
                    </h3>
                    <div className="flex space-x-reverse space-x-2">
                      <div className="w-8 h-8 bg-primary/20 rounded-full"></div>
                      <div className="w-8 h-8 bg-purple-200 rounded-full"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <div className="text-2xl font-bold text-primary">24</div>
                      <div className="text-xs text-gray-600">
                        פרויקטים פעילים
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <div className="text-2xl font-bold text-green-600">
                        12
                      </div>
                      <div className="text-xs text-gray-600">משימות להיום</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <div className="text-2xl font-bold text-yellow-600">
                        5
                      </div>
                      <div className="text-xs text-gray-600">דחופות</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="bg-white p-2 rounded-lg shadow-sm flex justify-between items-center">
                      <div className="text-sm font-medium">פרויקט אתר חדש</div>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="bg-white p-2 rounded-lg shadow-sm flex justify-between items-center">
                      <div className="text-sm font-medium">קמפיין פייסבוק</div>
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-20 bg-white"
        data-testid="features-section"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2
              className="text-4xl font-bold text-gray-900 mb-4 font-rubik"
              data-testid="features-title"
            >
              תכונות מתקדמות
            </h2>
            <p
              className="text-xl text-gray-600"
              data-testid="features-subtitle"
            >
              כל מה שאתם צריכים לניהול סוכנות דיגיטלית מצליחה
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature cards */}
            <Card
              className="bg-gradient-to-br from-blue-50 to-white p-8 shadow-lg card-hover"
              data-testid="feature-team-management"
            >
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-6">
                <Users className="text-primary text-xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                ניהול צוותים
              </h3>
              <p className="text-gray-600">
                הקצו משימות, עקבו אחר התקדמות ושתפו פעולה בצורה יעילה
              </p>
            </Card>

            <Card
              className="bg-gradient-to-br from-purple-50 to-white p-8 shadow-lg card-hover"
              data-testid="feature-project-management"
            >
              <div className="w-12 h-12 bg-purple-200 rounded-xl flex items-center justify-center mb-6">
                <Projector className="text-purple-600 text-xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                ניהול פרויקטים
              </h3>
              <p className="text-gray-600">
                עקבו אחר פרויקטים מתחילה ועד סוף עם כלים מתקדמים
              </p>
            </Card>

            <Card
              className="bg-gradient-to-br from-green-50 to-white p-8 shadow-lg card-hover"
              data-testid="feature-smart-reports"
            >
              <div className="w-12 h-12 bg-green-200 rounded-xl flex items-center justify-center mb-6">
                <BarChart3 className="text-green-600 text-xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                דוחות חכמים
              </h3>
              <p className="text-gray-600">
                קבלו תובנות מעמיקות על ביצועים ויעילות העבודה
              </p>
            </Card>

            <Card
              className="bg-gradient-to-br from-yellow-50 to-white p-8 shadow-lg card-hover"
              data-testid="feature-digital-assets"
            >
              <div className="w-12 h-12 bg-yellow-200 rounded-xl flex items-center justify-center mb-6">
                <Globe className="text-yellow-600 text-xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                ניהול נכסים דיגיטליים
              </h3>
              <p className="text-gray-600">
                עקבו אחר דומיינים, אחסון ותאריכי חידוש
              </p>
            </Card>

            <Card
              className="bg-gradient-to-br from-red-50 to-white p-8 shadow-lg card-hover"
              data-testid="feature-client-portal"
            >
              <div className="w-12 h-12 bg-red-200 rounded-xl flex items-center justify-center mb-6">
                <Shield className="text-red-600 text-xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                פורטל לקוחות
              </h3>
              <p className="text-gray-600">
                תנו ללקוחות גישה מוגבלת לפרויקטים שלהם
              </p>
            </Card>

            <Card
              className="bg-gradient-to-br from-indigo-50 to-white p-8 shadow-lg card-hover"
              data-testid="feature-templates"
            >
              <div className="w-12 h-12 bg-indigo-200 rounded-xl flex items-center justify-center mb-6">
                <Settings className="text-indigo-600 text-xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                תבניות מוכנות
              </h3>
              <p className="text-gray-600">
                התחילו מהר עם תבניות לסוגי סוכנויות שונים
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="py-20 bg-gradient-to-l from-primary/10 to-purple-50"
        data-testid="cta-section"
      >
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2
            className="text-4xl font-bold text-gray-900 mb-6 font-rubik"
            data-testid="cta-title"
          >
            מוכנים להתחיל?
          </h2>
          <p
            className="text-xl text-gray-600 mb-8"
            data-testid="cta-description"
          >
            הצטרפו לאלפי סוכנויות שכבר משתמשות במערכת שלנו
          </p>
          <div className="flex justify-center space-x-reverse space-x-4">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-primary text-white px-8 py-4 rounded-xl font-semibold hover:bg-primary/90 transition-all"
                data-testid="cta-signup"
              >
                התחילו חינם היום
                <ChevronLeft className="mr-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12" data-testid="footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div
                className="text-2xl font-bold mb-4 font-rubik"
                data-testid="footer-logo"
              >
                AgencyCRM
              </div>
              <p className="text-gray-400">
                מערכת CRM מתקדמת לסוכנויות דיגיטליות
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">המוצר</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a
                    href="#features"
                    className="hover:text-white transition-colors"
                  >
                    תכונות
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="hover:text-white transition-colors"
                  >
                    מחירים
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    אבטחה
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">חברה</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    אודות
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    בלוג
                  </a>
                </li>
                <li>
                  <a
                    href="#contact"
                    className="hover:text-white transition-colors"
                  >
                    צור קשר
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">תמיכה</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    מרכז עזרה
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    מדריכים
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    API
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 AgencyCRM. כל הזכויות שמורות.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
