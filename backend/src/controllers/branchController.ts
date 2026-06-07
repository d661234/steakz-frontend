import { Request, Response } from 'express';
import { BranchService } from '../services/branchService.js';
import { MenuService } from '../services/menuService.js';

export class BranchController {
  // Branch Operations
  static async getAllBranches(req: Request, res: Response) {
    try {
      const branches = await BranchService.getAllBranches();
      res.status(200).json(branches);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch branches' });
    }
  }

  static async getPublicBranches(req: Request, res: Response) {
    try {
      const branches = await BranchService.getPublicBranches();
      res.status(200).json(branches);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch public branches' });
    }
  }

  static async getPublicMenuByBranch(req: Request, res: Response) {
    try {
      const menu = await BranchService.getPublicMenuByBranch(req.params.branchId as string);
      res.status(200).json(menu);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch public menu' });
    }
  }

  static async getBranchById(req: Request, res: Response) {
    try {
      const branch = await BranchService.getBranchById(req.params.id as string);
      if (!branch) return res.status(404).json({ message: 'Branch not found' });
      res.status(200).json(branch);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch branch' });
    }
  }

  static async createBranch(req: Request, res: Response) {
    try {
      const branch = await BranchService.createBranch(req.body);
      res.status(201).json(branch);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create branch' });
    }
  }

  static async updateBranch(req: Request, res: Response) {
    try {
      const branch = await BranchService.updateBranch(req.params.id as string, req.body);
      res.status(200).json(branch);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update branch' });
    }
  }

  static async deleteBranch(req: Request, res: Response) {
    try {
      await BranchService.deleteBranch(req.params.id as string);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete branch' });
    }
  }

  // Menu Operations
  static async getMenuByBranch(req: Request, res: Response) {
    try {
      const menu = await MenuService.getMenuByBranch(req.params.branchId as string);
      res.status(200).json(menu);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch menu' });
    }
  }

  static async createMenuItem(req: Request, res: Response) {
    try {
      const menuItem = await MenuService.createMenuItem({
        ...req.body,
        branch_id: req.params.branchId as string
      });
      res.status(201).json(menuItem);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create menu item' });
    }
  }

  static async updateMenuItem(req: Request, res: Response) {
    try {
      const menuItem = await MenuService.updateMenuItem(req.params.id as string, req.body);
      res.status(200).json(menuItem);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update menu item' });
    }
  }

  static async deleteMenuItem(req: Request, res: Response) {
    try {
      await MenuService.deleteMenuItem(req.params.id as string);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete menu item' });
    }
  }
}
