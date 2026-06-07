import prisma from '../lib/prisma.js';
import { OrderStatus, Prisma } from '@prisma/client';

export class OrderService {
  static async getAllOrders(where?: Prisma.OrderWhereInput) {
    return prisma.order.findMany({
      where,
      include: {
        branch: true,
        user: true,
      },
      orderBy: { orderDate: 'desc' }
    });
  }

  static async getOrderById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        branch: true,
        user: true,
      },
    });
  }

  static async createOrder(data: Prisma.OrderUncheckedCreateInput) {
    return prisma.order.create({
      data,
    });
  }

  static async updateOrderStatus(id: string, status: OrderStatus) {
    return prisma.order.update({
      where: { id },
      data: { status },
    });
  }

  static async confirmOrderPayment(id: string) {
    return prisma.order.update({
      where: { id },
      data: { status: 'PAID' },
    });
  }

  static async getOrdersByCustomer(customerId: string) {
    return prisma.order.findMany({
      where: { customer_id: customerId },
      include: {
        branch: true,
      },
      orderBy: { orderDate: 'desc' }
    });
  }

  static async deleteOrder(id: string) {
    return prisma.order.delete({
      where: { id },
    });
  }
}
