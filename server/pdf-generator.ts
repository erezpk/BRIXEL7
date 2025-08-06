import PDFDocument from 'pdfkit';

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

  return new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        bufferPages: true
      });

      const chunks: Buffer[] = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      const template = agency.pdfTemplate || 'modern';
      const primaryColor = agency.pdfColor || '#0066cc';

      // Generate PDF based on template
      switch (template) {
        case 'modern':
          generateModernTemplate(doc, quote, client, agency, senderName, primaryColor);
          break;
        case 'classic':
          generateClassicTemplate(doc, quote, client, agency, senderName, primaryColor);
          break;
        case 'minimal':
          generateMinimalTemplate(doc, quote, client, agency, senderName, primaryColor);
          break;
        default:
          generateModernTemplate(doc, quote, client, agency, senderName, primaryColor);
      }

      doc.end();
    } catch (error) {
      console.error('Error generating PDF:', error);
      reject(new Error('Failed to generate PDF'));
    }
  });
}

function generateModernTemplate(
  doc: PDFDocument,
  quote: QuoteData,
  client: ClientData,
  agency: AgencyData,
  senderName?: string,
  primaryColor: string = '#0066cc'
) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS'
    }).format(amount / 100);
  };

  // Header with agency info
  doc.fontSize(24).fillColor(primaryColor).text(agency.name, 50, 50, { align: 'right' });
  doc.fontSize(12).fillColor('#666666');
  if (agency.email) doc.text(`אימייל: ${agency.email}`, 50, 85, { align: 'right' });
  if (agency.phone) doc.text(`טלפון: ${agency.phone}`, 50, 105, { align: 'right' });

  // Quote number and date
  doc.fontSize(18).fillColor(primaryColor).text(`הצעת מחיר #${quote.quoteNumber}`, 50, 150, { align: 'left' });
  doc.fontSize(12).fillColor('#000000').text(`תאריך: ${new Date(quote.createdAt).toLocaleDateString('he-IL')}`, 50, 175, { align: 'left' });

  // Title
  doc.fontSize(20).fillColor('#000000').text(quote.title, 50, 210, { align: 'right' });

  // Client info box
  doc.rect(50, 250, 500, 80).strokeColor(primaryColor).stroke();
  doc.fontSize(14).fillColor(primaryColor).text('פרטי הלקוח:', 60, 260, { align: 'right' });
  doc.fontSize(12).fillColor('#000000');
  doc.text(`שם: ${client.name}`, 60, 285, { align: 'right' });
  doc.text(`אימייל: ${client.email}`, 60, 305, { align: 'right' });
  if (client.phone) doc.text(`טלפון: ${client.phone}`, 300, 285, { align: 'right' });
  if (client.company) doc.text(`חברה: ${client.company}`, 300, 305, { align: 'right' });

  // Items table
  let yPosition = 370;
  doc.fontSize(14).fillColor(primaryColor).text('פירוט השירותים:', 50, yPosition, { align: 'right' });
  yPosition += 30;

  quote.items.forEach((item, index) => {
    if (yPosition > 700) {
      doc.addPage();
      yPosition = 50;
    }
    
    doc.rect(50, yPosition, 500, 40).strokeColor('#cccccc').stroke();
    doc.fontSize(12).fillColor('#000000');
    doc.text(item.name, 60, yPosition + 8, { align: 'right', width: 200 });
    doc.text(`כמות: ${item.quantity}`, 280, yPosition + 8, { align: 'right' });
    doc.text(formatCurrency(item.total), 400, yPosition + 8, { align: 'right' });
    if (item.description) {
      doc.fontSize(10).fillColor('#666666').text(item.description, 60, yPosition + 25, { align: 'right', width: 200 });
    }
    yPosition += 50;
  });

  // Summary
  yPosition += 20;
  doc.rect(350, yPosition, 200, 100).fillColor('#f8f9fa').fill();
  doc.rect(350, yPosition, 200, 100).strokeColor(primaryColor).stroke();
  
  doc.fontSize(12).fillColor('#000000');
  doc.text(`סכום חלקי: ${formatCurrency(quote.subtotal)}`, 360, yPosition + 15, { align: 'right' });
  doc.text(`מע״מ: ${formatCurrency(quote.vatAmount)}`, 360, yPosition + 35, { align: 'right' });
  doc.fontSize(14).fillColor(primaryColor);
  doc.text(`סה״כ: ${formatCurrency(quote.totalAmount)}`, 360, yPosition + 60, { align: 'right' });

  // Valid until
  yPosition += 120;
  doc.fontSize(12).fillColor('#d9534f').text(`תקף עד: ${new Date(quote.validUntil).toLocaleDateString('he-IL')}`, 50, yPosition, { align: 'center' });

  // Notes
  if (quote.notes) {
    yPosition += 30;
    doc.fontSize(12).fillColor('#000000').text('הערות:', 50, yPosition, { align: 'right' });
    doc.text(quote.notes, 50, yPosition + 20, { align: 'right', width: 500 });
  }
}

