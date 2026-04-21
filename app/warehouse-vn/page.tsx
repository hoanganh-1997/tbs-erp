"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Package, Layers, AlertTriangle, Truck, Calendar } from "lucide-react";
import { toast } from "sonner";
import { cn, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import {
  getWarehouseVnReceipts,
  updateWarehouseVnReceipt,
  type WarehouseVnReceipt,
} from "@/lib/warehouse-vn-receipts";

const STATUS_TABS = [
  "Tất cả",
  "Chờ dỡ",
  "Đã dỡ",
  "Đã kiểm",
  "Trên kệ",
  "Đang pick",
  "Chờ giao",
  "Đã giao",
];

const WAREHOUSES = ["Tất cả", "Đông Anh (HN)", "Hóc Môn (HCM)"];

const SHELF_ZONES = ["Tất cả", "A", "B", "C", "D", "VIP", "Tạm giữ"];

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

export default function WarehouseVnPage() {
  const [receipts, setReceipts] = useState<WarehouseVnReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Tất cả");
  const [warehouseFilter, setWarehouseFilter] = useState("Tất cả");
  const [shelfFilter, setShelfFilter] = useState("Tất cả");
  const [scanQuery, setScanQuery] = useState("");
  const [searchApplied, setSearchApplied] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchUpdating, setBatchUpdating] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getWarehouseVnReceipts({
        take: 200,
        sortField: "createdAt",
        sortDirection: "desc",
      });
      setReceipts(data);
    } catch {
      toast.error("Lỗi tải dữ liệu kho VN");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // KPIs
  const onShelf = receipts.filter((r) => r.Status === "Trên kệ").length;
  const pendingDelivery = receipts.filter((r) => r.Status === "Chờ giao").length;
  const unresolvedDiscrepancies = receipts.filter(
    (r) => (r.Discrepancy ?? 0) !== 0 && !r.DiscrepancyResolved
  ).length;
  const today = new Date().toISOString().split("T")[0];
  const receivedToday = receipts.filter(
    (r) => r.createdAt && r.createdAt.startsWith(today)
  ).length;

  // Filters
  const filtered = receipts.filter((r) => {
    if (activeTab !== "Tất cả" && r.Status !== activeTab) return false;
    if (warehouseFilter !== "Tất cả" && r.Warehouse !== warehouseFilter) return false;
    if (shelfFilter !== "Tất cả" && r.ShelfZone !== shelfFilter) return false;
    if (searchApplied) {
      const q = searchApplied.toLowerCase();
      const matchesReceipt = r.ReceiptCode?.toLowerCase().includes(q);
      const matchesOrder = r.OrderCode?.toLowerCase().includes(q);
      if (!matchesReceipt && !matchesOrder) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleScan = () => {
    setSearchApplied(scanQuery.trim());
    setPage(1);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === paginated.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginated.map((r) => r.id)));
    }
  };

  const handleBatchStatus = async (newStatus: string) => {
    if (selected.size === 0) return;
    setBatchUpdating(true);
    try {
      const ids = Array.from(selected);
      for (const id of ids) {
        await updateWarehouseVnReceipt(id, { Status: newStatus });
      }
      toast.success(`Đã cập nhật ${selected.size} phiếu → ${newStatus}`);
      setSelected(new Set());
      fetchData();
    } catch {
      toast.error("Lỗi cập nhật hàng loạt");
    } finally {
      setBatchUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kho Việt Nam"
        description="Quản lý nhận hàng & tồn kho VN"
        actionLabel="Nhận hàng"
        actionHref="/warehouse-vn/new"
        secondaryActionLabel="Tồn kho"
        onSecondaryAction={() => window.location.href = "/warehouse-vn/inventory"}
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard
          title="Trên kệ"
          value={onShelf}
          icon={Layers}
          borderColor="border-l-cyan-500"
          subtitle="kiện đang lưu kho"
        />
        <KpiCard
          title="Chờ giao"
          value={pendingDelivery}
          icon={Truck}
          borderColor="border-l-blue-500"
          subtitle="kiện chờ lệnh giao"
        />
        <KpiCard
          title="Chênh lệch"
          value={unresolvedDiscrepancies}
          icon={AlertTriangle}
          borderColor="border-l-red-500"
          subtitle="chưa xử lý"
          subtitleClassName={unresolvedDiscrepancies > 0 ? "text-red-500" : undefined}
        />
        <KpiCard
          title="Nhận hôm nay"
          value={receivedToday}
          icon={Calendar}
          borderColor="border-l-green-500"
          subtitle="phiếu mới"
        />
      </div>

      {/* Scan input */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={scanQuery}
              onChange={(e) => setScanQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScan()}
              placeholder="Quét mã phiếu hoặc mã đơn (Enter để tra cứu)"
              className="w-full h-12 text-lg pl-12 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent"
            />
          </div>
          <button
            onClick={handleScan}
            className="h-12 px-6 bg-[#4F5FD9] hover:bg-[#3B4CC0] text-white rounded-lg text-sm font-medium transition-colors"
          >
            Tra cứu
          </button>
        </div>
        {searchApplied && (
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
            <span>Đang lọc: &quot;{searchApplied}&quot;</span>
            <button
              onClick={() => { setSearchApplied(""); setScanQuery(""); }}
              className="text-[#4F5FD9] hover:text-[#3B4CC0] underline"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 font-medium">Kho:</label>
          <select
            value={warehouseFilter}
            onChange={(e) => { setWarehouseFilter(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]"
          >
            {WAREHOUSES.map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 font-medium">Khu:</label>
          <div className="flex gap-1">
            {SHELF_ZONES.map((z) => (
              <button
                key={z}
                onClick={() => { setShelfFilter(z); setPage(1); }}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                  shelfFilter === z
                    ? "bg-[#4F5FD9] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {z}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Batch actions */}
      {selected.size > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 flex items-center gap-3">
          <span className="text-sm font-medium text-indigo-700">
            Đã chọn {selected.size} phiếu
          </span>
          <button
            onClick={() => handleBatchStatus("Đã kiểm")}
            disabled={batchUpdating}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            → Đã kiểm
          </button>
          <button
            onClick={() => handleBatchStatus("Trên kệ")}
            disabled={batchUpdating}
            className="px-3 py-1.5 bg-cyan-600 text-white rounded-md text-xs font-medium hover:bg-cyan-700 disabled:opacity-50"
          >
            → Trên kệ
          </button>
          <button
            onClick={() => handleBatchStatus("Chờ giao")}
            disabled={batchUpdating}
            className="px-3 py-1.5 bg-green-600 text-white rounded-md text-xs font-medium hover:bg-green-700 disabled:opacity-50"
          >
            → Chờ giao
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto text-xs text-gray-500 hover:text-gray-700"
          >
            Bỏ chọn
          </button>
        </div>
      )}

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
              ({receipts.filter((r) => tab === "Tất cả" || r.Status === tab).length})
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton />
      ) : paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Package className="w-12 h-12 mb-3" />
          <p className="text-sm">Không có dữ liệu</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selected.size === paginated.length && paginated.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-[#4F5FD9] focus:ring-[#4F5FD9]"
                    />
                  </th>
                  {["Mã phiếu", "Mã đơn", "Kho", "Khu/Kệ", "Kiện", "Chênh lệch", "QC", "Trạng thái", "Ngày tạo"].map(
                    (h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((r) => {
                  const discrepancy = r.Discrepancy ?? 0;
                  const location = r.ShelfZone ? `${r.ShelfZone}${r.ShelfRow ? `-${r.ShelfRow}` : ""}` : r.Location || "";
                  return (
                    <tr key={r.id} className={cn("hover:bg-gray-50 transition-colors", selected.has(r.id) && "bg-indigo-50/50")}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(r.id)}
                          onChange={() => toggleSelect(r.id)}
                          className="w-4 h-4 rounded border-gray-300 text-[#4F5FD9] focus:ring-[#4F5FD9]"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <a href={`/warehouse-vn/${r.id}`} className="text-[#4F5FD9] hover:underline font-medium">{r.ReceiptCode}</a>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {r.OrderId ? (
                          <a href={`/orders/${r.OrderId}`} className="text-[#4F5FD9] hover:underline">{r.OrderCode}</a>
                        ) : <span className="text-gray-400">---</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{r.Warehouse || "---"}</td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-700">{location || "---"}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{r.PackagesReceived ?? 0}/{r.PackagesExpected ?? 0}</td>
                      <td className="px-4 py-3 text-sm">
                        {discrepancy !== 0 ? (
                          <span className="text-red-600 font-medium">{discrepancy > 0 ? `+${discrepancy}` : discrepancy}</span>
                        ) : <span className="text-gray-400">0</span>}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.QCStatus || "Chưa kiểm"} />
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={r.Status} /></td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatDate(r.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length} phiếu
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">Trước</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">Sau</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
