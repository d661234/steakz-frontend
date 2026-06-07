import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Truck, Plus, Edit, Trash2, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface Branch {
  id: string;
  name: string;
  address: string;
  contactNumber: string;
  isActive: boolean;
}

const Branches: React.FC = () => {
  const { user } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([
    { 
      id: '1', 
      name: 'Downtown Branch', 
      address: '123 Main St, Cityville', 
      contactNumber: '+1 (555) 123-4567',
      isActive: true 
    },
    { 
      id: '2', 
      name: 'Uptown Branch', 
      address: '456 High St, Townsville', 
      contactNumber: '+1 (555) 987-6543',
      isActive: true 
    }
  ]);

  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddBranch = () => {
    setSelectedBranch(null);
    setIsModalOpen(true);
  };

  const handleEditBranch = (branch: Branch) => {
    setSelectedBranch(branch);
    setIsModalOpen(true);
  };

  const handleDeleteBranch = (branchId: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this branch?');
    if (confirmDelete) {
      setBranches(branches.filter(b => b.id !== branchId));
      toast.success('Branch deleted successfully');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBranch) {
      // Update existing branch
      setBranches(branches.map(b => b.id === selectedBranch.id ? selectedBranch : b));
      toast.success('Branch updated successfully');
    } else {
      // Add new branch
      const newBranch: Branch = {
        id: String(branches.length + 1),
        name: (e.target as any).name.value,
        address: (e.target as any).address.value,
        contactNumber: (e.target as any).contactNumber.value,
        isActive: true
      };
      setBranches([...branches, newBranch]);
      toast.success('Branch added successfully');
    }
    setIsModalOpen(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <Truck className="w-10 h-10 mr-4 text-orange-500" />
          <h1 className="text-4xl font-bold text-gray-800">Branch Management</h1>
        </div>
        <button 
          onClick={handleAddBranch}
          className="flex items-center bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition"
        >
          <Plus className="w-5 h-5 mr-2" /> Add Branch
        </button>
      </div>

      {user && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Address</th>
                <th className="px-4 py-3 text-left">Contact Number</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {branches.map(b => (
                <tr key={b.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{b.name}</td>
                  <td className="px-4 py-3 flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                    {b.address}
                  </td>
                  <td className="px-4 py-3">{b.contactNumber}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${b.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {b.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end space-x-2">
                      <button 
                        onClick={() => handleEditBranch(b)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteBranch(b.id)}
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
              {selectedBranch ? 'Edit Branch' : 'Add New Branch'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Branch Name</label>
                <input 
                  type="text" 
                  name="name" 
                  defaultValue={selectedBranch?.name}
                  required 
                  className="w-full px-3 py-2 border rounded" 
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Address</label>
                <input 
                  type="text" 
                  name="address" 
                  defaultValue={selectedBranch?.address}
                  required 
                  className="w-full px-3 py-2 border rounded" 
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Contact Number</label>
                <input 
                  type="tel" 
                  name="contactNumber" 
                  defaultValue={selectedBranch?.contactNumber}
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
                  className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                >
                  {selectedBranch ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Branches;