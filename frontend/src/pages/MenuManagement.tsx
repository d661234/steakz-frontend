import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, X, ShoppingBag, RefreshCw, Minus } from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/axiosConfig';

interface Branch  { id: string; name: string; }
interface MenuItem {
  id: string;
  item_name: string;
  description?: string;
  price: number;
  category?: string;
  availability_status: boolean;
  branch_id: string;
}
interface CartLine { menuItemId: string; name: string; price: number; quantity: number; }

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<string, { gradient: string }> = {
  'Appetizer':   { gradient: 'from-amber-400  to-yellow-500'  },
  'Main Course': { gradient: 'from-red-500    to-orange-500'  },
  'Salad':       { gradient: 'from-green-400  to-emerald-500' },
  'Side':        { gradient: 'from-indigo-400 to-violet-500'  },
  'Dessert':     { gradient: 'from-pink-500   to-rose-400'    },
  'Beverage':    { gradient: 'from-sky-400    to-blue-500'    },
};

const catCfg = (cat?: string) =>
  CATEGORY_CONFIG[cat ?? ''] ?? { gradient: 'from-gray-400 to-gray-500' };

const CATEGORY_ORDER = ['Appetizer', 'Main Course', 'Salad', 'Side', 'Dessert', 'Beverage'];

// ─── Menu Card ────────────────────────────────────────────────────────────────

interface CardProps {
  item: MenuItem;
  canManage: boolean;
  canOrder: boolean;
  cartQty: number;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
  onAdjust: (item: MenuItem, delta: number) => void;
}

