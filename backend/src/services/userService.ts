import prisma from '../lib/prisma.js'; // Import the shared Prisma client singleton for all database operations
import { Prisma, UserRole } from '@prisma/client'; // Import Prisma namespace for typed inputs and UserRole enum for role filtering

export class UserService { // Service class encapsulating all user-related database operations
  static async getAllUsers() { // Returns all users in the system including their branch association
    return prisma.user.findMany({ // Fetch every user record
      include: {
        branch: true, // Include the related branch object so callers know which branch each user belongs to
      },
    });
  }

  static async getStaffMembers() { // Returns only HQ managers, branch managers, and waiters — excludes customers and admins
    return prisma.user.findMany({ // Fetch users matching the role filter
      where: {
        role: {
          in: [UserRole.HQ_MANAGER, UserRole.BRANCH_MANAGER, UserRole.CHEF, UserRole.WAITER], // Limit to staff-level roles only
        },
      },
      include: {
        branch: true, // Include the branch so callers know which branch each staff member is assigned to
      },
    });
  }

  static async getStaffByBranch(branchId: number) {
    return prisma.user.findMany({
      where: {
        branch_id: branchId,
        role: { in: [UserRole.BRANCH_MANAGER, UserRole.CHEF, UserRole.WAITER] },
      },
      include: { branch: true },
    });
  }

  static async getUserById(id: number) { // Returns a single user by their database ID
    return prisma.user.findUnique({ // Find exactly one user by primary key
      where: { id }, // Match the user's integer ID
      include: {
        branch: true, // Include the related branch object for branch context
      },
    });
  }

  static async getFavouriteItems(userId: number) { // Returns the list of menu items a user has saved as favourites
    const user = await prisma.user.findUnique({ // Fetch the user along with their favouriteItems relation
      where: { id: userId }, // Match the user by ID
      include: {
        favouriteItems: true, // Include the many-to-many favourites relation (list of MenuItem records)
      },
    });

    return user?.favouriteItems ?? []; // Return the favourites array or an empty array if the user was not found
  }

  static async addFavouriteItem(userId: number, itemId: number) { // Adds a menu item to the user's favourites list
    return prisma.user.update({ // Update the user record via a nested relation operation
      where: { id: userId }, // Target the specific user
      data: {
        favouriteItems: {
          connect: { id: itemId }, // Connect the menu item to the favouriteItems relation (many-to-many)
        },
      },
      include: {
        favouriteItems: true, // Return the updated favourites list in the response
      },
    });
  }

  static async removeFavouriteItem(userId: number, itemId: number) { // Removes a menu item from the user's favourites list
    return prisma.user.update({ // Update the user record via a nested relation operation
      where: { id: userId }, // Target the specific user
      data: {
        favouriteItems: {
          disconnect: { id: itemId }, // Disconnect the menu item from the favouriteItems relation (many-to-many)
        },
      },
      include: {
        favouriteItems: true, // Return the updated favourites list in the response
      },
    });
  }

  static async getUserByEmail(email: string) { // Returns a single user matched by their unique email address
    return prisma.user.findUnique({ // Find exactly one user by the unique email field
      where: { email }, // Match by email
    });
  }

  static async assignStaffToBranch(staffId: number, branchId: number) { // Updates a staff member's branch association
    return prisma.user.update({ // Update the user record with the new branch ID
      where: { id: staffId }, // Target the staff member by ID
      data: {
        branch_id: branchId, // Set the new branch association
      },
      include: {
        branch: true, // Return the full branch object to confirm the assignment
      },
    });
  }

  static async createUser(data: Prisma.UserCreateInput) { // Creates a new user with arbitrary input (used by admin panel)
    return prisma.user.create({ // Persist the new user to the database
      data, // Pass through all fields provided by the caller
    });
  }

  static async updateUser(id: number, data: Prisma.UserUpdateInput) { // Updates a user's fields by ID
    return prisma.user.update({ // Perform the update operation
      where: { id }, // Target the user by their integer ID
      data, // Apply the provided field changes
      include: { branch: true }, // Return the updated user with their branch for context
    });
  }

  static async deleteUser(id: number) { // Permanently deletes a user by ID
    return prisma.user.delete({ // Remove the user record from the database
      where: { id }, // Target the user by their integer ID
    });
  }
}
