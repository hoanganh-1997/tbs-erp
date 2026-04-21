"use client";
import { useState, useEffect, useMemo } from "react";
import { getOrders, type Order } from "@/lib/orders";
import { getAccountsReceivable, type AccountReceivable } from "@/lib/accounts-receivable";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { ShoppingCart, DollarSign, Users, CheckCircle, TrendingDown } from "lucide-react";

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [arRecords, setArRecords] = useState<AccountReceivable[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("Tháng");

  useEffect(() => {
    async function loadData() {
      try {
        const [ordersRes, arRes] = await Promise.all([
          getOrders({ take: 200, sortField: 'createdAt', sortDirection: 'desc' }),
          getAccountsReceivable({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
        ]);
        setOrders(ordersRes.data);
        setArRecords(arRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredOrders = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let cutoff: Date;
    switch (period) {
      case 'Hôm nay': cutoff = startOfDay; break;
      case 'Tuần': cutoff = new Date(startOfDay.getTime() - 7 * 86400000); break;
      case 'Tháng': cutoff = new Date(now.getFullYear(), now.getMonth(), 1); break;
      case 'Quý': { const qm = Math.floor(now.getMonth() / 3) * 3; cutoff = new Date(now.getFullYear(), qm, 1); break; }
      case 'Năm': cutoff = new Date(now.getFullYear(), 0, 1); break;
      default: cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    return orders.filter(o => o.createdAt && new Date(o.createdAt) >= cutoff);
  }, [orders, period]);

  const totalOrders = filteredOrders.length;
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.TotalVND || 0), 0);
  const totalAR = arRecords.reduce((sum, r) => sum + (r.Remaining || 0), 0);
  const overdueAR = arRecords.filter(r => r.Status === 'Quá hạn').reduce((sum, r) => sum + (r.Remaining || 0), 0);
  const completedOrders = filteredOrders.filter(o => o.Status === 'Hoàn thành').length;
  const completionRate = totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : '0';

  const statusCounts = filteredOrders.reduce<Record<string, number>>((acc, o) => {
    const s = o.Status || 'Không rõ';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const recentOrders = filteredOrders.slice(0, 5);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#2D3A8C]">Tổng quan</h1>
        <p className="text-gray-500 mt-1">Xin chào, Tổng Giám đốc</p>
      </div>

      {/* Period tabs */}
      <div className="flex gap-2">
        {['Hôm nay', 'Tuần', 'Tháng', 'Quý', 'Năm'].map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              period === p ? 'bg-[#4F5FD9] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 uppercase tracking-wide">Tổng đơn hàng</span>
            <ShoppingCart className="w-5 h-5 text-gray-400" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-gray-900">{totalOrders}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">{completedOrders} đơn hoàn thành</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 uppercase tracking-wide">Doanh thu</span>
            <DollarSign className="w-5 h-5 text-gray-400" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 uppercase tracking-wide">Công nợ phải thu</span>
            <Users className="w-5 h-5 text-gray-400" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-gray-900">{formatCurrency(totalAR)}</span>
          </div>
          <p className="text-xs text-red-500 mt-1">Quá hạn: {formatCurrency(overdueAR)}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 uppercase tracking-wide">Đơn hoàn thành</span>
            <CheckCircle className="w-5 h-5 text-gray-400" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-gray-900">{completionRate}%</span>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-bold text-[#2D3A8C] mb-4">Biểu đồ doanh thu</h3>
          <div className="flex items-center justify-center h-48 text-gray-400">
            <div className="text-center">
              <p className="text-4xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
              <p className="text-sm text-gray-500 mt-2">Doanh thu tháng này</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-bold text-[#2D3A8C] mb-4">Đơn hàng theo trạng thái</h3>
          <div className="space-y-3">
            {Object.entries(statusCounts).slice(0, 6).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <StatusBadge status={status} />
                <span className="font-medium text-sm">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between p-6 pb-4">
          <h3 className="font-bold text-[#2D3A8C]">Đơn hàng gần đây</h3>
          <a href="/orders" className="text-sm text-[#4F5FD9] hover:underline">Xem tất cả</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Mã đơn</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Khách hàng</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Trạng thái</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Tổng tiền</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">Không có dữ liệu</td></tr>
              ) : (
                recentOrders.map(order => (
                  <tr key={order.id} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <a href={`/orders/${order.id}`} className="text-[#4F5FD9] font-medium text-sm hover:underline">
                        {order.OrderCode}
                      </a>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700">{order.CustomerName}</td>
                    <td className="px-6 py-3"><StatusBadge status={order.Status} /></td>
                    <td className="px-6 py-3 text-sm text-right font-medium">{formatCurrency(order.TotalVND)}</td>
                    <td className="px-6 py-3 text-xs text-gray-500">{formatDate(order.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
