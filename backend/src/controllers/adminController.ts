import { Request, Response } from 'express'; // Import Express types for request and response objects
import bcrypt from 'bcryptjs'; // Import bcrypt to hash passwords when creating users through the admin panel
import { AuthRequest } from '../middleware/auth.js'; // Import the extended request type carrying the authenticated user
import { UserService } from '../services/userService.js'; // Import UserService for CRUD operations on user records
import { RoleService } from '../services/roleService.js'; // Import RoleService for role changes and audit log operations
import { UserRole } from '@prisma/client'; // Import the UserRole enum for role validation
import { Prisma } from '@prisma/client'; // Import Prisma namespace for typed update inputs and error types

const id = (p: string | string[]) => parseInt(p as string); // Helper that converts a URL param (always string) to an integer ID

export class AdminController { // Controller class grouping all admin-panel user management handlers
  static async createUser(req: Request, res: Response) { // Handles POST /api/admin/users — admin creates a new user
    try {
      const { email, password, role, firstName, lastName, branch_id } = req.body; // Destructure user fields from the request body
      if (!email || !password || !role) { // Validate the three required fields are present
        return res.status(400).json({ message: 'Email, password and role are required' }); // 400 Bad Request — cannot create user without these fields
      }
      if (!Object.values(UserRole).includes(role as UserRole)) { // Verify the provided role is a valid UserRole enum value
        return res.status(400).json({ message: 'Invalid role' }); // 400 Bad Request — reject unknown roles
      }
      const password_hash = await bcrypt.hash(password, 10); // Hash the plain-text password before storing it
      const user = await UserService.createUser({ // Delegate to UserService to persist the new user
        email, // Store the provided email address
        password_hash, // Store the hashed password (never plain text)
        role: role as UserRole, // Cast the validated role string to the enum type
        firstName: firstName || null, // Store first name or null if not provided
        lastName: lastName || null, // Store last name or null if not provided
        ...(branch_id ? { branch: { connect: { id: parseInt(branch_id) } } } : {}), // Connect to a branch if branch_id was given, otherwise omit
      });
      const { password_hash: _p, ...safe } = user; // Strip the password hash from the returned user object
      res.status(201).json(safe); // 201 Created — return the new user record without the password
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') { // P2002 is Prisma's unique constraint violation code
        return res.status(409).json({ message: 'A user with that email already exists' }); // 409 Conflict — email must be unique
      }
      const message = error instanceof Error ? error.message : 'Failed to create user'; // Extract error message safely
      res.status(500).json({ message }); // 500 Internal Server Error — unexpected failure
    }
  }

  static async getAllUsers(_req: Request, res: Response) { // Handles GET /api/admin/users — returns all users in the system
    try {
      const users = await UserService.getAllUsers(); // Fetch all users including their branch associations
      res.status(200).json(users); // 200 OK — return the full list of users
    } catch (error: unknown) {
      res.status(500).json({ message: 'Failed to fetch users' }); // 500 Internal Server Error — database query failed
    }
  }

  static async getUserById(req: Request, res: Response) { // Handles GET /api/admin/users/:id — returns a single user by ID
    try {
      const user = await UserService.getUserById(id(req.params.id)); // Fetch the user record for the given ID
      if (!user) { // User with that ID does not exist in the database
        return res.status(404).json({ message: 'User not found' }); // 404 Not Found — no user matches this ID
      }
      res.status(200).json(user); // 200 OK — return the found user record
    } catch (error: unknown) {
      res.status(500).json({ message: 'Failed to fetch user' }); // 500 Internal Server Error — database query failed
    }
  }

  static async updateUser(req: Request, res: Response) { // Handles PUT /api/admin/users/:id — updates user fields
    try {
      const { firstName, lastName, email, role, branch_id } = req.body; // Destructure only the fields that can be updated

      const data: Prisma.UserUpdateInput = { // Build a Prisma update object including only the fields that were sent
        ...(firstName !== undefined && { firstName }), // Include firstName only if it was explicitly sent
        ...(lastName  !== undefined && { lastName }), // Include lastName only if it was explicitly sent
        ...(email     !== undefined && { email }), // Include email only if it was explicitly sent
        ...(role      !== undefined && { role: role as UserRole }), // Include role only if it was explicitly sent
        ...(branch_id !== undefined && ( // Branch assignment is conditional on whether branch_id was sent
          branch_id
            ? { branch: { connect: { id: parseInt(branch_id) } } } // Connect to the provided branch ID
            : { branch: { disconnect: true } } // Disconnect from any branch if branch_id is falsy/null
        )),
      };

      const user = await UserService.updateUser(id(req.params.id), data); // Persist the update via UserService
      const { password_hash: _p, ...safe } = user; // Strip password hash from the response
      res.status(200).json(safe); // 200 OK — return the updated user without the password
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return res.status(409).json({ message: 'That email is already in use by another account' });
      }
      res.status(500).json({ message: 'Failed to update user' });
    }
  }

  static async deleteUser(req: Request, res: Response) { // Handles DELETE /api/admin/users/:id — permanently removes a user
    try {
      await UserService.deleteUser(id(req.params.id)); // Delete the user record from the database
      res.status(200).json({ message: 'User deleted successfully' }); // 200 OK — confirm deletion
    } catch (error: unknown) {
      res.status(500).json({ message: 'Failed to delete user' }); // 500 Internal Server Error — deletion failed
    }
  }

  static async changeUserRole(req: AuthRequest, res: Response) { // Handles PATCH /api/admin/users/:id/role — changes a user's role with audit logging
    try {
      const userId = id(req.params.id); // Parse the target user's ID from the URL param
      const { role } = req.body; // Extract the new role from the request body

      if (!role) { // Validate that a role was provided
        return res.status(400).json({ message: 'Role is required' }); // 400 Bad Request — cannot change role without specifying a new one
      }

      const adminId = req.user?.id; // Get the ID of the admin making this change from the JWT payload
      if (!adminId) { // No user on the request means authentication was bypassed — should not happen with middleware
        return res.status(401).json({ message: 'Unauthorized' }); // 401 Unauthorized — no authenticated admin
      }

      const updatedUser = await RoleService.changeUserRole(adminId, userId, role); // Delegate to RoleService which also writes the audit log entry
      const { password_hash: _p, ...safe } = updatedUser; // Strip password hash from the response
      res.status(200).json(safe); // 200 OK — return the updated user record
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to change user role'; // Extract error message safely
      res.status(500).json({ message }); // 500 Internal Server Error — role change failed
    }
  }

  static async deactivateUser(req: AuthRequest, res: Response) { // Handles PATCH /api/admin/users/:id/deactivate — disables a user account
    try {
      const userId = id(req.params.id); // Parse the target user's ID from the URL param
      const adminId = req.user?.id; // Get the admin's ID from the JWT payload

      if (!adminId) { // Authentication guard — should always be present after JWT middleware
        return res.status(401).json({ message: 'Unauthorized' }); // 401 Unauthorized — no authenticated admin
      }

      await RoleService.deactivateUser(adminId, userId); // Delegate to RoleService which verifies admin privilege and sets isActive to false
      res.status(200).json({ message: 'User deactivated successfully' }); // 200 OK — confirm the account was deactivated
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to deactivate user'; // Extract error message safely
      res.status(500).json({ message }); // 500 Internal Server Error — deactivation failed
    }
  }

  static async getUserActivitySummary(_req: Request, res: Response) { // Handles GET /api/admin/users/activity-summary — returns user count statistics
    try {
      const summary = await RoleService.getUserActivitySummary(); // Fetch total users, active users, and breakdown by role
      res.status(200).json(summary); // 200 OK — return the activity summary object
    } catch (error: unknown) {
      res.status(500).json({ message: 'Failed to fetch user activity summary' }); // 500 Internal Server Error — query failed
    }
  }

  static async getUserAuditLog(_req: Request, res: Response) { // Handles GET /api/admin/users/audit-log — returns all role change history
    try {
      const auditEntries = await RoleService.getRoleChangeAudit(); // Fetch all audit log entries ordered by most recent first
      res.status(200).json(auditEntries); // 200 OK — return the audit log array
    } catch (error: unknown) {
      res.status(500).json({ message: 'Failed to fetch user audit log' }); // 500 Internal Server Error — audit log query failed
    }
  }
}
