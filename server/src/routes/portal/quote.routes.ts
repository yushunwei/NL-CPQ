import { Router, Request, Response } from 'express';
import { auth, AuthRequest } from '../../middleware/auth';
import { quoteService } from '../../services/quote.service';
import { pricingService } from '../../services/pricing.service';

const router = Router();
router.use(auth);

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const quote = await quoteService.createQuote(req.userId!, req.body);
    res.json(quote);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const status = req.query.status as string | undefined;
    const result = await quoteService.getMyQuotes(req.userId!, page, 20, status);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const quote = await quoteService.getQuoteById(Number(req.params.id));
    if (quote.createdById !== req.userId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ message: '无权查看此报价' });
    }
    res.json(quote);
  } catch (err: any) {
    res.status(404).json({ message: err.message });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const quote = await quoteService.updateQuote(Number(req.params.id), req.userId!, req.body);
    res.json(quote);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/:id/copy', async (req: AuthRequest, res: Response) => {
  try {
    const quote = await quoteService.copyQuote(Number(req.params.id), req.userId!);
    res.json(quote);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/:id/pdf', async (req: AuthRequest, res: Response) => {
  try {
    const quote = await quoteService.getQuoteById(Number(req.params.id));
    if (quote.createdById !== req.userId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ message: '无权下载此报价' });
    }
    const { pdfService } = await import('../../services/pdf.service');
    const pdfBuffer = await pdfService.generateQuotePdf(Number(req.params.id));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="quote-${quote.quoteNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/pricing/calculate', async (req: AuthRequest, res: Response) => {
  try {
    const { productId, optionValueIds, numberOfUnits } = req.body;
    const result = await pricingService.calculatePrice(productId, optionValueIds, numberOfUnits || 1);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
