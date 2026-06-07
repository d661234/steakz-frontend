import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { Utensils, Plus, Edit, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/axiosConfig';

interface Branch {
  id: string;
  name: string;
}

interface MenuItem {
  id: string;
  item_name: string;
  description?: string;
  price: number;
  category?: string;
  availability_status: boolean;
  branch_id: string;
}

const MenuManagement: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(searchParams.get('branchId') ?? '');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const isOpenAccess = user?.role === 'OPEN_ACCESS';
  const canManageMenu = user?.role === 'ADMIN' || user?.role === 'BRANCH_MANAGER';
  const showBranchSelector = isOpenAccess || user?.role === 'ADMIN' || user?.role === 'HQ_MANAGER';

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        if (user?.role === 'BRANCH_MANAGER' || user?.role === 'WAITER') {
          if (!user.branch_id) return;
          setBranches([{ id: user.branch_id, name: 'My Branch' }]);
          setSelectedBranchId(user.branch_id);
          return;
        }

        if (isOpenAccess) {
          const response = await api.get('/branches/public');
          setBranches(response.data || []);
          if (!selectedBranchId && response.data.length > 0) {
            setSelectedBranchId(response.data[0].id);
          }
          return;
        }

        const response = await api.get('/branches');
        setBranches(response.data || []);
        if (!selectedBranchId && response.data.length > 0) {
          setSelectedBranchId(response.data[0].id);
        }
      } catch (error: unknown) {
        toast.error('Failed to load branches');
      }
    };

    fetchBranches();
  }, [user, selectedBranchId, isOpenAccess]);

  useEffect(() => {
    if (!selectedBranchId) return;

    const fetchMenu = async () => {
      try {
        const response = await api.get(`/branches/public/${selectedBranchId}/menu`);
        setMenuItems(response.data);
      } catch (error: unknown) {
        toast.error('Failed to load menu items');
      }
    };

    fetchMenu();
    if (isOpenAccess) {
      setSearchParams({ branchId: selectedBranchId });
    }
  }, [selectedBranchId, isOpenAccess, setSearchParams]);

  const handleAddItem = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const handleEditItem = (item: MenuItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleDeleteItem = async (itemId: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this menu item?');
    if (!confirmDelete) return;

    try {
      await api.delete(`/branches/menu/${itemId}`);
      toast.success('Menu item deleted successfully');
      setMenuItems(menuItems.filter((item) => item.id !== itemId));
    } catch (error: unknown) {
      toast.error('Failed to delete menu item');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const item_name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const description = (form.elements.namedItem('description') as HTMLInputElement).value;
    const price = parseFloat((form.elements.namedItem('price') as HTMLInputElement).value);
    const category = (form.elements.namedItem('category') as HTMLSelectElement).value;
    const availability_status = (form.elements.namedItem('availability') as HTMLInputElement).checked;
    const branchId = selectedBranchId || user?.branch_id;

    if (!branchId) {
      toast.error('A branch must be selected');
      return;
    }

    try {
      if (selectedItem) {
        const response = await api.put(`/branches/menu/${selectedItem.id}`, {
          item_name,
          description,
          price,
          category,
          availability_status,
        });
        setMenuItems(menuItems.map((item) => item.id === selectedItem.id ? response.data : item));
        toast.success('Menu item updated successfully');
      } else {
        const response = await api.post(`/branches/${branchId}/menu`, {
          item_name,
          description,
          price,
          category,
          availability_status,
        });
        setMenuItems([...menuItems, response.data]);
        toast.success('Menu item added successfully');
      }

      setIsModalOpen(false);
    } catch (error: unknown) {
      toast.error('Failed to save menu item');
    }
  };

  const filteredMenuItems = isOpenAccess
    ? menuItems.filter((item) =>
        item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.category ?? '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    : menuItems;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div className="flex items-center">
          <Utensils className="w-10 h-10 mr-4 text-green-500" />
          <div>
            <h1 className="text-4xl font-bold text-gray-800">
              {isOpenAccess ? 'Browse Public Menu' : 'Menu Management'}
            </h1>
            <p className="text-gray-600">
              {isOpenAccess
                ? 'Select a branch to view available dishes and prices.'
                : 'Manage menu items for your assigned branch.'}
            </p>
          </div>
        </div>
        {canManageMenu && (
          <button
            onClick={handleAddItem}
            className="flex items-center bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
          >
            <Plus className="w-5 h-5 mr-2" /> Add Menu Item
          </button>
        )}
      </div>

      {branches.length > 0 && showBranchSelector && (
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Select Branch</label>
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          >
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>{branch.name}</option>
            ))}
          </select>
        </div>
      )}

      {isOpenAccess && (
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Search menu items</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search dishes, categories or keywords"
              className="w-full pl-10 pr-4 py-2 border rounded"
            />
          </div>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Price</th>
              <th className="px-4 py-3 text-left">Status</th>
              {canManageMenu && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredMenuItems.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{item.item_name}</td>
                <td className="px-4 py-3">{item.category || 'Uncategorized'}</td>
                <td className="px-4 py-3">${item.price.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${item.availability_status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {item.availability_status ? 'Available' : 'Unavailable'}
                  </span>
                </td>
                {canManageMenu && (
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
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-2xl font-bold mb-4">
              {selectedItem ? 'Edit Menu Item' : 'Add New Menu Item'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={selectedItem?.item_name}
                  required
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  defaultValue={selectedItem?.description}
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
                  defaultValue={selectedItem?.category || 'Main Course'}
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
              <div className="mb-4 flex items-center">
                <input
                  id="availability"
                  type="checkbox"
                  name="availability"
                  defaultChecked={selectedItem?.availability_status ?? true}
                  className="mr-2"
                />
                <label htmlFor="availability" className="text-gray-700">Available</label>
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
