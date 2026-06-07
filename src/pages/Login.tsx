import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Lock, Mail, User } from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';
import { UserRole } from '../types/index';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loginAsGuest } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Simulated authentication (replace with actual backend call)
    const mockUsers: Array<{ id: string; email: string; role: UserRole; firstName: string; lastName: string; }> = [
      { 
        id: '1', 
        email: 'admin@steakz.com', 
        role: 'ADMIN', 
        firstName: 'Admin', 
        lastName: 'User' 
      },
      { 
        id: '2', 
        email: 'manager@steakz.com', 
        role: 'HQ_MANAGER', 
        firstName: 'Manager', 
        lastName: 'User' 
      },
      { 
        id: '3', 
        email: 'waiter@steakz.com', 
        role: 'WAITER', 
        firstName: 'Waiter', 
        lastName: 'User' 
      }
    ];

    const user = mockUsers.find(u => u.email === email);

    if (user && password.length >= 6) {
      // Simulated token generation
      const token = `token_${Math.random().toString(36).substring(2)}`;
      login(token, user);
      navigate('/dashboard');
    } else {
      toast.error('Invalid Login', {
        description: 'Please check your email and password'
      });
    }
  };

  const handleGuestLogin = () => {
    loginAsGuest();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <AnimatedBackground />
      <div className="bg-white bg-opacity-90 p-8 rounded-xl shadow-2xl w-96 z-10 relative">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">STEAKZ</h1>
          <p className="text-gray-600">Restaurant Management System</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="email" 
              placeholder="Email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition"
          >
            Login
          </button>
        </form>
        <div className="mt-4 text-center">
          <button 
            onClick={handleGuestLogin}
            className="text-sm text-gray-600 hover:text-orange-500 transition flex items-center justify-center w-full"
          >
            <User className="mr-2" size={16} /> Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;