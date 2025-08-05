
import nodemailer from 'nodemailer';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface ClientCredentialsEmail {
  to: string;
  clientName: string;
  username: string;
  password: string;
  loginUrl: string;
  agencyName: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // יש להגדיר את פרטי ה-SMTP במשתני הסביבה
    const emailConfig: EmailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      }
    };

    if (emailConfig.auth.user && emailConfig.auth.pass) {
      this.transporter = nodemailer.createTransporter(emailConfig);
    } else {
      console.warn('SMTP credentials not configured. Email service will be disabled.');
    }
  }

  async sendClientCredentials(emailData: ClientCredentialsEmail): Promise<boolean> {
    if (!this.transporter) {
      console.error('Email service not configured');
      return false;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>פרטי התחברות למערכת</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
            direction: rtl;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .content {
            padding: 30px;
          }
          .credentials-box {
            background-color: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .credential-item {
            margin: 15px 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .credential-label {
            font-weight: bold;
            color: #495057;
          }
          .credential-value {
            background-color: white;
            padding: 8px 12px;
            border-radius: 4px;
            border: 1px solid #dee2e6;
            font-family: monospace;
            color: #212529;
          }
          .login-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
          }
          .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>ברוכים הבאים למערכת הניהול</h1>
            <p>שלום ${emailData.clientName}, פרטי ההתחברות שלך מוכנים!</p>
          </div>
          
          <div class="content">
            <h2>פרטי התחברות למערכת</h2>
            <p>קיבלת גישה למערכת הניהול של ${emailData.agencyName}. להלן פרטי ההתחברות שלך:</p>
            
            <div class="credentials-box">
              <div class="credential-item">
                <span class="credential-label">שם משתמש / אימייל:</span>
                <code class="credential-value">${emailData.username}</code>
              </div>
              <div class="credential-item">
                <span class="credential-label">סיסמה:</span>
                <code class="credential-value">${emailData.password}</code>
              </div>
            </div>
            
            <div class="warning">
              <strong>חשוב:</strong> מומלץ לשנות את הסיסמה בכניסה הראשונה למערכת לצורך אבטחה מירבית.
            </div>
            
            <div style="text-align: center;">
              <a href="${emailData.loginUrl}" class="login-button">
                היכנס למערכת
              </a>
            </div>
            
            <h3>מה תוכל לעשות במערכת?</h3>
            <ul>
              <li>צפייה בפרויקטים שלך ובמצבם הנוכחי</li>
              <li>מעקב אחר התקדמות המשימות</li>
              <li>קבלת עדכונים בזמן אמת</li>
              <li>צפייה וניהול נכסים דיגיטליים</li>
              <li>תקשורת ישירה עם הצוות</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>אם יש לך שאלות או בעיות בכניסה למערכת, אנא פנה אלינו.</p>
            <p>תודה ובהצלחה!</p>
            <p><strong>${emailData.agencyName}</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: emailData.to,
      subject: `פרטי התחברות למערכת - ${emailData.agencyName}`,
      html: htmlContent,
      text: `
שלום ${emailData.clientName},

קיבלת גישה למערכת הניהול של ${emailData.agencyName}.

פרטי ההתחברות שלך:
שם משתמש: ${emailData.username}
סיסמה: ${emailData.password}

קישור למערכת: ${emailData.loginUrl}

מומלץ לשנות את הסיסמה בכניסה הראשונה למערכת.

בברכה,
${emailData.agencyName}
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${emailData.to}`);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
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
}

export const emailService = new EmailService();
