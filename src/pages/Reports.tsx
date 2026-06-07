import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosConfig';
import { toast } from 'sonner';

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
  branchName: string;
  itemName: string;
  currentStock: number;
  lowStockThreshold: number;
  alertDate: string;
}

interface GlobalStats {
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
  totalBranches: number;
}

const Reports: React.FC = () => {
  const { user } = useAuth();
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [branchPerformance, setBranchPerformance] = useState<BranchPerformance[]>([]);
  const [peakTimes, setPeakTimes] = useState<PeakTime[]>([]);
  const [customerFrequency, setCustomerFrequency] = useState<CustomerFrequency[]>([]);
  const [topMenuItems, setTopMenuItems] = useState<TopMenuItem[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<InventoryAlert[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const [statsRes, branchesRes, peakRes, customerRes, topMenuRes, inventoryRes] = await Promise.all([
          api.get('/hq/analytics/global-stats'),
          api.get('/hq/analytics/branches'),
          api.get('/hq/analytics/peak-times'),
          api.get('/hq/analytics/customer-frequency'),
          api.get('/hq/analytics/top-menu-items'),
          api.get('/hq/analytics/inventory-alerts'),
        ]);

        setGlobalStats(statsRes.data);
        setBranchPerformance(branchesRes.data);
        setPeakTimes(peakRes.data);
        setCustomerFrequency(customerRes.data);
        setTopMenuItems(topMenuRes.data);
        setInventoryAlerts(inventoryRes.data);
      } catch (error: unknown) {
        toast.error('Failed to load report data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchReports();
    }
  }, [user]);

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Reports</h1>
      {loading && <p className="text-gray-600">Loading reports...</p>}

      {globalStats && (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800">Total Sales</h2>
            <p className="mt-4 text-2xl font-bold text-green-600">${globalStats.totalSales.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800">Total Orders</h2>
            <p className="mt-4 text-2xl font-bold text-gray-800">{globalStats.totalOrders}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800">Customers</h2>
            <p className="mt-4 text-2xl font-bold text-gray-800">{globalStats.totalCustomers}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800">Branches</h2>
            <p className="mt-4 text-2xl font-bold text-gray-800">{globalStats.totalBranches}</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Branch Performance</h2>
          <div className="space-y-4">
            {branchPerformance.map((branch) => (
              <div key={branch.branchName} className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900">{branch.branchName}</h3>
                <p className="text-sm text-gray-600">Orders: {branch.orderCount}</p>
                <p className="text-sm text-gray-600">Sales: ${branch.totalSales.toFixed(2)}</p>
                <p className="text-sm text-gray-600">Avg. Order: ${branch.averageOrderValue.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Peak Order Times</h2>
          <ul className="space-y-3">
            {peakTimes.map((entry) => (
              <li key={entry.hour} className="rounded-lg border p-4">
                <span className="font-semibold">{entry.hour}:00</span> — {entry.orderCount} orders
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-6 bg-white rounded-xl shadow p-6">
        <h2 className="text-2xl font-semibold mb-4">Inventory Alerts</h2>
        {inventoryAlerts.length === 0 ? (
          <p className="text-gray-600">No inventory alerts at the moment.</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {inventoryAlerts.map((alert) => (
              <div key={alert.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{alert.itemName}</h3>
                  <span className="text-sm text-red-600">Low stock</span>
                </div>
                <p className="text-sm text-gray-600">Branch: {alert.branchName}</p>
                <p className="text-sm text-gray-600">Current stock: {alert.currentStock}</p>
                <p className="text-sm text-gray-600">Threshold: {alert.lowStockThreshold}</p>
                <p className="text-sm text-gray-500">Alert date: {new Date(alert.alertDate).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-2 mt-6">
        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Top Menu Items</h2>
          <ul className="space-y-3">
            {topMenuItems.map((item) => (
              <li key={item.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{item.item_name}</span>
                  <span className="text-sm text-gray-600">Views: {item.viewCount}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Top Customers</h2>
          <ul className="space-y-3">
            {customerFrequency.map((customer) => (
              <li key={customer.email} className="rounded-lg border p-4">
                <div className="font-semibold">{customer.customerName || customer.email}</div>
                <div className="text-sm text-gray-600">Orders: {customer.orderCount}</div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default Reports;
