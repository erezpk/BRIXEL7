# Google OAuth Setup Instructions

## הבעיה: redirect_uri_mismatch

השגיאה מתרחשת כי הדומיין של Replit לא רשום ב-Google Cloud Console.

## הפתרון המלא:

### שלב 1: צור Google OAuth App
1. לך ל-[Google Cloud Console](https://console.cloud.google.com)
2. צור פרויקט חדש או בחר פרויקט קיים
3. בחר **APIs & Services** → **Credentials**
4. לחץ **Create Credentials** → **OAuth 2.0 Client IDs**
5. בחר **Web Application**

### שלב 2: הגדר Authorized Origins
הכנס את הדומיינים הבאים ב-**Authorized JavaScript origins**:
```
https://ccdb57b1-53f6-4b88-ba50-863ae246f42e-00-1ffb4gjb4lc25.riker.replit.dev
http://localhost:5000
https://localhost:5000
https://*.replit.dev
https://*.repl.it
```

### שלב 3: עדכן את ה-Client ID
לאחר יצירת ה-OAuth App, העתק את ה-Client ID ועדכן את הקוד:

1. פתח את הקובץ `client/src/lib/google-oauth.ts`
2. החלף את הערך ב-`getClientId()` עם ה-Client ID החדש שלך

### שלב 4: בדיקה
1. שמור את השינויים ב-Google Cloud Console (יכול לקחת עד 5 דקות)
2. רענן את האתר
3. נסה להתחבר עם Google

## הדומיין הנוכחי של Replit:
```
https://ccdb57b1-53f6-4b88-ba50-863ae246f42e-00-1ffb4gjb4lc25.riker.replit.dev
```

## חלופה זמנית:
במקום ליצור Google OAuth App חדש, אפשר להשתמש בפתרון אחר:
- התחברות רק עם אימייל וסיסמה (כמו שהיה קודם)
- או התחברות עם Microsoft/GitHub OAuth שקל יותר להגדיר

## מה עשיתי:
✅ הסרתי Firebase לחלוטין
✅ יצרתי Google OAuth פשוט
✅ הקוד מוכן לעבודה
❌ צריך להגדיר Google Cloud Console (דורש פעולה מצידך)

אם אתה רוצה שאעזור לך ליצור פתרון אחר או לחזור לאימות רגיל, ספר לי!