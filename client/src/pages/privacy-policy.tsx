import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl">מדיניות פרטיות</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-lg max-w-none text-right" dir="rtl">
          <p className="text-lg text-muted-foreground mb-6">
            עדכון אחרון: {new Date().toLocaleDateString('he-IL')}
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. מבוא</h2>
            <p>
              מערכת CRM זו מיועדת לניהול לקוחות ופרויקטים עבור סוכנויות דיגיטליות. 
              אנו מתחייבים להגן על פרטיותכם ולשמור על המידע האישי שלכם בצורה מאובטחת.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. איסוף מידע</h2>
            <p>אנו אוספים את סוגי המידע הבאים:</p>
            <ul className="list-disc pr-6 mt-2">
              <li>מידע אישי: שם, כתובת אימייל, מספר טלפון</li>
              <li>מידע מקצועי: פרטי החברה, תפקיד, פרויקטים</li>
              <li>מידע טכני: כתובת IP, דפדפן, פעילות במערכת</li>
              <li>מידע יומן: פגישות ואירועים (באישורכם)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. שימוש במידע</h2>
            <p>אנו משתמשים במידע לצרכים הבאים:</p>
            <ul className="list-disc pr-6 mt-2">
              <li>מתן שירותי המערכת וניהול החשבון</li>
              <li>תקשורת עסקית ועדכונים</li>
              <li>שיפור השירות והמערכת</li>
              <li>ניתוח וסטטיסטיקות (באופן אנונימי)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. שיתוף מידע</h2>
            <p>
              אנו לא מוכרים, משתפים או מעבירים את המידע האישי שלכם לצדדים שלישיים 
              ללא אישורכם המפורש, למעט במקרים הנדרשים על פי חוק.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. אבטחת מידע</h2>
            <p>
              אנו נוקטים באמצעי אבטחה מתקדמים כולל הצפנה, אימות דו-שלבי, 
              וגישה מוגבלת למידע על בסיס הצורך לדעת.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. זכויותיכם</h2>
            <p>יש לכם זכות:</p>
            <ul className="list-disc pr-6 mt-2">
              <li>לקבל עותק של המידע האישי שלכם</li>
              <li>לבקש תיקון או מחיקת מידע</li>
              <li>להתנגד לעיבוד מידע</li>
              <li>לבטל את ההסכמה בכל עת</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. עוגיות (Cookies)</h2>
            <p>
              אנו משתמשים בעוגיות לשיפור החוויה, שמירת העדפות, 
              וניתוח פעילות המשתמשים באתר.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. שירותי צד שלישי</h2>
            <p>המערכת משתמשת בשירותים הבאים:</p>
            <ul className="list-disc pr-6 mt-2">
              <li>Google Calendar - לניהול פגישות ואירועים</li>
              <li>Google OAuth - לאימות משתמשים</li>
              <li>שירותי אימייל - לתקשורת עסקית</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">9. יצירת קשר</h2>
            <p>
              לשאלות בנושא פרטיות או לבקשות הקשורות לזכויותיכם, 
              אנא פנו אלינו בכתובת האימייל: privacy@agencycrm.co.il
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">10. עדכונים</h2>
            <p>
              מדיניות פרטיות זו עשויה להתעדכן מעת לעת. 
              נודיע לכם על שינויים משמעותיים דרך המערכת או באימייל.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}