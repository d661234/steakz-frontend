import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  User as UserIcon, 
  Settings, 
  LogOut, 
  Menu as MenuIcon 
} from 'lucide-react';

const UserMenu: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="relative">
        <button 
          onClick={toggleMenu}
          className="flex items-center justify-center w-10 h-10 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition"
        >
          <UserIcon size={20} />
        </button>

      {isMenuOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white shadow-lg rounded-lg border z-50">
          <div className="p-4 border-b flex items-center">
            <UserIcon className="mr-3 text-orange-500" />
            <div>
              <p className="font-semibold">{user?.firstName || user?.email}</p>
              <p className="text-sm text-gray-500">{user?.role}</p>
            </div>
          </div>
          <div className="py-1">
            <button 
              onClick={() => {
                navigate('/settings');
                setIsMenuOpen(false);
              }}
              className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 transition"
            >
              <Settings className="mr-3 text-gray-600" size={18} />
              System Settings
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 transition text-red-500"
            >
              <LogOut className="mr-3" size={18} />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default UserMenu;