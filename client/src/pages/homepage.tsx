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
  Mail,
  Phone,
  MapPin,
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
            <div className="hidden md:flex items-center space-x-reverse space-x-6">
              <a
                href="#features"
                className="text-gray-600 hover:text-primary transition-colors px-3 py-2"
                data-testid="nav-features"
              >
                תכונות
              </a>
              <a
                href="#pricing"
                className="text-gray-600 hover:text-primary transition-colors px-3 py-2"
                data-testid="nav-pricing"
              >
                מחירים
              </a>
              <a
                href="#contact"
                className="text-gray-600 hover:text-primary transition-colors px-3 py-2"
                data-testid="nav-contact"
              >
                צור קשר
              </a>
              <div className="flex items-center space-x-reverse space-x-3 mr-6">
                <Link href="/login">
                  <Button variant="ghost" data-testid="nav-login">
                    כניסה
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button data-testid="nav-signup">הרשמה</Button>
                </Link>
              </div>
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
              <div className="flex flex-col space-y-4 text-right">
                <a
                  href="#features"
                  className="text-gray-600 hover:text-primary transition-colors py-2"
                >
                  תכונות
                </a>
                <a
                  href="#pricing"
                  className="text-gray-600 hover:text-primary transition-colors py-2"
                >
                  מחירים
                </a>
                <a
                  href="#contact"
                  className="text-gray-600 hover:text-primary transition-colors py-2"
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

      {/* Pricing Section */}
      <section
        id="pricing"
        className="py-20 bg-gradient-to-bl from-gray-50 to-white"
        data-testid="pricing-section"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2
              className="text-4xl font-bold text-gray-900 mb-4 font-rubik"
              data-testid="pricing-title"
            >
              תוכניות מחירים
            </h2>
            <p
              className="text-xl text-gray-600"
              data-testid="pricing-subtitle"
            >
              בחרו את התוכנית המתאימה לכם
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Basic Plan */}
            <Card className="bg-white p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-0">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    תוכנית בסיסית
                  </h3>
                  <div className="text-4xl font-bold text-primary mb-2">
                    ₪199
                    <span className="text-lg text-gray-600 font-normal">/חודש</span>
                  </div>
                  <p className="text-gray-600">מושלם לסוכנויות קטנות</p>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-right">
                    <span className="ml-3">✓</span>
                    עד 5 פרויקטים פעילים
                  </li>
                  <li className="flex items-center text-right">
                    <span className="ml-3">✓</span>
                    עד 3 חברי צוות
                  </li>
                  <li className="flex items-center text-right">
                    <span className="ml-3">✓</span>
                    ניהול משימות בסיסי
                  </li>
                  <li className="flex items-center text-right">
                    <span className="ml-3">✓</span>
                    תמיכה באימייל
                  </li>
                </ul>
                <Button className="w-full">התחילו עכשיו</Button>
              </CardContent>
            </Card>

            {/* Professional Plan */}
            <Card className="bg-gradient-to-bl from-primary/5 to-white p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-primary relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-white px-4 py-2 rounded-full text-sm font-semibold">
                  הכי פופולרי
                </span>
              </div>
              <CardContent className="p-0">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    תוכנית מקצועית
                  </h3>
                  <div className="text-4xl font-bold text-primary mb-2">
                    ₪399
                    <span className="text-lg text-gray-600 font-normal">/חודש</span>
                  </div>
                  <p className="text-gray-600">לסוכנויות בינוניות</p>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-right">
                    <span className="ml-3">✓</span>
                    פרויקטים ללא הגבלה
                  </li>
                  <li className="flex items-center text-right">
                    <span className="ml-3">✓</span>
                    עד 15 חברי צוות
                  </li>
                  <li className="flex items-center text-right">
                    <span className="ml-3">✓</span>
                    ניהול משימות מתקדם
                  </li>
                  <li className="flex items-center text-right">
                    <span className="ml-3">✓</span>
                    דוחות ואנליטיקס
                  </li>
                  <li className="flex items-center text-right">
                    <span className="ml-3">✓</span>
                    פורטל לקוחות
                  </li>
                  <li className="flex items-center text-right">
                    <span className="ml-3">✓</span>
                    תמיכה טלפונית
                  </li>
                </ul>
                <Button className="w-full">התחילו עכשיו</Button>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="bg-white p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-0">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    תוכנית ארגונית
                  </h3>
                  <div className="text-4xl font-bold text-primary mb-2">
                    ₪799
                    <span className="text-lg text-gray-600 font-normal">/חודש</span>
                  </div>
                  <p className="text-gray-600">לסוכנויות גדולות</p>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-right">
                    <span className="ml-3">✓</span>
                    כל התכונות של התוכנית המקצועית
                  </li>
                  <li className="flex items-center text-right">
                    <span className="ml-3">✓</span>
                    חברי צוות ללא הגבלה
                  </li>
                  <li className="flex items-center text-right">
                    <span className="ml-3">✓</span>
                    אוטומציות מתקדמות
                  </li>
                  <li className="flex items-center text-right">
                    <span className="ml-3">✓</span>
                    אינטגרציות מותאמות
                  </li>
                  <li className="flex items-center text-right">
                    <span className="ml-3">✓</span>
                    תמיכה 24/7
                  </li>
                  <li className="flex items-center text-right">
                    <span className="ml-3">✓</span>
                    מנהל חשבון ייעודי
                  </li>
                </ul>
                <Button className="w-full">צרו קשר</Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              כל התוכניות כוללות 14 יום ניסיון חינם, ללא התחייבות
            </p>
            <p className="text-sm text-gray-500">
              המחירים אינם כוללים מע"ם • ניתן לבטל בכל עת
            </p>
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

      {/* Contact Section */}
      <section
        id="contact"
        className="py-20 bg-white"
        data-testid="contact-section"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2
              className="text-4xl font-bold text-gray-900 mb-4 font-rubik"
              data-testid="contact-title"
            >
              צרו קשר
            </h2>
            <p
              className="text-xl text-gray-600"
              data-testid="contact-subtitle"
            >
              יש לכם שאלות? אנחנו כאן לעזור
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div className="text-right">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">
                דברו איתנו
              </h3>
              <div className="space-y-6">
                <div className="flex items-center space-x-reverse space-x-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">אימייל</p>
                    <p className="text-gray-600">support@brixel7.com</p>
                  </div>
                </div>
                <div className="flex items-center space-x-reverse space-x-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">טלפון</p>
                    <p className="text-gray-600">03-1234567</p>
                  </div>
                </div>
                <div className="flex items-center space-x-reverse space-x-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">כתובת</p>
                    <p className="text-gray-600">רחוב רוטשילד 1, תל אביב</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1 text-right">
                        שם מלא
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right text-sm"
                        placeholder="שמכם המלא"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1 text-right">
                        אימייל
                      </label>
                      <input
                        type="email"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right text-sm"
                        placeholder="כתובת אימייל"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1 text-right">
                      נושא
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right text-sm"
                      placeholder="נושא הפנייה"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1 text-right">
                      הודעה
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right resize-none text-sm"
                      placeholder="הודעתכם..."
                    ></textarea>
                  </div>
                  <Button className="w-full" size="sm">שלחו הודעה</Button>
                </form>
              </CardContent>
            </Card>
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
                Brixel7
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
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">צור קשר</h3>
              <ul className="space-y-2 text-gray-400">
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
              <h3 className="font-semibold mb-4">תמיכה ומידע</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/help-center" className="hover:text-white transition-colors cursor-pointer text-gray-400">
                    מרכז עזרה
                  </Link>
                </li>
                <li>
                  <Link href="/privacy-policy" className="hover:text-white transition-colors cursor-pointer text-gray-400">
                    מדיניות פרטיות
                  </Link>
                </li>
                <li>
                  <Link href="/terms-of-service" className="hover:text-white transition-colors cursor-pointer text-gray-400">
                    תנאי שירות
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Brixel7. כל הזכויות שמורות.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
