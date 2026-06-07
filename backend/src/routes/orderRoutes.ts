import { Router } from 'express';
import { OrderController } from '../controllers/orderController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticateJWT);

// Waiter, Branch Manager, HQ Manager, Admin can view orders
router.get('/', authorize([UserRole.WAITER, UserRole.BRANCH_MANAGER, UserRole.HQ_MANAGER, UserRole.ADMIN]), OrderController.getAllOrders);
router.get('/:id', authorize([UserRole.WAITER, UserRole.BRANCH_MANAGER, UserRole.HQ_MANAGER, UserRole.ADMIN]), OrderController.getOrderById);

// Customers can create orders
router.post('/', authorize([UserRole.CUSTOMER, UserRole.WAITER, UserRole.ADMIN]), OrderController.createOrder);

// Status updates
router.patch('/:id/status', authorize([UserRole.WAITER, UserRole.BRANCH_MANAGER, UserRole.ADMIN]), OrderController.updateStatus);
router.patch('/:id/confirm', authorize([UserRole.CUSTOMER, UserRole.WAITER, UserRole.BRANCH_MANAGER, UserRole.ADMIN]), OrderController.confirmPayment);

export default router;
