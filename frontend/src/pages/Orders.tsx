import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Plus,
  RefreshCw,
  Flame,
  Bell,
  Utensils,
  Receipt,
  BadgeCheck,
  Clock,
  ChefHat,
  MapPin,
  ArrowLeft,
  Minus,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/axiosConfig';

interface Branch { id: string; name: string; }

// ─── New-order panel types ────────────────────────────────────────────────────
interface PBranch   { id: string; name: string; }
interface PMenuItem { id: string; item_name: string; description?: string; price: number; availability_status: boolean; }
interface CartLine  { menuItemId: string; name: string; price: number; quantity: number; }

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
  orderDate?: string;
  items: OrderItem[];
}

// ─── Shared status config ────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  PLACED: 'New Order',
  COOKING: 'In Kitchen',
  FINISHED_COOKING: 'Ready to Serve',
  SERVED: 'At Table',
  BILLED: 'Bill Sent',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
};

const STATUS_COLORS: Record<string, string> = {
  PLACED: 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-300',
  COOKING: 'bg-orange-100 text-orange-800',
  FINISHED_COOKING: 'bg-sky-100 text-sky-800 ring-1 ring-sky-300',
  SERVED: 'bg-indigo-100 text-indigo-800',
  BILLED: 'bg-purple-100 text-purple-800',
  PAID: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

// ─── Customer Order History View ─────────────────────────────────────────────

const STEPS = ['PLACED','COOKING','FINISHED_COOKING','SERVED','BILLED','PAID'] as const;

const OrderProgress: React.FC<{ status: string }> = ({ status }) => {
  if (status === 'CANCELLED') return (
    <span className="text-xs text-red-500 font-semibold uppercase tracking-wide">Cancelled</span>
  );
  const cur = STEPS.indexOf(status as typeof STEPS[number]);
  return (
    <div className="flex items-center gap-0.5 mt-3">
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <div className={`h-1.5 flex-1 rounded-full transition-colors ${i <= cur ? 'bg-red-500' : 'bg-gray-200'}`} />
          {i < STEPS.length - 1 && <div className="w-px" />}
        </React.Fragment>
      ))}
    </div>
  );
};

