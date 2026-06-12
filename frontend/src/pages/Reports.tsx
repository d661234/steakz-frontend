import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosConfig';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  DollarSign, ShoppingBag, Users, Store, Clock,
  AlertTriangle, Award, ChefHat, UserCheck, TrendingUp, Package,
} from 'lucide-react';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface BranchPerformance {
  branchName: string;
  totalSales: number;
  orderCount: number;
  averageOrderValue: number;
}

interface PeakTime {
  hour: number;
  orderCount: number;
}

interface CustomerFrequency {
  customerName: string;
  email: string;
  orderCount: number;
}

interface TopMenuItem {
  id: string;
  item_name: string;
  viewCount: number;
}

interface InventoryAlert {
  id: string;
  type: 'manual' | 'restock';
  branchName: string;
  itemName: string;
  currentStock: number;
  lowStockThreshold: number;
  alertDate: string;
  status: string | null;
  quantity: number | null;
  unit: string | null;
  notes: string | null;
}

interface GlobalStats {
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
  totalBranches: number;
}

interface StaffMember {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  branch?: { name: string };
}

// ─── Palette per role ─────────────────────────────────────────────────────────

const ADMIN_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];
const HQ_COLORS    = ['#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6'];
const BM_COLORS    = ['#10b981', '#14b8a6', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444'];

const ROLE_BADGE: Record<string, string> = {
  ADMIN:          'bg-red-100 text-red-700',
  HQ_MANAGER:     'bg-violet-100 text-violet-700',
  BRANCH_MANAGER: 'bg-emerald-100 text-emerald-700',
  CHEF:           'bg-orange-100 text-orange-700',
  WAITER:         'bg-sky-100 text-sky-700',
};

const fmt = (n: number) => `£${Number(n).toFixed(2)}`;

// ─── Shared atoms ─────────────────────────────────────────────────────────────

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 ${className}`}>{children}</div>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-base font-semibold text-gray-800 mb-4">{children}</h2>
);

const NoData: React.FC<{ message?: string }> = ({ message = 'No data available yet' }) => (
  <div className="flex flex-col items-center justify-center py-10 text-gray-300">
    <Package className="w-8 h-8 mb-2" />
    <p className="text-sm">{message}</p>
  </div>
);

// ─── Shared blocks ────────────────────────────────────────────────────────────

const InventoryAlertCards: React.FC<{ alerts: InventoryAlert[] }> = ({ alerts }) => (
  <div>
    <SectionTitle>Inventory Alerts</SectionTitle>
    {alerts.length === 0 ? (
      <Card><NoData message="No inventory alerts at the moment" /></Card>
    ) : (
      <div className="grid gap-4 lg:grid-cols-2">
        {alerts.map(alert => (
          <div
            key={alert.id}
            className={`rounded-xl border p-4 ${
              alert.type === 'restock' ? 'border-amber-200 bg-amber-50' : 'border-red-200 bg-red-50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-900 text-sm">{alert.itemName}</span>
              {alert.type === 'restock' ? (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  alert.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {alert.status === 'PENDING' ? 'Restock Pending' : 'Acknowledged'}
                </span>
              ) : (
                <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                  Low Stock
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">Branch: {alert.branchName}</p>
            {alert.type === 'restock' ? (
              <>
                <p className="text-xs text-gray-500">Requested: {alert.quantity} {alert.unit}</p>
                {alert.notes && <p className="text-xs text-gray-400 italic mt-1">"{alert.notes}"</p>}
              </>
            ) : (
              <p className="text-xs text-gray-500">
                Stock: {alert.currentStock} / threshold {alert.lowStockThreshold}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-1">{new Date(alert.alertDate).toLocaleString()}</p>
          </div>
        ))}
      </div>
    )}
  </div>
);

