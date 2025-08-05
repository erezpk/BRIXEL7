import nodemailer from 'nodemailer';

interface EmailParams {
  to: string;
  from?: string;
  subject: string;
  text?: string;
  html?: string;
}

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig | null = null;

  async initialize() {
    console.log('🔄 Initializing email service...');
    console.log('Gmail User:', process.env.GMAIL_USER ? 'Set' : 'Not set');
    console.log('Gmail App Password:', process.env.GMAIL_APP_PASSWORD ? 'Set' : 'Not set');
    
    // Check for Gmail credentials first
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      this.config = {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD
        },
        from: process.env.GMAIL_USER
      };

      this.transporter = nodemailer.createTransporter(this.config);
      
      // Verify connection
      try {
        await this.transporter.verify();
        console.log('✅ Gmail SMTP connection verified successfully');
        console.log(`📧 Email service ready with Gmail: ${process.env.GMAIL_USER}`);
      } catch (error) {
        console.error('❌ Gmail SMTP verification failed:', error);
        this.transporter = null;
        this.config = null;
      }
    }
    // Fallback to generic SMTP if configured
    else if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
      this.config = {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        },
        from: process.env.SMTP_FROM || process.env.SMTP_USER
      };

      this.transporter = nodemailer.createTransporter(this.config);
      
      // Verify connection
      try {
        await this.transporter.verify();
        console.log('✅ SMTP connection verified successfully');
      } catch (error) {
        console.error('❌ SMTP verification failed:', error);
        this.transporter = null;
        this.config = null;
      }
    } else {
      console.warn('⚠️ Email service not configured - no SMTP credentials found');
      console.warn('💡 To enable email: Set GMAIL_USER and GMAIL_APP_PASSWORD environment variables');
    }
  }

  async sendEmail(params: EmailParams): Promise<boolean> {
    if (!this.transporter || !this.config) {
      console.error('Email service not initialized or configured');
      return false;
    }

    try {
      const mailOptions = {
        from: params.from || this.config.from,
        to: params.to,
        subject: params.subject,
        text: params.text,
        html: params.html
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('📧 Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      return false;
    }
  }

  // Email templates for common use cases
  async sendWelcomeEmail(to: string, userName: string): Promise<boolean> {
    const html = `
      <div dir="rtl" style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
        <h2>ברוכים הבאים ל-AgencyCRM!</h2>
        <p>שלום ${userName},</p>
        <p>תודה שהצטרפת למערכת ניהול הלקוחות שלנו. אנחנו שמחים שבחרת בנו לנהל את העסק שלך.</p>
        <p>כעת תוכל:</p>
        <ul>
          <li>לנהל לקוחות ופרויקטים</li>
          <li>לעקוב אחר לידים חדשים</li>
          <li>לנהל משימות וזמנים</li>
          <li>לקבל דוחות מפורטים</li>
        </ul>
        <p>אם יש לך שאלות, אנחנו כאן לעזור!</p>
        <p>בהצלחה,<br>צוות AgencyCRM</p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: 'ברוכים הבאים ל-AgencyCRM',
      html,
      text: `שלום ${userName}, ברוכים הבאים ל-AgencyCRM! תודה שהצטרפת למערכת ניהול הלקוחות שלנו.`
    });
  }

  async sendLeadNotification(to: string, leadName: string, leadEmail: string): Promise<boolean> {
    const html = `
      <div dir="rtl" style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
        <h2>ליד חדש התקבל!</h2>
        <p>ליד חדש נוסף למערכת:</p>
        <ul>
          <li><strong>שם:</strong> ${leadName}</li>
          <li><strong>אימייל:</strong> ${leadEmail}</li>
        </ul>
        <p>היכנס למערכת כדי לנהל את הליד החדש.</p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: 'ליד חדש - AgencyCRM',
      html,
      text: `ליד חדש: ${leadName} (${leadEmail})`
    });
  }

  async sendProjectUpdate(to: string, projectName: string, status: string): Promise<boolean> {
    const statusText = status === 'completed' ? 'הושלם' : 'עודכן';
    
    const html = `
      <div dir="rtl" style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
        <h2>עדכון פרויקט</h2>
        <p>הפרויקט "${projectName}" ${statusText}.</p>
        <p>היכנס למערכת לפרטים נוספים.</p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: `עדכון פרויקט: ${projectName}`,
      html,
      text: `הפרויקט "${projectName}" ${statusText}.`
    });
  }

  async sendPasswordReset(to: string, resetToken: string): Promise<boolean> {
    const resetUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const html = `
      <div dir="rtl" style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
        <h2>איפוס סיסמה</h2>
        <p>קיבלת בקשה לאיפוס סיסמה לחשבון שלך ב-AgencyCRM.</p>
        <p>לחץ על הקישור הבא כדי לאפס את הסיסמה:</p>
        <p><a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">איפוס סיסמה</a></p>
        <p>הקישור תקף למשך 24 שעות.</p>
        <p>אם לא ביקשת איפוס סיסמה, התעלם מהאימייל הזה.</p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: 'איפוס סיסמה - AgencyCRM',
      html,
      text: `איפוס סיסמה: ${resetUrl}`
    });
  }

  async sendTaskAssignment(to: string, taskName: string, projectName: string, dueDate?: string): Promise<boolean> {
    const dueDateText = dueDate ? `עד תאריך: ${new Date(dueDate).toLocaleDateString('he-IL')}` : '';
    
    const html = `
      <div dir="rtl" style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
        <h2>משימה חדשה הוקצתה לך</h2>
        <p>הוקצתה לך משימה חדשה:</p>
        <ul>
          <li><strong>משימה:</strong> ${taskName}</li>
          <li><strong>פרויקט:</strong> ${projectName}</li>
          ${dueDate ? `<li><strong>תאריך יעד:</strong> ${dueDateText}</li>` : ''}
        </ul>
        <p>היכנס למערכת לפרטים נוספים.</p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: `משימה חדשה: ${taskName}`,
      html,
      text: `משימה חדשה: ${taskName} בפרויקט ${projectName} ${dueDateText}`
    });
  }

  async sendClientCredentials(emailData: { to: string; clientName: string; username: string; password: string; loginUrl: string; agencyName: string; }): Promise<boolean> {
    const html = `
      <div dir="rtl" style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
        <h2>פרטי התחברות למערכת</h2>
        <p>שלום ${emailData.clientName},</p>
        <p>קיבלת גישה למערכת ${emailData.agencyName}.</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>שם משתמש:</strong> ${emailData.username}</p>
          <p><strong>סיסמה:</strong> ${emailData.password}</p>
          <p><strong>קישור למערכת:</strong> <a href="${emailData.loginUrl}">${emailData.loginUrl}</a></p>
        </div>
        <p>מומלץ לשנות את הסיסמה בכניסה הראשונה.</p>
        <p>בברכה,<br>${emailData.agencyName}</p>
      </div>
    `;

    return this.sendEmail({
      to: emailData.to,
      subject: `פרטי התחברות למערכת - ${emailData.agencyName}`,
      html,
      text: `שלום ${emailData.clientName}, קיבלת גישה למערכת ${emailData.agencyName}. שם משתמש: ${emailData.username}, סיסמה: ${emailData.password}, קישור: ${emailData.loginUrl}`
    });
  }

  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email connection test failed:', error);
      return false;
    }
  }

  isConfigured(): boolean {
    return this.transporter !== null && this.config !== null;
  }
}

// Create singleton instance
const emailService = new EmailService();

export { emailService, EmailService };
export type { EmailParams };