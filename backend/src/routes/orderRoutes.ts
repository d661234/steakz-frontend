import { Router } from 'express'; // Import Express Router to create a modular route handler
import { OrderController } from '../controllers/orderController.js'; // Import the controller handling all order operations
import { authenticateJWT } from '../middleware/auth.js'; // Import JWT authentication middleware for protected routes
import { authorize } from '../middleware/rbac.js'; // Import role-based access control middleware
import { UserRole } from '@prisma/client'; // Import UserRole enum for role lists in authorize() calls

const router = Router(); // Create a new router instance for order routes

// Public guest order — no authentication required
router.post('/guest', OrderController.createGuestOrder); // POST /api/orders/guest — allows unauthenticated guests to place orders

router.use(authenticateJWT); // Apply JWT authentication to all routes defined below this line

// Waiter, Chef, Branch Manager, HQ Manager, Admin can view orders (branch-scoped for WAITER, CHEF, BRANCH_MANAGER)
router.get('/', authorize([UserRole.WAITER, UserRole.CHEF, UserRole.BRANCH_MANAGER, UserRole.HQ_MANAGER, UserRole.ADMIN]), OrderController.getAllOrders);
router.get('/:id', authorize([UserRole.WAITER, UserRole.CHEF, UserRole.BRANCH_MANAGER, UserRole.HQ_MANAGER, UserRole.ADMIN]), OrderController.getOrderById);

// Customers can create orders
router.post('/', authorize([UserRole.CUSTOMER, UserRole.WAITER, UserRole.ADMIN]), OrderController.createOrder);

// Status updates — Waiter, Chef, and Admin (Chef handles cooking stages; Waiter handles serving/billing)
router.patch('/:id/status', authorize([UserRole.WAITER, UserRole.CHEF, UserRole.ADMIN]), OrderController.updateStatus);
router.patch('/:id/confirm', authorize([UserRole.CUSTOMER, UserRole.WAITER, UserRole.ADMIN]), OrderController.confirmPayment); // PATCH /api/orders/:id/confirm — marks an order as PAID

export default router; // Export the router so it can be mounted in index.ts under /api/orders
