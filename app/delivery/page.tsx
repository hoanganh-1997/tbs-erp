"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Truck, Package, List, Users } from "lucide-react";
import { toast } from "sonner";
import { cn, formatDate, formatCurrency } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import {
  getDeliveryOrders,
  updateDeliveryOrder,
  type DeliveryOrder,
} from "@/lib/delivery-orders";

const STATUS_TABS = [
  "Tất cả",
  "Chờ xếp lịch",
  "Đã xếp lịch",
  "Đang giao",
  "Đã giao",
  "Giao lỗi",
];

const PAGE_SIZE = 20;

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <Package className="w-12 h-12 mb-3" />
      <p className="text-sm">Không có dữ liệu</p>
    </div>
  );
}

function DriverCard({
  driverName,
  deliveries,
  onAction,
}: {
  driverName: string;
  deliveries: DeliveryOrder[];
  onAction: (d: DeliveryOrder, status: string) => void;
}) {
  const totalPackages = deliveries.reduce((sum, d) => sum + (d.Packages ?? 0), 0);
  const totalCOD = deliveries.reduce((sum, d) => sum + (d.CODAmount ?? 0), 0);
  const completed = deliveries.filter((d) => d.Status === "Đã giao").length;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#4F5FD9] flex items-center justify-center">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{driverName || "Chưa phân công"}</p>
              <p className="text-xs text-gray-500">
                {completed}/{deliveries.length} hoàn thành
              </p>
            </div>
          </div>
          <div className="text-right text-xs text-gray-500">
            <p>{totalPackages} kiện</p>
            <p className="font-medium text-gray-700">COD: {formatCurrency(totalCOD)}</p>
          </div>
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {deliveries.map((d) => (
          <div key={d.id} className="px-5 py-3 flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <a
                  href={`/orders/${d.OrderId}`}
                  className="text-sm text-[#4F5FD9] hover:text-[#3B4CC0] hover:underline font-medium"
                >
                  {d.OrderCode}
                </a>
                <StatusBadge status={d.Status} />
              </div>
              <p className="text-xs text-gray-700 truncate">{d.CustomerName}</p>
              <p className="text-xs text-gray-500 truncate">{d.DeliveryAddress}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                <span>{d.TimeSlot}</span>
                <span>{d.Packages ?? 0} kiện</span>
                {(d.CODAmount ?? 0) > 0 && (
                  <span className="font-medium text-orange-600">COD: {formatCurrency(d.CODAmount)}</span>
                )}
              </div>
            </div>
            <div className="flex-shrink-0">
              {d.Status === "Đã xếp lịch" && (
                <button
                  onClick={() => onAction(d, "Đang giao")}
                  className="px-2.5 py-1 rounded text-xs font-medium bg-[#4F5FD9] hover:bg-[#3B4CC0] text-white transition-colors"
                >
                  Bắt đầu giao
                </button>
              )}
              {d.Status === "Đang giao" && (
                <button
                  onClick={() => onAction(d, "Đã giao")}
                  className="px-2.5 py-1 rounded text-xs font-medium bg-green-600 hover:bg-green-700 text-white transition-colors"
                >
                  Hoàn thành
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DeliveryPage() {
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Tất cả");
  const [viewMode, setViewMode] = useState<"driver" | "list">("driver");
  const [dateFilter, setDateFilter] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getDeliveryOrders({
        take: 200,
        sortField: "createdAt",
        sortDirection: "desc",
      });
      setDeliveries(data);
    } catch {
      toast.error("Lỗi tải dữ liệu giao hàng");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    return deliveries.filter((d) => {
      if (activeTab !== "Tất cả" && d.Status !== activeTab) return false;
      // Filter by date
      if (dateFilter && d.ScheduledDate) {
        const scheduled = d.ScheduledDate.slice(0, 10);
        if (scheduled !== dateFilter) return false;
      }
      return true;
    });
  }, [deliveries, activeTab, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Group by driver
  const groupedByDriver = useMemo(() => {
    const groups: Record<string, DeliveryOrder[]> = {};
    filtered.forEach((d) => {
      const driver = d.Driver || "Chưa phân công";
      if (!groups[driver]) groups[driver] = [];
      groups[driver].push(d);
    });
    return groups;
  }, [filtered]);

  const handleAction = async (delivery: DeliveryOrder, newStatus: string) => {
    try {
      await updateDeliveryOrder(delivery.id, { Status: newStatus });
      toast.success(`${delivery.DeliveryCode} -> ${newStatus}`);
      fetchData();
    } catch {
      toast.error("Lỗi cập nhật trạng thái");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Giao hàng" description="Quản lý giao hàng" />

      {/* Date filter + view toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600 font-medium">Ngày:</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]"
          />
        </div>
        <div className="flex border border-gray-300 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode("driver")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors",
              viewMode === "driver" ? "bg-[#4F5FD9] text-white" : "bg-white text-gray-600 hover:bg-gray-50"
            )}
          >
            <Users className="w-4 h-4" />
            Theo tài xế
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors",
              viewMode === "list" ? "bg-[#4F5FD9] text-white" : "bg-white text-gray-600 hover:bg-gray-50"
            )}
          >
            <List className="w-4 h-4" />
            Danh sách
          </button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setPage(1); }}
            className={cn(
              "px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
              activeTab === tab
                ? "border-[#4F5FD9] text-[#4F5FD9]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            {tab}
            <span className="ml-1.5 text-xs text-gray-400">
              ({deliveries.filter((d) => tab === "Tất cả" || d.Status === tab).length})
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <TableSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : viewMode === "driver" ? (
        /* Driver grouped view */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Object.entries(groupedByDriver).map(([driver, driverDeliveries]) => (
            <DriverCard
              key={driver}
              driverName={driver}
              deliveries={driverDeliveries}
              onAction={handleAction}
            />
          ))}
        </div>
      ) : (
        /* Flat table view */
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  {["Mã giao", "Mã đơn", "Khách hàng", "Địa chỉ", "Khung giờ", "Tài xế", "Kiện", "COD", "Trạng thái", "Thao tác"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm">
                      <a
                        href={`/delivery-orders/${d.id}`}
                        className="text-[#4F5FD9] hover:text-[#3B4CC0] hover:underline font-medium"
                      >
                        {d.DeliveryCode}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <a
                        href={`/orders/${d.OrderId}`}
                        className="text-[#4F5FD9] hover:text-[#3B4CC0] hover:underline"
                      >
                        {d.OrderCode}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{d.CustomerName || "---"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-[200px] truncate">
                      {d.DeliveryAddress || "---"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{d.TimeSlot || "---"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{d.Driver || "---"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{d.Packages ?? 0}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(d.CODAmount)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={d.Status} />
                    </td>
                    <td className="px-4 py-3">
                      {d.Status === "Đã xếp lịch" && (
                        <button
                          onClick={() => handleAction(d, "Đang giao")}
                          className="px-2.5 py-1 rounded text-xs font-medium bg-[#4F5FD9] hover:bg-[#3B4CC0] text-white transition-colors"
                        >
                          Bắt đầu giao
                        </button>
                      )}
                      {d.Status === "Đang giao" && (
                        <button
                          onClick={() => handleAction(d, "Đã giao")}
                          className="px-2.5 py-1 rounded text-xs font-medium bg-green-600 hover:bg-green-700 text-white transition-colors"
                        >
                          Hoàn thành
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length} đơn giao
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Trước
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
