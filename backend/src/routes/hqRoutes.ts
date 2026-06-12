import { Router } from 'express';
import { HQController } from '../controllers/hqController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticateJWT);

// Branch Managers can read analytics for their own branch; HQ/Admin see all branches
const hqOrAdmin   = authorize([UserRole.HQ_MANAGER, UserRole.ADMIN]);
const hqAdminOrBM = authorize([UserRole.HQ_MANAGER, UserRole.ADMIN, UserRole.BRANCH_MANAGER]);

router.get('/analytics/sales',              hqAdminOrBM, HQController.getSalesAnalytics);
router.get('/analytics/branches',           hqAdminOrBM, HQController.getBranchPerformance);
router.get('/analytics/global-stats',       hqAdminOrBM, HQController.getGlobalStats);
router.get('/analytics/peak-times',         hqAdminOrBM, HQController.getPeakTimes);
router.get('/analytics/customer-frequency', hqAdminOrBM, HQController.getCustomerFrequency);
router.get('/analytics/top-menu-items',     hqAdminOrBM, HQController.getMostViewedMenuItems);
router.get('/analytics/inventory-alerts',   hqAdminOrBM, HQController.getInventoryAlerts);
router.post('/analytics/inventory-alerts',         hqOrAdmin, HQController.createInventoryAlert);
router.delete('/analytics/inventory-alerts/:id',   hqOrAdmin, HQController.deleteInventoryAlert);
router.get('/staff',        hqAdminOrBM, HQController.getAllStaff);
router.post('/staff/assign', hqOrAdmin,  HQController.assignStaffToBranch);

export default router;
