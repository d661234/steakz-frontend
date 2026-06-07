import { Response } from 'express';
import { UserRole } from '@prisma/client';
import { OrderService } from '../services/orderService.js';
import { AuthRequest } from '../middleware/auth.js';

export class OrderController {
  static async getAllOrders(req: AuthRequest, res: Response) {
    try {
      // If branch manager or waiter, filter by their branch
      const where = req.user?.branch_id ? { branch_id: req.user.branch_id } : {};
      const orders = await OrderService.getAllOrders(where);
      res.status(200).json(orders);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch orders' });
    }
  }

  static async getOrderById(req: AuthRequest, res: Response) {
    try {
      const order = await OrderService.getOrderById(req.params.id as string);
      if (!order) return res.status(404).json({ message: 'Order not found' });
      
      // Access control: only allow if same branch or admin or owner
      if (req.user?.branch_id && order.branch_id !== req.user.branch_id) {
        return res.status(403).json({ message: 'Forbidden: Order belongs to another branch' });
      }

      res.status(200).json(order);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch order' });
    }
  }

  static async createOrder(req: AuthRequest, res: Response) {
    try {
      const order = await OrderService.createOrder({
        ...req.body,
        customer_id: req.user?.role === 'CUSTOMER' ? req.user.id : req.body.customer_id
      });
      res.status(201).json(order);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create order' });
    }
  }

  static async updateStatus(req: AuthRequest, res: Response) {
    try {
      const { status } = req.body;
      const order = await OrderService.updateOrderStatus(req.params.id as string, status);
      res.status(200).json(order);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update order status' });
    }
  }

  static async confirmPayment(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

      const order = await OrderService.getOrderById(req.params.id as string);
      if (!order) return res.status(404).json({ message: 'Order not found' });

      if (req.user.role === UserRole.CUSTOMER && order.customer_id !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden: Order does not belong to customer' });
      }

      const updatedOrder = await OrderService.confirmOrderPayment(req.params.id as string);
      res.status(200).json(updatedOrder);
    } catch (error) {
      res.status(500).json({ message: 'Failed to confirm payment' });
    }
  }
}
