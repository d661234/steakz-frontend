import { Request, Response } from 'express';
import { ReportService } from '../services/reportService.js';
import { UserService } from '../services/userService.js';
import { BranchService } from '../services/branchService.js';
import { UserRole } from '@prisma/client';

type AssignStaffBody = {
  staffId: string;
  branchId: string;
};

export class HQController {
  static async getSalesAnalytics(req: Request, res: Response) {
    try {
      const report = await ReportService.getSalesReportPerBranch();
      res.status(200).json(report);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch sales analytics' });
    }
  }

  static async getBranchPerformance(req: Request, res: Response) {
    try {
      const performance = await ReportService.getBranchPerformance();
      res.status(200).json(performance);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch branch performance' });
    }
  }

  static async getAllStaff(req: Request, res: Response) {
    try {
      const staff = await UserService.getStaffMembers();
      res.status(200).json(staff);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch staff members' });
    }
  }

  static async assignStaffToBranch(req: Request, res: Response) {
    try {
      const { staffId, branchId } = req.body as AssignStaffBody;

      if (!staffId || !branchId) {
        return res.status(400).json({ message: 'staffId and branchId are required' });
      }

      const staff = await UserService.getUserById(staffId);
      if (!staff) {
        return res.status(404).json({ message: 'Staff member not found' });
      }

      const allowedRoles: readonly UserRole[] = [UserRole.BRANCH_MANAGER, UserRole.WAITER];
      if (!allowedRoles.includes(staff.role)) {
        return res.status(400).json({ message: 'User role cannot be assigned to a branch' });
      }

      const branch = await BranchService.getBranchById(branchId);
      if (!branch) {
        return res.status(404).json({ message: 'Branch not found' });
      }

      const updatedStaff = await UserService.assignStaffToBranch(staffId, branchId);
      res.status(200).json(updatedStaff);
    } catch (error) {
      res.status(500).json({ message: 'Failed to assign staff to branch' });
    }
  }

  static async getSalesReport(req: Request, res: Response) {
    try {
      const report = await ReportService.getSalesReportPerBranch();
      res.status(200).json(report);
    } catch (error) {
      res.status(500).json({ message: 'Failed to generate sales report' });
    }
  }

  static async getGlobalStats(req: Request, res: Response) {
    try {
      const stats = await ReportService.getGlobalStats();
      res.status(200).json(stats);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch global stats' });
    }
  }

  static async getPeakTimes(req: Request, res: Response) {
    try {
      const peakTimes = await ReportService.getPeakOrderTimes();
      res.status(200).json(peakTimes);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch peak times' });
    }
  }

  static async getCustomerFrequency(req: Request, res: Response) {
    try {
      const frequency = await ReportService.getCustomerFrequency();
      res.status(200).json(frequency);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch customer frequency' });
    }
  }

  static async getMostViewedMenuItems(req: Request, res: Response) {
    try {
      const items = await ReportService.getMostViewedMenuItems();
      res.status(200).json(items);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch most viewed menu items' });
    }
  }
}
