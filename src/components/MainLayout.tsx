import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, LogOut, Store, Menu as MenuIcon, ShoppingBag, BarChart3, Users } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/', roles: [] },
    { label: 'Users', icon: Users, path: '/admin/users', roles: ['ADMIN'] },
    { label: 'Branches', icon: Store, path: '/branches', roles: ['ADMIN', 'HQ_MANAGER'] },
    { label: 'Orders', icon: ShoppingBag, path: '/orders', roles: ['WAITER', 'BRANCH_MANAGER', 'ADMIN', 'HQ_MANAGER'] },
    { label: 'Reports', icon: BarChart3, path: '/reports', roles: ['HQ_MANAGER', 'ADMIN'] },
  ];

  const filteredNavItems = navItems.filter(item => 
    item.roles.length === 0 || (user && item.roles.includes(user.role))
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary-600">Steakz MIS</h1>
        </div>
        <nav className="mt-6">
          {filteredNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center px-6 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
            >
              <item.icon className="w-5 h-5 mr-3" />
              <span>{item.label}</span>
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-6 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors mt-auto"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Welcome, {user?.email}</h2>
          <div className="flex items-center space-x-4">
            <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium uppercase">
              {user?.role}
            </span>
          </div>
        </header>
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
