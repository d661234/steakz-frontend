import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const AdminUsers: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([
    { id: '1', name: 'John Doe', email: 'john@example.com', role: 'ADMIN' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'HQ_MANAGER' },
    { id: '3', name: 'Mike Johnson', email: 'mike@example.com', role: 'BRANCH_MANAGER' }
  ]);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddUser = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleDeleteUser = (userId: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this user?');
    if (confirmDelete) {
      setUsers(users.filter(u => u.id !== userId));
      toast.success('User deleted successfully');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser) {
      // Update existing user
      setUsers(users.map(u => u.id === selectedUser.id ? selectedUser : u));
      toast.success('User updated successfully');
    } else {
      // Add new user
      const newUser: User = {
        id: String(users.length + 1),
        name: (e.target as any).name.value,
        email: (e.target as any).email.value,
        role: (e.target as any).role.value
      };
      setUsers([...users, newUser]);
      toast.success('User added successfully');
    }
    setIsModalOpen(false);
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

      {user && (
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
              {users.map(u => (
                <tr key={u.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{u.name}</td>
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
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-2xl font-bold mb-4">
              {selectedUser ? 'Edit User' : 'Add New User'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Name</label>
                <input 
                  type="text" 
                  name="name" 
                  defaultValue={selectedUser?.name}
                  required 
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
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Role</label>
                <select 
                  name="role" 
                  defaultValue={selectedUser?.role}
                  required 
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="HQ_MANAGER">HQ Manager</option>
                  <option value="BRANCH_MANAGER">Branch Manager</option>
                  <option value="WAITER">Waiter</option>
                  <option value="CUSTOMER">Customer</option>
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
                  {selectedUser ? 'Update' : 'Add'}
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