import prisma from '../lib/prisma.js';

export class ReportService {
  static async getSalesReportPerBranch(branchId?: number) {
    const report = await prisma.order.groupBy({
      by: ['branch_id'],
      _sum: { total_amount: true },
      _count: { id: true },
      where: { status: 'PAID', ...(branchId ? { branch_id: branchId } : {}) },
    });
    const branches = await prisma.branch.findMany({ select: { id: true, name: true } });
    return report.map(item => ({
      branchName: branches.find(b => b.id === item.branch_id)?.name ?? 'Unknown',
      totalSales: item._sum.total_amount || 0,
      orderCount: item._count.id,
    }));
  }

  static async getBranchPerformance(branchId?: number) {
    const report = await prisma.order.groupBy({
      by: ['branch_id'],
      _sum: { total_amount: true },
      _count: { id: true },
      where: { status: 'PAID', ...(branchId ? { branch_id: branchId } : {}) },
    });
    const branches = await prisma.branch.findMany({ select: { id: true, name: true } });
    return report.map(item => {
      const totalSales = item._sum.total_amount || 0;
      const orderCount = item._count.id;
      return {
        branchName: branches.find(b => b.id === item.branch_id)?.name ?? 'Unknown',
        totalSales,
        orderCount,
        averageOrderValue: orderCount > 0 ? totalSales / orderCount : 0,
      };
    });
  }

  static async getPeakOrderTimes(branchId?: number) {
    const orders = await prisma.order.findMany({
      where: { status: 'PAID', ...(branchId ? { branch_id: branchId } : {}) },
      select: { orderDate: true },
    });
    const hourlyCounts: Record<number, number> = {};
    orders.forEach(order => {
      const hour = order.orderDate.getHours();
      hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
    });
    return Object.entries(hourlyCounts)
      .map(([hour, count]) => ({ hour: Number(hour), orderCount: count }))
      .sort((a, b) => b.orderCount - a.orderCount);
  }

  static async getCustomerFrequency(branchId?: number) {
    const frequency = await prisma.order.groupBy({
      by: ['customer_id'],
      _count: { id: true },
      where: {
        customer_id: { not: null },
        ...(branchId ? { branch_id: branchId } : {}),
      },
    });
    const customerIds = frequency.map(item => item.customer_id).filter(Boolean) as number[];
    const customers = await prisma.user.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
    return frequency
      .map(item => ({
        customerId: item.customer_id,
        orderCount: item._count.id,
        customerName: (() => {
          const c = customers.find(c => c.id === item.customer_id);
          return c ? `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || c.email : 'Unknown Customer';
        })(),
        email: customers.find(c => c.id === item.customer_id)?.email ?? 'unknown',
      }))
      .sort((a, b) => b.orderCount - a.orderCount);
  }

  static async getMostViewedMenuItems(branchId?: number) {
    return prisma.menuItem.findMany({
      where: {
        availability_status: true,
        ...(branchId ? { branch_id: branchId } : {}),
      },
      orderBy: { viewCount: 'desc' },
      take: 10,
    });
  }

  static async getInventoryAlerts(branchId?: number) {
    const alerts = await prisma.inventoryAlert.findMany({
      orderBy: { alertDate: 'desc' },
      where: branchId ? { branch_id: branchId } : undefined,
      include: { branch: { select: { id: true, name: true } } },
    });
    const menuItemIds = alerts.map(a => a.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
      select: { id: true, item_name: true },
    });
    const manualAlerts = alerts.map(alert => ({
      id: `alert-${alert.id}`,
      type: 'manual' as const,
      branchName: alert.branch.name,
      itemName: menuItems.find(m => m.id === alert.menuItemId)?.item_name ?? 'Unknown Item',
      currentStock: alert.currentStock,
      lowStockThreshold: alert.lowStockThreshold,
      alertDate: alert.alertDate,
      status: null, quantity: null, unit: null, notes: null,
    }));

    const stockRequests = await prisma.stockRequest.findMany({
      where: {
        status: { in: ['PENDING', 'ACKNOWLEDGED'] },
        ...(branchId ? { branch_id: branchId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: { branch: { select: { id: true, name: true } } },
    });
    const restockAlerts = stockRequests.map(req => ({
      id: `req-${req.id}`,
      type: 'restock' as const,
      branchName: req.branch.name,
      itemName: req.item_name,
      currentStock: 0, lowStockThreshold: 0,
      alertDate: req.createdAt,
      status: req.status,
      quantity: req.quantity,
      unit: req.unit,
      notes: req.notes ?? null,
    }));
    return [...restockAlerts, ...manualAlerts];
  }

  static async getGlobalStats(branchId?: number) {
    const orderWhere = branchId ? { branch_id: branchId } : {};
    const totalSales = await prisma.order.aggregate({
      _sum: { total_amount: true },
      where: { status: 'PAID', ...orderWhere },
    });
    const totalOrders = await prisma.order.count({ where: orderWhere });
    const totalCustomers = branchId
      ? (await prisma.order.findMany({
          where: { ...orderWhere, customer_id: { not: null } },
          select: { customer_id: true },
          distinct: ['customer_id'],
        })).length
      : await prisma.user.count({ where: { role: 'CUSTOMER' } });
    const totalBranches = branchId ? 1 : await prisma.branch.count();

    return {
      totalSales: totalSales._sum.total_amount || 0,
      totalOrders,
      totalCustomers,
      totalBranches,
    };
  }
}
