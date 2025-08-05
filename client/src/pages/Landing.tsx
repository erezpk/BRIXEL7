import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4" dir="rtl">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            מערכת CRM לסוכנויות דיגיטליות
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            נהל את הלקוחות, הפרויקטים והמשימות שלך במקום אחד עם מערכת CRM מתקדמת הבנויה במיוחד לסוכנויות דיגיטליות
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ניהול לקוחות</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                נהל את פרטי הלקוחות, פרויקטים פעילים וההיסטוריה המלאה במקום אחד
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">מעקב פרויקטים</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                עקוב אחרי התקדמות הפרויקטים, תקציבים ולוחות זמנים בזמן אמת
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ניהול משימות</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                הקצה משימות לחברי הצוות, עקוב אחרי התקדמות וודא עמידה בלוחות זמנים
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Button
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
            onClick={() => {
              window.location.href = '/api/login';
            }}
          >
            התחבר עם Replit
          </Button>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            התחבר באמצעות חשבון Replit שלך כדי להתחיל להשתמש במערכת
          </p>
        </div>
      </div>
    </div>
  );
}