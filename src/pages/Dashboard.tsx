import React, { useEffect, useState, useCallback } from 'react';
import {
  ShoppingCart,
  BarChart2,
  Truck,
  Star,
  ClipboardList,
  FlameKindling,
  CheckCircle2,
  Receipt,
  MapPin,
  Phone,
  Store,
  Utensils,
  CircleCheck,
  Heart,
  Sparkles,
  ArrowRight,
  UtensilsCrossed,
  ChefHat,
  BellRing,
  BadgeCheck,
  RefreshCw,
  Ban,
} from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';
import InteractiveCard from '../components/InteractiveCard';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

interface OrderCounts {
  placed: number;
  cooking: number;
  readyToServe: number;
  awaitingBill: number;
}

interface BranchInfo {
  id: string;
  name: string;
  location_address: string;
  contactNumber?: string;
  isActive: boolean;
}

// ─── Waiter quick stats ───────────────────────────────────────────────────────

const WaiterInsights: React.FC = () => {
  const [counts, setCounts] = useState<OrderCounts | null>(null);

  useEffect(() => {
    api.get('/orders')
      .then(r => {
        const orders: { status: string }[] = r.data || [];
        setCounts({
          placed: orders.filter(o => o.status === 'PLACED').length,
          cooking: orders.filter(o => o.status === 'COOKING').length,
          readyToServe: orders.filter(o => o.status === 'FINISHED_COOKING').length,
          awaitingBill: orders.filter(o => o.status === 'SERVED').length,
        });
      })
      .catch(() => setCounts({ placed: 0, cooking: 0, readyToServe: 0, awaitingBill: 0 }));
  }, []);

  const items = [
    { label: 'New orders',     value: counts?.placed,       icon: <ClipboardList className="w-5 h-5 text-yellow-500" />, badge: counts?.placed      ? 'bg-yellow-100 text-yellow-800' : '' },
    { label: 'In the kitchen', value: counts?.cooking,      icon: <FlameKindling  className="w-5 h-5 text-orange-500" />, badge: '' },
    { label: 'Ready to serve', value: counts?.readyToServe, icon: <CheckCircle2   className="w-5 h-5 text-blue-500"   />, badge: counts?.readyToServe ? 'bg-blue-100 text-blue-800'   : '' },
    { label: 'Awaiting bill',  value: counts?.awaitingBill, icon: <Receipt        className="w-5 h-5 text-purple-500" />, badge: '' },
  ];

  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className={`flex items-center justify-between pb-3 ${i < items.length - 1 ? 'border-b border-gray-100' : ''}`}>
          <span className="flex items-center gap-2 text-gray-700">{item.icon}{item.label}</span>
          {counts === null
            ? <span className="w-6 h-4 bg-gray-200 rounded animate-pulse" />
            : <strong className={`text-sm px-2.5 py-0.5 rounded-full font-semibold ${item.badge || 'bg-gray-100 text-gray-700'}`}>{item.value}</strong>
          }
        </li>
      ))}
    </ul>
  );
};

// ─── Chef kitchen stats ───────────────────────────────────────────────────────

const ChefInsights: React.FC = () => {
  const [counts, setCounts] = useState<OrderCounts | null>(null);

  useEffect(() => {
    api.get('/orders')
      .then(r => {
        const orders: { status: string }[] = r.data || [];
        setCounts({
          placed:       orders.filter(o => o.status === 'PLACED').length,
          cooking:      orders.filter(o => o.status === 'COOKING').length,
          readyToServe: orders.filter(o => o.status === 'FINISHED_COOKING').length,
          awaitingBill: orders.filter(o => o.status === 'PAID').length,
        });
      })
      .catch(() => setCounts({ placed: 0, cooking: 0, readyToServe: 0, awaitingBill: 0 }));
  }, []);

  const items = [
    { label: 'Waiting to cook',   value: counts?.placed,       icon: <ClipboardList className="w-5 h-5 text-yellow-500" />, badge: counts?.placed      ? 'bg-yellow-100 text-yellow-800' : '' },
    { label: 'On the grill now',  value: counts?.cooking,      icon: <FlameKindling  className="w-5 h-5 text-orange-500" />, badge: counts?.cooking     ? 'bg-orange-100 text-orange-800' : '' },
    { label: 'Ready for waiter',  value: counts?.readyToServe, icon: <CheckCircle2   className="w-5 h-5 text-sky-500"    />, badge: counts?.readyToServe ? 'bg-sky-100 text-sky-800'       : '' },
    { label: 'Completed today',   value: counts?.awaitingBill, icon: <BadgeCheck     className="w-5 h-5 text-green-500"  />, badge: '' },
  ];

  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className={`flex items-center justify-between pb-3 ${i < items.length - 1 ? 'border-b border-gray-100' : ''}`}>
          <span className="flex items-center gap-2 text-gray-700">{item.icon}{item.label}</span>
          {counts === null
            ? <span className="w-6 h-4 bg-gray-200 rounded animate-pulse" />
            : <strong className={`text-sm px-2.5 py-0.5 rounded-full font-semibold ${item.badge || 'bg-gray-100 text-gray-700'}`}>{item.value}</strong>
          }
        </li>
      ))}
    </ul>
  );
};

