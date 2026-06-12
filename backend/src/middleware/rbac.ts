import { UserRole } from '@prisma/client'; // Import the UserRole enum to use as keys in the permissions map
import { Request, Response, NextFunction } from 'express'; // Import Express types for middleware function signatures
import { AuthRequest } from './auth.js'; // Import the extended request type that carries the authenticated user payload

// Define permission mappings
const ROLE_PERMISSIONS: Record<UserRole, string[]> = { // Map every role to an array of permission strings it is allowed to perform
  [UserRole.OPEN_ACCESS]: [ // Permissions for unauthenticated or public-access users
    'browse_branches', // Can view list of restaurant branches
    'search_menu_items', // Can search for items on the menu
    'view_menu_prices', // Can see the prices of menu items
    'read_restaurant_info' // Can read general restaurant information
  ],
  [UserRole.CUSTOMER]: [ // Permissions for registered and logged-in customers
    'browse_branches', // Can view list of restaurant branches
    'search_menu_items', // Can search for items on the menu
    'view_menu_prices', // Can see the prices of menu items
    'read_restaurant_info', // Can read general restaurant information
    'register_account', // Can create a new customer account
    'browse_menu', // Can browse the full menu
    'place_order', // Can place a new food order
    'view_order_history', // Can view their past orders
    'save_favourite_items', // Can save menu items as favourites
    'confirm_payment', // Can confirm payment for their order
    'reorder_previous_order', // Can reorder from a previous order with one click
    'get_recommendations' // Can receive personalised menu recommendations
  ],
  [UserRole.WAITER]: [ // Permissions for floor staff who take and manage orders
    'browse_branches', // Can view list of restaurant branches
    'search_menu_items', // Can search for items on the menu
    'view_menu_prices', // Can see the prices of menu items
    'read_restaurant_info', // Can read general restaurant information
    'view_new_orders', // Can see incoming orders for their branch
    'update_order_status', // Can change the status of an order (e.g. COOKING → SERVED)
    'mark_order_completed', // Can mark an order as finished
    'view_order_details' // Can view the full details of a specific order
  ],
  [UserRole.CHEF]: [ // Permissions for kitchen staff who prepare orders
    'browse_branches', // Can view list of restaurant branches
    'view_menu_prices', // Can see the prices of menu items
    'read_restaurant_info', // Can read general restaurant information
    'view_new_orders', // Can see incoming orders for their branch
    'update_order_status', // Can move orders through cooking stages (PLACED → COOKING → FINISHED_COOKING)
    'mark_order_completed', // Can mark cooking as finished
    'view_order_details', // Can view the full details of a specific order
    'view_complete_menu' // Can view the full internal menu to know what they are preparing
  ],
  [UserRole.BRANCH_MANAGER]: [ // Permissions for managers who run a single branch
    'browse_branches', // Can view list of restaurant branches
    'search_menu_items', // Can search for items on the menu
    'view_menu_prices', // Can see the prices of menu items
    'read_restaurant_info', // Can read general restaurant information
    'view_new_orders', // Can see incoming orders for their branch
    'update_order_status', // Can change the status of an order
    'mark_order_completed', // Can mark an order as finished
    'view_order_details', // Can view the full details of a specific order
    'add_menu_items', // Can add new items to their branch menu
    'edit_menu_items', // Can update existing menu items
    'remove_menu_items', // Can delete menu items from their branch
    'view_complete_menu', // Can view the full internal menu including unavailable items
    'view_low_stock_alerts' // Can see inventory alerts for their branch
  ],
  [UserRole.HQ_MANAGER]: [ // Permissions for headquarters managers who oversee all branches
    'browse_branches', // Can view list of restaurant branches
    'search_menu_items', // Can search for items on the menu
    'view_menu_prices', // Can see the prices of menu items
    'read_restaurant_info', // Can read general restaurant information
    'view_all_orders', // Can view orders across all branches
    'generate_sales_summary', // Can generate sales reports per branch
    'identify_peak_times', // Can access peak order time analytics
    'view_customer_frequency', // Can view how often customers order
    'assign_staff_to_branches', // Can assign staff members to specific branches
    'view_most_viewed_items', // Can see which menu items get the most views
    'compare_branch_performance' // Can compare performance metrics across branches
  ],
  [UserRole.ADMIN]: [ // Permissions for system administrators with full access
    'browse_branches', // Can view list of restaurant branches
    'search_menu_items', // Can search for items on the menu
    'view_menu_prices', // Can see the prices of menu items
    'read_restaurant_info', // Can read general restaurant information
    'create_branches', // Can create new restaurant branches
    'deactivate_user_accounts', // Can deactivate any user account
    'assign_user_roles', // Can change the role of any user
    'view_system_activity', // Can view system-wide activity summaries
    'remove_inactive_branches', // Can delete inactive or closed branches
    'audit_role_changes', // Can view the audit log of all role changes
    'view_all_orders', // Can view orders across all branches
    'generate_sales_summary' // Can generate sales reports per branch
  ]
};

export function checkPermission(requiredPermission: string) { // Factory that returns middleware enforcing a specific permission string
  return (req: AuthRequest, res: Response, next: NextFunction) => { // The returned middleware has access to the request carrying the authenticated user
    const userRole = req.user?.role; // Read the user's role from the JWT payload attached by authenticateJWT

    if (!userRole) { // No role means the user was not authenticated
      return res.status(401).json({ error: 'Unauthorized' }); // 401 Unauthorized — request must be authenticated first
    }

    const rolePermissions = ROLE_PERMISSIONS[userRole]; // Look up all permissions the user's role is allowed

    if (rolePermissions && rolePermissions.includes(requiredPermission)) { // Check if the required permission is in the role's permission list
      next(); // Permission granted — pass control to the next handler
    } else {
      res.status(403).json({ // Permission denied — user is authenticated but not allowed this action
        error: 'Insufficient permissions', // Human-readable error message
        requiredPermission, // Echo which permission was required, for debugging
        userRole // Echo the user's role, for debugging
      });
    }
  };
}

export function authorize(allowedRoles: UserRole[]) { // Factory that returns middleware restricting access to a set of roles
  return (req: AuthRequest, res: Response, next: NextFunction) => { // The returned middleware checks the user's role against the allowed list
    const userRole = req.user?.role; // Read the user's role from the JWT payload

    if (!userRole) { // No role means the request was not authenticated
      return res.status(401).json({ error: 'Unauthorized' }); // 401 Unauthorized — must log in first
    }

    if (allowedRoles.includes(userRole)) { // Check if the user's role is in the allowed list for this route
      next(); // Role is allowed — continue to the route handler
    } else {
      res.status(403).json({ // Role is not in the allowed list — access denied
        error: 'Insufficient permissions', // Human-readable error message
        allowedRoles, // Echo which roles are permitted, for debugging
        userRole // Echo the user's actual role, for debugging
      });
    }
  };
}

export function getRolePermissions(role: UserRole): string[] { // Utility that returns the full permission list for a given role
  return ROLE_PERMISSIONS[role] || []; // Return the permission array, or empty array if the role has no entry
}