const StaffTable: React.FC<{ staff: StaffMember[]; showBranch?: boolean }> = ({ staff, showBranch = true }) =>
  staff.length === 0 ? (
    <NoData message="No staff members found" />
  ) : (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Name</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Email</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Role</th>
            {showBranch && <th className="px-4 py-3 text-left font-semibold text-gray-600">Branch</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {staff.map(m => (
            <tr key={m.id} className="hover:bg-gray-50 transition">
              <td className="px-4 py-3 font-medium text-gray-800">
                {`${m.firstName || ''} ${m.lastName || ''}`.trim() || '—'}
              </td>
              <td className="px-4 py-3 text-gray-500">{m.email}</td>
              <td className="px-4 py-3">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_BADGE[m.role] ?? 'bg-gray-100 text-gray-600'}`}>
                  {m.role.replace(/_/g, ' ')}
                </span>
              </td>
              {showBranch && <td className="px-4 py-3 text-gray-500">{m.branch?.name || '—'}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

// ─── ADMIN layout ─────────────────────────────────────────────────────────────
// Layout: stat cards → full-width branch sales bar → 3-col analytics row →
// staff table → inventory alerts.

interface ViewProps {
  globalStats: GlobalStats;
  branchPerformance: BranchPerformance[];
  peakTimes: PeakTime[];
  topMenuItems: TopMenuItem[];
  customerFrequency: CustomerFrequency[];
  inventoryAlerts: InventoryAlert[];
  staff: StaffMember[];
}

const AdminReportsView: React.FC<ViewProps> = ({
  globalStats, branchPerformance, peakTimes, topMenuItems,
  customerFrequency, inventoryAlerts, staff,
}) => {
  const sorted = [...peakTimes].sort((a, b) => a.hour - b.hour).map(t => ({ ...t, label: `${t.hour}:00` }));

  return (
    <div className="space-y-8">
      {/* 4 stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
        {([
          { label: 'Total Revenue',  value: fmt(globalStats.totalSales),               icon: <DollarSign  className="w-5 h-5 text-red-600"    />, bg: 'bg-red-50',    sub: 'All branches · paid' },
          { label: 'Total Orders',   value: globalStats.totalOrders.toLocaleString(),   icon: <ShoppingBag className="w-5 h-5 text-orange-600" />, bg: 'bg-orange-50', sub: 'Across all branches' },
          { label: 'Customers',      value: globalStats.totalCustomers.toLocaleString(),icon: <Users       className="w-5 h-5 text-amber-600"  />, bg: 'bg-amber-50',  sub: 'Registered accounts' },
          { label: 'Branches',       value: globalStats.totalBranches.toLocaleString(), icon: <Store       className="w-5 h-5 text-green-600"  />, bg: 'bg-green-50',  sub: 'Active locations' },
        ] as const).map(c => (
          <div key={c.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{c.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{c.value}</p>
                <p className="text-xs text-gray-400 mt-1">{c.sub}</p>
              </div>
              <div className={`p-3 rounded-xl ${c.bg}`}>{c.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Full-width branch sales bar chart */}
      <Card>
        <SectionTitle>Branch Sales Comparison</SectionTitle>
        {branchPerformance.length === 0 ? <NoData /> : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={branchPerformance.map(b => ({ ...b, totalSales: Number(b.totalSales) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
              <XAxis dataKey="branchName" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `£${v}`} />
              <Tooltip formatter={(v: unknown) => [`£${Number(v).toFixed(2)}`, 'Revenue']} />
              <Bar dataKey="totalSales" name="Revenue" radius={[6, 6, 0, 0]}>
                {branchPerformance.map((_, i) => (
                  <Cell key={i} fill={ADMIN_COLORS[i % ADMIN_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* 3-col analytics: peak hours line | top items horizontal bar | top customers ranked list */}
      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <SectionTitle>Peak Order Hours</SectionTitle>
          {sorted.length === 0 ? <NoData /> : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={sorted}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="orderCount" name="Orders" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <SectionTitle>Top Menu Items</SectionTitle>
          {topMenuItems.length === 0 ? <NoData /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                layout="vertical"
                data={topMenuItems.slice(0, 5).map(i => ({
                  name: i.item_name.length > 14 ? i.item_name.slice(0, 13) + '…' : i.item_name,
                  views: i.viewCount,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={85} />
                <Tooltip />
                <Bar dataKey="views" name="Views" fill="#f97316" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <SectionTitle>Top Customers</SectionTitle>
          {customerFrequency.length === 0 ? <NoData /> : (
            <ul className="space-y-2">
              {customerFrequency.slice(0, 6).map((c, i) => (
                <li key={c.email} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-red-100 text-red-600 text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{c.customerName || c.email}</p>
                    <p className="text-xs text-gray-400">{c.orderCount} orders</p>
                  </div>
                  <Award className={`w-4 h-4 shrink-0 ${
                    i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-600' : 'text-gray-200'
                  }`} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Staff table */}
      <Card>
        <SectionTitle>All Staff Members</SectionTitle>
        <StaffTable staff={staff} showBranch />
      </Card>

      {/* Inventory alerts */}
      <InventoryAlertCards alerts={inventoryAlerts} />
    </div>
  );
};

// ─── HQ MANAGER layout ────────────────────────────────────────────────────────
// Layout: stat cards → area chart + donut → branch detail table with progress bars →
// peak hours line + customer frequency bar → inventory alerts → staff table.

const HQReportsView: React.FC<ViewProps> = ({
  globalStats, branchPerformance, peakTimes,
  customerFrequency, inventoryAlerts, staff,
}) => {
  const sorted   = [...peakTimes].sort((a, b) => a.hour - b.hour).map(t => ({ ...t, label: `${t.hour}:00` }));
  const pieData  = branchPerformance.map(b => ({ name: b.branchName, value: b.orderCount }));
  const maxSales = Math.max(...branchPerformance.map(b => Number(b.totalSales)), 1);

  return (
    <div className="space-y-8">
      {/* 4 stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
        {([
          { label: 'System Revenue',  value: fmt(globalStats.totalSales),               icon: <TrendingUp  className="w-5 h-5 text-violet-600" />, bg: 'bg-violet-50' },
          { label: 'Total Orders',    value: globalStats.totalOrders.toLocaleString(),   icon: <ShoppingBag className="w-5 h-5 text-indigo-600" />, bg: 'bg-indigo-50' },
          { label: 'Customers',       value: globalStats.totalCustomers.toLocaleString(),icon: <Users       className="w-5 h-5 text-blue-600"   />, bg: 'bg-blue-50'   },
          { label: 'Active Branches', value: globalStats.totalBranches.toLocaleString(), icon: <Store       className="w-5 h-5 text-cyan-600"   />, bg: 'bg-cyan-50'   },
        ] as const).map(c => (
          <div key={c.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{c.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{c.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${c.bg}`}>{c.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Area chart (3/5) + donut (2/5) */}
      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <SectionTitle>Revenue by Branch</SectionTitle>
          {branchPerformance.length === 0 ? <NoData /> : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={branchPerformance.map(b => ({ name: b.branchName, revenue: Number(b.totalSales), orders: b.orderCount }))}>
                <defs>
                  <linearGradient id="hqGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `£${v}`} />
                <Tooltip
                  formatter={(v: unknown, name: unknown) =>
                    [name === 'revenue' ? `£${Number(v).toFixed(2)}` : Number(v), name === 'revenue' ? 'Revenue' : 'Orders']
                  }
                />
                <Area type="monotone" dataKey="revenue" name="revenue" stroke="#8b5cf6" strokeWidth={2} fill="url(#hqGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="xl:col-span-2">
          <SectionTitle>Order Share by Branch</SectionTitle>
          {pieData.length === 0 ? <NoData /> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  dataKey="value"
                  nameKey="name"
                  label={({ percent }) => (percent ?? 0) > 0.05 ? `${((percent ?? 0) * 100).toFixed(0)}%` : ''}
                  labelLine={false}
                >
                  {pieData.map((_, i) => <Cell key={i} fill={HQ_COLORS[i % HQ_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: unknown, n: unknown) => [`${Number(v)} orders`, String(n)]} />
                <Legend iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Branch performance detail table with inline progress bars */}
      <Card>
        <SectionTitle>Branch Performance Details</SectionTitle>
        {branchPerformance.length === 0 ? <NoData /> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Branch</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Revenue</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Orders</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Avg. Order</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 w-44">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {branchPerformance.map(b => {
                const pct = (Number(b.totalSales) / maxSales) * 100;
                return (
                  <tr key={b.branchName} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-800">{b.branchName}</td>
                    <td className="px-4 py-3 text-right font-semibold text-violet-600">{fmt(Number(b.totalSales))}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{b.orderCount}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{fmt(Number(b.averageOrderValue))}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div className="h-2 rounded-full bg-violet-500 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-400 w-8">{pct.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {/* Peak hours line + customer frequency bar */}
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <SectionTitle>Peak Order Hours</SectionTitle>
          {sorted.length === 0 ? <NoData /> : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={sorted}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="orderCount" name="Orders" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <SectionTitle>Customer Order Frequency</SectionTitle>
          {customerFrequency.length === 0 ? <NoData /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={customerFrequency.slice(0, 6).map(c => ({
                  name: (c.customerName || c.email).split(' ')[0],
                  orders: c.orderCount,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="orders" name="Orders" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Inventory alerts full width */}
      <InventoryAlertCards alerts={inventoryAlerts} />

      {/* Staff directory */}
      <Card>
        <SectionTitle>Staff Directory</SectionTitle>
        <StaffTable staff={staff} showBranch />
      </Card>
    </div>
  );
};

// ─── BRANCH MANAGER layout ────────────────────────────────────────────────────
// Layout: urgent alert banner → 3 hero stat cards (gradient first) →
// full-width busiest hours bar → popular items pie + team roster → inventory alerts.

interface BMViewProps {
  globalStats: GlobalStats;
  branchPerformance: BranchPerformance[];
  peakTimes: PeakTime[];
  topMenuItems: TopMenuItem[];
  inventoryAlerts: InventoryAlert[];
  staff: StaffMember[];
}

const BranchManagerReportsView: React.FC<BMViewProps> = ({
  globalStats, branchPerformance, peakTimes, topMenuItems, inventoryAlerts, staff,
}) => {
  const sorted       = [...peakTimes].sort((a, b) => a.hour - b.hour).map(t => ({ ...t, label: `${t.hour}:00` }));
  const maxCount     = Math.max(...sorted.map(t => t.orderCount), 1);
  const menuPie      = topMenuItems.slice(0, 6).map(i => ({ name: i.item_name, value: i.viewCount }));
  const branchLabel  = branchPerformance[0]?.branchName ?? 'your branch';
  const lowStockCount = inventoryAlerts.filter(a => a.type === 'manual').length;

  return (
    <div className="space-y-8">
      {/* Urgent banner when there are low-stock alerts */}
      {lowStockCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700">
              {lowStockCount} low-stock alert{lowStockCount > 1 ? 's' : ''} require your attention
            </p>
            <p className="text-xs text-red-400 mt-0.5">Scroll down to review and raise restock orders.</p>
          </div>
        </div>
      )}

      {/* 3 hero stat cards — first uses gradient */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
          <p className="text-emerald-100 text-sm font-medium">Branch Revenue</p>
          <p className="text-4xl font-bold mt-2">{fmt(globalStats.totalSales)}</p>
          <p className="text-emerald-200 text-xs mt-1">From paid orders only</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-500">Total Orders</p>
            <ShoppingBag className="w-5 h-5 text-teal-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{globalStats.totalOrders.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">All statuses included</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-500">Unique Customers</p>
            <Users className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{globalStats.totalCustomers.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">Served at this branch</p>
        </div>
      </div>

      {/* Full-width busiest hours bar — operationally critical for shift scheduling */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-emerald-500" />
          <h2 className="text-base font-semibold text-gray-800">Busiest Hours — {branchLabel}</h2>
        </div>
        {sorted.length === 0 ? (
          <NoData message="No orders recorded yet — check back after the first orders are placed" />
        ) : (
          <>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={sorted}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: unknown) => [Number(v), 'Orders']} />
                <Bar dataKey="orderCount" name="Orders" radius={[6, 6, 0, 0]}>
                  {sorted.map((t, i) => (
                    <Cell key={i} fill={t.orderCount === maxCount ? '#10b981' : '#6ee7b7'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-400 mt-2">
              Tip: schedule extra staff during the highlighted peak hours to keep service smooth.
            </p>
          </>
        )}
      </Card>

      {/* Popular items pie (2/5) + team roster cards (3/5) */}
      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-2">
          <SectionTitle>Popular Menu Items</SectionTitle>
          {menuPie.length === 0 ? <NoData /> : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={menuPie}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ percent }) => (percent ?? 0) > 0.08 ? `${((percent ?? 0) * 100).toFixed(0)}%` : ''}
                    labelLine={false}
                  >
                    {menuPie.map((_, i) => <Cell key={i} fill={BM_COLORS[i % BM_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: unknown, n: unknown) => [`${Number(v)} views`, String(n)]} />
                </PieChart>
              </ResponsiveContainer>
              <ul className="space-y-1.5 mt-2">
                {menuPie.map((item, i) => (
                  <li key={item.name} className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: BM_COLORS[i % BM_COLORS.length] }} />
                    <span className="text-gray-700 truncate flex-1">{item.name}</span>
                    <span className="text-gray-400 text-xs">{item.value}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>

        <Card className="xl:col-span-3">
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="w-5 h-5 text-emerald-500" />
            <h2 className="text-base font-semibold text-gray-800">My Team</h2>
          </div>
          {staff.length === 0 ? (
            <NoData message="No staff assigned to this branch yet" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {staff.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    {m.role === 'CHEF'
                      ? <ChefHat className="w-4 h-4 text-orange-500" />
                      : <UserCheck className="w-4 h-4 text-emerald-600" />
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {`${m.firstName || ''} ${m.lastName || ''}`.trim() || m.email}
                    </p>
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${ROLE_BADGE[m.role] ?? 'bg-gray-100 text-gray-600'}`}>
                      {m.role.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Inventory alerts */}
      <InventoryAlertCards alerts={inventoryAlerts} />
    </div>
  );
};

// ─── Main Reports component ───────────────────────────────────────────────────

const Reports: React.FC = () => {
  const { user } = useAuth();
  const [globalStats,        setGlobalStats]        = useState<GlobalStats | null>(null);
  const [branchPerformance,  setBranchPerformance]  = useState<BranchPerformance[]>([]);
  const [peakTimes,          setPeakTimes]          = useState<PeakTime[]>([]);
  const [customerFrequency,  setCustomerFrequency]  = useState<CustomerFrequency[]>([]);
  const [topMenuItems,       setTopMenuItems]       = useState<TopMenuItem[]>([]);
  const [inventoryAlerts,    setInventoryAlerts]    = useState<InventoryAlert[]>([]);
  const [staff,              setStaff]              = useState<StaffMember[]>([]);
  const [loading,            setLoading]            = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const [statsRes, branchesRes, peakRes, customerRes, topMenuRes, inventoryRes, staffRes] = await Promise.all([
          api.get('/hq/analytics/global-stats'),
          api.get('/hq/analytics/branches'),
          api.get('/hq/analytics/peak-times'),
          api.get('/hq/analytics/customer-frequency'),
          api.get('/hq/analytics/top-menu-items'),
          api.get('/hq/analytics/inventory-alerts'),
          api.get('/hq/staff'),
        ]);
        setGlobalStats(statsRes.data);
        setBranchPerformance(branchesRes.data);
        setPeakTimes(peakRes.data);
        setCustomerFrequency(customerRes.data);
        setTopMenuItems(topMenuRes.data);
        setInventoryAlerts(inventoryRes.data);
        setStaff(staffRes.data);
      } catch {
        toast.error('Failed to load report data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (!user) return null;

  const isBM    = user.role === 'BRANCH_MANAGER';
  const isAdmin = user.role === 'ADMIN';
  const isHQ    = user.role === 'HQ_MANAGER';

  const title = isBM ? 'Branch Report' : 'Reports';
  const subtitle = isBM
    ? 'Operational overview for your branch'
    : isAdmin
    ? 'System-wide analytics & management'
    : 'Cross-branch performance & insights';

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      </div>

      {loading && (
        <div className="flex items-center gap-3 text-gray-500 py-6">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          Loading report data…
        </div>
      )}

      {!loading && globalStats && isAdmin && (
        <AdminReportsView
          globalStats={globalStats}
          branchPerformance={branchPerformance}
          peakTimes={peakTimes}
          topMenuItems={topMenuItems}
          customerFrequency={customerFrequency}
          inventoryAlerts={inventoryAlerts}
          staff={staff}
        />
      )}

      {!loading && globalStats && isHQ && (
        <HQReportsView
          globalStats={globalStats}
          branchPerformance={branchPerformance}
          peakTimes={peakTimes}
          topMenuItems={topMenuItems}
          customerFrequency={customerFrequency}
          inventoryAlerts={inventoryAlerts}
          staff={staff}
        />
      )}

      {!loading && globalStats && isBM && (
        <BranchManagerReportsView
          globalStats={globalStats}
          branchPerformance={branchPerformance}
          peakTimes={peakTimes}
          topMenuItems={topMenuItems}
          inventoryAlerts={inventoryAlerts}
          staff={staff}
        />
      )}
    </div>
  );
};

export default Reports;
