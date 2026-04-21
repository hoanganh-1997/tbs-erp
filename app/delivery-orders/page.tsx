"use client";

import { useEffect, useState, useCallback } from "react";
import { cn, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { toast } from "sonner";
import { getDeliveryOrders, updateDeliveryOrder } from "@/lib/delivery-orders";
import type { DeliveryOrder } from "@/lib/delivery-orders";
import { ClipboardList, Search } from "lucide-react";

const STATUS_TABS = ["Tất cả", "Chờ xếp lịch", "Đã xếp lịch", "Đang giao", "Đã giao", "Giao lỗi", "Trả lại"] as const;
const PAGE_SIZE = 20;

function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-12 bg-gray-100 rounded" />
      ))}
    </div>
  );
}

export default function DeliveryOrdersPage() {
  const [data, setData] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("Tất cả");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDeliveryOrders({ take: 200, sortField: "createdAt", sortDirection: "desc" });
      setData(res.data);
    } catch {
      toast.error("Lỗi tải dữ liệu lệnh giao hàng");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = data.filter((r) => {
    if (activeTab !== "Tất cả" && r.Status !== activeTab) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (
        !(r.DeliveryCode || "").toLowerCase().includes(q) &&
        !(r.OrderCode || "").toLowerCase().includes(q) &&
        !(r.CustomerName || "").toLowerCase().includes(q) &&
        !(r.Driver || "").toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleStartDelivery = async (item: DeliveryOrder) => {
    try {
      await updateDeliveryOrder(item.id, { Status: "Đang giao" });
      toast.success(`Bắt đầu giao ${item.DeliveryCode}`);
      fetchData();
    } catch {
      toast.error("Lỗi cập nhật trạng thái");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Lệnh giao hàng" description="Quản lý lệnh giao hàng & xếp lịch" />

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Tìm mã lệnh, mã đơn, khách hàng, tài xế..."
          className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none"
        />
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setPage(1); }}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
              activeTab === tab
                ? "border-[#4F5FD9] text-[#4F5FD9]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            {tab}
            <span className="ml-1.5 text-xs text-gray-400">
              ({data.filter((r) => tab === "Tất cả" || r.Status === tab).length})
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState title="Không có lệnh giao hàng" description="Chưa có dữ liệu lệnh giao hàng" icon={ClipboardList} />
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mã lệnh</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mã đơn</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Khách hàng</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Người nhận</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tài xế</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ngày giao</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Khung giờ</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Kiện</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      <a href={`/delivery-orders/${r.id}`} className="text-[#4F5FD9] hover:text-[#3B4CC0] hover:underline">{r.DeliveryCode || "---"}</a>
                    </td>
                    <td className="px-4 py-3">
                      {r.OrderId ? (
                        <a href={`/orders/${r.OrderId}`} className="text-[#4F5FD9] hover:text-[#3B4CC0] font-medium">{r.OrderCode}</a>
                      ) : <span className="text-gray-400">---</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{r.CustomerName || "---"}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {r.ReceiverName || "---"}
                      {r.ReceiverPhone && <span className="text-gray-400 text-xs ml-1">({r.ReceiverPhone})</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{r.Driver || "---"}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(r.ScheduledDate)}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{r.TimeSlot || "---"}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{r.Packages ?? 0}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.Status} /></td>
                    <td className="px-4 py-3">
                      {r.Status === "Đã xếp lịch" && (
                        <button
                          onClick={() => handleStartDelivery(r)}
                          className="text-xs font-medium text-[#4F5FD9] hover:text-[#3B4CC0] whitespace-nowrap"
                        >
                          Bắt đầu giao
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Hiện {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length}
              </p>
              <div className="flex gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50">Trước</button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50">Sau</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
