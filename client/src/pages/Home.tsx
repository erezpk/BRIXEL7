import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              ברוכים הבאים, {user?.firstName || user?.fullName || 'משתמש'}!
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              זהו הדף הראשי של מערכת ה-CRM שלך
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              window.location.href = '/api/logout';
            }}
          >
            התנתק
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                לקוחות פעילים
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">מסך טעינה</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                פרויקטים פעילים
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">מסך טעינה</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                משימות פתוחות
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">מסך טעינה</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                משימות שהושלמו השבוע
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">מסך טעינה</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>פעולות אחרונות</CardTitle>
              <CardDescription>
                פעילות אחרונה במערכת
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                אין פעילות אחרונה
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>משימות דחופות</CardTitle>
              <CardDescription>
                משימות הדורשות תשומת לב מיידית
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                אין משימות דחופות
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}