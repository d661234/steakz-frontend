import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/axiosConfig';

interface User {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

const AdminUsers: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [password, setPassword] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error: unknown) {
      toast.error('Failed to load users');
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAddUser = () => {
    setSelectedUser(null);
    setPassword('');
    setIsModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setPassword('');
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this user?');
    if (!confirmDelete) return;

    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error: unknown) {
      toast.error('Failed to delete user');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const firstName = (form.elements.namedItem('firstName') as HTMLInputElement).value;
    const lastName = (form.elements.namedItem('lastName') as HTMLInputElement).value;
    const role = (form.elements.namedItem('role') as HTMLSelectElement).value;

    try {
      if (selectedUser) {
        await api.put(`/admin/users/${selectedUser.id}`, {
          email,
          firstName,
          lastName,
          role,
        });
        toast.success('User updated successfully');
      } else {
        if (!password) {
          toast.error('Password is required when creating a user');
          return;
        }

        const response = await api.post('/auth/register', {
          email,
          password,
          role,
        });

        const newUser = response.data;
        if (firstName || lastName) {
          await api.put(`/admin/users/${newUser.id}`, {
            firstName,
            lastName,
          });
        }

        toast.success('User created successfully');
      }

      setIsModalOpen(false);
      fetchUsers();
    } catch (error: unknown) {
      toast.error('Failed to save user');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <Users className="w-10 h-10 mr-4 text-blue-500" />
          <h1 className="text-4xl font-bold text-gray-800">User Management</h1>
        </div>
        <button 
          onClick={handleAddUser}
          className="flex items-center bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
        >
          <Plus className="w-5 h-5 mr-2" /> Add User
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{`${u.firstName || ''} ${u.lastName || ''}`.trim() || 'No name'}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">{u.role}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end space-x-2">
                    <button 
                      onClick={() => handleEditUser(u)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(u.id)}
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-2xl font-bold mb-4">
              {selectedUser ? 'Edit User' : 'Add New User'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">First Name</label>
                <input 
                  type="text" 
                  name="firstName" 
                  defaultValue={selectedUser?.firstName}
                  className="w-full px-3 py-2 border rounded" 
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Last Name</label>
                <input 
                  type="text" 
                  name="lastName" 
                  defaultValue={selectedUser?.lastName}
                  className="w-full px-3 py-2 border rounded" 
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Email</label>
                <input 
                  type="email" 
                  name="email" 
                  defaultValue={selectedUser?.email}
                  required 
                  className="w-full px-3 py-2 border rounded" 
                />
              </div>
              {!selectedUser && (
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Password</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                    className="w-full px-3 py-2 border rounded" 
                  />
                </div>
              )}
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Role</label>
                <select 
                  name="role" 
                  defaultValue={selectedUser?.role || 'CUSTOMER'}
                  required 
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="HQ_MANAGER">HQ Manager</option>
                  <option value="BRANCH_MANAGER">Branch Manager</option>
                  <option value="WAITER">Waiter</option>
                  <option value="CUSTOMER">Customer</option>
                  <option value="OPEN_ACCESS">Open Access</option>
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
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {selectedUser ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
