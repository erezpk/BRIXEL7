import puppeteer from 'puppeteer';

interface QuoteData {
  id: string;
  quoteNumber: string;
  title: string;
  description?: string;
  validUntil: string;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  items: Array<{
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  notes?: string;
  createdAt: string;
}

interface ClientData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
}

interface AgencyData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  logo?: string;
  pdfTemplate?: string;
  pdfColor?: string;
}

export async function generateQuotePDFHtml(
  quote: QuoteData,
  client: ClientData,
  agency: AgencyData,
  senderName?: string
): Promise<Buffer> {
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL');
  };

  const primaryColor = agency.pdfColor || '#0066cc';
  const template = agency.pdfTemplate || 'modern';
  
  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>הצעת מחיר - ${quote.quoteNumber}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Assistant:wght@200;300;400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Assistant', 'Rubik', 'Segoe UI', Tahoma, Arial, sans-serif;
          direction: rtl;
          text-align: right;
          line-height: 1.6;
          background: #ffffff;
          color: #1a1a1a;
        }
        
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 3px solid ${primaryColor};
        }
        
        .agency-info {
          text-align: right;
        }
        
        .agency-name {
          font-size: 28px;
          font-weight: 700;
          color: ${primaryColor};
          margin-bottom: 8px;
        }
        
        .agency-details {
          font-size: 14px;
          color: #666;
          line-height: 1.4;
        }
        
        .logo {
          max-width: 120px;
          max-height: 80px;
          object-fit: contain;
        }
        
        .quote-header {
          background: linear-gradient(135deg, ${primaryColor}15, ${primaryColor}05);
          padding: 30px;
          border-radius: 12px;
          margin-bottom: 30px;
          border: 1px solid ${primaryColor}30;
        }
        
        .quote-title {
          font-size: 24px;
          font-weight: 600;
          color: ${primaryColor};
          margin-bottom: 15px;
        }
        
        .quote-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          font-size: 14px;
        }
        
        .quote-number {
          font-weight: 600;
          color: #333;
        }
        
        .client-section {
          margin-bottom: 30px;
        }
        
        .section-title {
          font-size: 18px;
          font-weight: 600;
          color: ${primaryColor};
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 2px solid ${primaryColor}30;
        }
        
        .client-info {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          font-size: 14px;
          line-height: 1.6;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          font-size: 14px;
        }
        
        .items-table th {
          background: ${primaryColor};
          color: white;
          padding: 15px 12px;
          text-align: right;
          font-weight: 600;
        }
        
        .items-table td {
          padding: 12px;
          border-bottom: 1px solid #e0e0e0;
          text-align: right;
        }
        
        .items-table tr:nth-child(even) {
          background: #f8f9fa;
        }
        
        .item-description {
          font-size: 12px;
          color: #666;
          margin-top: 4px;
        }
        
        .totals-section {
          background: #f8f9fa;
          padding: 25px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 14px;
        }
        
        .final-total {
          font-size: 18px;
          font-weight: 700;
          color: ${primaryColor};
          border-top: 2px solid ${primaryColor};
          padding-top: 12px;
          margin-top: 12px;
        }
        
        .valid-until {
          background: ${primaryColor}10;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid ${primaryColor}30;
          text-align: center;
          font-weight: 600;
          margin-bottom: 20px;
        }
        
        .notes {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          padding: 20px;
          border-radius: 8px;
          font-size: 14px;
          line-height: 1.6;
        }
        
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 12px;
          color: #666;
          border-top: 1px solid #e0e0e0;
          padding-top: 20px;
        }

        ${template === 'minimal' ? `
          .header { border-bottom: 1px solid #e0e0e0; }
          .quote-header { background: none; border: 1px solid #e0e0e0; }
          .items-table th { background: #f8f9fa; color: #333; }
        ` : ''}

        ${template === 'classic' ? `
          .container { border: 2px solid ${primaryColor}; }
          .header { border-bottom: 2px double ${primaryColor}; }
          .quote-header { border: 2px solid ${primaryColor}; background: ${primaryColor}05; }
        ` : ''}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="agency-info">
            <div class="agency-name">${agency.name}</div>
            <div class="agency-details">
              ${agency.email ? `דוא"ל: ${agency.email}<br>` : ''}
              ${agency.phone ? `טלפון: ${agency.phone}<br>` : ''}
              ${agency.address ? `כתובת: ${agency.address}` : ''}
            </div>
          </div>
          ${agency.logo ? `<img src="${agency.logo}" alt="לוגו" class="logo">` : ''}
        </div>

        <div class="quote-header">
          <div class="quote-title">הצעת מחיר #${quote.quoteNumber}</div>
          <div class="quote-info">
            <div><strong>תאריך יצירה:</strong> ${formatDate(quote.createdAt)}</div>
            <div><strong>תקפות עד:</strong> ${formatDate(quote.validUntil)}</div>
          </div>
        </div>

        <div class="client-section">
          <div class="section-title">פרטי הלקוח</div>
          <div class="client-info">
            <strong>שם:</strong> ${client.name}<br>
            ${client.company ? `<strong>חברה:</strong> ${client.company}<br>` : ''}
            <strong>דוא"ל:</strong> ${client.email}<br>
            ${client.phone ? `<strong>טלפון:</strong> ${client.phone}` : ''}
          </div>
        </div>

        <div class="section-title">פירוט השירותים</div>
        <table class="items-table">
          <thead>
            <tr>
              <th>תיאור</th>
              <th>כמות</th>
              <th>מחיר יחידה</th>
              <th>סכום</th>
            </tr>
          </thead>
          <tbody>
            ${quote.items.map(item => `
              <tr>
                <td>
                  <strong>${item.name}</strong>
                  ${item.description ? `<div class="item-description">${item.description}</div>` : ''}
                </td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.unitPrice)}</td>
                <td><strong>${formatCurrency(item.total)}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals-section">
          <div class="total-row">
            <span>סכום ביניים:</span>
            <span>${formatCurrency(quote.subtotal)}</span>
          </div>
          <div class="total-row">
            <span>מע"ם (17%):</span>
            <span>${formatCurrency(quote.vatAmount)}</span>
          </div>
          <div class="total-row final-total">
            <span>סה"כ לתשלום:</span>
            <span>${formatCurrency(quote.totalAmount)}</span>
          </div>
        </div>

        <div class="valid-until">
          הצעה זו תקפה עד: ${formatDate(quote.validUntil)}
        </div>

        ${quote.notes ? `
          <div class="section-title">הערות נוספות</div>
          <div class="notes">${quote.notes}</div>
        ` : ''}

        <div class="footer">
          מסמך זה נוצר אוטומטית על ידי מערכת ה-CRM<br>
          ${new Date().toLocaleDateString('he-IL')}
        </div>
      </div>
    </body>
    </html>
  `;

  // For development/Replit environment, return text-based PDF
  if (process.env.NODE_ENV === 'development') {
    const textContent = `
הצעת מחיר #${quote.quoteNumber}
=====================================

${agency.name}
${agency.email ? `דוא"ל: ${agency.email}` : ''}
${agency.phone ? `טלפון: ${agency.phone}` : ''}

פרטי הלקוח:
-----------
שם: ${client.name}
${client.company ? `חברה: ${client.company}` : ''}
דוא"ל: ${client.email}
${client.phone ? `טלפון: ${client.phone}` : ''}

פירוט השירותים:
--------------
${quote.items.map(item => 
  `${item.name} - כמות: ${item.quantity} × ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.total)}${item.description ? `\n  תיאור: ${item.description}` : ''}`
).join('\n')}

סיכום:
------
סכום ביניים: ${formatCurrency(quote.subtotal)}
מע"ם (17%): ${formatCurrency(quote.vatAmount)}
סה"כ לתשלום: ${formatCurrency(quote.totalAmount)}

תקף עד: ${formatDate(quote.validUntil)}

${quote.notes ? `הערות:\n${quote.notes}` : ''}

מסמך זה נוצר על ידי מערכת CRM ב-${formatDate(new Date().toISOString())}
    `;
    
    return Buffer.from(textContent, 'utf8');
  }

  // Production: Use Puppeteer to generate actual PDF
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setContent(html, { 
    waitUntil: 'networkidle0',
    timeout: 30000 
  });
  
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20mm',
      right: '15mm',
      bottom: '20mm',
      left: '15mm'
    }
  });
  
  await browser.close();
  return Buffer.from(pdfBuffer);
}

// Sample data for testing
export const sampleQuoteData = {
  quote: {
    id: "sample-1",
    quoteNumber: "Q-2025-SAMPLE",
    title: "פיתוח אתר תדמית מקצועי",
    description: "פיתוח אתר תדמית מותאם אישית עם עיצוב מודרני ומערכת ניהול תוכן",
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    subtotal: 8500,
    vatAmount: 1445,
    totalAmount: 9945,
    items: [
      {
        name: "עיצוב UI/UX מקצועי",
        description: "עיצוב מותאם אישית עם דגש על חווית משתמש מצוינת ועיצוב רספונסיבי",
        quantity: 1,
        unitPrice: 3500,
        total: 3500
      },
      {
        name: "פיתוח Frontend מתקדם",
        description: "פיתוח צד לקוח ב-React עם אנימציות חלקות וטעינה מהירה",
        quantity: 1,
        unitPrice: 4000,
        total: 4000
      },
      {
        name: "מערכת ניהול תוכן (CMS)",
        description: "מערכת ניהול תוכן פשוטה ואינטואיטיבית לעדכון קל של התוכן",
        quantity: 1,
        unitPrice: 1000,
        total: 1000
      }
    ],
    notes: "המחיר כולל 3 חודשי תחזוקה חינם, אחריות מלאה למשך שנה, והדרכה מקצועית לצוות.",
    createdAt: new Date().toISOString()
  },
  client: {
    name: "דוד כהן",
    email: "david@example.com",
    phone: "050-123-4567",
    company: "כהן ושות' - יעוץ עסקי"
  }
};