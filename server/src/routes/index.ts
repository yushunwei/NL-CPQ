import { Router } from 'express';
import authRoutes from './auth.routes';
import portalProductRoutes from './portal/product.routes';
import portalQuoteRoutes from './portal/quote.routes';
import adminProductRoutes from './admin/product.routes';
import adminQuoteRoutes from './admin/quote.routes';
import adminUserRoutes from './admin/user.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/portal/products', portalProductRoutes);
router.use('/portal/quotes', portalQuoteRoutes);
router.use('/admin/products', adminProductRoutes);
router.use('/admin/quotes', adminQuoteRoutes);
router.use('/admin/users', adminUserRoutes);

export default router;
