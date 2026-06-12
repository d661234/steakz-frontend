import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingCart, Plus, Minus, X,
  LogIn, UserPlus, LayoutDashboard, Flame, MapPin,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/axiosConfig';

interface Branch  { id: string; name: string; location_address?: string; }
interface MenuItem {
  id: string;
  item_name: string;
  description?: string;
  price: number;
  category?: string;
  availability_status: boolean;
}
interface CartItem { item: MenuItem; qty: number; }

const CATEGORY_ORDER = ['Appetizer', 'Main Course', 'Salad', 'Side', 'Dessert', 'Beverage'];
const STAFF_ROLES    = ['ADMIN', 'HQ_MANAGER', 'WAITER', 'BRANCH_MANAGER'];

const Home: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const isStaff    = isAuthenticated && STAFF_ROLES.includes(user?.role || '');
  const isCustomer = isAuthenticated && user?.role === 'CUSTOMER';

  const [branches, setBranches]               = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [menuItems, setMenuItems]             = useState<MenuItem[]>([]);
  const [cart, setCart]                       = useState<Record<string, CartItem>>({});
  const [showGuestModal, setShowGuestModal]   = useState(false);
  const [guestName, setGuestName]             = useState('');
  const [guestEmail, setGuestEmail]           = useState('');
  const [placing, setPlacing]                 = useState(false);
  const [activeCategory, setActiveCategory]   = useState('');

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const navRef      = useRef<HTMLDivElement>(null);

  // ── Data fetching ──────────────────────────────────────────────────────────
  useEffect(() => {
    api.get('/branches/public')
      .then(r => {
        const data: Branch[] = r.data || [];
        setBranches(data);
        if (data.length > 0) setSelectedBranchId(data[0].id);
      })
      .catch(() => toast.error('Failed to load branches'));
  }, []);

  useEffect(() => {
    if (!selectedBranchId) return;
    api.get(`/branches/public/${selectedBranchId}/menu`)
      .then(r => setMenuItems(r.data || []))
      .catch(() => toast.error('Failed to load menu'));
    setCart({});
  }, [selectedBranchId]);

  // ── Intersection observer: highlight active category in nav ────────────────
  useEffect(() => {
    if (!menuItems.length) return;
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.find(e => e.isIntersecting);
        if (visible) setActiveCategory(visible.target.getAttribute('data-cat') ?? '');
      },
      { rootMargin: '-15% 0px -80% 0px' },
    );
    Object.values(sectionRefs.current).forEach(el => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [menuItems]);

  // ── Cart helpers ───────────────────────────────────────────────────────────
  const adjust = (item: MenuItem, delta: number) =>
    setCart(prev => {
      const next = (prev[item.id]?.qty ?? 0) + delta;
      if (next <= 0) { const u = { ...prev }; delete u[item.id]; return u; }
      return { ...prev, [item.id]: { item, qty: next } };
    });

  const cartItems = Object.values(cart);
  const total     = cartItems.reduce((s, c) => s + c.item.price * c.qty, 0);
  const totalQty  = cartItems.reduce((s, c) => s + c.qty, 0);

  const handlePlaceOrder = () => {
    if (!cartItems.length) { toast.error('Your cart is empty'); return; }
    if (isAuthenticated && user?.role === 'CUSTOMER') submitOrder();
    else setShowGuestModal(true);
  };

  const submitOrder = async () => {
    setPlacing(true);
    try {
      const payload = {
        branch_id: selectedBranchId,
        total_amount: parseFloat(total.toFixed(2)),
        items: { create: cartItems.map(c => ({ menuItemId: c.item.id, quantity: c.qty, price: c.item.price })) },
      };
      if (isAuthenticated && user?.role === 'CUSTOMER') await api.post('/orders', payload);
      else await api.post('/orders/guest', payload);
      toast.success('Order placed! Your food is on its way.');
      setCart({}); setShowGuestModal(false); setGuestName(''); setGuestEmail('');
    } catch {
      toast.error('Failed to place order. Please try again.');
    } finally { setPlacing(false); }
  };

  const scrollToSection = (cat: string) => {
    const el = sectionRefs.current[cat];
    if (!el) return;
    const offset = (navRef.current?.offsetHeight ?? 0) + 57; // navbar height
    const top = el.getBoundingClientRect().top + window.scrollY - offset - 8;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  const categories    = CATEGORY_ORDER.filter(cat => menuItems.some(m => m.category === cat));
  const uncategorised = menuItems.filter(m => !CATEGORY_ORDER.includes(m.category ?? ''));
  const allSections   = [...categories, ...(uncategorised.length > 0 ? ['Other'] : [])];
  const selectedBranch = branches.find(b => b.id === selectedBranchId);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#111111]">

      {/* ── Top navbar ────────────────────────────────────────────────────── */}
      <header className="bg-[#0A0A0A] sticky top-0 z-40 shadow-lg border-b border-white/5">
        <div className="container mx-auto px-5 py-3.5 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <Flame className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-black text-xl tracking-tight">Steakz</span>
          </div>

          <nav className="flex items-center gap-2">
            {isStaff ? (
              <>
                <span className="text-gray-400 text-sm hidden sm:inline mr-1">
                  Hi, {user?.firstName || user?.email}
                </span>
                <Link to="/dashboard" className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg text-sm font-medium transition">
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>
              </>
            ) : isCustomer ? (
              <div className="flex items-center gap-3">
                <span className="text-gray-300 text-sm">Hi, {user?.firstName || user?.email}</span>
                <Link to="/dashboard" className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg text-sm font-medium transition">
                  <LayoutDashboard className="w-4 h-4" /> My Account
                </Link>
              </div>
            ) : (
              <>
                <Link to="/login" className="flex items-center gap-1.5 text-gray-300 hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition">
                  <LogIn className="w-4 h-4" /> Sign In
                </Link>
                <Link to="/register" className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
                  <UserPlus className="w-4 h-4" /> Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* ── Restaurant info bar ────────────────────────────────────────────── */}
      <div className="border-b border-white/5 bg-[#161616]">
        <div className="container mx-auto px-5 py-5 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-white">Steakz Restaurant</h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
              {selectedBranch && (
                <>
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{selectedBranch.name}</span>
                </>
              )}
              <span className="text-gray-700">·</span>
              <span>Order &amp; Dine-in</span>
            </div>
          </div>

          {/* Branch selector */}
          {branches.length > 1 && (
            <select
              value={selectedBranchId}
              onChange={e => setSelectedBranchId(e.target.value)}
              className="px-3 py-2 border border-white/10 rounded-lg text-sm text-gray-300 bg-[#1f1f1f] focus:border-red-500 focus:outline-none"
            >
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* ── Sticky category nav ────────────────────────────────────────────── */}
      {allSections.length > 0 && (
        <div ref={navRef} className="sticky top-[57px] z-30 bg-[#111111] border-b border-white/5">
          <div className="container mx-auto px-5">
            <div className="flex overflow-x-auto scrollbar-hide">
              {allSections.map(cat => (
                <button
                  key={cat}
                  onClick={() => scrollToSection(cat)}
                  className={`px-4 py-3.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                    activeCategory === cat
                      ? 'border-red-500 text-red-500'
                      : 'border-transparent text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Menu + Cart ────────────────────────────────────────────────────── */}
      <div className="container mx-auto px-5 py-6 pb-28 lg:pb-10">
        <div className="flex gap-10 flex-col lg:flex-row items-start">

          {/* ── Menu sections ────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {menuItems.length === 0 && (
              <div className="py-20 text-center text-gray-600 text-sm">Loading menu…</div>
            )}

            {allSections.map(cat => {
              const items = cat === 'Other'
                ? uncategorised
                : menuItems.filter(m => m.category === cat);
              if (!items.length) return null;

              return (
                <section
                  key={cat}
                  ref={el => { sectionRefs.current[cat] = el; }}
                  data-cat={cat}
                  className="mb-8"
                >
                  {/* Section heading */}
                  <h2 className="text-xl font-black text-white mb-1">{cat}</h2>
                  <div className="h-px bg-white/5 mb-4" />

                  {/* Item rows */}
                  <div className="divide-y divide-white/5">
                    {items.map(item => {
                      const qty = cart[item.id]?.qty ?? 0;
                      return (
                        <div
                          key={item.id}
                          className={`flex items-center gap-4 py-4 -mx-3 px-3 rounded-xl transition-colors ${item.availability_status ? 'hover:bg-white/5' : 'opacity-50'}`}
                        >
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-100 text-sm leading-snug">{item.item_name}</p>
                              {!item.availability_status && (
                                <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">
                                  Sold Out
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{item.description}</p>
                            )}
                            <p className="text-sm font-bold text-gray-300 mt-1.5">£{item.price.toFixed(2)}</p>
                          </div>

                          {/* Add / qty controls */}
                          <div className="shrink-0">
                            {!item.availability_status ? (
                              <span className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center cursor-not-allowed">
                                <Plus className="w-4 h-4 text-white/20" />
                              </span>
                            ) : qty > 0 ? (
                              <div className="flex items-center gap-2.5">
                                <button
                                  onClick={() => adjust(item, -1)}
                                  className="w-7 h-7 rounded-full border-2 border-white/30 flex items-center justify-center hover:border-white/60 transition"
                                >
                                  <Minus className="w-3 h-3 text-white" />
                                </button>
                                <span className="font-black text-sm text-white w-4 text-center">{qty}</span>
                                <button
                                  onClick={() => adjust(item, 1)}
                                  className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-700 transition"
                                >
                                  <Plus className="w-3 h-3 text-white" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => adjust(item, 1)}
                                className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition"
                              >
                                <Plus className="w-4 h-4 text-white" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>

          {/* ── Cart sidebar (desktop) ──────────────────────────────────── */}
          <div className="lg:w-72 xl:w-80 shrink-0 hidden lg:block">
            <div className="rounded-2xl border border-white/5 overflow-hidden sticky top-[120px] bg-[#1a1a1a]">
              {/* Cart header */}
              <div className="bg-[#0f0f0f] px-5 py-4 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-gray-400" />
                  <span className="text-white font-bold text-sm">Your Order</span>
                </div>
                {totalQty > 0 && (
                  <span className="bg-red-600 text-white text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">
                    {totalQty}
                  </span>
                )}
              </div>

              <div className="p-5">
                {cartItems.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-8 h-8 text-white/10 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Add items to get started</p>
                  </div>
                ) : (
                  <>
                    <ul className="space-y-3 mb-4 max-h-72 overflow-y-auto">
                      {cartItems.map(({ item, qty }) => (
                        <li key={item.id} className="flex items-start gap-2">
                          <button onClick={() => adjust(item, -1)} className="mt-0.5 text-gray-600 hover:text-red-500 transition shrink-0">
                            <X className="w-3.5 h-3.5" />
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-200 font-medium truncate">{item.item_name}</p>
                            <p className="text-xs text-gray-600">Qty {qty}</p>
                          </div>
                          <span className="text-sm font-semibold text-gray-300 shrink-0">
                            £{(item.price * qty).toFixed(2)}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="border-t border-white/5 pt-3 mb-4 flex justify-between items-baseline">
                      <span className="text-sm text-gray-500">Subtotal</span>
                      <span className="text-xl font-black text-white">£{total.toFixed(2)}</span>
                    </div>

                    <button
                      onClick={handlePlaceOrder}
                      className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold text-sm transition"
                    >
                      Place Order
                    </button>

                    {!isAuthenticated && (
                      <p className="text-center text-xs text-gray-600 mt-3">
                        <Link to="/register" className="text-red-500 hover:underline font-medium">Register</Link>
                        {' '}to save order history
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Mobile cart bar ─────────────────────────────────────────────────── */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden px-4 pb-4">
          <button
            onClick={handlePlaceOrder}
            className="w-full bg-red-600 hover:bg-red-700 text-white rounded-2xl py-4 flex items-center justify-between px-5 shadow-2xl font-bold transition"
          >
            <span className="bg-red-700 text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center">
              {totalQty}
            </span>
            <span>View Order · £{total.toFixed(2)}</span>
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* ── Guest order modal ────────────────────────────────────────────────── */}
      {showGuestModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden border border-white/5">
            <div className="bg-[#0f0f0f] px-6 py-5 flex items-center justify-between border-b border-white/5">
              <h2 className="text-base font-black text-white">Confirm Order</h2>
              <button onClick={() => setShowGuestModal(false)} className="text-gray-600 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Summary */}
              <div className="bg-[#111111] rounded-xl divide-y divide-white/5 mb-5 border border-white/5">
                {cartItems.map(({ item, qty }) => (
                  <div key={item.id} className="flex justify-between px-4 py-2.5 text-sm">
                    <span className="text-gray-400">{item.item_name} <span className="text-gray-600">× {qty}</span></span>
                    <span className="font-semibold text-gray-200">£{(item.price * qty).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between px-4 py-2.5 font-black text-sm">
                  <span className="text-white">Total</span>
                  <span className="text-red-500">£{total.toFixed(2)}</span>
                </div>
              </div>

              <p className="text-xs text-gray-600 mb-4">No account needed — you can order as a guest.</p>

              <div className="space-y-2.5 mb-5">
                <input
                  type="text"
                  placeholder="Your name (optional)"
                  value={guestName}
                  onChange={e => setGuestName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-white/10 rounded-xl text-sm text-gray-200 bg-[#111111] placeholder-gray-600 focus:border-white/30 focus:outline-none"
                />
                <input
                  type="email"
                  placeholder="Email for receipt (optional)"
                  value={guestEmail}
                  onChange={e => setGuestEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-white/10 rounded-xl text-sm text-gray-200 bg-[#111111] placeholder-gray-600 focus:border-white/30 focus:outline-none"
                />
              </div>

              <button
                onClick={submitOrder}
                disabled={placing}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white py-3 rounded-xl font-bold text-sm transition mb-3"
              >
                {placing ? 'Placing order…' : 'Confirm Order'}
              </button>

              <p className="text-center text-xs text-gray-600">
                Want order history?{' '}
                <Link to="/register" className="text-red-500 font-semibold hover:underline">Create an account</Link>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