const MenuCard: React.FC<CardProps> = ({ item, canManage, canOrder, cartQty, onEdit, onDelete, onAdjust }) => {
  const cfg = catCfg(item.category);
  return (
    <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col hover:shadow-md transition-shadow ${
      cartQty > 0 ? 'border-red-300 ring-1 ring-red-100' : 'border-gray-100'
    } ${!item.availability_status ? 'opacity-60' : ''}`}>
      {/* Gradient banner */}
      <div className={`relative h-32 bg-gradient-to-br ${cfg.gradient} flex items-center justify-center`}>
        <span className="absolute top-3 left-3 text-xs font-semibold bg-white/25 text-white backdrop-blur-sm px-2.5 py-0.5 rounded-full">
          {item.category ?? 'Other'}
        </span>
        {canManage && (
          <div className="absolute top-2 right-2 flex gap-1.5">
            <button onClick={() => onEdit(item)} className="p-1.5 bg-white/90 hover:bg-white text-blue-600 rounded-lg shadow transition">
              <Edit className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(item.id)} className="p-1.5 bg-white/90 hover:bg-white text-red-500 rounded-lg shadow transition">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {cartQty > 0 && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shadow">
            {cartQty}
          </span>
        )}
        {!item.availability_status && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-black/60 text-white text-xs font-bold px-3 py-1 rounded-full tracking-wide">SOLD OUT</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-gray-800 text-base leading-snug mb-1">{item.item_name}</h3>
        <p className="text-xs text-gray-500 leading-relaxed flex-1 line-clamp-2 mb-3">
          {item.description || 'A delicious dish prepared fresh to order.'}
        </p>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-xl font-extrabold text-gray-800">£{item.price.toFixed(2)}</span>
          {item.availability_status && canOrder && (
            cartQty > 0 ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onAdjust(item, -1)}
                  className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-sm font-bold text-gray-800 w-5 text-center">{cartQty}</span>
                <button
                  onClick={() => onAdjust(item, +1)}
                  className="w-7 h-7 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onAdjust(item, +1)}
                className="flex items-center gap-1 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition"
              >
                <ShoppingBag className="w-3.5 h-3.5" /> Add
              </button>
            )
          )}
          {!item.availability_status && (
            <span className="text-xs text-gray-400 font-medium">Unavailable</span>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const MenuManagement: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(searchParams.get('branchId') ?? '');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const canManageMenu      = user?.role === 'ADMIN' || user?.role === 'BRANCH_MANAGER';
  const showBranchSelector = user?.role === 'ADMIN' || user?.role === 'HQ_MANAGER';
  const isCustomerView     = user?.role === 'CUSTOMER' || user?.role === 'WAITER';
  const isWaiter           = user?.role === 'WAITER';
  const canOrder           = user?.role === 'CUSTOMER' || user?.role === 'WAITER';

  // ── Cart ────────────────────────────────────────────────────────────────────
  const [cart,        setCart]        = useState<CartLine[]>([]);
  const [placing,     setPlacing]     = useState(false);
  const [tableNumber, setTableNumber] = useState('');

  const adjust = (item: MenuItem, delta: number) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItemId === item.id);
      if (!existing) return delta > 0 ? [...prev, { menuItemId: item.id, name: item.item_name, price: item.price, quantity: 1 }] : prev;
      const newQty = existing.quantity + delta;
      if (newQty <= 0) return prev.filter(c => c.menuItemId !== item.id);
      return prev.map(c => c.menuItemId === item.id ? { ...c, quantity: newQty } : c);
    });
  };

  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);
  const cartTotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);

  const placeOrder = async () => {
    if (!selectedBranchId || cart.length === 0) return;
    if (isWaiter && !tableNumber.trim()) { toast.error('Please enter a table number before placing the order.'); return; }
    setPlacing(true);
    try {
      await api.post('/orders', {
        branch_id: selectedBranchId,
        total_amount: cartTotal,
        items: { create: cart.map(c => ({ menuItemId: c.menuItemId, quantity: c.quantity, price: c.price })) },
      });
      toast.success(isWaiter ? `Order placed for Table ${tableNumber}!` : "Order placed! We'll start preparing it now.");
      setCart([]);
      if (isWaiter) setTableNumber('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  // ── Fetch branches ──────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        if (user?.role === 'BRANCH_MANAGER' || user?.role === 'WAITER' || user?.role === 'CHEF') {
          if (!user.branch_id) return;
          setBranches([{ id: user.branch_id, name: 'My Branch' }]);
          setSelectedBranchId(user.branch_id);
          return;
        }
        // Customers use the public endpoint; admins/HQ use the authenticated one
        const endpoint = user?.role === 'CUSTOMER' ? '/branches/public' : '/branches';
        const r = await api.get(endpoint);
        setBranches(r.data || []);
        if (!selectedBranchId && r.data?.length > 0) setSelectedBranchId(r.data[0].id);
      } catch { toast.error('Failed to load branches'); }
    };
    load();
  }, [user]);  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch menu ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedBranchId) return;
    api.get(`/branches/public/${selectedBranchId}/menu`)
      .then(r => setMenuItems(r.data || []))
      .catch(() => toast.error('Failed to load menu'));
  }, [selectedBranchId]);

  // ── CRUD ────────────────────────────────────────────────────────────────────
  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('Delete this menu item?')) return;
    try {
      await api.delete(`/branches/menu/${itemId}`);
      setMenuItems(prev => prev.filter(i => i.id !== itemId));
      toast.success('Item deleted');
    } catch { toast.error('Failed to delete item'); }
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const payload = {
      item_name:           (form.elements.namedItem('name')         as HTMLInputElement).value,
      description:         (form.elements.namedItem('description')  as HTMLInputElement).value,
      price:               parseFloat((form.elements.namedItem('price') as HTMLInputElement).value),
      category:            (form.elements.namedItem('category')     as HTMLSelectElement).value,
      availability_status: (form.elements.namedItem('availability') as HTMLInputElement).checked,
    };
    const branchId = selectedBranchId || user?.branch_id;
    if (!branchId) { toast.error('No branch selected'); return; }
    try {
      if (selectedItem) {
        const r = await api.put(`/branches/menu/${selectedItem.id}`, payload);
        setMenuItems(prev => prev.map(i => i.id === selectedItem.id ? r.data : i));
        toast.success('Item updated');
      } else {
        const r = await api.post(`/branches/${branchId}/menu`, payload);
        setMenuItems(prev => [...prev, r.data]);
        toast.success('Item added');
      }
      setIsModalOpen(false);
    } catch { toast.error('Failed to save item'); }
  };

  // ── Filtering ───────────────────────────────────────────────────────────────
  const bySearch = searchTerm
    ? menuItems.filter(i =>
        i.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.category ?? '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    : menuItems;

  const filtered = activeCategory === 'All'
    ? bySearch
    : bySearch.filter(i => i.category === activeCategory);

  // Categories that actually have items (for tab counts)
  const categoriesInUse = ['All', ...CATEGORY_ORDER.filter(c => menuItems.some(i => i.category === c))];

  const countFor = (cat: string) =>
    cat === 'All' ? bySearch.length : bySearch.filter(i => i.category === cat).length;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero header */}
      <div className={`px-6 py-8 ${isCustomerView ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white' : 'bg-white border-b border-gray-200'}`}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-extrabold ${isCustomerView ? 'text-white' : 'text-gray-800'}`}>
              {isCustomerView ? '🍽️  Our Menu' : 'Menu Management'}
            </h1>
            <p className={`text-sm mt-0.5 ${isCustomerView ? 'text-red-100' : 'text-gray-500'}`}>
              {isCustomerView
                ? 'Fresh ingredients, bold flavours — order straight from the menu'
                : 'Add, edit and manage dishes for your branch'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {canManageMenu && (
              <button
                onClick={() => { setSelectedItem(null); setIsModalOpen(true); }}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition"
              >
                <Plus className="w-4 h-4" /> Add Item
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* Branch selector */}
        {showBranchSelector && branches.length > 0 && (
          <div className="flex items-center gap-3 mb-5">
            <label className="text-sm font-medium text-gray-600 shrink-0">Branch:</label>
            <select
              value={selectedBranchId}
              onChange={e => setSelectedBranchId(e.target.value)}
              className="flex-1 max-w-xs px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-400 focus:outline-none"
            >
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        )}

        {/* Waiter — table number input */}
        {isWaiter && (
          <div className="flex items-center gap-3 mb-5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <span className="text-amber-600 text-sm font-semibold shrink-0">Table #</span>
            <input
              type="text"
              value={tableNumber}
              onChange={e => setTableNumber(e.target.value)}
              placeholder="Enter table number or name…"
              className="flex-1 px-3 py-1.5 border border-amber-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none bg-white"
            />
          </div>
        )}

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search dishes or categories…"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-400 focus:outline-none bg-white shadow-sm"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {categoriesInUse.map(cat => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition border ${
                  isActive
                    ? 'bg-red-600 text-white border-red-600 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-red-300 hover:text-red-600'
                }`}
              >
                {cat}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {countFor(cat)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-5xl mb-4 block">🍽️</span>
            <p className="text-gray-500 font-medium">No items found</p>
            <p className="text-sm text-gray-400 mt-1">Try a different category or search term.</p>
          </div>
        ) : (
          <div className={`grid gap-5 sm:grid-cols-2 lg:grid-cols-3 ${canOrder && cartCount > 0 ? 'pb-28' : ''}`}>
            {filtered.map(item => (
              <MenuCard
                key={item.id}
                item={item}
                canManage={canManageMenu}
                canOrder={canOrder}
                cartQty={cart.find(c => c.menuItemId === item.id)?.quantity ?? 0}
                onEdit={i => { setSelectedItem(i); setIsModalOpen(true); }}
                onDelete={handleDeleteItem}
                onAdjust={adjust}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">
                {selectedItem ? 'Edit Menu Item' : 'Add New Menu Item'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                <input name="name" type="text" defaultValue={selectedItem?.item_name} required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-400 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea name="description" rows={2} defaultValue={selectedItem?.description}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-400 focus:outline-none resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price <span className="text-red-500">*</span></label>
                  <input name="price" type="number" step="0.01" min="0" defaultValue={selectedItem?.price} required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-400 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
                  <select name="category" defaultValue={selectedItem?.category || 'Main Course'} required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-400 focus:outline-none">
                    <option value="Appetizer">Appetizer</option>
                    <option value="Main Course">Main Course</option>
                    <option value="Salad">Salad</option>
                    <option value="Side">Side</option>
                    <option value="Dessert">Dessert</option>
                    <option value="Beverage">Beverage</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input name="availability" type="checkbox" defaultChecked={selectedItem?.availability_status ?? true}
                  className="w-4 h-4 rounded accent-green-600" />
                <span className="text-sm text-gray-700 font-medium">Available for ordering</span>
              </label>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
                  Cancel
                </button>
                <button type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition">
                  {selectedItem ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sticky cart bar — customers & waiters */}
      {canOrder && cartCount > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 border-t border-gray-200 bg-white shadow-2xl">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingBag className="w-5 h-5 text-red-600" />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">
                  {cartCount} item{cartCount !== 1 ? 's' : ''}
                  {isWaiter && tableNumber.trim() && <span className="ml-2 text-amber-600 font-semibold">· Table {tableNumber}</span>}
                </p>
                <p className="text-xs text-gray-500">£{cartTotal.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCart([])}
                className="text-xs text-gray-400 hover:text-red-500 px-3 py-1.5 transition"
              >
                Clear
              </button>
              <button
                onClick={placeOrder}
                disabled={placing}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition"
              >
                {placing
                  ? <RefreshCw className="w-4 h-4 animate-spin" />
                  : <ShoppingBag className="w-4 h-4" />}
                {placing ? 'Placing…' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;
