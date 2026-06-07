import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

export class RoleService {
  static async changeUserRole(
    adminId: string, 
    userId: string, 
    newRole: UserRole
  ) {
    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    
    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new Error('Only admins can change user roles');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      throw new Error('User not found');
    }

    // Create audit log of role change
    await prisma.roleChangeAudit.create({
      data: {
        userId,
        previousRole: user.role,
        newRole,
        changedBy: adminId
      }
    });

    // Update user role
    return prisma.user.update({
      where: { id: userId },
      data: { role: newRole }
    });
  }

  static async deactivateUser(adminId: string, userId: string) {
    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    
    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new Error('Only admins can deactivate users');
    }

    return prisma.user.update({
      where: { id: userId },
      data: { isActive: false }
    });
  }

  static async getUserActivitySummary() {
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({ where: { isActive: true } });
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: { id: true }
    });

    return {
      totalUsers,
      activeUsers,
      usersByRole
    };
  }

  static async getRoleChangeAudit() {
    return prisma.roleChangeAudit.findMany({
      orderBy: { changedAt: 'desc' },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true }
        }
      }
    });
  }
}