function generateClassicTemplate(
  doc: PDFDocument,
  quote: QuoteData,
  client: ClientData,
  agency: AgencyData,
  senderName?: string,
  primaryColor: string = '#0066cc'
) {
  // Classic template with formal layout
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS'
    }).format(amount / 100);
  };

  // Header line
  doc.rect(50, 50, 500, 3).fillColor(primaryColor).fill();
  
  // Agency name
  doc.fontSize(28).fillColor('#000000').text(agency.name, 50, 70, { align: 'center' });
  
  // Quote title
  doc.fontSize(22).fillColor(primaryColor).text('הצעת מחיר', 50, 120, { align: 'center' });
  
  // Quote details in formal table
  doc.rect(50, 160, 500, 120).strokeColor('#000000').stroke();
  
  // Table headers
  doc.fontSize(12).fillColor('#000000');
  doc.text('מספר הצעה:', 400, 180, { align: 'right' });
  doc.text(quote.quoteNumber, 300, 180, { align: 'right' });
  doc.text('תאריך:', 400, 200, { align: 'right' });
  doc.text(new Date(quote.createdAt).toLocaleDateString('he-IL'), 300, 200, { align: 'right' });
  doc.text('תקף עד:', 400, 220, { align: 'right' });
  doc.text(new Date(quote.validUntil).toLocaleDateString('he-IL'), 300, 220, { align: 'right' });
  doc.text('כותרת:', 400, 240, { align: 'right' });
  doc.text(quote.title, 300, 240, { align: 'right' });

  // Client details
  doc.fontSize(16).fillColor(primaryColor).text('פרטי הלקוח', 50, 310, { align: 'right' });
  doc.rect(50, 340, 500, 80).strokeColor('#cccccc').stroke();
  
  doc.fontSize(12).fillColor('#000000');
  doc.text(`${client.name}`, 60, 355, { align: 'right' });
  doc.text(`${client.email}`, 60, 375, { align: 'right' });
  if (client.phone) doc.text(`${client.phone}`, 60, 395, { align: 'right' });

  // Items with formal table
  let yPos = 450;
  doc.fontSize(16).fillColor(primaryColor).text('פירוט הצעת המחיר', 50, yPos, { align: 'right' });
  yPos += 40;
  
  // Table header
  doc.rect(50, yPos, 500, 25).fillColor('#f0f0f0').fill().strokeColor('#000000').stroke();
  doc.fontSize(12).fillColor('#000000');
  doc.text('שירות', 450, yPos + 8, { align: 'right' });
  doc.text('כמות', 350, yPos + 8, { align: 'center' });
  doc.text('מחיר יחידה', 250, yPos + 8, { align: 'center' });
  doc.text('סה״כ', 150, yPos + 8, { align: 'center' });
  
  yPos += 25;
  
  quote.items.forEach((item) => {
    doc.rect(50, yPos, 500, 30).strokeColor('#cccccc').stroke();
    doc.fontSize(11).fillColor('#000000');
    doc.text(item.name, 450, yPos + 8, { align: 'right', width: 150 });
    doc.text(item.quantity.toString(), 350, yPos + 8, { align: 'center' });
    doc.text(formatCurrency(item.unitPrice), 250, yPos + 8, { align: 'center' });
    doc.text(formatCurrency(item.total), 150, yPos + 8, { align: 'center' });
    yPos += 30;
  });

  // Summary table
  yPos += 20;
  doc.rect(300, yPos, 250, 80).strokeColor('#000000').stroke();
  doc.rect(300, yPos, 250, 20).fillColor('#f0f0f0').fill().strokeColor('#000000').stroke();
  doc.fontSize(12).fillColor('#000000').text('סיכום', 420, yPos + 5, { align: 'center' });
  
  yPos += 20;
  doc.text(`סכום חלקי: ${formatCurrency(quote.subtotal)}`, 500, yPos + 8, { align: 'right' });
  yPos += 20;
  doc.text(`מע״מ (18%): ${formatCurrency(quote.vatAmount)}`, 500, yPos + 8, { align: 'right' });
  yPos += 20;
  doc.fontSize(14).fillColor(primaryColor);
  doc.text(`סה״כ לתשלום: ${formatCurrency(quote.totalAmount)}`, 500, yPos + 8, { align: 'right' });
}

