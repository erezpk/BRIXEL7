
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Search,
  ArrowRight,
  Book,
  Users,
  Settings,
  CreditCard,
  Shield,
  MessageCircle,
  Phone,
  Mail,
  ChevronRight,
  HelpCircle,
  FileText,
  Video,
} from "lucide-react";

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState("");

  // Popular questions for quick access
  const popularQuestions = [
    {
      question: "כיצד ליצור חשבון חדש?",
      answer: "בעמוד הבית, לחצו על כפתור 'הרשמה' בפינה הימנית העליונה. מלאו את הפרטים הנדרשים כמו שם, אימייל וסיסמה. לאחר מכן תקבלו אימייל אישור שתצטרכו ללחוץ עליו כדי להפעיל את החשבון."
    },
    {
      question: "איך מוסיפים לקוח חדש למערכת?",
      answer: "בדשבורד הראשי, עברו לעמוד 'לקוחות' ולחצו על כפתור 'הוסף לקוח' הכחול. מלאו את פרטי הלקוח כמו שם, אימייל, טלפון וכל מידע רלוונטי אחר. לאחר השמירה, הלקוח יופיע ברשימת הלקוחות שלכם."
    },
    {
      question: "כיצד ליצור פרויקט חדש?",
      answer: "בעמוד הפרויקטים, לחצו על 'פרויקט חדש'. בחרו לקוח קיים או הוסיפו חדש, הזינו שם לפרויקט, תיאור קצר, תאריך יעד ותקציב. ניתן גם להקצות חברי צוות לפרויקט מיד ביצירתו."
    },
    {
      question: "איך מנהלים משימות בפרויקט?",
      answer: "בתוך כל פרויקט יש לשונית 'משימות'. לחצו על 'הוסף משימה' כדי ליצור משימה חדשה. הגדירו כותרת, תיאור, תאריך יעד וחשיבות. ניתן להקצות המשימה לחבר צוות ספציפי ולעקוב אחר התקדמותה."
    },
    {
      question: "כיצד מזמינים חברי צוות חדשים?",
      answer: "בעמוד 'צוות', לחצו על 'הזמן חבר צוות'. הזינו את כתובת האימייל של האדם שברצונכם להזמין ובחרו את הרמת הגישה שלו (מנהל או חבר צוות). המוזמן יקבל אימייל עם קישור להרשמה למערכת."
    }
  ];

  const categories = [
    {
      title: "התחלת עבודה",
      description: "כל מה שצריך לדעת כדי להתחיל",
      icon: Book,
      color: "bg-blue-50 text-blue-600",
      articles: [
        "כיצד ליצור חשבון חדש",
        "הגדרת הפרופיל הראשון שלכם",
        "הוספת הלקוח הראשון",
        "יצירת הפרויקט הראשון",
      ],
    },
    {
      title: "ניהול לקוחות",
      description: "כל מה שקשור לניהול לקוחות",
      icon: Users,
      color: "bg-green-50 text-green-600",
      articles: [
        "הוספת לקוח חדש",
        "עריכת פרטי לקוח",
        "ניהול קשר עם לקוחות",
        "מחיקת לקוח",
      ],
    },
    {
      title: "פרויקטים ומשימות",
      description: "ניהול פרויקטים ומשימות ביעילות",
      icon: FileText,
      color: "bg-purple-50 text-purple-600",
      articles: [
        "יצירת פרויקט חדש",
        "הקצאת משימות לחברי צוות",
        "מעקב אחר התקדמות",
        "סגירת פרויקטים",
      ],
    },
    {
      title: "הגדרות מערכת",
      description: "התאמה אישית של המערכת",
      icon: Settings,
      color: "bg-yellow-50 text-yellow-600",
      articles: [
        "שינוי הגדרות חשבון",
        "ניהול הרשאות משתמשים",
        "התאמת דשבורד",
        "הגדרות התראות",
      ],
    },
    {
      title: "חיוב ותשלומים",
      description: "כל מה שקשור לחיוב ותשלומים",
      icon: CreditCard,
      color: "bg-red-50 text-red-600",
      articles: [
        "שינוי תוכנית מחירים",
        "עדכון פרטי תשלום",
        "הורדת חשבוניות",
        "ביטול מנוי",
      ],
    },
    {
      title: "אבטחה ופרטיות",
      description: "שמירה על המידע שלכם",
      icon: Shield,
      color: "bg-indigo-50 text-indigo-600",
      articles: [
        "הגדרת אימות דו-שלבי",
        "ניהול סיסמאות",
        "הרשאות גישה",
        "גיבוי מידע",
      ],
    },
  ];

  const faqs = [
    {
      question: "איך אני יכול להוסיף חבר צוות חדש?",
      answer: "כדי להוסיף חבר צוות חדש, היכנסו לעמוד 'צוות' בתפריט הצד, לחצו על 'הזמן חבר צוות', הזינו את כתובת האימייל והבחרו את הרמה המתאימה (מנהל/עובד). החבר יקבל הזמנה באימייל.",
    },
    {
      question: "איך אני יכול לשנות את תוכנית המחירים שלי?",
      answer: "לשינוי תוכנית המחירים, היכנסו להגדרות החשבון, בחרו 'חיוב ותשלומים', ולחצו על 'שנה תוכנית'. תוכלו לבחור תוכנית חדשה והשינוי יכנס לתוקף מיד.",
    },
    {
      question: "איך אני יכול לייצא את הנתונים שלי?",
      answer: "ייצוא נתונים זמין בהגדרות החשבון תחת 'ייצוא נתונים'. תוכלו לבחור אילו נתונים לייצא (לקוחות, פרויקטים, משימות) ולקבל קובץ CSV או Excel.",
    },
    {
      question: "האם יש אפליקציה לטלפון?",
      answer: "כרגע אין אפליקציה ייעודית, אבל האתר מותאם לחלוטין לטלפונים ניידים. תוכלו לגשת לכל התכונות דרך הדפדפן בטלפון.",
    },
    {
      question: "איך אני יכול לשחזר פרויקט שנמחק?",
      answer: "פרויקטים מחוקים נשמרים בפח המחזור למשך 30 יום. היכנסו להגדרות, בחרו 'פח מחזור' וגשו לפרויקט שתרצו לשחזר.",
    },
    {
      question: "איך אני יכול לקבל התראות על משימות חדשות?",
      answer: "בהגדרות החשבון, תחת 'התראות', תוכלו לבחור לקבל התראות באימייל, SMS או דרך הדפדפן על פעילויות שונות במערכת.",
    },
  ];

  const filteredCategories = categories.filter(category =>
    category.title.includes(searchQuery) || 
    category.description.includes(searchQuery) ||
    category.articles.some(article => article.includes(searchQuery))
  );

  const filteredFaqs = faqs.filter(faq =>
    faq.question.includes(searchQuery) || faq.answer.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-gradient-to-bl from-blue-50 to-white" dir="rtl">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <div className="text-2xl font-bold text-primary font-rubik">
                Brixel7
              </div>
            </Link>
            <div className="flex items-center space-x-reverse space-x-4">
              <Link href="/login">
                <Button variant="ghost">כניסה</Button>
              </Link>
              <Link href="/">
                <Button variant="outline">חזרה לדף הבית</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-l from-primary/10 to-purple-50">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6 font-rubik">
            מרכז עזרה
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            מצאו תשובות לכל השאלות שלכם על השימוש במערכת
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto mb-8">
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="חפשו כאן..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-12 py-4 text-lg text-right"
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center font-rubik">
            קטגוריות עזרה
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCategories.map((category, index) => {
              const Icon = category.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${category.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl font-semibold text-gray-900">
                      {category.title}
                    </CardTitle>
                    <p className="text-gray-600">{category.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {category.articles.map((article, articleIndex) => (
                        <button
                          key={articleIndex}
                          className="flex items-center justify-between w-full text-right p-2 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-700 hover:text-primary">
                            {article}
                          </span>
                        </button>
                      ))}
                    </div>
                    <Button variant="ghost" className="w-full mt-4">
                      ראו עוד <ArrowRight className="mr-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 font-rubik">
              שאלות נפוצות
            </h2>
            <p className="text-xl text-gray-600">
              התשובות לשאלות הנפוצות ביותר
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {filteredFaqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border border-gray-200 rounded-lg px-6"
              >
                <AccordionTrigger className="text-right hover:no-underline py-6">
                  <span className="text-lg font-medium text-gray-900">
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-right pb-6">
                  <p className="text-gray-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center font-rubik">
            פעולות מהירות
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center p-8 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Video className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                צפו במדריכים
              </h3>
              <p className="text-gray-600 mb-6">
                סרטוני הדרכה קצרים שיעזרו לכם להתחיל
              </p>
              <Button className="w-full">צפו במדריכים</Button>
            </Card>

            <Card className="text-center p-8 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                צ'אט עם התמיכה
              </h3>
              <p className="text-gray-600 mb-6">
                דברו עם נציג תמיכה לקבלת עזרה מיידית
              </p>
              <Button className="w-full">התחילו צ'אט</Button>
            </Card>

            <Card className="text-center p-8 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Book className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                קראו את המדריך
              </h3>
              <p className="text-gray-600 mb-6">
                מדריך מקיף לכל תכונות המערכת
              </p>
              <Button className="w-full">פתחו מדריך</Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-16 bg-gradient-to-l from-primary/10 to-purple-50">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 font-rubik">
            עדיין צריכים עזרה?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            צרו קשר עם צוות התמיכה שלנו - אנחנו כאן לעזור
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">אימייל</h3>
              <p className="text-gray-600 mb-4">support@brixel7.com</p>
              <Button variant="outline">שלחו אימייל</Button>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">טלפון</h3>
              <p className="text-gray-600 mb-4">03-1234567</p>
              <Button variant="outline">התקשרו עכשיו</Button>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">צ'אט חי</h3>
              <p className="text-gray-600 mb-4">זמינים 24/7</p>
              <Button>התחילו צ'אט</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-2xl font-bold mb-4 font-rubik">
            Brixel7
          </div>
          <p className="text-gray-400">
            מערכת CRM מתקדמת לסוכנויות דיגיטליות
          </p>
          <div className="border-t border-gray-800 mt-8 pt-8 text-gray-400">
            <p>&copy; 2025 Brixel7. כל הזכויות שמורות.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
