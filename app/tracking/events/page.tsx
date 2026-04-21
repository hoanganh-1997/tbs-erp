"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Activity, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { cn, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import {
  getTrackingEvents,
  createTrackingEvent,
  type TrackingEvent,
} from "@/lib/tracking-events";

const EVENT_TYPES = [
  "Tất cả",
  "Tạo đơn",
  "Nhập kho TQ",
  "Đóng container",
  "Đang vận chuyển",
  "Đã nộp tờ khai",
  "Đã thông quan",
  "Về kho VN",
  "Đã kiểm hàng",
  "Lên kệ",
  "Đang giao",
  "Đã giao",
  "Sự cố",
  "Ghi chú",
];

const ALL_EVENT_OPTIONS = [
  "Tạo đơn", "Đã báo giá", "Đã cọc", "Đã mua hàng", "Nhập kho TQ",
  "Đóng container", "Xuất kho TQ", "Đang vận chuyển", "Tại biên giới",
  "Đã nộp tờ khai", "Đang kiểm hóa", "Đã thông quan", "Về kho VN",
  "Đã kiểm hàng", "Lên kệ", "Đang giao", "Đã giao", "Hoàn thành", "Sự cố", "Ghi chú",
];

const PAGE_SIZE = 30;

export default function TrackingEventsPage() {
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("Tất cả");
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("q") || "");
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create form
  const [newOrderCode, setNewOrderCode] = useState("");
  const [newContainerCode, setNewContainerCode] = useState("");
  const [newEventType, setNewEventType] = useState("Ghi chú");
  const [newDescription, setNewDescription] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newActor, setNewActor] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getTrackingEvents({
        take: 200,
        sortField: "createdAt",
        sortDirection: "desc",
      });
      setEvents(data);
    } catch {
      toast.error("Lỗi tải sự kiện");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // KPIs
  const today = new Date().toISOString().split("T")[0];
  const eventsToday = events.filter((e) => e.createdAt?.startsWith(today)).length;
  const incidents = events.filter((e) => e.EventType === "Sự cố").length;
  const uniqueOrders = new Set(events.filter((e) => e.OrderId).map((e) => e.OrderId)).size;

  // Filters
  const filtered = events.filter((e) => {
    if (activeFilter !== "Tất cả" && e.EventType !== activeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        e.OrderCode?.toLowerCase().includes(q) ||
        e.ContainerCode?.toLowerCase().includes(q) ||
        e.Description?.toLowerCase().includes(q) ||
        e.Actor?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleCreate = async () => {
    if (!newDescription.trim()) {
      toast.error("Vui lòng nhập mô tả sự kiện");
      return;
    }
    setCreating(true);
    try {
      await createTrackingEvent({
        OrderCode: newOrderCode || undefined,
        ContainerCode: newContainerCode || undefined,
        EventType: newEventType,
        Description: newDescription,
        Location: newLocation || undefined,
        Actor: newActor || undefined,
      });
      toast.success("Đã tạo sự kiện");
      setShowCreateModal(false);
      setNewOrderCode("");
      setNewContainerCode("");
      setNewEventType("Ghi chú");
      setNewDescription("");
      setNewLocation("");
      setNewActor("");
      fetchData();
    } catch {
      toast.error("Lỗi tạo sự kiện");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <a href="/tracking" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
        <ArrowLeft className="w-4 h-4" />Quay lại theo dõi
      </a>

      <PageHeader
        title="Lịch sử sự kiện"
        description="Tất cả sự kiện tracking đơn hàng & container"
        actionLabel="Tạo sự kiện"
        onAction={() => setShowCreateModal(true)}
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard title="Tổng sự kiện" value={events.length} icon={Activity} borderColor="border-l-blue-500" />
        <KpiCard title="Hôm nay" value={eventsToday} icon={Activity} borderColor="border-l-green-500" />
        <KpiCard title="Sự cố" value={incidents} icon={Activity} borderColor="border-l-red-500" subtitle={incidents > 0 ? "cần chú ý" : undefined} subtitleClassName="text-red-500" />
        <KpiCard title="Đơn hàng liên quan" value={uniqueOrders} icon={Activity} borderColor="border-l-indigo-500" />
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="Tìm theo mã đơn, container, mô tả..."
            className="w-full h-10 pl-10 pr-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]"
          />
        </div>
      </div>

      {/* Event type filter chips */}
      <div className="flex gap-1.5 flex-wrap">
        {EVENT_TYPES.map((type) => {
          const count = type === "Tất cả" ? events.length : events.filter((e) => e.EventType === type).length;
          if (type !== "Tất cả" && count === 0) return null;
          return (
            <button
              key={type}
              onClick={() => { setActiveFilter(type); setPage(1); }}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                activeFilter === type
                  ? "bg-[#4F5FD9] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {type} ({count})
            </button>
          );
        })}
      </div>

      {/* Events table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Activity className="w-12 h-12 mb-3" />
          <p className="text-sm">Không có sự kiện</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  {["Loại", "Mã đơn", "Container", "Mô tả", "Vị trí", "Người TH", "Thời gian"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((e) => (
                  <tr key={e.id} className={cn("hover:bg-gray-50", e.EventType === "Sự cố" && "bg-red-50/30")}>
                    <td className="px-4 py-3"><StatusBadge status={e.EventType} /></td>
                    <td className="px-4 py-3">
                      {e.OrderCode ? (
                        e.OrderId ? (
                          <a href={`/orders/${e.OrderId}`} className="text-[#4F5FD9] font-medium hover:underline">{e.OrderCode}</a>
                        ) : (
                          <span className="text-[#4F5FD9] font-medium">{e.OrderCode}</span>
                        )
                      ) : "---"}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {e.ContainerCode ? (
                        e.ContainerId ? (
                          <a href={`/containers/${e.ContainerId}`} className="text-[#4F5FD9] hover:underline">{e.ContainerCode}</a>
                        ) : (
                          <span className="text-gray-700">{e.ContainerCode}</span>
                        )
                      ) : "---"}
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{e.Description || "---"}</td>
                    <td className="px-4 py-3 text-gray-700">{e.Location || "---"}</td>
                    <td className="px-4 py-3 text-gray-700">{e.Actor || "---"}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(e.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">Trước</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">Sau</button>
            </div>
          </div>
        </div>
      )}

      {/* Create modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <h2 className="text-lg font-bold text-[#2D3A8C]">Tạo sự kiện thủ công</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Mã đơn hàng</label>
                <input type="text" value={newOrderCode} onChange={(e) => setNewOrderCode(e.target.value)} placeholder="DH-..." className="w-full h-9 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Mã container</label>
                <input type="text" value={newContainerCode} onChange={(e) => setNewContainerCode(e.target.value)} placeholder="CNT-..." className="w-full h-9 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Loại sự kiện *</label>
              <select value={newEventType} onChange={(e) => setNewEventType(e.target.value)} className="w-full h-9 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]">
                {ALL_EVENT_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Mô tả *</label>
              <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={2} placeholder="Chi tiết sự kiện..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Vị trí</label>
                <input type="text" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="Kho VN, Lạng Sơn..." className="w-full h-9 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Người thực hiện</label>
                <input type="text" value={newActor} onChange={(e) => setNewActor(e.target.value)} placeholder="Tên NV" className="w-full h-9 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Hủy</button>
              <button onClick={handleCreate} disabled={creating} className="inline-flex items-center gap-2 px-5 py-2 bg-[#4F5FD9] hover:bg-[#3B4CC0] text-white rounded-lg text-sm font-medium disabled:opacity-50">
                <Plus className="w-4 h-4" />{creating ? "Đang tạo..." : "Tạo sự kiện"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