function generateMinimalTemplate(
  doc: PDFDocument,
  quote: QuoteData,
  client: ClientData,
  agency: AgencyData,
  senderName?: string,
  primaryColor: string = '#0066cc'
) {
  // Minimal clean template
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS'
    }).format(amount / 100);
  };

  // Simple header
  doc.fontSize(32).fillColor(primaryColor).text(agency.name, 50, 50, { align: 'right' });
  doc.fontSize(18).fillColor('#666666').text('הצעת מחיר', 50, 90, { align: 'right' });
  
  // Minimal quote info
  doc.fontSize(14).fillColor('#000000');
  doc.text(`#${quote.quoteNumber}`, 50, 130, { align: 'left' });
  doc.text(new Date(quote.createdAt).toLocaleDateString('he-IL'), 450, 130, { align: 'right' });
  
  // Title
  doc.fontSize(20).text(quote.title, 50, 170, { align: 'right' });
  
  // Client - minimal
  doc.fontSize(12).fillColor('#666666').text('ללקוח:', 50, 210, { align: 'right' });
  doc.fontSize(14).fillColor('#000000').text(client.name, 50, 230, { align: 'right' });
  doc.fontSize(12).text(client.email, 50, 250, { align: 'right' });

  // Clean items list
  let y = 300;
  doc.fontSize(16).fillColor(primaryColor).text('שירותים:', 50, y, { align: 'right' });
  y += 40;
  
  quote.items.forEach((item, index) => {
    doc.fontSize(14).fillColor('#000000');
    doc.text(item.name, 50, y, { align: 'right' });
    doc.text(formatCurrency(item.total), 450, y, { align: 'left' });
    y += 25;
    
    if (item.description) {
      doc.fontSize(11).fillColor('#666666');
      doc.text(item.description, 50, y, { align: 'right', width: 350 });
      y += 20;
    }
    y += 10;
  });

  // Simple total
  y += 20;
  doc.moveTo(350, y).lineTo(550, y).strokeColor(primaryColor).stroke();
  y += 15;
  doc.fontSize(18).fillColor(primaryColor);
  doc.text(`סה״כ: ${formatCurrency(quote.totalAmount)}`, 450, y, { align: 'left' });
  
  // Valid until
  y += 50;
  doc.fontSize(12).fillColor('#666666');
  doc.text(`תקף עד ${new Date(quote.validUntil).toLocaleDateString('he-IL')}`, 50, y, { align: 'center' });
}