import { Router, Request, Response } from 'express';
import { auth, adminOnly } from '../../middleware/auth';
import { quoteService } from '../../services/quote.service';

const router = Router();
router.use(auth, adminOnly);

router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const filters = {
      status: req.query.status as string | undefined,
      customerName: req.query.customerName as string | undefined,
      createdById: req.query.createdById as string | undefined,
    };
    const result = await quoteService.getAllQuotes(page, 20, filters);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const quote = await quoteService.updateQuoteStatus(Number(req.params.id), req.body.status);
    res.json(quote);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
