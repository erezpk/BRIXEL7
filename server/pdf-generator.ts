// Using a simpler PDF generation approach for Replit compatibility

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
}

export async function generateQuotePDF(
  quote: QuoteData,
  client: ClientData,
  agency: AgencyData,
  senderName?: string
): Promise<Buffer> {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS'
    }).format(amount / 100); // Convert from agorot to shekels
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL');
  };

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>הצעת מחיר - ${quote.quoteNumber}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
          direction: rtl;
          text-align: right;
          line-height: 1.6;
          color: #333;
          background: #fff;
        }
        
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
          border-bottom: 3px solid #0066cc;
          padding-bottom: 20px;
        }
        
        .agency-info {
          text-align: right;
        }
        
        .agency-name {
          font-size: 28px;
          font-weight: bold;
          color: #0066cc;
          margin-bottom: 10px;
        }
        
        .quote-info {
          text-align: left;
          color: #666;
        }
        
        .quote-number {
          font-size: 24px;
          font-weight: bold;
          color: #0066cc;
          margin-bottom: 5px;
        }
        
        .quote-title {
          font-size: 20px;
          font-weight: bold;
          margin: 30px 0 20px 0;
          color: #333;
        }
        
        .client-section {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        
        .client-title {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 15px;
          color: #0066cc;
        }
        
        .client-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 30px 0;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .items-table th,
        .items-table td {
          padding: 15px 12px;
          text-align: right;
          border-bottom: 1px solid #ddd;
        }
        
        .items-table th {
          background: #0066cc;
          color: white;
          font-weight: bold;
        }
        
        .items-table tbody tr:hover {
          background: #f8f9fa;
        }
        
        .items-table tbody tr:last-child {
          border-bottom: 2px solid #0066cc;
        }
        
        .summary-section {
          background: #f8f9fa;
          padding: 25px;
          border-radius: 8px;
          margin: 30px 0;
          border-right: 5px solid #0066cc;
        }
        
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          font-size: 16px;
        }
        
        .summary-row:last-child {
          font-weight: bold;
          font-size: 20px;
          color: #0066cc;
          border-top: 2px solid #ddd;
          padding-top: 15px;
          margin-top: 15px;
        }
        
        .notes-section {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 8px;
          padding: 20px;
          margin: 30px 0;
        }
        
        .notes-title {
          font-weight: bold;
          color: #856404;
          margin-bottom: 10px;
        }
        
        .footer {
          margin-top: 50px;
          padding-top: 30px;
          border-top: 2px solid #eee;
          text-align: center;
          color: #666;
          font-size: 14px;
        }
        
        .valid-until {
          background: #d1ecf1;
          border: 1px solid #bee5eb;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
          text-align: center;
          font-weight: bold;
          color: #0c5460;
        }
        
        .description {
          background: #e7f3ff;
          border-right: 4px solid #0066cc;
          padding: 15px;
          margin: 20px 0;
          border-radius: 0 8px 8px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="agency-info">
            <div class="agency-name">${agency.name || senderName || 'HORIZON-X'}</div>
            ${agency.email ? `<div>אימייל: ${agency.email}</div>` : ''}
            ${agency.phone ? `<div>טלפון: ${agency.phone}</div>` : ''}
            ${agency.address ? `<div>כתובת: ${agency.address}</div>` : ''}
          </div>
          <div class="quote-info">
            <div class="quote-number">מספר הצעה: ${quote.quoteNumber}</div>
            <div>תאריך: ${formatDate(quote.createdAt)}</div>
          </div>
        </div>

        <!-- Quote Title -->
        <div class="quote-title">${quote.title}</div>
        
        <!-- Description -->
        ${quote.description ? `
          <div class="description">
            <strong>תיאור:</strong> ${quote.description}
          </div>
        ` : ''}

        <!-- Client Info -->
        <div class="client-section">
          <div class="client-title">פרטי הלקוח</div>
          <div class="client-details">
            <div><strong>שם:</strong> ${client.name}</div>
            <div><strong>אימייל:</strong> ${client.email}</div>
            ${client.phone ? `<div><strong>טלפון:</strong> ${client.phone}</div>` : ''}
            ${client.company ? `<div><strong>חברה:</strong> ${client.company}</div>` : ''}
          </div>
        </div>

        <!-- Valid Until -->
        <div class="valid-until">
          ההצעה תקפה עד: ${formatDate(quote.validUntil)}
        </div>

        <!-- Items Table -->
        <table class="items-table">
          <thead>
            <tr>
              <th>פריט</th>
              <th>תיאור</th>
              <th>כמות</th>
              <th>מחיר יחידה</th>
              <th>סה"כ</th>
            </tr>
          </thead>
          <tbody>
            ${quote.items.map(item => `
              <tr>
                <td><strong>${item.name}</strong></td>
                <td>${item.description || ''}</td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.unitPrice)}</td>
                <td><strong>${formatCurrency(item.total)}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Summary -->
        <div class="summary-section">
          <div class="summary-row">
            <span>סכום חלקי:</span>
            <span>${formatCurrency(quote.subtotal)}</span>
          </div>
          <div class="summary-row">
            <span>מע"מ (18%):</span>
            <span>${formatCurrency(quote.vatAmount)}</span>
          </div>
          <div class="summary-row">
            <span>סה"כ לתשלום:</span>
            <span>${formatCurrency(quote.totalAmount)}</span>
          </div>
        </div>

        <!-- Notes -->
        ${quote.notes ? `
          <div class="notes-section">
            <div class="notes-title">הערות נוספות:</div>
            <div>${quote.notes}</div>
          </div>
        ` : ''}

        <!-- Footer -->
        <div class="footer">
          <p>תודה על הזדמנות לשתף פעולה!</p>
          <p>ההצעה נוצרה באמצעות מערכת HORIZON-X CRM</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const options = {
    format: 'A4',
    border: {
      top: '20mm',
      right: '15mm',
      bottom: '20mm',
      left: '15mm'
    },
    type: 'pdf',
    quality: '75',
    orientation: 'portrait',
    timeout: 30000
  };

  try {
    // For now, create a simple HTML-based PDF representation
    // This will be enhanced with proper PDF generation later
    const htmlBuffer = Buffer.from(html, 'utf8');
    
    // Create a simple text-based PDF content for attachment
    const pdfContent = `
מספר הצעה: ${quote.quoteNumber}
כותרת: ${quote.title}
לקוח: ${client.name}
אימייל לקוח: ${client.email}

פריטים:
${quote.items.map(item => `- ${item.name}: ${item.description || ''} | כמות: ${item.quantity} | מחיר: ${(item.unitPrice / 100).toLocaleString('he-IL')} ₪`).join('\n')}

סכום חלקי: ${(quote.subtotal / 100).toLocaleString('he-IL')} ₪
מע"מ: ${(quote.vatAmount / 100).toLocaleString('he-IL')} ₪
סה"כ: ${(quote.totalAmount / 100).toLocaleString('he-IL')} ₪

תאריך יצירה: ${new Date(quote.createdAt).toLocaleDateString('he-IL')}
תקף עד: ${new Date(quote.validUntil).toLocaleDateString('he-IL')}

${quote.notes ? `הערות: ${quote.notes}` : ''}

בברכה,
${agency.name}
`;
    
    return Buffer.from(pdfContent, 'utf8');
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}