import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import Loader from '../components/Loader';
import ErrorBoundary from '../components/ErrorBoundary';
import MainLayout from '@/components/MainLayout';

const Home = lazy(() => import('../pages/Home').then(module => ({ default: module.default })));
const Login = lazy(() => import('../pages/Login').then(module => ({ default: module.default })));
const Dashboard = lazy(() => import('../pages/Dashboard').then(module => ({ default: module.default })));
const AdminUsers = lazy(() => import('../pages/AdminUsers').then(module => ({ default: module.default })));
const Branches = lazy(() => import('../pages/Branches').then(module => ({ default: module.default })));
const MenuManagement = lazy(() => import('../pages/MenuManagement').then(module => ({ default: module.default })));
const Orders = lazy(() => import('../pages/Orders').then(module => ({ default: module.default })));
const Reports = lazy(() => import('../pages/Reports').then(module => ({ default: module.default })));
const Recommendations = lazy(() => import('../pages/Recommendations').then(module => ({ default: module.default })));
const Settings = lazy(() => import('../pages/Settings').then(module => ({ default: module.default })));
const Register = lazy(() => import('../pages/Register').then(module => ({ default: module.default })));
const RestockOrders = lazy(() => import('../pages/RestockOrders').then(module => ({ default: module.default })));

const AppRoutes: React.FC = () => {
  const handleRouteError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('Route-level error:', error, errorInfo);
  };

  return (
    <ErrorBoundary onError={handleRouteError}>
      <Suspense fallback={<Loader fullScreen />}>
        <Routes>
          {/* Public landing page — no layout wrapper */}
          <Route path="/" element={
            <ErrorBoundary>
              <Home />
            </ErrorBoundary>
          } />

          <Route path="/login" element={
            <ErrorBoundary>
              <Login />
            </ErrorBoundary>
          } />

          <Route path="/register" element={
            <ErrorBoundary>
              <Register />
            </ErrorBoundary>
          } />

          {/* All authenticated pages share the sidebar layout */}
          <Route element={<MainLayout />}>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <Dashboard />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requiredRoles={['ADMIN']}>
                  <ErrorBoundary>
                    <AdminUsers />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/branches"
              element={
                <ProtectedRoute requiredRoles={['BRANCH_MANAGER', 'HQ_MANAGER', 'ADMIN']}>
                  <ErrorBoundary>
                    <Branches />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/menu"
              element={
                <ProtectedRoute requiredRoles={['CHEF', 'HQ_MANAGER', 'ADMIN', 'WAITER', 'CUSTOMER']}>
                  <ErrorBoundary>
                    <MenuManagement />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute requiredRoles={['HQ_MANAGER', 'ADMIN', 'WAITER', 'CHEF', 'BRANCH_MANAGER', 'CUSTOMER']}>
                  <ErrorBoundary>
                    <Orders />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute requiredRoles={['HQ_MANAGER', 'ADMIN', 'BRANCH_MANAGER']}>
                  <ErrorBoundary>
                    <Reports />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/recommendations"
              element={
                <ProtectedRoute requiredRoles={['CUSTOMER', 'ADMIN']}>
                  <ErrorBoundary>
                    <Recommendations />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute requiredRoles={['ADMIN']}>
                  <ErrorBoundary>
                    <Settings />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/restock"
              element={
                <ProtectedRoute requiredRoles={['BRANCH_MANAGER', 'ADMIN', 'HQ_MANAGER']}>
                  <ErrorBoundary>
                    <RestockOrders />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback — go to home page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

export default AppRoutes;
