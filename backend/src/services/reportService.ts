import prisma from '../lib/prisma.js';

export class ReportService {
  static async getSalesReportPerBranch() {
    const report = await prisma.order.groupBy({
      by: ['branch_id'],
      _sum: {
        total_amount: true,
      },
      _count: {
        id: true,
      },
      where: {
        status: 'PAID'
      }
    });

    // Enriches report with branch names
    const branches = await prisma.branch.findMany({
      select: { id: true, name: true }
    });

    return report.map(item => {
      const branch = branches.find(b => b.id === item.branch_id);
      return {
        branchName: branch ? branch.name : 'Unknown',
        totalSales: item._sum.total_amount || 0,
        orderCount: item._count.id
      };
    });
  }

  static async getBranchPerformance() {
    const report = await prisma.order.groupBy({
      by: ['branch_id'],
      _sum: {
        total_amount: true,
      },
      _count: {
        id: true,
      },
      where: {
        status: 'PAID'
      }
    });

    const branches = await prisma.branch.findMany({
      select: { id: true, name: true }
    });

    return report.map(item => {
      const branch = branches.find(b => b.id === item.branch_id);
      const totalSales = item._sum.total_amount || 0;
      const orderCount = item._count.id;
      return {
        branchName: branch ? branch.name : 'Unknown',
        totalSales,
        orderCount,
        averageOrderValue: orderCount > 0 ? totalSales / orderCount : 0
      };
    });
  }

  static async getPeakOrderTimes() {
    const orders = await prisma.order.findMany({
      where: { status: 'PAID' },
      select: { orderDate: true }
    });

    const hourlyCounts: Record<number, number> = {};

    orders.forEach((order) => {
      const hour = order.orderDate.getHours();
      hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
    });

    return Object.entries(hourlyCounts)
      .map(([hour, count]) => ({ hour: Number(hour), orderCount: count }))
      .sort((a, b) => b.orderCount - a.orderCount);
  }

  static async getCustomerFrequency() {
    const frequency = await prisma.order.groupBy({
      by: ['customer_id'],
      _count: { id: true },
      where: {
        customer_id: { not: null }
      }
    });

    const customerIds = frequency.map(item => item.customer_id).filter(Boolean) as string[];
    const customers = await prisma.user.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, firstName: true, lastName: true, email: true }
    });

    return frequency
      .map(item => ({
        customerId: item.customer_id,
        orderCount: item._count.id,
        customerName: customers.find(c => c.id === item.customer_id)
          ? `${customers.find(c => c.id === item.customer_id)?.firstName ?? ''} ${customers.find(c => c.id === item.customer_id)?.lastName ?? ''}`.trim()
          : 'Unknown Customer',
        email: customers.find(c => c.id === item.customer_id)?.email ?? 'unknown'
      }))
      .sort((a, b) => b.orderCount - a.orderCount);
  }

  static async getMostViewedMenuItems() {
    return prisma.menuItem.findMany({
      where: { availability_status: true },
      orderBy: { viewCount: 'desc' },
      take: 10,
    });
  }

  static async getGlobalStats() {
    const totalSales = await prisma.order.aggregate({
      _sum: {
        total_amount: true
      },
      where: {
        status: 'PAID'
      }
    });

    const totalOrders = await prisma.order.count();
    const totalCustomers = await prisma.user.count({
      where: { role: 'CUSTOMER' }
    });
    const totalBranches = await prisma.branch.count();

    return {
      totalSales: totalSales._sum.total_amount || 0,
      totalOrders,
      totalCustomers,
      totalBranches
    };
  }
}
