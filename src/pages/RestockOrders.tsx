import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { PackagePlus, RefreshCw, Clock, CheckCheck, ShoppingBag, Truck, AlertTriangle } from 'lucide-react';
import api from '../api/axiosConfig';

interface StockRequest {
  id: string;
  item_name: string;
  quantity: number;
  unit: string;
  notes?: string;
  status: 'PENDING' | 'ACKNOWLEDGED' | 'ORDERED' | 'FULFILLED';
  createdAt: string;
  branch: { id: string; name: string };
  user?: { firstName?: string; lastName?: string; email: string };
}

const STATUS_CONFIG = {
  PENDING:      { label: 'Pending',      icon: Clock,       cls: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  ACKNOWLEDGED: { label: 'Acknowledged', icon: CheckCheck,  cls: 'bg-blue-100   text-blue-800   border-blue-200'   },
  ORDERED:      { label: 'Ordered',      icon: ShoppingBag, cls: 'bg-violet-100 text-violet-800 border-violet-200' },
  FULFILLED:    { label: 'Fulfilled',    icon: Truck,       cls: 'bg-green-100  text-green-800  border-green-200'  },
};

const NEXT_STATUS: Record<string, string> = {
  PENDING:      'ACKNOWLEDGED',
  ACKNOWLEDGED: 'ORDERED',
  ORDERED:      'FULFILLED',
};

const UNITS = ['units', 'kg', 'g', 'litres', 'ml', 'boxes', 'bags', 'crates', 'portions'];

// ── Branch Manager View ───────────────────────────────────────────────────────

const BranchManagerView: React.FC = () => {
  const [requests, setRequests] = useState<StockRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('units');
  const [notes, setNotes] = useState('');

  const fetchRequests = () => {
    api.get('/stock/mine')
      .then(r => setRequests(r.data || []))
      .catch((err) => {
        const status = err.response?.status;
        const msg = err.response?.data?.message || err.message || 'Network error';
        toast.error(`Failed to load requests (${status ?? 'no response'}: ${msg})`);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !quantity) { toast.error('Item name and quantity are required'); return; }
    setSubmitting(true);
    try {
      await api.post('/stock', { item_name: itemName.trim(), quantity: Number(quantity), unit, notes: notes.trim() || undefined });
      toast.success('Restock request submitted');
      setItemName(''); setQuantity(''); setUnit('units'); setNotes('');
      fetchRequests();
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
      const status = e.response?.status;
      const msg = e.response?.data?.message || e.message || 'Network error';
      toast.error(`Failed to submit request (${status ?? 'no response'}: ${msg})`);
    } finally { setSubmitting(false); }
  };

  const pending   = requests.filter(r => r.status === 'PENDING').length;
  const inFlight  = requests.filter(r => r.status === 'ACKNOWLEDGED' || r.status === 'ORDERED').length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Restock Orders</h1>
        <p className="text-sm text-gray-500 mt-1">Submit a request when stock is running low — admin will be notified immediately.</p>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm font-semibold text-yellow-800">
          <AlertTriangle className="w-4 h-4" />{pending} pending
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm font-semibold text-blue-800">
          <Truck className="w-4 h-4" />{inFlight} in progress
        </div>
      </div>

      {/* New request form */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
          <PackagePlus className="w-5 h-5 text-red-600" /> New Restock Request
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Item Name *</label>
              <input
                value={itemName}
                onChange={e => setItemName(e.target.value)}
                placeholder="e.g. Ribeye Steak, Olive Oil"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-red-400 focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Quantity *</label>
                <input
                  type="number" min="1"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-red-400 focus:outline-none"
                />
              </div>
              <div className="w-32">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Unit</label>
                <select
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-red-400 focus:outline-none bg-white"
                >
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Urgency, supplier preference, etc."
              rows={2}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-red-400 focus:outline-none resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition"
          >
            {submitting ? 'Submitting…' : 'Submit Request'}
          </button>
        </form>
      </div>

      {/* Request history */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-800">Your Requests</h2>
          <button onClick={fetchRequests} className="text-gray-400 hover:text-gray-600 transition">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No requests yet. Submit one above.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Item</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Qty</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Notes</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {requests.map(r => {
                const cfg = STATUS_CONFIG[r.status];
                const Icon = cfg.icon;
                return (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-gray-900">{r.item_name}</td>
                    <td className="px-6 py-3 text-gray-600">{r.quantity} {r.unit}</td>
                    <td className="px-6 py-3 text-gray-500 hidden sm:table-cell max-w-xs truncate">{r.notes || '—'}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.cls}`}>
                        <Icon className="w-3 h-3" />{cfg.label}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-400 hidden md:table-cell whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// ── Admin / HQ View ───────────────────────────────────────────────────────────

const AdminView: React.FC = () => {
  const [requests, setRequests]         = useState<StockRequest[]>([]);
  const [loading, setLoading]           = useState(true);
  const [updatingId, setUpdatingId]     = useState<string | null>(null);
  const [lastRefresh, setLastRefresh]   = useState(new Date());
  const [newIds, setNewIds]             = useState<Set<string>>(new Set());
  const knownIds = useRef<Set<string>>(new Set());

  const fetchRequests = (silent = false) => {
    if (!silent) setLoading(true);
    api.get('/stock')
      .then(r => {
        const incoming: StockRequest[] = r.data || [];
        // detect newly arrived requests since last poll
        const fresh = incoming.filter(req => !knownIds.current.has(req.id));
        if (fresh.length > 0 && knownIds.current.size > 0) {
          setNewIds(prev => new Set([...prev, ...fresh.map(f => f.id)]));
          toast.info(`${fresh.length} new restock request${fresh.length > 1 ? 's' : ''} received`);
        }
        knownIds.current = new Set(incoming.map(req => req.id));
        setRequests(incoming);
        setLastRefresh(new Date());
      })
      .catch(() => { if (!silent) toast.error('Failed to load requests'); })
      .finally(() => setLoading(false));
  };

  // Initial load + 10-second polling for real-time updates
  useEffect(() => {
    fetchRequests();
    const interval = setInterval(() => fetchRequests(true), 10_000);
    return () => clearInterval(interval);
  }, []);

  const advance = async (id: string, nextStatus: string) => {
    setUpdatingId(id);
    try {
      const updated = await api.patch(`/stock/${id}`, { status: nextStatus });
      setRequests(prev => prev.map(r => r.id === id ? updated.data : r));
      setNewIds(prev => { const s = new Set(prev); s.delete(id); return s; });
      toast.success(`Marked as ${STATUS_CONFIG[nextStatus as keyof typeof STATUS_CONFIG]?.label}`);
    } catch {
      toast.error('Failed to update status');
    } finally { setUpdatingId(null); }
  };

  const pending = requests.filter(r => r.status === 'PENDING');
  const others  = requests.filter(r => r.status !== 'PENDING');

  const RequestTable: React.FC<{ rows: StockRequest[]; title: string; highlight?: boolean }> = ({ rows, title, highlight }) => (
    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${highlight ? 'border-yellow-300' : 'border-gray-200'}`}>
      <div className={`px-6 py-4 border-b flex items-center justify-between ${highlight ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-100'}`}>
        <div className="flex items-center gap-2">
          {highlight && <AlertTriangle className="w-4 h-4 text-yellow-600" />}
          <h2 className="text-base font-bold text-gray-800">{title}</h2>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${highlight ? 'bg-yellow-200 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}>
            {rows.length}
          </span>
        </div>
        {highlight && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
            Live · refreshed {lastRefresh.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        )}
      </div>
      {rows.length === 0 ? (
        <div className="p-8 text-center text-gray-400 text-sm">None</div>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Branch</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Item</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Qty</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Notes</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Requested</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map(r => {
              const cfg     = STATUS_CONFIG[r.status];
              const Icon    = cfg.icon;
              const next    = NEXT_STATUS[r.status];
              const nextCfg = next ? STATUS_CONFIG[next as keyof typeof STATUS_CONFIG] : null;
              const isNew   = newIds.has(r.id);
              return (
                <tr key={r.id} className={`transition-colors ${isNew ? 'bg-yellow-50 hover:bg-yellow-100' : 'hover:bg-gray-50'}`}>
                  <td className="px-6 py-3 font-medium text-gray-900">{r.branch.name}</td>
                  <td className="px-6 py-3 text-gray-800">
                    <div className="flex items-center gap-1.5">
                      {isNew && <span className="w-2 h-2 bg-yellow-500 rounded-full shrink-0" />}
                      {r.item_name}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-gray-600">{r.quantity} {r.unit}</td>
                  <td className="px-6 py-3 text-gray-500 hidden sm:table-cell max-w-[160px] truncate">{r.notes || '—'}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.cls}`}>
                      <Icon className="w-3 h-3" />{cfg.label}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-400 hidden md:table-cell whitespace-nowrap text-xs">
                    {new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-3">
                    {next && nextCfg && (
                      <button
                        onClick={() => advance(r.id, next)}
                        disabled={updatingId === r.id}
                        className="text-xs font-semibold text-white bg-gray-800 hover:bg-gray-700 disabled:opacity-50 px-3 py-1.5 rounded-lg transition whitespace-nowrap"
                      >
                        {updatingId === r.id ? '…' : `Mark ${nextCfg.label}`}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Restock Requests</h1>
          <p className="text-sm text-gray-500 mt-1">Live feed from all branches · auto-refreshes every 10 seconds</p>
        </div>
        <button
          onClick={() => fetchRequests()}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 px-3 py-2 rounded-lg transition"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">Loading…</div>
      ) : (
        <>
          <RequestTable rows={pending} title="Pending Requests" highlight />
          <RequestTable rows={others}  title="All Other Requests" />
        </>
      )}
    </div>
  );
};

// ── Page entry ────────────────────────────────────────────────────────────────

const RestockOrders: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;
  return user.role === 'BRANCH_MANAGER' ? <BranchManagerView /> : <AdminView />;
};

export default RestockOrders;
