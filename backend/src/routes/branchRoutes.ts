import { Router } from 'express';
import { BranchController } from '../controllers/branchController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { UserRole } from '@prisma/client';

const router = Router();

// Public branch browsing for open access users
router.get('/public', BranchController.getPublicBranches);
router.get('/public/:branchId/menu', BranchController.getPublicMenuByBranch);

router.use(authenticateJWT);

// Branch Management (Admin only)
router.get('/', authorize([UserRole.ADMIN, UserRole.HQ_MANAGER]), BranchController.getAllBranches);
router.post('/', authorize([UserRole.ADMIN]), BranchController.createBranch);
router.get('/:id', authorize([UserRole.ADMIN, UserRole.BRANCH_MANAGER]), BranchController.getBranchById);
router.put('/:id', authorize([UserRole.ADMIN]), BranchController.updateBranch);
router.delete('/:id', authorize([UserRole.ADMIN]), BranchController.deleteBranch);

// Menu Management (Branch-specific)
router.get('/:branchId/menu', authorize([UserRole.ADMIN, UserRole.BRANCH_MANAGER, UserRole.CUSTOMER, UserRole.WAITER]), BranchController.getMenuByBranch);
router.post('/:branchId/menu', authorize([UserRole.ADMIN, UserRole.BRANCH_MANAGER]), BranchController.createMenuItem);
router.put('/menu/:id', authorize([UserRole.ADMIN, UserRole.BRANCH_MANAGER]), BranchController.updateMenuItem);
router.delete('/menu/:id', authorize([UserRole.ADMIN, UserRole.BRANCH_MANAGER]), BranchController.deleteMenuItem);

export default router;
