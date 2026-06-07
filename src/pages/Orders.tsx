import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, Plus, Edit, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface Order {
  id: string;
  customerName: string;
  items: { name: string; quantity: number; price: number }[];
  totalPrice: number;
  status: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'CANCELLED';
}

const Orders: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([
    { 
      id: '1', 
      customerName: 'John Doe',
      items: [
        { name: 'Classic Burger', quantity: 2, price: 12.99 },
        { name: 'Caesar Salad', quantity: 1, price: 8.50 }
      ],
      totalPrice: 34.48,
      status: 'PENDING'
    },
    { 
      id: '2', 
      customerName: 'Jane Smith',
      items: [
        { name: 'Grilled Chicken', quantity: 1, price: 15.99 }
      ],
      totalPrice: 15.99,
      status: 'APPROVED'
    }
  ]);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddOrder = () => {
    setSelectedOrder(null);
    setIsModalOpen(true);
  };

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleDeleteOrder = (orderId: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this order?');
    if (confirmDelete) {
      setOrders(orders.filter(order => order.id !== orderId));
      toast.success('Order deleted successfully');
    }
  };

  const handleUpdateStatus = (orderId: string, status: Order['status']) => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, status } : order
    ));
    toast.success(`Order status updated to ${status}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedOrder) {
      // Update existing order
      setOrders(orders.map(order => 
        order.id === selectedOrder.id ? selectedOrder : order
      ));
      toast.success('Order updated successfully');
    } else {
      // Add new order
      const newOrder: Order = {
        id: String(orders.length + 1),
        customerName: (e.target as any).customerName.value,
        items: [
          {
            name: (e.target as any).itemName.value,
            quantity: parseInt((e.target as any).quantity.value),
            price: parseFloat((e.target as any).price.value)
          }
        ],
        totalPrice: parseFloat((e.target as any).price.value) * parseInt((e.target as any).quantity.value),
        status: 'PENDING'
      };
      setOrders([...orders, newOrder]);
      toast.success('Order added successfully');
    }
    setIsModalOpen(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <ShoppingCart className="w-10 h-10 mr-4 text-green-500" />
          <h1 className="text-4xl font-bold text-gray-800">Order Management</h1>
        </div>
        <button 
          onClick={handleAddOrder}
          className="flex items-center bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
        >
          <Plus className="w-5 h-5 mr-2" /> Add Order
        </button>
      </div>

      {user && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left">Order ID</th>
                <th className="px-4 py-3 text-left">Customer Name</th>
                <th className="px-4 py-3 text-left">Items</th>
                <th className="px-4 py-3 text-left">Total Price</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">#{order.id}</td>
                  <td className="px-4 py-3">{order.customerName}</td>
                  <td className="px-4 py-3">
                    {order.items.map(item => `${item.name} (${item.quantity})`).join(', ')}
                  </td>
                  <td className="px-4 py-3">${order.totalPrice.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end space-x-2">
                      <button 
                        onClick={() => handleEditOrder(order)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteOrder(order.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      {order.status === 'PENDING' && (
                        <>
                          <button 
                            onClick={() => handleUpdateStatus(order.id, 'APPROVED')}
                            className="text-green-500 hover:text-green-700"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(order.id, 'CANCELLED')}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-2xl font-bold mb-4">
              {selectedOrder ? 'Edit Order' : 'Add New Order'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Customer Name</label>
                <input 
                  type="text" 
                  name="customerName" 
                  defaultValue={selectedOrder?.customerName}
                  required 
                  className="w-full px-3 py-2 border rounded" 
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Item Name</label>
                <input 
                  type="text" 
                  name="itemName" 
                  defaultValue={selectedOrder?.items[0]?.name}
                  required 
                  className="w-full px-3 py-2 border rounded" 
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Quantity</label>
                <input 
                  type="number" 
                  name="quantity" 
                  defaultValue={selectedOrder?.items[0]?.quantity || 1}
                  required 
                  className="w-full px-3 py-2 border rounded" 
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Price</label>
                <input 
                  type="number" 
                  name="price" 
                  step="0.01" 
                  defaultValue={selectedOrder?.items[0]?.price}
                  required 
                  className="w-full px-3 py-2 border rounded" 
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
                  {selectedOrder ? 'Update' : 'Add'}
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