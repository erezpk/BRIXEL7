// Service for handling platform subscriptions (customers buying the CRM system)

import { createPaymentProvider } from './payment-providers/factory';
import { storage } from './storage';

interface SubscriptionPlan {
  id: string;
  name: string;
  nameHe: string;
  description: string;
  descriptionHe: string;
  price: number; // in agorot
  currency: string;
  billingPeriod: 'monthly' | 'yearly';
  features: string[];
  maxUsers: number;
  maxClients: number;
  maxProjects: number;
  isPopular?: boolean;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    nameHe: 'בסיסי',
    description: 'Perfect for small agencies and freelancers',
    descriptionHe: 'מושלם לסוכנויות קטנות ועצמאיים',
    price: 9900, // ₪99/month
    currency: 'ILS',
    billingPeriod: 'monthly',
    features: [
      'עד 5 משתמשים',
      'עד 50 לקוחות',
      'עד 100 פרויקטים',
      'ניהול הצעות מחיר',
      'ניהול משימות',
      'תמיכה בסיסית'
    ],
    maxUsers: 5,
    maxClients: 50,
    maxProjects: 100
  },
  {
    id: 'professional',
    name: 'Professional',
    nameHe: 'מקצועי',
    description: 'For growing agencies with advanced needs',
    descriptionHe: 'לסוכנויות צומחות עם צרכים מתקדמים',
    price: 19900, // ₪199/month
    currency: 'ILS',
    billingPeriod: 'monthly',
    features: [
      'עד 15 משתמשים',
      'עד 200 לקוחות',
      'עד 500 פרויקטים',
      'כל הפיצ\'רים של תוכנית הבסיסי',
      'ניהול תשלומים מתקדם',
      'דוחות מפורטים',
      'אוטומציות',
      'תמיכה מועדפת'
    ],
    maxUsers: 15,
    maxClients: 200,
    maxProjects: 500,
    isPopular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    nameHe: 'ארגוני',
    description: 'For large agencies with unlimited needs',
    descriptionHe: 'לסוכנויות גדולות עם צרכים בלתי מוגבלים',
    price: 39900, // ₪399/month
    currency: 'ILS',
    billingPeriod: 'monthly',
    features: [
      'משתמשים ללא הגבלה',
      'לקוחות ללא הגבלה',
      'פרויקטים ללא הגבלה',
      'כל הפיצ\'רים של התוכנית המקצועית',
      'התאמות אישיות',
      'API מלא',
      'תמיכה 24/7',
      'מנהל לקוחות ייעודי'
    ],
    maxUsers: -1, // unlimited
    maxClients: -1, // unlimited
    maxProjects: -1 // unlimited
  }
];

export class SubscriptionService {
  // Platform payment provider (for selling the CRM)
  private platformProvider = createPaymentProvider('greeninvoice', {
    apiKey: process.env.PLATFORM_PAYMENT_API_KEY || '',
    secretKey: process.env.PLATFORM_PAYMENT_SECRET_KEY || '',
    companyId: process.env.PLATFORM_PAYMENT_COMPANY_ID || '',
    testMode: process.env.NODE_ENV !== 'production'
  });

  async getPlans(): Promise<SubscriptionPlan[]> {
    return SUBSCRIPTION_PLANS;
  }

  async getPlan(planId: string): Promise<SubscriptionPlan | null> {
    return SUBSCRIPTION_PLANS.find(plan => plan.id === planId) || null;
  }

  async createSubscriptionPaymentLink(
    planId: string,
    customerEmail: string,
    customerName: string,
    agencyName: string
  ): Promise<{ success: boolean; paymentUrl?: string; error?: string }> {
    try {
      const plan = await this.getPlan(planId);
      if (!plan) {
        return { success: false, error: 'תוכנית לא נמצאה' };
      }

      const result = await this.platformProvider.createPaymentLink({
        amount: plan.price,
        currency: plan.currency,
        description: `מנוי CRM - ${plan.nameHe} - ${agencyName}`,
        successUrl: `${process.env.FRONTEND_URL}/subscription/success`,
        cancelUrl: `${process.env.FRONTEND_URL}/subscription/cancel`,
        callbackUrl: `${process.env.BACKEND_URL}/api/subscriptions/callback`,
        metadata: {
          planId: plan.id,
          customerEmail,
          customerName,
          agencyName,
          type: 'subscription'
        }
      });

      return result;
    } catch (error) {
      console.error('Subscription payment link error:', error);
      return { success: false, error: 'שגיאה ביצירת קישור התשלום' };
    }
  }

