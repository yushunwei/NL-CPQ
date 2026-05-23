import PDFDocument from 'pdfkit';
import { quoteService } from './quote.service';

export class PdfService {
  async generateQuotePdf(quoteId: number): Promise<Buffer> {
    const quote = await quoteService.getQuoteById(quoteId);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Title
      doc.fontSize(20).font('Helvetica-Bold').text('Noblelift CPQ', { align: 'left' });
      doc.fontSize(14).font('Helvetica').text('Quotation', { align: 'left' });
      doc.moveDown(0.5);

      // Quote info
      doc.fontSize(10).font('Helvetica');
      doc.text(`Quote Number: ${quote.quoteNumber}`);
      doc.text(`Date: ${new Date(quote.quotationDate).toLocaleDateString('zh-CN')}`);
      doc.text(`Valid Until: ${quote.validUntil ? new Date(quote.validUntil).toLocaleDateString('zh-CN') : 'N/A'}`);
      doc.text(`Customer: ${quote.customerName}`);
      doc.text(`Salesperson: ${quote.createdBy.name}`);
      doc.text(`Number of Units: ${quote.numberOfUnits}`);
      doc.text(`Status: ${quote.status}`);
      doc.moveDown();

      // Product info
      doc.fontSize(12).font('Helvetica-Bold').text(`Product: ${quote.product.name} (${quote.product.sku})`);
      doc.moveDown(0.5);

      // Items table
      doc.fontSize(9).font('Helvetica-Bold');
      const tableTop = doc.y;
      const colX = [50, 200, 350, 420, 500];
      doc.text('Option Group', colX[0], tableTop);
      doc.text('Selection', colX[1], tableTop);
      doc.text('Price Delta', colX[3], tableTop, { width: 80, align: 'right' });
      doc.moveDown(0.3);

      doc.font('Helvetica').fontSize(9);
      let y = doc.y;
      for (const item of quote.items) {
        doc.text(item.optionGroup.name, colX[0], y);
        doc.text(item.optionValue.label, colX[1], y);
        doc.text(`${Number(item.priceDelta).toFixed(2)} ${quote.currency}`, colX[3], y, { width: 80, align: 'right' });
        y += 16;
        if (y > 720) {
          doc.addPage();
          y = 50;
        }
      }

      // Totals
      y += 10;
      doc.moveTo(50, y).lineTo(550, y).stroke();
      y += 10;
      doc.font('Helvetica-Bold').fontSize(10);
      doc.text(`Subtotal: ${Number(quote.subtotal).toFixed(2)} ${quote.currency}`, colX[3], y, { width: 80, align: 'right' });

      if (Number(quote.discountTotal) > 0) {
        y += 18;
        doc.font('Helvetica').fontSize(10);
        doc.text(`Discount: -${Number(quote.discountTotal).toFixed(2)} ${quote.currency}`, colX[3], y, { width: 80, align: 'right' });
      }

      y += 22;
      doc.font('Helvetica-Bold').fontSize(12);
      doc.text(`TOTAL: ${Number(quote.total).toFixed(2)} ${quote.currency}`, colX[3], y, { width: 80, align: 'right' });

      // Footer
      doc.fontSize(8).font('Helvetica');
      doc.text(
        '* Quote valid for 30 days from the date of issue. Actual performance may vary due to configuration.',
        50, 770, { align: 'center', width: 500 }
      );

      doc.end();
    });
  }
}

export const pdfService = new PdfService();
