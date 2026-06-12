import { Router } from 'express'; // Import Express Router to create a modular route handler
import { BranchController } from '../controllers/branchController.js'; // Import the controller handling all branch and menu operations
import { authenticateJWT } from '../middleware/auth.js'; // Import JWT authentication middleware for protected routes
import { authorize } from '../middleware/rbac.js'; // Import role-based access control middleware
import { UserRole } from '@prisma/client'; // Import UserRole enum for role lists in authorize() calls

const router = Router(); // Create a new router instance for branch routes

// Public branch browsing for open access users
router.get('/public', BranchController.getPublicBranches); // GET /api/branches/public — returns active branches without requiring authentication
router.get('/public/:branchId/menu', BranchController.getPublicMenuByBranch); // GET /api/branches/public/:branchId/menu — returns menu items for a branch without authentication

router.use(authenticateJWT); // Apply JWT authentication to all routes defined below this line

// Branch Management (Admin only)
router.get('/', authorize([UserRole.ADMIN, UserRole.HQ_MANAGER, UserRole.OPEN_ACCESS]), BranchController.getAllBranches); // GET /api/branches — lists all branches with counts; accessible to admins, HQ managers, and open-access users
router.post('/', authorize([UserRole.ADMIN]), BranchController.createBranch); // POST /api/branches — creates a new branch; restricted to admins only
router.get('/:id', authorize([UserRole.ADMIN, UserRole.HQ_MANAGER, UserRole.BRANCH_MANAGER, UserRole.CHEF, UserRole.WAITER, UserRole.OPEN_ACCESS]), BranchController.getBranchById); // GET /api/branches/:id — returns a specific branch's details; accessible to admins, branch managers, and open-access
router.put('/:id', authorize([UserRole.ADMIN]), BranchController.updateBranch); // PUT /api/branches/:id — updates branch fields; restricted to admins only
router.delete('/:id', authorize([UserRole.ADMIN]), BranchController.deleteBranch); // DELETE /api/branches/:id — deletes a branch and all related data; restricted to admins only

// Menu Management (Branch-specific)
router.get('/:branchId/menu', authorize([UserRole.ADMIN, UserRole.BRANCH_MANAGER, UserRole.CUSTOMER, UserRole.WAITER, UserRole.OPEN_ACCESS]), BranchController.getMenuByBranch); // GET /api/branches/:branchId/menu — returns all menu items for a branch; accessible to most roles
router.post('/:branchId/menu', authorize([UserRole.ADMIN]), BranchController.createMenuItem);
router.put('/menu/:id', authorize([UserRole.ADMIN]), BranchController.updateMenuItem);
router.delete('/menu/:id', authorize([UserRole.ADMIN]), BranchController.deleteMenuItem);

export default router; // Export the router so it can be mounted in index.ts under /api/branches
