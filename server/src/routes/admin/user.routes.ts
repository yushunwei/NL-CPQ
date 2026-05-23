import { Router, Request, Response } from 'express';
import { auth, adminOnly } from '../../middleware/auth';
import { quoteService } from '../../services/quote.service';

const router = Router();
router.use(auth, adminOnly);

router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page as string) || 1;
    const result = await quoteService.getAllUsers(page, 20);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const user = await quoteService.updateUser(id, req.body);
    res.json(user);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
