import { Response } from 'express';
import { ReportService } from '../services/reportService.js';
import { UserService } from '../services/userService.js';
import { BranchService } from '../services/branchService.js';
import { UserRole } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

type AssignStaffBody = { staffId: number; branchId: number };

// Returns the branch_id to filter by, or undefined if the user should see all branches
const branchFilter = (req: AuthRequest): number | undefined =>
  req.user?.role === UserRole.BRANCH_MANAGER && req.user.branch_id
    ? req.user.branch_id
    : undefined;

export class HQController {
  static async getSalesAnalytics(req: AuthRequest, res: Response) {
    try {
      const report = await ReportService.getSalesReportPerBranch(branchFilter(req));
      res.status(200).json(report);
    } catch {
      res.status(500).json({ message: 'Failed to fetch sales analytics' });
    }
  }

  static async getBranchPerformance(req: AuthRequest, res: Response) {
    try {
      const performance = await ReportService.getBranchPerformance(branchFilter(req));
      res.status(200).json(performance);
    } catch {
      res.status(500).json({ message: 'Failed to fetch branch performance' });
    }
  }

  static async getGlobalStats(req: AuthRequest, res: Response) {
    try {
      const stats = await ReportService.getGlobalStats(branchFilter(req));
      res.status(200).json(stats);
    } catch {
      res.status(500).json({ message: 'Failed to fetch global stats' });
    }
  }

  static async getPeakTimes(req: AuthRequest, res: Response) {
    try {
      const peakTimes = await ReportService.getPeakOrderTimes(branchFilter(req));
      res.status(200).json(peakTimes);
    } catch {
      res.status(500).json({ message: 'Failed to fetch peak times' });
    }
  }

  static async getCustomerFrequency(req: AuthRequest, res: Response) {
    try {
      const frequency = await ReportService.getCustomerFrequency(branchFilter(req));
      res.status(200).json(frequency);
    } catch {
      res.status(500).json({ message: 'Failed to fetch customer frequency' });
    }
  }

  static async getMostViewedMenuItems(req: AuthRequest, res: Response) {
    try {
      const items = await ReportService.getMostViewedMenuItems(branchFilter(req));
      res.status(200).json(items);
    } catch {
      res.status(500).json({ message: 'Failed to fetch most viewed menu items' });
    }
  }

  static async getInventoryAlerts(req: AuthRequest, res: Response) {
    try {
      const alerts = await ReportService.getInventoryAlerts(branchFilter(req));
      res.status(200).json(alerts);
    } catch {
      res.status(500).json({ message: 'Failed to fetch inventory alerts' });
    }
  }

  static async getAllStaff(req: AuthRequest, res: Response) {
    try {
      const bid = branchFilter(req);
      const staff = bid
        ? await UserService.getStaffByBranch(bid)
        : await UserService.getStaffMembers();
      res.status(200).json(staff);
    } catch {
      res.status(500).json({ message: 'Failed to fetch staff members' });
    }
  }

  static async assignStaffToBranch(req: AuthRequest, res: Response) {
    try {
      const { staffId, branchId } = req.body as AssignStaffBody;
      if (!staffId || !branchId) {
        return res.status(400).json({ message: 'staffId and branchId are required' });
      }
      const staff = await UserService.getUserById(staffId);
      if (!staff) return res.status(404).json({ message: 'Staff member not found' });

      const allowedRoles: readonly UserRole[] = [UserRole.BRANCH_MANAGER, UserRole.WAITER, UserRole.CHEF];
      if (!allowedRoles.includes(staff.role)) {
        return res.status(400).json({ message: 'User role cannot be assigned to a branch' });
      }
      const branch = await BranchService.getBranchById(branchId);
      if (!branch) return res.status(404).json({ message: 'Branch not found' });

      const updatedStaff = await UserService.assignStaffToBranch(staffId, branchId);
      res.status(200).json(updatedStaff);
    } catch {
      res.status(500).json({ message: 'Failed to assign staff to branch' });
    }
  }

  static async createInventoryAlert(req: AuthRequest, res: Response) {
    try {
      const { branch_id, menuItemId, lowStockThreshold, currentStock } = req.body;
      if (!branch_id || !menuItemId || lowStockThreshold == null || currentStock == null) {
        return res.status(400).json({ message: 'branch_id, menuItemId, lowStockThreshold and currentStock are required' });
      }
      const alert = await prisma.inventoryAlert.create({
        data: {
          branch_id: Number(branch_id),
          menuItemId: Number(menuItemId),
          lowStockThreshold: Number(lowStockThreshold),
          currentStock: Number(currentStock),
        },
        include: { branch: true },
      });
      res.status(201).json(alert);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create inventory alert';
      res.status(500).json({ message });
    }
  }

  static async deleteInventoryAlert(req: AuthRequest, res: Response) {
    try {
      await prisma.inventoryAlert.delete({ where: { id: parseInt(req.params.id as string) } });
      res.status(200).json({ message: 'Inventory alert deleted successfully' });
    } catch {
      res.status(500).json({ message: 'Failed to delete inventory alert' });
    }
  }

  static async getSalesReport(req: AuthRequest, res: Response) {
    try {
      const report = await ReportService.getSalesReportPerBranch(branchFilter(req));
      res.status(200).json(report);
    } catch {
      res.status(500).json({ message: 'Failed to generate sales report' });
    }
  }
}
