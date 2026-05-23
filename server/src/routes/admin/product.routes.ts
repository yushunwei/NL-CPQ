import { Router, Request, Response } from 'express';
import { auth, adminOnly, AuthRequest } from '../../middleware/auth';
import { productService } from '../../services/product.service';

const router = Router();
router.use(auth, adminOnly);

// ===== 分类管理 =====
router.get('/categories', async (_req: Request, res: Response) => {
  try {
    const categories = await productService.getCategories();
    res.json(categories);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/categories', async (req: Request, res: Response) => {
  try {
    const cat = await productService.createCategory(req.body);
    res.json(cat);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

// ===== 产品CRUD =====
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const search = req.query.search as string | undefined;
    const result = await productService.getAllProducts(page, 20, search);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const product = await productService.createProduct(req.body);
    res.json(product);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const product = await productService.updateProduct(Number(req.params.id), req.body);
    res.json(product);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await productService.deleteProduct(Number(req.params.id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

// ===== 产品配置组管理 =====
router.get('/:productId/options', async (req: Request, res: Response) => {
  try {
    const options = await productService.getProductOptions(Number(req.params.productId));
    res.json(options);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/:productId/option-groups', async (req: Request, res: Response) => {
  try {
    const group = await productService.createOptionGroup(Number(req.params.productId), req.body);
    res.json(group);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/option-groups/:id', async (req: Request, res: Response) => {
  try {
    const group = await productService.updateOptionGroup(Number(req.params.id), req.body);
    res.json(group);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/option-groups/:id', async (req: Request, res: Response) => {
  try {
    await productService.deleteOptionGroup(Number(req.params.id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/option-groups/:groupId/values', async (req: Request, res: Response) => {
  try {
    const value = await productService.createOptionValue(Number(req.params.groupId), req.body);
    res.json(value);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/option-values/:id', async (req: Request, res: Response) => {
  try {
    const value = await productService.updateOptionValue(Number(req.params.id), req.body);
    res.json(value);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/option-values/:id', async (req: Request, res: Response) => {
  try {
    await productService.deleteOptionValue(Number(req.params.id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
