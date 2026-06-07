import { ReactNode } from 'react';

export type UserRole = 
  | 'OPEN_ACCESS'
  | 'CUSTOMER'
  | 'WAITER'
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