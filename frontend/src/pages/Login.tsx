import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Lock, Mail, ArrowLeft } from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';
import api from '../api/axiosConfig';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, token } = response.data;
      login(token, user);
      navigate('/dashboard');
    } catch {
      toast.error('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <AnimatedBackground />
      <div className="bg-white bg-opacity-95 p-8 rounded-2xl shadow-2xl w-96 z-10 relative">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-red-600 mb-1">Steakz</h1>
          <p className="text-gray-500 text-sm">Sign in to track your orders</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 text-sm"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white py-2.5 rounded-lg font-semibold transition"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="mt-5 space-y-3 text-center text-sm">
          <p className="text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-red-600 font-medium hover:underline">
              Create one
            </Link>
          </p>
          <Link
            to="/"
            className="flex items-center justify-center gap-1.5 text-gray-400 hover:text-gray-600 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Menu
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