const CustomerOrderView: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // ── New-order panel ─────────────────────────────────────────────────────────
  const [showNewOrder,  setShowNewOrder]  = useState(false);
  const [branches,      setBranches]      = useState<PBranch[]>([]);
  const [menuBranchId,  setMenuBranchId]  = useState('');
  const [menuItems,     setMenuItems]     = useState<PMenuItem[]>([]);
  const [loadingMenu,   setLoadingMenu]   = useState(false);
  const [cart,          setCart]          = useState<CartLine[]>([]);
  const [placing,       setPlacing]       = useState(false);

  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);
  const cartTotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);

  useEffect(() => {
    api.get('/branches/public').then(r => setBranches(r.data || [])).catch(() => {});
  }, []);

  // If panel is open but branches loaded AFTER the click (rare), auto-fill then
  useEffect(() => {
    if (!showNewOrder || branches.length === 0 || menuBranchId) return;
    const recentId = orders.find(o => o.branch?.id)?.branch?.id;
    setMenuBranchId(
      (recentId && branches.find(b => b.id === recentId) ? recentId : null) || branches[0].id
    );
  }, [showNewOrder, branches, orders, menuBranchId]);

  const openNewOrder = () => {
    if (showNewOrder) {
      setShowNewOrder(false);
      setCart([]);
      setMenuBranchId('');
      return;
    }
    // Set the branch synchronously so items start loading immediately
    const recentId = orders.find(o => o.branch?.id)?.branch?.id;
    const defaultId =
      (recentId && branches.find(b => b.id === recentId) ? recentId : null) ||
      branches[0]?.id ||
      '';
    setMenuBranchId(defaultId);
    setShowNewOrder(true);
  };

  useEffect(() => {
    if (!menuBranchId) { setMenuItems([]); return; }
    setLoadingMenu(true);
    api.get(`/branches/public/${menuBranchId}/menu`)
      .then(r => setMenuItems((r.data || []).filter((i: PMenuItem) => i.availability_status)))
      .catch(() => setMenuItems([]))
      .finally(() => setLoadingMenu(false));
    setCart([]);
  }, [menuBranchId]);

  const adjust = (item: PMenuItem, delta: number) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItemId === item.id);
      if (!existing) {
        return delta > 0
          ? [...prev, { menuItemId: item.id, name: item.item_name, price: item.price, quantity: 1 }]
          : prev;
      }
      const newQty = existing.quantity + delta;
      if (newQty <= 0) return prev.filter(c => c.menuItemId !== item.id);
      return prev.map(c => c.menuItemId === item.id ? { ...c, quantity: newQty } : c);
    });
  };

  const placeNewOrder = async () => {
    if (!menuBranchId || cart.length === 0) return;
    setPlacing(true);
    try {
      await api.post('/orders', {
        branch_id: menuBranchId,
        total_amount: cartTotal,
        items: { create: cart.map(c => ({ menuItemId: c.menuItemId, quantity: c.quantity, price: c.price })) },
      });
      toast.success("Order placed! We'll start preparing it now.");
      setCart([]);
      setShowNewOrder(false);
      fetchOrders();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  // ── Orders fetch ────────────────────────────────────────────────────────────
  const fetchOrders = () => {
    setLoading(true);
    api.get('/customer/orders')
      .then(r => setOrders(r.data || []))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleReorder = async (orderId: string) => {
    try {
      await api.post(`/customer/orders/${orderId}/reorder`);
      toast.success('Reorder placed!');
      fetchOrders();
    } catch {
      toast.error('Failed to reorder');
    }
  };

  const handleConfirmPayment = async (orderId: string) => {
    try {
      await api.patch(`/orders/${orderId}/confirm`);
      toast.success('Payment confirmed');
      fetchOrders();
    } catch {
      toast.error('Failed to confirm payment');
    }
  };

  const active = orders.filter(o => !['PAID','CANCELLED'].includes(o.status));
  const past   = orders.filter(o =>  ['PAID','CANCELLED'].includes(o.status));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner */}
      <div className="bg-gradient-to-r from-red-600 to-orange-500 px-6 py-8 text-white">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 text-red-100 hover:text-white text-xs font-medium mb-4 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </button>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm mb-0.5">Welcome back, {user?.firstName || 'there'}</p>
              <h1 className="text-2xl font-extrabold">My Orders</h1>
              <p className="text-red-100 text-xs mt-1">{orders.length} order{orders.length !== 1 ? 's' : ''} total</p>
            </div>
            <button
              onClick={openNewOrder}
              className="flex items-center gap-2 bg-white text-red-600 font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-red-50 transition shadow-sm"
            >
              {showNewOrder ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showNewOrder ? 'Cancel' : 'New Order'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Inline new-order panel ─────────────────────────────────────────── */}
      {showNewOrder && (
        <div className="border-b border-gray-200 bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Place a New Order</h2>

            {/* Branch selector */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Select a branch</label>
              <select
                value={menuBranchId}
                onChange={e => setMenuBranchId(e.target.value)}
                className="w-full sm:w-72 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-400 focus:outline-none bg-gray-50"
              >
                <option value="">— Choose a branch —</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            {/* Menu items */}
            {(!menuBranchId || loadingMenu) && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 animate-pulse">
                {[...Array(8)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}
              </div>
            )}

            {menuBranchId && !loadingMenu && menuItems.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-8">No available items at this branch.</p>
            )}

            {menuBranchId && !loadingMenu && menuItems.length > 0 && (
              <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 ${cartCount > 0 ? 'pb-2' : ''}`}>
                {menuItems.map(item => {
                  const inCart = cart.find(c => c.menuItemId === item.id);
                  return (
                    <div
                      key={item.id}
                      className={`relative rounded-xl border p-3.5 transition ${
                        inCart ? 'border-red-300 bg-red-50/40' : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                      }`}
                    >
                      {inCart && (
                        <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                          {inCart.quantity}
                        </span>
                      )}
                      <p className="text-sm font-semibold text-gray-800 leading-tight pr-6">{item.item_name}</p>
                      {item.description && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>
                      )}
                      <p className="text-sm font-bold text-red-600 mt-1.5">£{Number(item.price).toFixed(2)}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        {inCart ? (
                          <>
                            <button
                              onClick={() => adjust(item, -1)}
                              className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-sm font-bold text-gray-800 w-5 text-center">{inCart.quantity}</span>
                            <button
                              onClick={() => adjust(item, +1)}
                              className="w-7 h-7 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => adjust(item, +1)}
                            className="flex items-center gap-1 text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 px-2.5 py-1 rounded-lg transition"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm p-5 animate-pulse">
                <div className="flex justify-between mb-3">
                  <div className="space-y-1.5">
                    <div className="h-3 w-20 bg-gray-200 rounded" />
                    <div className="h-4 w-32 bg-gray-200 rounded" />
                  </div>
                  <div className="h-6 w-16 bg-gray-200 rounded-full" />
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-9 h-9 text-red-300" />
            </div>
            <h2 className="text-lg font-bold text-gray-700 mb-1">No orders yet</h2>
            <p className="text-sm text-gray-400 mb-5">Your order history will appear here.</p>
            <a
              href="/"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition"
            >
              <ShoppingCart className="w-4 h-4" /> Browse Menu
            </a>
          </div>
        ) : (
          <>
            {/* Active orders */}
            {active.length > 0 && (
              <section>
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Active Orders</h2>
                <div className="space-y-3">
                  {active.map(order => (
                    <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <div>
                          <span className="font-mono text-xs text-gray-400">#{order.id}</span>
                          <div className="flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-sm font-semibold text-gray-800">{order.branch?.name}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-700'}`}>
                            {STATUS_LABELS[order.status] ?? order.status}
                          </span>
                          <p className="text-base font-bold text-gray-800 mt-1">£{order.total_amount?.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 my-2">
                        {(order.items || []).map(item => (
                          <span key={item.id} className="text-xs bg-gray-50 border border-gray-100 text-gray-600 rounded-md px-2 py-0.5">
                            {item.menuItem?.item_name} <strong>×{item.quantity}</strong>
                          </span>
                        ))}
                      </div>

                      <OrderProgress status={order.status} />

                      {order.status === 'BILLED' && (
                        <button
                          onClick={() => handleConfirmPayment(order.id)}
                          className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2.5 rounded-xl transition"
                        >
                          Confirm Payment
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Past orders */}
            {past.length > 0 && (
              <section>
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Order History</h2>
                <div className="space-y-3">
                  {past.map(order => (
                    <div key={order.id} className={`bg-white rounded-2xl shadow-sm border p-5 ${order.status === 'CANCELLED' ? 'border-red-100 opacity-70' : 'border-gray-100'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="font-mono text-xs text-gray-400">#{order.id}</span>
                          <div className="flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-sm font-semibold text-gray-800">{order.branch?.name}</span>
                          </div>
                          {order.orderDate && (
                            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(order.orderDate).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
                              {' '}{new Date(order.orderDate).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-700'}`}>
                            {STATUS_LABELS[order.status] ?? order.status}
                          </span>
                          <p className="text-base font-bold text-gray-800 mt-1">£{order.total_amount?.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(order.items || []).map(item => (
                          <span key={item.id} className="text-xs bg-gray-50 border border-gray-100 text-gray-600 rounded-md px-2 py-0.5">
                            {item.menuItem?.item_name} <strong>×{item.quantity}</strong>
                          </span>
                        ))}
                      </div>

                      {order.status === 'PAID' && (
                        <button
                          onClick={() => handleReorder(order.id)}
                          className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition"
                        >
                          <Plus className="w-3.5 h-3.5" /> Order Again
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* Sticky cart bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 border-t border-gray-200 bg-white shadow-2xl">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCart className="w-5 h-5 text-red-600" />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">{cartCount} item{cartCount !== 1 ? 's' : ''}</p>
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
                onClick={placeNewOrder}
                disabled={placing}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition"
              >
                {placing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
                {placing ? 'Placing…' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Action button config per status ────────────────────────────────────────

interface ActionConfig {
  label: string;
  icon: React.ReactNode;
  cls: string;
  next: string;
}

const ACTION: Record<string, ActionConfig> = {
  PLACED: {
    label: 'Start Cooking',
    icon: <Flame className="w-4 h-4" />,
    cls: 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm shadow-orange-200',
    next: 'COOKING',
  },
  COOKING: {
    label: 'Mark Ready',
    icon: <Bell className="w-4 h-4" />,
    cls: 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-200',
    next: 'FINISHED_COOKING',
  },
  FINISHED_COOKING: {
    label: 'Serve to Table',
    icon: <Utensils className="w-4 h-4" />,
    cls: 'bg-sky-500 hover:bg-sky-600 text-white shadow-sm shadow-sky-200',
    next: 'SERVED',
  },
  SERVED: {
    label: 'Bill Customer',
    icon: <Receipt className="w-4 h-4" />,
    cls: 'bg-purple-500 hover:bg-purple-600 text-white shadow-sm shadow-purple-200',
    next: 'BILLED',
  },
  BILLED: {
    label: 'Confirm Payment',
    icon: <BadgeCheck className="w-4 h-4" />,
    cls: 'bg-green-500 hover:bg-green-600 text-white shadow-sm shadow-green-200',
    next: 'PAID',
  },
};

const STATUS_SORT: Record<string, number> = {
  PLACED: 0, COOKING: 1, FINISHED_COOKING: 2, SERVED: 3, BILLED: 4, PAID: 5, CANCELLED: 6,
};

// ─── Staff Order View ────────────────────────────────────────────────────────

const StaffOrderView: React.FC<{ userRole: string }> = ({ userRole }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const fetchOrders = async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const r = await api.get('/orders');
      const sorted = (r.data || []).sort(
        (a: Order, b: Order) => (STATUS_SORT[a.status] ?? 9) - (STATUS_SORT[b.status] ?? 9)
      );
      setOrders(sorted);
      setLastRefresh(new Date());
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => fetchOrders(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (orderId: string, nextStatus: string) => {
    setLoading(prev => ({ ...prev, [orderId]: true }));
    try {
      await api.patch(`/orders/${orderId}/status`, { status: nextStatus });
      const label = STATUS_LABELS[nextStatus] ?? nextStatus;
      toast.success(`Order marked as "${label}"`);
      await fetchOrders(true);
    } catch {
      toast.error('Failed to update order status');
    } finally {
      setLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const isChef   = userRole === 'CHEF';
  const isWaiter = userRole === 'WAITER';
  const canAct   = isChef || isWaiter;

  // Statuses each role can act on
  const CHEF_STATUSES   = ['PLACED', 'COOKING'];
  const WAITER_STATUSES = ['FINISHED_COOKING', 'SERVED', 'BILLED'];

  const newCount   = orders.filter(o => o.status === 'PLACED').length;
  const readyCount = orders.filter(o => o.status === 'FINISHED_COOKING').length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">

      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <div className="flex items-center gap-3">
          <ChefHat className="w-8 h-8 text-gray-700" />
          <h1 className="text-3xl font-bold text-gray-800">Orders</h1>
          {newCount > 0 && (
            <span className="bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
              {newCount} new
            </span>
          )}
          {readyCount > 0 && (
            <span className="bg-sky-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {readyCount} ready
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <span className="hidden sm:inline">Updated {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <button
            onClick={() => fetchOrders()}
            disabled={refreshing}
            className="flex items-center gap-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg transition disabled:opacity-50 text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>


      {/* Orders */}
      <div className="space-y-3">
        {orders.length === 0 && !refreshing ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm text-center py-16 text-gray-400">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            No orders yet — they'll appear here automatically.
          </div>
        ) : (
          orders.map(order => {
            const isNew = order.status === 'PLACED';
            const isReady = order.status === 'FINISHED_COOKING';
            const isPaid = order.status === 'PAID';

            return (
              <div
                key={order.id}
                className={`bg-white rounded-xl border shadow-sm transition-all ${
                  isNew
                    ? 'border-orange-200 ring-1 ring-orange-100'
                    : isReady
                    ? 'border-sky-200 ring-1 ring-sky-100'
                    : isPaid
                    ? 'border-green-100 opacity-60'
                    : 'border-gray-100'
                }`}
              >
                <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">

                  {/* Left: order meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-gray-400">
                        #{order.id}
                      </span>
                      {order.orderDate && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          {new Date(order.orderDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}{' '}
                          {new Date(order.orderDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                      <span className="font-semibold text-gray-800 text-sm">
                        {order.branch?.name || '—'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {order.user
                          ? (`${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || order.user.email)
                          : <em className="text-gray-400">Guest</em>}
                      </span>
                    </div>

                    <p className="text-xs text-gray-400 mt-1 truncate">
                      {(order.items || []).map(i => `${i.menuItem?.item_name} ×${i.quantity}`).join(' · ')}
                    </p>
                  </div>

                  {/* Right: total */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-bold text-gray-800 text-base">£{order.total_amount?.toFixed(2)}</span>
                    {isPaid && (
                      <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                        <BadgeCheck className="w-4 h-4" /> Done
                      </span>
                    )}
                  </div>
                </div>

                {/* Item breakdown */}
                {order.items?.length > 0 && (
                  <div className="px-4 pb-2 border-t border-gray-50 pt-2">
                    <div className="flex flex-wrap gap-2">
                      {order.items.map(item => (
                        <span key={item.id} className="text-xs bg-gray-50 border border-gray-100 text-gray-600 rounded-md px-2 py-0.5">
                          {item.menuItem?.item_name} <strong>×{item.quantity}</strong>
                          <span className="text-gray-400 ml-1">£{(item.price * item.quantity).toFixed(2)}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action button — one step at a time, role-filtered */}
                {canAct && !isPaid && order.status !== 'CANCELLED' && (() => {
                  const allowed = isChef ? CHEF_STATUSES : WAITER_STATUSES;
                  if (!allowed.includes(order.status)) return null;
                  const cfg = ACTION[order.status];
                  if (!cfg) return null;
                  return (
                    <div className="px-4 pb-4 pt-2 border-t border-gray-50">
                      <button
                        onClick={() => updateStatus(order.id, cfg.next)}
                        disabled={!!loading[order.id]}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition ${cfg.cls}`}
                      >
                        {loading[order.id]
                          ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          : cfg.icon}
                        {cfg.label}
                      </button>
                    </div>
                  );
                })()}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// ─── Main Orders Component ───────────────────────────────────────────────────

const Orders: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  if (user.role === 'CUSTOMER') return <CustomerOrderView />;

  return <StaffOrderView userRole={user.role} />;
};

export default Orders;
