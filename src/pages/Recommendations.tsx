import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Star, ShoppingBag, Heart, ArrowRight, Plus, Minus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface RecommendationItem {
  id: string;
  item_name: string;
  description?: string;
  price?: number;
  category?: string;
  branch_id: string;
}

interface CartLine {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  'Main Course':  'from-red-500 to-orange-400',
  'Appetizer':    'from-yellow-400 to-amber-500',
  'Dessert':      'from-pink-500 to-rose-400',
  'Beverage':     'from-sky-400 to-blue-500',
  'Salad':        'from-green-400 to-emerald-500',
  'Side':         'from-indigo-400 to-violet-500',
};

const CategoryIcon: React.FC<{ category?: string }> = ({ category }) => {
  const grad = CATEGORY_GRADIENTS[category ?? ''] ?? 'from-gray-400 to-gray-500';
  const letter = category?.[0]?.toUpperCase() ?? '?';
  return (
    <div className={`w-full h-36 bg-gradient-to-br ${grad} flex items-center justify-center rounded-t-xl`}>
      <span className="text-5xl font-black text-white/30 select-none">{letter}</span>
    </div>
  );
};

const Recommendations: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems]               = useState<RecommendationItem[]>([]);
  const [loading, setLoading]           = useState(true);
  const [hasFavourites, setHasFavourites] = useState(false);

  // ── Cart ──────────────────────────────────────────────────────────────────
  const [cart,         setCart]         = useState<CartLine[]>([]);
  const [cartBranchId, setCartBranchId] = useState<string | null>(null);
  const [placing,      setPlacing]      = useState(false);

  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);
  const cartTotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);

  const adjust = (item: RecommendationItem, delta: number) => {
    if (item.price == null) return;

    if (delta > 0 && cartBranchId && cartBranchId !== item.branch_id) {
      toast.error('Your cart contains items from a different branch. Clear it first.');
      return;
    }

    setCart(prev => {
      const existing = prev.find(c => c.menuItemId === item.id);
      if (!existing) {
        if (delta > 0) {
          setCartBranchId(item.branch_id);
          return [...prev, { menuItemId: item.id, name: item.item_name, price: item.price!, quantity: 1 }];
        }
        return prev;
      }
      const newQty = existing.quantity + delta;
      if (newQty <= 0) {
        const next = prev.filter(c => c.menuItemId !== item.id);
        if (next.length === 0) setCartBranchId(null);
        return next;
      }
      return prev.map(c => c.menuItemId === item.id ? { ...c, quantity: newQty } : c);
    });
  };

  const clearCart = () => { setCart([]); setCartBranchId(null); };

  const placeOrder = async () => {
    if (!cartBranchId || cart.length === 0) return;
    setPlacing(true);
    try {
      await api.post('/orders', {
        branch_id: cartBranchId,
        total_amount: cartTotal,
        items: { create: cart.map(c => ({ menuItemId: c.menuItemId, quantity: c.quantity, price: c.price })) },
      });
      toast.success("Order placed! We'll start preparing it now.");
      clearCart();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  // ── Data fetch ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.get('/customer/recommendations'),
      api.get('/customer/favourites').catch(() => ({ data: [] })),
    ]).then(([recRes, favRes]) => {
      setItems(recRes.data || []);
      setHasFavourites((favRes.data || []).length > 0);
    }).catch(() => {
      setItems([]);
    }).finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero banner */}
      <div className="bg-gradient-to-r from-red-600 to-orange-500 px-6 py-10 text-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-2 text-red-100 text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            Personalised for you
          </div>
          <h1 className="text-3xl font-extrabold mb-1">
            Hey {user.firstName || 'there'}, here's what we picked for you
          </h1>
          <p className="text-red-100 text-sm">
            {hasFavourites
              ? "Based on the dishes you love, we think you'll enjoy these too."
              : 'Explore our top dishes — start favouriting items on the menu to get personalised picks.'}
          </p>
          <button
            onClick={() => navigate('/menu')}
            className="mt-4 inline-flex items-center gap-2 bg-white text-red-600 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-red-50 transition"
          >
            <ShoppingBag className="w-4 h-4" /> Browse Full Menu
          </button>
        </div>
      </div>

      <div className={`max-w-4xl mx-auto px-4 py-8 ${cartCount > 0 ? 'pb-28' : ''}`}>
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
                <div className="h-36 bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-14 h-14 text-red-200 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-700 mb-2">Nothing to show yet</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              Explore the menu and tap the heart icon on dishes you love — we'll use that to curate picks just for you.
            </p>
            <button
              onClick={() => navigate('/menu')}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition"
            >
              Go to Menu <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                {hasFavourites ? 'Dishes you might love' : 'Top picks right now'}
              </h2>
              <span className="text-sm text-gray-400">{items.length} items</span>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map(item => {
                const inCart = cart.find(c => c.menuItemId === item.id);
                const fromDifferentBranch = cartBranchId != null && cartBranchId !== item.branch_id;
                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow ${
                      inCart ? 'border-red-300 ring-1 ring-red-100' : 'border-gray-100'
                    }`}
                  >
                    <div className="relative">
                      <CategoryIcon category={item.category} />
                      {inCart && (
                        <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shadow">
                          {inCart.quantity}
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-gray-800 leading-snug">{item.item_name}</h3>
                        {item.category && (
                          <span className="shrink-0 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                            {item.category}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                        {item.description || 'A top-rated dish loved by our regulars.'}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-800">
                          {item.price != null ? `£${item.price.toFixed(2)}` : '—'}
                        </span>
                        {item.price != null && (
                          inCart ? (
                            <div className="flex items-center gap-1.5">
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
                            </div>
                          ) : (
                            <button
                              onClick={() => adjust(item, +1)}
                              disabled={fromDifferentBranch}
                              title={fromDifferentBranch ? 'Clear your cart to order from a different branch' : undefined}
                              className="flex items-center gap-1 text-xs font-semibold bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg transition"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" /> Add
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Sticky cart bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 border-t border-gray-200 bg-white shadow-2xl">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
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
                </p>
                <p className="text-xs text-gray-500">£{cartTotal.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={clearCart} className="text-xs text-gray-400 hover:text-red-500 px-3 py-1.5 transition">
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

export default Recommendations;
