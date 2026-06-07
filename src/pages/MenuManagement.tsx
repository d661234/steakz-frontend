import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Utensils, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isAvailable: boolean;
}

const MenuManagement: React.FC = () => {
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    { 
      id: '1', 
      name: 'Classic Burger', 
      description: 'Juicy beef patty with fresh lettuce and tomato',
      price: 12.99,
      category: 'Main Course',
      isAvailable: true
    },
    { 
      id: '2', 
      name: 'Caesar Salad', 
      description: 'Fresh romaine lettuce with parmesan and croutons',
      price: 8.50,
      category: 'Salad',
      isAvailable: true
    }
  ]);

  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddItem = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const handleEditItem = (item: MenuItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleDeleteItem = (itemId: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this menu item?');
    if (confirmDelete) {
      setMenuItems(menuItems.filter(item => item.id !== itemId));
      toast.success('Menu item deleted successfully');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItem) {
      // Update existing item
      setMenuItems(menuItems.map(item => 
        item.id === selectedItem.id ? selectedItem : item
      ));
      toast.success('Menu item updated successfully');
    } else {
      // Add new item
      const newItem: MenuItem = {
        id: String(menuItems.length + 1),
        name: (e.target as any).name.value,
        description: (e.target as any).description.value,
        price: parseFloat((e.target as any).price.value),
        category: (e.target as any).category.value,
        isAvailable: true
      };
      setMenuItems([...menuItems, newItem]);
      toast.success('Menu item added successfully');
    }
    setIsModalOpen(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <Utensils className="w-10 h-10 mr-4 text-green-500" />
          <h1 className="text-4xl font-bold text-gray-800">Menu Management</h1>
        </div>
        <button 
          onClick={handleAddItem}
          className="flex items-center bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
        >
          <Plus className="w-5 h-5 mr-2" /> Add Menu Item
        </button>
      </div>

      {user && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-left">Price</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {menuItems.map(item => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{item.name}</td>
                  <td className="px-4 py-3">{item.description}</td>
                  <td className="px-4 py-3">${item.price.toFixed(2)}</td>
                  <td className="px-4 py-3">{item.category}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${item.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {item.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end space-x-2">
                      <button 
                        onClick={() => handleEditItem(item)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
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
              {selectedItem ? 'Edit Menu Item' : 'Add New Menu Item'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Item Name</label>
                <input 
                  type="text" 
                  name="name" 
                  defaultValue={selectedItem?.name}
                  required 
                  className="w-full px-3 py-2 border rounded" 
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Description</label>
                <textarea 
                  name="description" 
                  defaultValue={selectedItem?.description}
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
                  defaultValue={selectedItem?.price}
                  required 
                  className="w-full px-3 py-2 border rounded" 
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Category</label>
                <select 
                  name="category" 
                  defaultValue={selectedItem?.category}
                  required 
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="Appetizer">Appetizer</option>
                  <option value="Main Course">Main Course</option>
                  <option value="Dessert">Dessert</option>
                  <option value="Beverage">Beverage</option>
                  <option value="Salad">Salad</option>
                </select>
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
                  {selectedItem ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;