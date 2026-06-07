import React, { useState } from 'react';
import { 
  Users, 
  ShoppingCart, 
  BarChart2, 
  Settings, 
  Truck, 
  Star 
} from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';
import InteractiveCard from '../components/InteractiveCard';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types/index';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  const dashboardCards = [
    {
      title: 'User Management',
      description: 'Manage and track user roles and permissions',
      icon: <Users className="w-8 h-8 text-blue-500" />,
      roles: ['ADMIN', 'HQ_MANAGER'],
      route: '/admin/users'
    },
    {
      title: 'Order Tracking',
      description: 'Monitor and manage current and past orders',
      icon: <ShoppingCart className="w-8 h-8 text-green-500" />,
      roles: ['BRANCH_MANAGER', 'WAITER', 'HQ_MANAGER', 'ADMIN'],
      route: '/orders'
    },
    {
      title: 'Branch Analytics',
      description: 'Detailed insights and performance metrics',
      icon: <BarChart2 className="w-8 h-8 text-purple-500" />,
      roles: ['HQ_MANAGER', 'ADMIN'],
      route: '/reports'
    },
    {
      title: 'Branch Management',
      description: 'Manage branch details and configurations',
      icon: <Truck className="w-8 h-8 text-orange-500" />,
      roles: ['BRANCH_MANAGER', 'HQ_MANAGER', 'ADMIN'],
      route: '/branches'
    },
    {
      title: 'Recommendations',
      description: 'Review personalised dish recommendations',
      icon: <Star className="w-8 h-8 text-yellow-500" />,
      roles: ['CUSTOMER', 'ADMIN'],
      route: '/recommendations'
    },
    {
      title: 'System Settings',
      description: 'Configure system-wide settings and preferences',
      icon: <Settings className="w-8 h-8 text-gray-500" />,
      roles: ['ADMIN', 'HQ_MANAGER'],
      route: '/settings'
    }
  ];

  const filteredCards = dashboardCards.filter(card => 
    user?.role && card.roles.includes(user.role)
  );

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <div className="container mx-auto px-4 py-8 relative z-10">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">
          Welcome, {user?.firstName || user?.email || 'User'}
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCards.map((card, index) => (
            <InteractiveCard 
              key={index}
              title={card.title}
              description={card.description}
              icon={card.icon}
              onClick={() => {
                setSelectedCard(card.title);
                navigate(card.route);
              }}
            />
          ))}
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Quick Insights</h2>
            <ul className="space-y-4 text-gray-700">
              <li className="flex items-center justify-between border-b border-gray-200 pb-3">
                <span>Active branches</span>
                <strong>12</strong>
              </li>
              <li className="flex items-center justify-between border-b border-gray-200 pb-3">
                <span>Pending orders</span>
                <strong>34</strong>
              </li>
              <li className="flex items-center justify-between border-b border-gray-200 pb-3">
                <span>Staff on shift</span>
                <strong>27</strong>
              </li>
              <li className="flex items-center justify-between pt-3">
                <span>Weekly revenue</span>
                <strong>$24.3k</strong>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Team Status</h2>
            <p className="text-gray-600">You have full access to branch, order, and reports management from your dashboard. Use the cards above to navigate directly to the tools you need.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;