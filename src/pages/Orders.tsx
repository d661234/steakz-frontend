import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, Plus, Edit, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/axiosConfig';

interface Branch {
  id: string;
  name: string;
}

interface OrderItem {
  id: string;
  menuItem: { item_name: string };
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  branch: Branch;
  user?: { firstName?: string; lastName?: string; email: string };
  status: string;
  total_amount: number;
  items: OrderItem[];
}

const Orders: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');
  const [amount, setAmount] = useState('');

  const canManageStatus = ['WAITER', 'BRANCH_MANAGER', 'ADMIN'].includes(user?.role || '');
  const canCreateOrder = ['CUSTOMER', 'WAITER', 'ADMIN'].includes(user?.role || '');

  const fetchOrders = async () => {
    try {
      const endpoint = user?.role === 'CUSTOMER' ? '/customer/orders' : '/orders';
      const response = await api.get(endpoint);
      setOrders(response.data || []);
    } catch (error: unknown) {
      toast.error('Failed to load orders');
    }
  };

  const fetchBranches = async () => {
    try {
      if (user?.role === 'CUSTOMER') {
        const response = await api.get('/branches/public');
        setBranches(response.data || []);
      } else if (user?.role === 'ADMIN' || user?.role === 'HQ_MANAGER') {
        const response = await api.get('/branches');
        setBranches(response.data || []);
      } else if (user?.role === 'WAITER' || user?.role === 'BRANCH_MANAGER') {
        if (user.branch_id) {
          setBranches([{ id: user.branch_id, name: 'My Branch' }]);
          setSelectedBranchId(user.branch_id);
        }
      }
    } catch (error: unknown) {
      toast.error('Failed to load branches');
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchBranches();
  }, [user]);

  useEffect(() => {
    if (branches.length > 0 && !selectedBranchId) {
      setSelectedBranchId(branches[0].id);
    }
  }, [branches, selectedBranchId]);

  const handleCreateOrder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedBranchId || !amount) {
      toast.error('Branch and amount are required');
      return;
    }

    try {
      const body: Record<string, unknown> = {
        branch_id: selectedBranchId,
        total_amount: parseFloat(amount),
      };

      if (user?.role !== 'CUSTOMER') {
        body.customer_id = user?.id;
      }

      await api.post('/orders', body);
      toast.success('Order created successfully');
      setIsModalOpen(false);
      setAmount('');
      fetchOrders();
    } catch (error: unknown) {
      toast.error('Failed to create order');
    }
  };

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      toast.success('Order status updated');
      fetchOrders();
    } catch (error: unknown) {
      toast.error('Failed to update status');
    }
  };

  const confirmPayment = async (orderId: string) => {
    try {
      await api.patch(`/orders/${orderId}/confirm`);
      toast.success('Payment confirmed');
      fetchOrders();
    } catch (error: unknown) {
      toast.error('Failed to confirm payment');
    }
  };

  const handleReorder = async (orderId: string) => {
    try {
      await api.post(`/customer/orders/${orderId}/reorder`);
      toast.success('Reorder placed successfully');
      fetchOrders();
    } catch (error: unknown) {
      toast.error('Failed to reorder');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <ShoppingCart className="w-10 h-10 mr-4 text-green-500" />
          <h1 className="text-4xl font-bold text-gray-800">Order Management</h1>
        </div>
        {canCreateOrder && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
          >
            <Plus className="w-5 h-5 mr-2" /> Create Order
          </button>
        )}
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left">Order ID</th>
              <th className="px-4 py-3 text-left">Branch</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Items</th>
              <th className="px-4 py-3 text-left">Total</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">#{order.id}</td>
                <td className="px-4 py-3">{order.branch?.name || 'Unknown'}</td>
                <td className="px-4 py-3">{order.user ? `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || order.user.email : 'N/A'}</td>
                <td className="px-4 py-3">{order.items.map((item) => `${item.menuItem.item_name}(${item.quantity})`).join(', ')}</td>
                <td className="px-4 py-3">${order.total_amount.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${order.status === 'PAID' || order.status === 'FINISHED_COOKING' ? 'bg-green-100 text-green-800' : order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end space-x-2">
                    {canManageStatus && order.status !== 'CANCELLED' && order.status !== 'PAID' && (
                      <button 
                        onClick={() => updateStatus(order.id, 'PAID')}
                        className="text-green-500 hover:text-green-700"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                    )}
                    {(user?.role === 'CUSTOMER' || canManageStatus) && (
                      <button 
                        onClick={() => confirmPayment(order.id)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                    {user?.role === 'CUSTOMER' && (
                      <button 
                        onClick={() => handleReorder(order.id)}
                        className="text-orange-500 hover:text-orange-700"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-2xl font-bold mb-4">Create Order</h2>
            <form onSubmit={handleCreateOrder}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Branch</label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  required
                >
                  <option value="">Select branch</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Total Amount</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  step="0.01"
                  required
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Customer Email</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  disabled={user?.role === 'CUSTOMER'}
                  className="w-full px-3 py-2 border rounded bg-gray-50"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
