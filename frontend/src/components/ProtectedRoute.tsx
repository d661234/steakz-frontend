import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ProtectedRouteProps } from '../types/index';
import { toast } from 'sonner';

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = []
}) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles.length > 0 && user) {
    const hasRequiredRole = requiredRoles.includes(user.role);

    if (!hasRequiredRole) {
      toast.error('Insufficient Permissions', {
        description: 'You do not have permission to access this page.'
      });
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;