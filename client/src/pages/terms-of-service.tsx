import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsOfService() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl">תנאי שירות</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-lg max-w-none text-right" dir="rtl">
          <p className="text-lg text-muted-foreground mb-6">
            עדכון אחרון: {new Date().toLocaleDateString('he-IL')}
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. הסכמה לתנאים</h2>
            <p>
              השימוש במערכת CRM זו כפוף לתנאי השירות הללו. 
              על ידי גישה למערכת או שימוש בה, אתם מסכימים לכל התנאים המפורטים כאן.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. תיאור השירות</h2>
            <p>
              מערכת CRM זו מיועדת לסוכנויות דיגיטליות לניהול:
            </p>
            <ul className="list-disc pr-6 mt-2">
              <li>לקוחות ולידים</li>
              <li>פרויקטים ומשימות</li>
              <li>תקשורת ופגישות</li>
              <li>מסמכים ונכסים דיגיטליים</li>
              <li>הצעות מחיר וחשבוניות</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. רישיון שימוש</h2>
            <p>
              אנו מעניקים לכם רישיון מוגבל, אישי, לא ניתן להעברה לשימוש במערכת 
              למטרות עסקיות בלבד, בהתאם לתנאים אלה.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. חשבון משתמש</h2>
            <p>אתם אחראים על:</p>
            <ul className="list-disc pr-6 mt-2">
              <li>שמירה על סודיות פרטי הכניסה</li>
              <li>כל הפעילות שמתבצעת בחשבון שלכם</li>
              <li>הודעה מיידית על שימוש לא מורשה</li>
              <li>עדכון פרטים אישיים ועסקיים</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. איסורי שימוש</h2>
            <p>אסור לכם:</p>
            <ul className="list-disc pr-6 mt-2">
              <li>להשתמש במערכת למטרות לא חוקיות</li>
              <li>לנסות לפרוץ או לפגוע במערכת</li>
              <li>להעביר תוכנות זדוניות</li>
              <li>להפר זכויות אחרים</li>
              <li>לשתף פרטי גישה עם אחרים</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. תשלומים והחזרים</h2>
            <p>
              התשלומים מבוצעים לפי התעריף שנבחר. 
              החזרים יעשו בהתאם למדיניות ההחזרים שלנו, 
              בדרך כלל תוך 30 יום מהרכישה.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. זמינות השירות</h2>
            <p>
              אנו שואפים לזמינות גבוהה אך לא מתחייבים על זמינות של 100%. 
              ייתכנו הפסקות לתחזוקה או בעיות טכניות מעת לעת.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. קניין רוחני</h2>
            <p>
              כל הזכויות במערכת, בתוכן, ובטכנולוגיה שייכות לנו. 
              המידע שאתם מכניסים למערכת נשאר בבעלותכם.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">9. הגבלת אחריות</h2>
            <p>
              אחריותנו מוגבלת לסכום ששילמתם עבור השירות. 
              איננו אחראים לנזקים עקיפים או אובדן רווחים.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">10. סיום השירות</h2>
            <p>
              אנו רשאים להפסיק את השירות בהתראה של 30 יום. 
              אתם רשאים לבטל בכל עת דרך הגדרות החשבון.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">11. יצירת קשר</h2>
            <p>
              לשאלות או בקשות תמיכה, אנא פנו אלינו ב:
              support@agencycrm.co.il
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}