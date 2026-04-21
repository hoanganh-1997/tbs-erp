"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Package,
  Warehouse,
  MapPin,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { EmptyState } from "@/components/empty-state";
import {
  getWarehouseCnReceipts,
  type WarehouseCnReceipt,
} from "@/lib/warehouse-cn-receipts";
import {
  getWarehouseVnReceipts,
  type WarehouseVnReceipt,
} from "@/lib/warehouse-vn-receipts";

// ---------- constants ----------

const PAGE_SIZE = 20;

const TABS = [
  { key: "cn", label: "Kho TQ" },
  { key: "vn", label: "Kho VN" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const VN_WAREHOUSES = ["Tất cả", "Đông Anh (HN)", "Hóc Môn (HCM)"] as const;

// ---------- helpers ----------

function calcDaysOnShelf(createdAt: string | undefined): number {
  if (!createdAt) return 0;
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);
}

function agingColor(days: number): string {
  if (days > 30) return "text-red-600 bg-red-50";
  if (days > 14) return "text-orange-600 bg-orange-50";
  if (days > 7) return "text-yellow-600 bg-yellow-50";
  return "text-gray-600 bg-gray-50";
}

function matchesSearch(
  receipt: { ReceiptCode?: string; OrderCode?: string },
  query: string
): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    (receipt.ReceiptCode?.toLowerCase().includes(q) ?? false) ||
    (receipt.OrderCode?.toLowerCase().includes(q) ?? false)
  );
}

// ---------- skeletons ----------

function KpiSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={cn("grid gap-4", count === 4 ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2 md:grid-cols-4")}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
      ))}
    </div>
  );
}

// ---------- sub-components ----------

function AgingBadge({ days }: { days: number }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        agingColor(days)
      )}
    >
      {days}d
    </span>
  );
}

