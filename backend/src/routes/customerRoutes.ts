import { Router } from 'express';
import { CustomerController } from '../controllers/customerController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticateJWT);
router.use(authorize([UserRole.CUSTOMER, UserRole.ADMIN]));

router.get('/profile', CustomerController.getProfile);
router.put('/profile', CustomerController.updateProfile);
router.get('/orders', CustomerController.getOrderHistory);
router.get('/recommendations', CustomerController.getRecommendations);
router.post('/orders/:orderId/reorder', CustomerController.reorder);
router.get('/favourites', CustomerController.getFavourites);
router.post('/favourites/:itemId', CustomerController.toggleFavourite);

export default router;
