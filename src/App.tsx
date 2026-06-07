import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import ErrorBoundary from './components/ErrorBoundary';
import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './context/AuthContext';
import UserMenu from './components/UserMenu';
import { useAuth } from './context/AuthContext';

const AppContent: React.FC = () => {
  const { user } = useAuth();

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <AppRoutes />
      </div>
      <Toaster 
        position="top-right" 
        richColors 
        closeButton 
        duration={3000} 
      />
      {user && <UserMenu />}
    </>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;