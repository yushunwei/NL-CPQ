import { Router, Request, Response } from 'express';
import { auth } from '../../middleware/auth';
import { productService } from '../../services/product.service';

const router = Router();

router.get('/', auth, async (_req: Request, res: Response) => {
  try {
    const products = await productService.getActiveProducts();
    res.json(products);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/:id', auth, async (req: Request, res: Response) => {
  try {
    const product = await productService.getProductConfig(Number(req.params.id));
    res.json(product);
  } catch (err: any) {
    res.status(404).json({ message: err.message });
  }
});

export default router;
