import { ReactNode } from 'react';

export type UserRole =
  | 'CUSTOMER'
  | 'WAITER'
  | 'CHEF'
  | 'BRANCH_MANAGER'
  | 'HQ_MANAGER'
  | 'ADMIN';

export interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: UserRole[];
}

export interface LoaderProps {
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// Alias for backward compatibility
export type Role = UserRole;