function Pagination({
  page,
  totalPages,
  total,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
      <p className="text-sm text-gray-500">
        Hiển thị {(page - 1) * PAGE_SIZE + 1}
        &ndash;
        {Math.min(page * PAGE_SIZE, total)} / {total} phiếu
      </p>
      <div className="flex gap-2">
        <button
          onClick={onPrev}
          disabled={page === 1}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Trước
        </button>
        <button
          onClick={onNext}
          disabled={page === totalPages}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
        >
          Sau
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function SummaryBar({
  items,
}: {
  items: { label: string; value: string | number }[];
}) {
  return (
    <div className="flex flex-wrap gap-4 bg-gray-50 rounded-lg px-4 py-3">
      {items.map((item) => (
        <div key={item.label} className="text-sm">
          <span className="text-gray-500">{item.label}: </span>
          <span className="font-semibold text-gray-800">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

// ---------- CN table ----------

function CnInventoryTable({
  data,
  page,
  setPage,
}: {
  data: WarehouseCnReceipt[];
  page: number;
  setPage: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
  const paginated = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (data.length === 0) {
    return (
      <EmptyState
        title="Không có kiện tồn kho TQ"
        description="Chưa có kiện nào phù hợp bộ lọc"
        icon={Package}
      />
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              {[
                "Mã phiếu",
                "Mã đơn",
                "Tracking CN",
                "Cân nặng",
                "CBM",
                "Trạng thái",
                "Ngày trên kệ",
                "Đại lý",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginated.map((r) => {
              const days = calcDaysOnShelf(r.createdAt);
              return (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {r.ReceiptCode || "---"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {r.OrderId ? (
                      <a
                        href={`/orders/${r.OrderId}`}
                        className="text-[#4F5FD9] hover:text-[#3B4CC0] hover:underline"
                      >
                        {r.OrderCode || "---"}
                      </a>
                    ) : (
                      <span className="text-gray-400">---</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 font-mono">
                    {r.TrackingCN || "---"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {r.WeightKg ? `${r.WeightKg} kg` : "---"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {r.CBM ?? "---"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.Status} />
                  </td>
                  <td className="px-4 py-3">
                    <AgingBadge days={days} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {r.Agent || "---"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        totalPages={totalPages}
        total={data.length}
        onPrev={() => setPage(Math.max(1, page - 1))}
        onNext={() => setPage(Math.min(totalPages, page + 1))}
      />
    </div>
  );
}

// ---------- VN table ----------

function VnInventoryTable({
  data,
  page,
  setPage,
}: {
  data: WarehouseVnReceipt[];
  page: number;
  setPage: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
  const paginated = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (data.length === 0) {
    return (
      <EmptyState
        title="Không có kiện tồn kho VN"
        description="Chưa có kiện nào phù hợp bộ lọc"
        icon={Package}
      />
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              {[
                "Mã phiếu",
                "Mã đơn",
                "Kho",
                "Vị trí",
                "Kiện",
                "Cân nặng",
                "Trạng thái",
                "Ngày trên kệ",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginated.map((r) => {
              const days = calcDaysOnShelf(r.createdAt);
              return (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {r.ReceiptCode || "---"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {r.OrderId ? (
                      <a
                        href={`/orders/${r.OrderId}`}
                        className="text-[#4F5FD9] hover:text-[#3B4CC0] hover:underline"
                      >
                        {r.OrderCode || "---"}
                      </a>
                    ) : (
                      <span className="text-gray-400">---</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {r.Warehouse || "---"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {r.Location || "---"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {r.PackagesReceived ?? "---"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {r.WeightKg ? `${r.WeightKg} kg` : "---"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.Status} />
                  </td>
                  <td className="px-4 py-3">
                    <AgingBadge days={days} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        totalPages={totalPages}
        total={data.length}
        onPrev={() => setPage(Math.max(1, page - 1))}
        onNext={() => setPage(Math.min(totalPages, page + 1))}
      />
    </div>
  );
}

// ---------- main page ----------

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("cn");
  const [loading, setLoading] = useState(true);
  const [cnReceipts, setCnReceipts] = useState<WarehouseCnReceipt[]>([]);
  const [vnReceipts, setVnReceipts] = useState<WarehouseVnReceipt[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchApplied, setSearchApplied] = useState("");
  const [vnWarehouseFilter, setVnWarehouseFilter] = useState<string>("Tất cả");
  const [cnPage, setCnPage] = useState(1);
  const [vnPage, setVnPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [cnRes, vnRes] = await Promise.all([
        getWarehouseCnReceipts({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
        getWarehouseVnReceipts({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
      ]);
      setCnReceipts(cnRes.data);
      setVnReceipts(vnRes.data);
    } catch {
      toast.error("Lỗi tải dữ liệu tồn kho");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = () => {
    setSearchApplied(searchQuery.trim());
    setCnPage(1);
    setVnPage(1);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchApplied("");
    setCnPage(1);
    setVnPage(1);
  };

  // --- CN filtered data ---
  const cnFiltered = useMemo(() => {
    return cnReceipts
      .filter((r) => r.Status === "Trên kệ")
      .filter((r) => matchesSearch(r, searchApplied));
  }, [cnReceipts, searchApplied]);

  // --- CN KPI ---
  const cnKpi = useMemo(() => {
    const onShelf = cnReceipts.filter((r) => r.Status === "Trên kệ");
    const totalWeight = onShelf.reduce((sum, r) => sum + (r.WeightKg || 0), 0);
    const totalCbm = onShelf.reduce((sum, r) => sum + (r.CBM || 0), 0);
    const aging14 = onShelf.filter(
      (r) => calcDaysOnShelf(r.createdAt) > 14
    ).length;
    return {
      onShelf: onShelf.length,
      totalWeight: Math.round(totalWeight * 100) / 100,
      totalCbm: Math.round(totalCbm * 100) / 100,
      aging14,
    };
  }, [cnReceipts]);

  // --- CN summary ---
  const cnSummary = useMemo(() => {
    const byStatus: Record<string, number> = {};
    cnReceipts.forEach((r) => {
      const s = r.Status || "Không rõ";
      byStatus[s] = (byStatus[s] || 0) + 1;
    });
    return Object.entries(byStatus).map(([label, value]) => ({ label, value }));
  }, [cnReceipts]);

  // --- VN filtered data ---
  const vnFiltered = useMemo(() => {
    return vnReceipts
      .filter((r) => r.Status === "Trên kệ")
      .filter((r) => matchesSearch(r, searchApplied))
      .filter(
        (r) =>
          vnWarehouseFilter === "Tất cả" || r.Warehouse === vnWarehouseFilter
      );
  }, [vnReceipts, searchApplied, vnWarehouseFilter]);

  // --- VN KPI ---
  const vnKpi = useMemo(() => {
    const onShelf = vnReceipts.filter((r) => r.Status === "Trên kệ");
    const onShelfHn = onShelf.filter(
      (r) => r.Warehouse === "Đông Anh (HN)"
    ).length;
    const onShelfHcm = onShelf.filter(
      (r) => r.Warehouse === "Hóc Môn (HCM)"
    ).length;
    const choGiao = vnReceipts.filter((r) => r.Status === "Chờ giao").length;
    const aging14 = onShelf.filter(
      (r) => calcDaysOnShelf(r.createdAt) > 14
    ).length;
    return { onShelfHn, onShelfHcm, choGiao, aging14 };
  }, [vnReceipts]);

  // --- VN summary ---
  const vnSummary = useMemo(() => {
    const byStatus: Record<string, number> = {};
    vnReceipts.forEach((r) => {
      const s = r.Status || "Không rõ";
      byStatus[s] = (byStatus[s] || 0) + 1;
    });
    return Object.entries(byStatus).map(([label, value]) => ({ label, value }));
  }, [vnReceipts]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tồn kho"
        description="Theo dõi kiện hàng tồn kho TQ và VN"
      />

      {/* Tab switcher */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setCnPage(1);
              setVnPage(1);
            }}
            className={cn(
              "px-5 py-2.5 text-sm font-medium border-b-2 transition-colors",
              activeTab === tab.key
                ? "border-[#4F5FD9] text-[#4F5FD9]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Tìm theo mã phiếu hoặc mã đơn..."
              className="w-full h-11 pl-12 pr-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent"
            />
          </div>
          {activeTab === "vn" && (
            <select
              value={vnWarehouseFilter}
              onChange={(e) => {
                setVnWarehouseFilter(e.target.value);
                setVnPage(1);
              }}
              className="h-11 px-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent bg-white"
            >
              {VN_WAREHOUSES.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={handleSearch}
            className="h-11 px-5 bg-[#4F5FD9] hover:bg-[#3B4CC0] text-white rounded-lg text-sm font-medium transition-colors"
          >
            Tìm kiếm
          </button>
        </div>
        {searchApplied && (
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
            <span>Đang lọc: &quot;{searchApplied}&quot;</span>
            <button
              onClick={clearSearch}
              className="text-[#4F5FD9] hover:text-[#3B4CC0] underline"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* ===== KHO TQ TAB ===== */}
      {activeTab === "cn" && (
        <>
          {/* CN KPIs */}
          {loading ? (
            <KpiSkeleton />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KpiCard
                title="Trên kệ"
                value={cnKpi.onShelf}
                icon={Package}
                borderColor="border-l-cyan-400"
                subtitle="Kiện đang tồn kho TQ"
                subtitleClassName="text-cyan-600"
              />
              <KpiCard
                title="Tổng cân nặng"
                value={`${cnKpi.totalWeight} kg`}
                icon={Package}
                borderColor="border-l-blue-400"
                subtitle="Tổng kg kiện trên kệ"
                subtitleClassName="text-blue-600"
              />
              <KpiCard
                title="Tổng CBM"
                value={cnKpi.totalCbm}
                icon={Warehouse}
                borderColor="border-l-indigo-400"
                subtitle="Thể tích kiện trên kệ"
                subtitleClassName="text-indigo-600"
              />
              <KpiCard
                title="Tồn >14 ngày"
                value={cnKpi.aging14}
                icon={AlertTriangle}
                borderColor="border-l-orange-400"
                subtitle="Kiện cần xử lý sớm"
                subtitleClassName="text-orange-600"
              />
            </div>
          )}

          {/* CN Summary */}
          {!loading && cnSummary.length > 0 && (
            <SummaryBar items={cnSummary} />
          )}

          {/* CN Table */}
          {loading ? (
            <TableSkeleton />
          ) : (
            <CnInventoryTable
              data={cnFiltered}
              page={cnPage}
              setPage={setCnPage}
            />
          )}
        </>
      )}

      {/* ===== KHO VN TAB ===== */}
      {activeTab === "vn" && (
        <>
          {/* VN KPIs */}
          {loading ? (
            <KpiSkeleton />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KpiCard
                title="Trên kệ HN"
                value={vnKpi.onShelfHn}
                icon={MapPin}
                borderColor="border-l-cyan-400"
                subtitle="Đông Anh (HN)"
                subtitleClassName="text-cyan-600"
              />
              <KpiCard
                title="Trên kệ HCM"
                value={vnKpi.onShelfHcm}
                icon={MapPin}
                borderColor="border-l-blue-400"
                subtitle="Hóc Môn (HCM)"
                subtitleClassName="text-blue-600"
              />
              <KpiCard
                title="Chờ giao"
                value={vnKpi.choGiao}
                icon={Clock}
                borderColor="border-l-yellow-400"
                subtitle="Kiện chờ giao cho KH"
                subtitleClassName="text-yellow-600"
              />
              <KpiCard
                title="Tồn >14 ngày"
                value={vnKpi.aging14}
                icon={AlertTriangle}
                borderColor="border-l-orange-400"
                subtitle="Kiện cần xử lý sớm"
                subtitleClassName="text-orange-600"
              />
            </div>
          )}

          {/* VN Summary */}
          {!loading && vnSummary.length > 0 && (
            <SummaryBar items={vnSummary} />
          )}

          {/* VN Table */}
          {loading ? (
            <TableSkeleton />
          ) : (
            <VnInventoryTable
              data={vnFiltered}
              page={vnPage}
              setPage={setVnPage}
            />
          )}
        </>
      )}
    </div>
  );
}
