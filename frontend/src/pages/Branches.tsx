import React, { useCallback, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Truck, Plus, Edit, Trash2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/axiosConfig';
import { useDataFetching } from '../hooks/useDataFetching';

interface Branch {
  id: string;
  name: string;
  location_address?: string;
  contactNumber?: string;
  isActive?: boolean;
}

const Branches: React.FC = () => {
  const { user } = useAuth();
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const canManageBranches = user?.role === 'ADMIN';
  const canViewOwnBranch = user?.role === 'BRANCH_MANAGER';

  const fetchBranches = useCallback(async () => {
    if (canViewOwnBranch && user?.branch_id) {
      const response = await api.get(`/branches/${user.branch_id}`);
      return response.data ? [response.data as Branch] : [];
    }

    if (user?.role === 'HQ_MANAGER' || canManageBranches) {
      const response = await api.get('/branches');
      return response.data as Branch[];
    }

    return [];
  }, [user, canViewOwnBranch]);

  const { data: branches = [], error, loading, refetch } = useDataFetching<Branch[]>(fetchBranches, []);

  const handleAddBranch = () => {
    setSelectedBranch(null);
    setIsModalOpen(true);
  };

  const handleEditBranch = (branch: Branch) => {
    setSelectedBranch(branch);
    setIsModalOpen(true);
  };

  const handleDeleteBranch = async (branchId: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this branch?');
    if (!confirmDelete) return;

    try {
      await api.delete(`/branches/${branchId}`);
      toast.success('Branch deleted successfully');
      refetch();
    } catch (err: unknown) {
      toast.error('Failed to delete branch');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const locationAddress = (form.elements.namedItem('address') as HTMLInputElement).value;
    const contactNumber = (form.elements.namedItem('contactNumber') as HTMLInputElement).value;

    try {
      if (selectedBranch) {
        await api.put(`/branches/${selectedBranch.id}`, {
          name,
          location_address: locationAddress,
          contactNumber,
        });
        toast.success('Branch updated successfully');
      } else {
        await api.post('/branches', {
          name,
          location_address: locationAddress,
          contactNumber,
        });
        toast.success('Branch added successfully');
      }
      setIsModalOpen(false);
      refetch();
    } catch (err: unknown) {
      toast.error('Failed to save branch');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <Truck className="w-10 h-10 mr-4 text-orange-500" />
          <div>
            <h1 className="text-4xl font-bold text-gray-800">
              {canManageBranches ? 'Branch Management' : 'Branch Overview'}
            </h1>
            <p className="text-gray-600">
              {canManageBranches
                ? 'Manage and review branch locations'
                : 'Review your branch details and location information.'}
            </p>
          </div>
        </div>
        {canManageBranches && (
          <button
            onClick={handleAddBranch}
            className="flex items-center bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition"
          >
            <Plus className="w-5 h-5 mr-2" /> Add Branch
          </button>
        )}
      </div>

      {loading && <p className="text-gray-600">Loading branches...</p>}
      {error && <p className="text-red-500">Failed to load branches.</p>}

      {!loading && branches.length === 0 && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <p className="text-gray-700">No branches available for your account.</p>
        </div>
      )}

      {branches.length > 0 && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Address</th>
                <th className="px-4 py-3 text-left">Contact</th>
                <th className="px-4 py-3 text-left">Status</th>
                {canManageBranches && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {branches.map((branch) => (
                <tr key={branch.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{branch.name}</td>
                  <td className="px-4 py-3 flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                    {branch.location_address || 'No address provided'}
                  </td>
                  <td className="px-4 py-3">{branch.contactNumber || 'N/A'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${branch.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {branch.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  {canManageBranches && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end items-center space-x-2">
                        <button
                          onClick={() => handleEditBranch(branch)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteBranch(branch.id)}
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
                  defaultValue={selectedBranch?.location_address}
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
