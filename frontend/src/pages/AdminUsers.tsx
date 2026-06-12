import React, { useEffect, useState, useCallback } from 'react';
import { Users, UserCog, ShoppingBag, Plus, Edit, Trash2, X, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/axiosConfig';

interface User {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  branch?: { id: string; name: string } | null;
}

interface Branch {
  id: string;
  name: string;
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN:          'bg-red-100 text-red-700',
  HQ_MANAGER:     'bg-purple-100 text-purple-700',
  BRANCH_MANAGER: 'bg-blue-100 text-blue-700',
  CHEF:           'bg-orange-100 text-orange-700',
  WAITER:         'bg-green-100 text-green-700',
  CUSTOMER:       'bg-gray-100 text-gray-600',
};

const STAFF_ROLES  = ['ADMIN', 'HQ_MANAGER', 'BRANCH_MANAGER', 'CHEF', 'WAITER'];
const BRANCH_ROLES = ['BRANCH_MANAGER', 'CHEF', 'WAITER'];

const emptyForm = { firstName: '', lastName: '', email: '', password: '', role: 'WAITER', branch_id: '' };

type Tab = 'staff' | 'customers';

const AdminUsers: React.FC = () => {
  const [users, setUsers]         = useState<User[]>([]);
  const [branches, setBranches]   = useState<Branch[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('staff');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing]     = useState<User | null>(null);
  const [form, setForm]           = useState(emptyForm);
  const [saving, setSaving]       = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const r = await api.get('/admin/users');
      setUsers(r.data);
    } catch {
      toast.error('Failed to load users');
    }
  }, []);

  const fetchBranches = useCallback(async () => {
    try {
      const r = await api.get('/branches');
      setBranches(r.data || []);
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchBranches();
  }, [fetchUsers, fetchBranches]);

  const staff    = users.filter(u => STAFF_ROLES.includes(u.role));
  const customers = users.filter(u => u.role === 'CUSTOMER');

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm, role: activeTab === 'customers' ? 'CUSTOMER' : 'WAITER' });
    setIsModalOpen(true);
  };

  const openEdit = (u: User) => {
    setEditing(u);
    setForm({
      firstName: u.firstName || '',
      lastName:  u.lastName  || '',
      email:     u.email,
      password:  '',
      role:      u.role,
      branch_id: u.branch?.id || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditing(null); };

  const handleDelete = async (userId: string, role: string) => {
    if (role === 'ADMIN') { toast.error('Admin accounts cannot be deleted.'); return; }
    if (!window.confirm('Delete this user?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('User deleted');
      fetchUsers();
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/admin/users/${editing.id}`, {
          firstName: form.firstName || null,
          lastName:  form.lastName  || null,
          email:     form.email,
          role:      form.role,
          ...(BRANCH_ROLES.includes(form.role) && form.branch_id ? { branch_id: form.branch_id } : {}),
        });
        toast.success('User updated');
      } else {
        if (!form.password) { toast.error('Password is required'); setSaving(false); return; }
        await api.post('/admin/users', {
          firstName:  form.firstName || null,
          lastName:   form.lastName  || null,
          email:      form.email,
          password:   form.password,
          role:       form.role,
          branch_id:  BRANCH_ROLES.includes(form.role) ? form.branch_id || null : null,
        });
        toast.success('User created');
      }
      closeModal();
      fetchUsers();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const needsBranch = BRANCH_ROLES.includes(form.role);
  const isCustomerTab = activeTab === 'customers';

  // ── Shared table ─────────────────────────────────────────────────────────────
  const UserTable: React.FC<{ rows: User[]; showBranch: boolean }> = ({ rows, showBranch }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
            {showBranch && (
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Branch</th>
            )}
            <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(u => (
            <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50 transition">
              <td className="px-5 py-3.5 font-medium text-gray-800">
                {[u.firstName, u.lastName].filter(Boolean).join(' ') || (
                  <span className="text-gray-400 italic text-sm">No name</span>
                )}
              </td>
              <td className="px-5 py-3.5 text-sm text-gray-500">{u.email}</td>
              <td className="px-5 py-3.5">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_COLORS[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
                  {u.role.replace(/_/g, ' ')}
                </span>
              </td>
              {showBranch && (
                <td className="px-5 py-3.5 text-sm text-gray-500">
                  {u.branch?.name
                    ? <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{u.branch.name}</span>
                    : '—'}
                </td>
              )}
              <td className="px-5 py-3.5 text-right">
                <div className="flex justify-end gap-2">
                  <button onClick={() => openEdit(u)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition">
                    <Edit className="w-4 h-4" />
                  </button>
                  {u.role !== 'ADMIN' && (
                    <button onClick={() => handleDelete(u.id, u.role)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={showBranch ? 5 : 4} className="text-center text-gray-400 py-10 text-sm">
                No {isCustomerTab ? 'customers' : 'staff members'} found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
            <p className="text-sm text-gray-500">{users.length} total accounts</p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition text-sm"
        >
          <Plus className="w-4 h-4" />
          {isCustomerTab ? 'Add Customer' : 'Add Staff'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
        <button
          onClick={() => setActiveTab('staff')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition ${
            activeTab === 'staff'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <UserCog className="w-4 h-4" />
          Staff
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${activeTab === 'staff' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'}`}>
            {staff.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('customers')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition ${
            activeTab === 'customers'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Customers
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${activeTab === 'customers' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>
            {customers.length}
          </span>
        </button>
      </div>

      {/* Active table */}
      {activeTab === 'staff'
        ? <UserTable rows={staff}     showBranch={true}  />
        : <UserTable rows={customers} showBranch={false} />
      }

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">
                {editing ? 'Edit User' : isCustomerTab ? 'Add Customer' : 'Add Staff Member'}
              </h2>
              <button onClick={closeModal} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    value={form.firstName}
                    onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                    placeholder="John"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    value={form.lastName}
                    onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                    placeholder="Doe"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                  autoComplete="off"
                  placeholder="john@example.com"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                />
              </div>

              {!editing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required
                    placeholder="Min. 8 characters"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  />
                </div>
              )}

              {/* Role selector — staff roles only on staff tab, hidden on customer tab */}
              {!isCustomerTab && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role <span className="text-red-500">*</span></label>
                  <select
                    value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value, branch_id: '' }))}
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="HQ_MANAGER">HQ Manager</option>
                    <option value="BRANCH_MANAGER">Branch Manager</option>
                    <option value="CHEF">Chef</option>
                    <option value="WAITER">Waiter</option>
                  </select>
                </div>
              )}

              {needsBranch && !isCustomerTab && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assign to Branch <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.branch_id}
                    onChange={e => setForm(f => ({ ...f, branch_id: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  >
                    <option value="">— Select a branch —</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal}
                  className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-lg transition">
                  {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create'}
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
