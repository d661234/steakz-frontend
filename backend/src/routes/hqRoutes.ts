import { Router } from 'express';
import { HQController } from '../controllers/hqController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticateJWT);
router.use(authorize([UserRole.HQ_MANAGER, UserRole.ADMIN]));

router.get('/analytics/sales', HQController.getSalesAnalytics);
router.get('/analytics/branches', HQController.getBranchPerformance);
router.get('/analytics/global-stats', HQController.getGlobalStats);
router.get('/analytics/peak-times', HQController.getPeakTimes);
router.get('/analytics/customer-frequency', HQController.getCustomerFrequency);
router.get('/analytics/top-menu-items', HQController.getMostViewedMenuItems);
router.get('/staff', HQController.getAllStaff);
router.post('/staff/assign', HQController.assignStaffToBranch);

export default router;