// ─── Branch manager branch info ───────────────────────────────────────────────

const BranchManagerInsights: React.FC<{ branchId: string }> = ({ branchId }) => {
  const [branch, setBranch] = useState<BranchInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/branches/${branchId}`)
      .then(r => setBranch(r.data))
      .catch(() => setBranch(null))
      .finally(() => setLoading(false));
  }, [branchId]);

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[...Array(3)].map((_, i) => <div key={i} className="h-5 bg-gray-100 rounded" />)}
      </div>
    );
  }

  if (!branch) {
    return <p className="text-sm text-gray-400">Branch information unavailable.</p>;
  }

  return (
    <ul className="space-y-4">
      <li className="flex items-start gap-3 pb-4 border-b border-gray-100">
        <Store className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Branch Name</p>
          <p className="font-semibold text-gray-800">{branch.name}</p>
        </div>
        <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full self-start ${branch.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
          {branch.isActive ? 'Active' : 'Inactive'}
        </span>
      </li>
      <li className="flex items-start gap-3 pb-4 border-b border-gray-100">
        <MapPin className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Location</p>
          <p className="text-gray-700 text-sm">{branch.location_address}</p>
        </div>
      </li>
      <li className="flex items-start gap-3">
        <Phone className="w-5 h-5 text-purple-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Contact</p>
          <p className="text-gray-700 text-sm">{branch.contactNumber || 'Not set'}</p>
        </div>
      </li>
    </ul>
  );
};

// ─── Branch manager team status ───────────────────────────────────────────────

const BranchManagerStatus: React.FC<{ branchId: string }> = ({ branchId }) => {
  const [menuCount, setMenuCount] = useState<number | null>(null);

  useEffect(() => {
    api.get(`/branches/public/${branchId}/menu`)
      .then(r => setMenuCount((r.data || []).length))
      .catch(() => setMenuCount(null));
  }, [branchId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
        <Utensils className="w-5 h-5 text-orange-500 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-700">Menu items</p>
          <p className="text-xs text-gray-500">Available dishes at your branch</p>
        </div>
        <strong className="text-gray-800">
          {menuCount === null ? '—' : menuCount}
        </strong>
      </div>
      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
        <CircleCheck className="w-5 h-5 text-green-500 shrink-0" />
        <div>
          <p className="text-sm font-medium text-gray-700">System status</p>
          <p className="text-xs text-gray-500">All services running normally</p>
        </div>
        <span className="ml-auto text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
          Operational
        </span>
      </div>
      <p className="text-xs text-gray-400 leading-relaxed">
        Use <strong>Branch Management</strong> to update contact details or address. Use <strong>Menu</strong> to add or edit dishes for your branch.
      </p>
    </div>
  );
};

// ─── Customer panels ─────────────────────────────────────────────────────────

const CustomerInsights: React.FC = () => {
  const [favCount, setFavCount]   = useState<number | null>(null);
  const [recCount, setRecCount]   = useState<number | null>(null);

  useEffect(() => {
    api.get('/customer/favourites').then(r => setFavCount((r.data || []).length)).catch(() => setFavCount(0));
    api.get('/customer/recommendations').then(r => setRecCount((r.data || []).length)).catch(() => setRecCount(0));
  }, []);

  const stat = (val: number | null) =>
    val === null ? <span className="w-8 h-5 bg-gray-200 rounded animate-pulse inline-block" /> : <strong className="text-gray-800">{val}</strong>;

  return (
    <ul className="space-y-3">
      <li className="flex items-center justify-between pb-3 border-b border-gray-100">
        <span className="flex items-center gap-2 text-gray-700">
          <Heart className="w-5 h-5 text-rose-500" /> Saved favourites
        </span>
        {stat(favCount)}
      </li>
      <li className="flex items-center justify-between pb-3 border-b border-gray-100">
        <span className="flex items-center gap-2 text-gray-700">
          <Sparkles className="w-5 h-5 text-violet-500" /> Personalised picks
        </span>
        {stat(recCount)}
      </li>
      <li className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-gray-700">
          <UtensilsCrossed className="w-5 h-5 text-orange-500" /> Ready to order
        </span>
        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Kitchen open</span>
      </li>
    </ul>
  );
};

const CustomerActions: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="space-y-3">
      <button
        onClick={() => navigate('/')}
        className="flex items-center justify-between w-full px-4 py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl transition group"
      >
        <span className="flex items-center gap-3 font-semibold text-sm">
          <UtensilsCrossed className="w-5 h-5" /> Browse the full menu
        </span>
        <ArrowRight className="w-4 h-4 opacity-60 group-hover:translate-x-0.5 transition-transform" />
      </button>
      <button
        onClick={() => navigate('/orders')}
        className="flex items-center justify-between w-full px-4 py-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl transition group"
      >
        <span className="flex items-center gap-3 font-semibold text-sm">
          <ShoppingCart className="w-5 h-5" /> Place an order
        </span>
        <ArrowRight className="w-4 h-4 opacity-60 group-hover:translate-x-0.5 transition-transform" />
      </button>
      <button
        onClick={() => navigate('/recommendations')}
        className="flex items-center justify-between w-full px-4 py-3 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-xl transition group"
      >
        <span className="flex items-center gap-3 font-semibold text-sm">
          <Sparkles className="w-5 h-5" /> See recommendations
        </span>
        <ArrowRight className="w-4 h-4 opacity-60 group-hover:translate-x-0.5 transition-transform" />
      </button>
    </div>
  );
};

// ─── Customer order tracking ─────────────────────────────────────────────────

interface CustomerOrder {
  id: string;
  status: string;
  createdAt: string;
  total?: number;
  branch?: { name: string };
  items?: { quantity: number }[];
}

const STATUS_STEPS = ['PLACED', 'COOKING', 'FINISHED_COOKING', 'SERVED', 'BILLED', 'PAID'] as const;

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  PLACED:           { label: 'Placed',       color: 'text-yellow-700', bg: 'bg-yellow-100', icon: <ClipboardList className="w-4 h-4" /> },
  COOKING:          { label: 'Cooking',       color: 'text-orange-700', bg: 'bg-orange-100', icon: <ChefHat       className="w-4 h-4" /> },
  FINISHED_COOKING: { label: 'Ready',         color: 'text-blue-700',   bg: 'bg-blue-100',   icon: <BellRing      className="w-4 h-4" /> },
  SERVED:           { label: 'Served',        color: 'text-green-700',  bg: 'bg-green-100',  icon: <Utensils      className="w-4 h-4" /> },
  BILLED:           { label: 'Billed',        color: 'text-purple-700', bg: 'bg-purple-100', icon: <Receipt       className="w-4 h-4" /> },
  PAID:             { label: 'Paid',          color: 'text-emerald-700',bg: 'bg-emerald-100',icon: <BadgeCheck    className="w-4 h-4" /> },
  CANCELLED:        { label: 'Cancelled',     color: 'text-red-700',    bg: 'bg-red-100',    icon: <Ban           className="w-4 h-4" /> },
};

const CustomerOrderTracking: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<CustomerOrder[] | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchOrders = useCallback(() => {
    api.get('/customer/orders')
      .then(r => { setOrders(r.data || []); setLastRefresh(new Date()); })
      .catch(() => setOrders([]));
  }, []);

  useEffect(() => {
    fetchOrders();
    const timer = setInterval(fetchOrders, 20000);
    return () => clearInterval(timer);
  }, [fetchOrders]);

  const recent = (orders ?? []).slice(0, 5);
  const active = recent.filter(o => !['PAID', 'CANCELLED'].includes(o.status));

  return (
    <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Orders</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {active.length > 0
              ? `${active.length} order${active.length > 1 ? 's' : ''} in progress · auto-refreshing`
              : 'Auto-refreshing every 20 s'}
          </p>
        </div>
        <button
          onClick={fetchOrders}
          title={`Last updated ${lastRefresh.toLocaleTimeString()}`}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {orders === null && (
        <div className="space-y-3 animate-pulse">
          {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
        </div>
      )}

      {orders !== null && recent.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 gap-3 text-gray-400">
          <UtensilsCrossed className="w-10 h-10 opacity-30" />
          <p className="text-sm">No orders yet</p>
          <button
            onClick={() => navigate('/')}
            className="text-sm text-red-600 font-semibold hover:underline"
          >
            Browse the menu to get started
          </button>
        </div>
      )}

      {orders !== null && recent.length > 0 && (
        <div className="space-y-3">
          {recent.map(order => {
            const meta   = STATUS_META[order.status] ?? STATUS_META['PLACED'];
            const stepIdx = STATUS_STEPS.indexOf(order.status as typeof STATUS_STEPS[number]);
            const isCancelled = order.status === 'CANCELLED';
            const itemCount = (order.items ?? []).reduce((s, i) => s + (i.quantity ?? 1), 0);

            return (
              <div key={order.id} className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-700">
                        #{order.id}
                      </span>
                      {order.branch?.name && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Store className="w-3 h-3" /> {order.branch.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span>{new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      {itemCount > 0 && <span>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>}
                      {order.total != null && <span className="font-medium text-gray-600">£{Number(order.total).toFixed(2)}</span>}
                    </div>
                  </div>
                  <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${meta.bg} ${meta.color}`}>
                    {meta.icon}{meta.label}
                  </span>
                </div>

                {/* Progress bar — only for non-cancelled orders */}
                {!isCancelled && (
                  <div className="mt-3 flex items-center gap-0.5">
                    {STATUS_STEPS.map((step, idx) => {
                      const done    = idx <= stepIdx;
                      const current = idx === stepIdx;
                      return (
                        <React.Fragment key={step}>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                            current  ? 'bg-orange-500 ring-2 ring-orange-200'
                            : done   ? 'bg-green-500'
                            : 'bg-gray-100'
                          }`}>
                            {done
                              ? <CheckCircle2 className="w-3 h-3 text-white" />
                              : <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />}
                          </div>
                          {idx < STATUS_STEPS.length - 1 && (
                            <div className={`flex-1 h-0.5 ${idx < stepIdx ? 'bg-green-400' : 'bg-gray-100'}`} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {orders.length > 5 && (
            <button
              onClick={() => navigate('/orders')}
              className="w-full text-sm text-center text-gray-400 hover:text-gray-600 py-2 transition"
            >
              View all {orders.length} orders →
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const dashboardCards = [
    { title: 'Order Food',        description: 'Browse the menu and place your order',             icon: <ShoppingCart className="w-8 h-8 text-green-500"  />, roles: ['CUSTOMER'],                                    route: '/orders'          },
    { title: 'Order Tracking',    description: 'Monitor and manage current and past orders',       icon: <ShoppingCart className="w-8 h-8 text-green-500"  />, roles: ['WAITER', 'HQ_MANAGER', 'ADMIN'],               route: '/orders'          },
    { title: 'Kitchen Queue',     description: 'See incoming orders and update cooking status',    icon: <ChefHat      className="w-8 h-8 text-orange-500" />, roles: ['CHEF'],                                        route: '/orders'          },
    { title: 'Branch Analytics',  description: 'Detailed insights and performance metrics',        icon: <BarChart2    className="w-8 h-8 text-purple-500" />, roles: ['HQ_MANAGER', 'ADMIN'],                         route: '/reports'         },
    { title: 'Branch Management', description: 'Manage branch details and configurations',         icon: <Truck        className="w-8 h-8 text-orange-500" />, roles: ['BRANCH_MANAGER', 'HQ_MANAGER', 'ADMIN'],       route: '/branches'        },
    { title: 'View Menu',         description: 'Browse all dishes available at your branch',       icon: <UtensilsCrossed className="w-8 h-8 text-amber-500" />, roles: ['CHEF'],                                     route: '/menu'            },
    { title: 'Recommendations',   description: 'Review personalised dish recommendations',         icon: <Star         className="w-8 h-8 text-yellow-500" />, roles: ['CUSTOMER'],                                    route: '/recommendations' },
  ];

  const filteredCards = dashboardCards.filter(card => user?.role && card.roles.includes(user.role));

  const isWaiter        = user?.role === 'WAITER';
  const isChef          = user?.role === 'CHEF';
  const isBranchManager = user?.role === 'BRANCH_MANAGER';
  const isCustomer      = user?.role === 'CUSTOMER';
  const isStaff         = user?.role === 'ADMIN' || user?.role === 'HQ_MANAGER';

  const [staffCount, setStaffCount] = useState<number | null>(null);
  useEffect(() => {
    if (!isStaff) return;
    api.get('/admin/users')
      .then(r => {
        const STAFF_ROLES = ['ADMIN', 'HQ_MANAGER', 'BRANCH_MANAGER', 'WAITER'];
        const staffOnly = (r.data as { role: string }[]).filter(u => STAFF_ROLES.includes(u.role));
        setStaffCount(staffOnly.length);
      })
      .catch(() => setStaffCount(null));
  }, [isStaff]);

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <div className="container mx-auto px-4 py-8 relative z-10">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">
          Welcome, {user?.firstName || user?.email || 'User'}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCards.map((card, index) => (
            <InteractiveCard
              key={index}
              title={card.title}
              description={card.description}
              icon={card.icon}
              onClick={() => navigate(card.route)}
            />
          ))}
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {/* Left panel */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              {isChef ? 'Kitchen Status' : isWaiter ? 'Quick Insights' : isBranchManager ? 'Quick Insights' : isCustomer ? 'My Activity' : 'Quick Insights'}
            </h2>
            {isChef && <ChefInsights />}
            {isWaiter && <WaiterInsights />}
            {isBranchManager && user.branch_id && <BranchManagerInsights branchId={user.branch_id} />}
            {isCustomer && <CustomerInsights />}
            {!isChef && !isWaiter && !isBranchManager && !isCustomer && (
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <span>Registered staff</span>
                  {staffCount === null
                    ? <span className="w-8 h-5 bg-gray-200 rounded animate-pulse inline-block" />
                    : <strong>{staffCount}</strong>}
                </li>
                <li className="flex items-center justify-between pt-3">
                  <span>System status</span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Operational</span>
                </li>
              </ul>
            )}
          </div>

          {/* Right panel */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              {isChef ? 'Chef Actions' : isWaiter ? 'Shift Notes' : isBranchManager ? 'Branch Status' : isCustomer ? 'Quick Actions' : 'Team Status'}
            </h2>

            {isChef && (
              <div className="space-y-3">
                <p className="text-gray-600 text-sm">
                  New orders appear at the top of the Kitchen Queue highlighted in orange. Mark each order as cooking, then ready when done — the waiter takes it from there.
                </p>
                <button
                  onClick={() => navigate('/orders')}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <FlameKindling className="w-4 h-4" /> Open Kitchen Queue
                </button>
                <button
                  onClick={() => navigate('/menu')}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <UtensilsCrossed className="w-4 h-4" /> View Today's Menu
                </button>
              </div>
            )}

            {isWaiter && (
              <>
                <p className="text-gray-600 text-sm">
                  Keep an eye on new orders — they appear highlighted at the top of the Orders page. Use the action buttons to move each order through the kitchen and to the table.
                </p>
                <button
                  onClick={() => navigate('/orders')}
                  className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2.5 rounded-lg transition"
                >
                  Go to Orders
                </button>
              </>
            )}

            {isBranchManager && user.branch_id && (
              <BranchManagerStatus branchId={user.branch_id} />
            )}

            {isCustomer && <CustomerActions />}

            {!isChef && !isWaiter && !isBranchManager && !isCustomer && (
              <p className="text-gray-600 text-sm">
                Use the cards above to navigate directly to the tools you need. Branch analytics, user management, and system settings are all accessible from your dashboard.
              </p>
            )}
          </div>
        </div>

        {isCustomer && <CustomerOrderTracking />}
      </div>
    </div>
  );
};

export default Dashboard;