  async processSubscriptionCallback(callbackData: any): Promise<{ success: boolean; agencyId?: string }> {
    try {
      const parsedData = this.platformProvider.parseCallback(callbackData);
      
      if (parsedData.status === 'completed' || parsedData.status === 'success') {
        const metadata = parsedData.metadata;
        
        // Create new agency with subscription
        const agencyData = {
          name: metadata.agencyName,
          email: metadata.customerEmail,
          phone: '',
          address: '',
          logo: null,
          settings: {
            planId: metadata.planId,
            subscriptionStatus: 'active',
            subscriptionStartDate: new Date().toISOString(),
            nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
            transactionId: parsedData.transactionId
          }
        };

        // Create agency
        const agency = await storage.createAgency(agencyData);

        // Create admin user for the agency
        const adminUserData = {
          email: metadata.customerEmail,
          fullName: metadata.customerName,
          password: 'temp-password-to-be-changed', // They'll need to set this via reset
          role: 'admin' as const,
          agencyId: agency.id,
          isActive: true
        };

        const adminUser = await storage.createUser(adminUserData);

        // Send welcome email with setup instructions
        await this.sendWelcomeEmail(agency, adminUser);

        return { success: true, agencyId: agency.id };
      }

      return { success: false };
    } catch (error) {
      console.error('Subscription callback processing error:', error);
      return { success: false };
    }
  }

  private async sendWelcomeEmail(agency: any, user: any): Promise<void> {
    try {
      const { emailService } = await import('./email-service');
      
      const subject = `ברוכים הבאים ל-AgencyCRM! הגדרת החשבון שלכם`;
      const htmlBody = `
        <div dir="rtl" style="font-family: Arial, sans-serif;">
          <h2>ברוכים הבאים ל-AgencyCRM!</h2>
          <p>שלום ${user.fullName},</p>
          
          <p>תודה שבחרתם ב-AgencyCRM! החשבון שלכם עבור סוכנות "${agency.name}" נוצר בהצלחה.</p>
          
          <h3>השלבים הבאים:</h3>
          <ol>
            <li>היכנסו למערכת: <a href="${process.env.FRONTEND_URL}/login">${process.env.FRONTEND_URL}/login</a></li>
            <li>השתמשו בכתובת המייל: ${user.email}</li>
            <li>לחצו על "שכחתי סיסמה" להגדרת סיסמה חדשה</li>
            <li>התחילו להגדיר את פרופיל הסוכנות שלכם</li>
          </ol>
          
          <h3>מה אפשר לעשות במערכת:</h3>
          <ul>
            <li>ניהול לקוחות ולידים</li>
            <li>יצירת והצעות מחיר מקצועיות</li>
            <li>ניהול פרויקטים ומשימות</li>
            <li>מערכת תשלומים מתקדמת</li>
            <li>דוחות ואנליטיקה</li>
          </ul>
          
          <p>זקוקים לעזרה? אנחנו כאן בשבילכם!</p>
          <p>תמיכה: support@agencycrm.co.il</p>
          
          <p>בהצלחה,<br>צוות AgencyCRM</p>
        </div>
      `;

      await emailService.sendEmail({
        to: user.email,
        subject,
        html: htmlBody
      });

      console.log(`Welcome email sent to: ${user.email}`);
    } catch (error) {
      console.error('Error sending welcome email:', error);
    }
  }

  async checkSubscriptionStatus(agencyId: string): Promise<{
    isActive: boolean;
    plan?: SubscriptionPlan;
    daysUntilRenewal?: number;
    overUsage?: {
      users: boolean;
      clients: boolean;
      projects: boolean;
    };
  }> {
    try {
      const agency = await storage.getAgency(agencyId);
      if (!agency || !agency.settings?.planId) {
        return { isActive: false };
      }

      const plan = await this.getPlan(agency.settings.planId);
      if (!plan) {
        return { isActive: false };
      }

      // Check if subscription is still active
      const nextBillingDate = new Date(agency.settings.nextBillingDate);
      const now = new Date();
      const isActive = now < nextBillingDate;
      
      const daysUntilRenewal = Math.ceil((nextBillingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Check usage limits
      const [userCount, clientCount, projectCount] = await Promise.all([
        storage.getUsersByAgency(agencyId).then(users => users.length),
        storage.getClientsByAgency(agencyId).then(clients => clients.length),
        storage.getProjectsByAgency(agencyId).then(projects => projects.length)
      ]);

      const overUsage = {
        users: plan.maxUsers > 0 && userCount > plan.maxUsers,
        clients: plan.maxClients > 0 && clientCount > plan.maxClients,
        projects: plan.maxProjects > 0 && projectCount > plan.maxProjects
      };

      return {
        isActive,
        plan,
        daysUntilRenewal: Math.max(0, daysUntilRenewal),
        overUsage
      };
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return { isActive: false };
    }
  }
}

export const subscriptionService = new SubscriptionService();