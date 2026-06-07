import prisma from '../lib/prisma.js';
import { Prisma } from '@prisma/client';

export class BranchService {
  static async getAllBranches() {
    return prisma.branch.findMany({
      include: {
        _count: {
          select: { staff: true, menuItems: true, orders: true, inventoryAlerts: true }
        }
      }
    });
  }

  static async getBranchById(id: string) {
    return prisma.branch.findUnique({
      where: { id },
      include: {
        staff: true,
        menuItems: true,
        inventoryAlerts: true
      }
    });
  }

  static async getPublicBranches() {
    return prisma.branch.findMany({
      where: { isActive: true },
      include: {
        menuItems: {
          where: { availability_status: true }
        }
      }
    });
  }

  static async getPublicMenuByBranch(branchId: string) {
    return prisma.menuItem.findMany({
      where: {
        branch_id: branchId,
        availability_status: true
      }
    });
  }

  static async createBranch(data: Prisma.BranchCreateInput) {
    return prisma.branch.create({
      data,
    });
  }

  static async updateBranch(id: string, data: Prisma.BranchUpdateInput) {
    return prisma.branch.update({
      where: { id },
      data,
    });
  }

  static async deleteBranch(id: string) {
    return prisma.branch.delete({
      where: { id },
    });
  }
}
