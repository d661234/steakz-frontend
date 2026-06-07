import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Lock, Mail, UserPlus } from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';
import api from '../api/axiosConfig';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('CUSTOMER');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords must match');
      return;
    }

    try {
      await api.post('/auth/register', {
        email,
        password,
        role,
      });

      toast.success('Registration successful');
      navigate('/login');
    } catch (error: unknown) {
      toast.error('Registration failed', {
        description: error instanceof Error ? error.message : 'Unable to register',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <AnimatedBackground />
      <div className="bg-white bg-opacity-90 p-8 rounded-xl shadow-2xl w-96 z-10 relative">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Create your account</h1>
          <p className="text-gray-600">Register as a customer or open-access user</p>
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
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block mb-2 text-gray-700">Account Type</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="CUSTOMER">Customer</option>
              <option value="OPEN_ACCESS">Open Access</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition"
          >
            Register
          </button>
        </form>
        <div className="mt-4 text-center">
          <Link to="/login" className="text-sm text-gray-600 hover:text-orange-500 transition flex items-center justify-center w-full">
            <UserPlus className="mr-2" size={16} /> Already have an account? Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
