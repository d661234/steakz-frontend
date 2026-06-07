import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { UserService } from '../services/userService.js';
import { RoleService } from '../services/roleService.js';

export class AdminController {
  static async getAllUsers(req: Request, res: Response) {
    try {
      const users = await UserService.getAllUsers();
      res.status(200).json(users);
    } catch (error: unknown) {
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  }

  static async getUserById(req: Request, res: Response) {
    try {
      const user = await UserService.getUserById(req.params.id as string);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(200).json(user);
    } catch (error: unknown) {
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  }

  static async updateUser(req: Request, res: Response) {
    try {
      const user = await UserService.updateUser(req.params.id as string, req.body);
      res.status(200).json(user);
    } catch (error: unknown) {
      res.status(500).json({ message: 'Failed to update user' });
    }
  }

  static async deleteUser(req: Request, res: Response) {
    try {
      await UserService.deleteUser(req.params.id as string);
      res.status(204).send();
    } catch (error: unknown) {
      res.status(500).json({ message: 'Failed to delete user' });
    }
  }

  static async changeUserRole(req: AuthRequest, res: Response) {
    try {
      const userId = req.params.id as string;
      const { role } = req.body;

      if (!role) {
        return res.status(400).json({ message: 'Role is required' });
      }

      const adminId = req.user?.id;
      if (!adminId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const updatedUser = await RoleService.changeUserRole(adminId, userId, role);
      res.status(200).json(updatedUser);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to change user role';
      res.status(500).json({ message });
    }
  }

  static async deactivateUser(req: AuthRequest, res: Response) {
    try {
      const userId = req.params.id as string;
      const adminId = req.user?.id;

      if (!adminId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const updatedUser = await RoleService.deactivateUser(adminId, userId);
      res.status(200).json(updatedUser);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to deactivate user';
      res.status(500).json({ message });
    }
  }

  static async getUserActivitySummary(req: Request, res: Response) {
    try {
      const summary = await RoleService.getUserActivitySummary();
      res.status(200).json(summary);
    } catch (error: unknown) {
      res.status(500).json({ message: 'Failed to fetch user activity summary' });
    }
  }

  static async getUserAuditLog(req: Request, res: Response) {
    try {
      const auditEntries = await RoleService.getRoleChangeAudit();
      res.status(200).json(auditEntries);
    } catch (error: unknown) {
      res.status(500).json({ message: 'Failed to fetch user audit log' });
    }
  }
}
