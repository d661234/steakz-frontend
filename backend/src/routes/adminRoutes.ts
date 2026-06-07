import { Router } from 'express';
import { AdminController } from '../controllers/adminController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { UserRole } from '@prisma/client';

const router = Router();

// All admin routes are protected and require ADMIN role
router.use(authenticateJWT);
router.use(authorize([UserRole.ADMIN]));

router.get('/users', AdminController.getAllUsers);
router.get('/users/activity-summary', AdminController.getUserActivitySummary);
router.get('/users/audit-log', AdminController.getUserAuditLog);
router.get('/users/:id', AdminController.getUserById);
router.patch('/users/:id/role', AdminController.changeUserRole);
router.patch('/users/:id/deactivate', AdminController.deactivateUser);
router.put('/users/:id', AdminController.updateUser);
router.delete('/users/:id', AdminController.deleteUser);

export default router;
