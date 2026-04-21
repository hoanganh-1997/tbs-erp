"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Search, Package, MapPin, AlertTriangle, Clock } from "lucide-react";
import { toast } from "sonner";
import { cn, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import {
  getWarehouseVnReceipts,
  type WarehouseVnReceipt,
} from "@/lib/warehouse-vn-receipts";

const ZONES = ["A", "B", "C", "D", "VIP", "Tạm giữ"] as const;

const ZONE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  A: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
  B: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700" },
  C: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700" },
  D: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700" },
  VIP: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700" },
  "Tạm giữ": { bg: "bg-red-50", border: "border-red-200", text: "text-red-700" },
};

function differenceInDays(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

export default function WarehouseVnInventoryPage() {
  const [receipts, setReceipts] = useState<WarehouseVnReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getWarehouseVnReceipts({ take: 200, sortField: "createdAt", sortDirection: "desc" });
      setReceipts(data);
    } catch {
      toast.error("Lỗi tải dữ liệu tồn kho");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Only items on shelf
  const onShelf = receipts.filter((r) => r.Status === "Trên kệ");
  const totalOnShelf = onShelf.length;

  // Zone breakdown
  const zoneData = ZONES.map((zone) => {
    const items = onShelf.filter((r) => r.ShelfZone === zone);
    const agingItems = items.filter((r) => {
      if (!r.createdAt) return false;
      return differenceInDays(new Date(), new Date(r.createdAt)) > 7;
    });
    return { zone, count: items.length, aging: agingItems.length, items };
  });

  const totalAging = zoneData.reduce((s, z) => s + z.aging, 0);
  const noZone = onShelf.filter((r) => !r.ShelfZone).length;

  // Filter for detail table
  const detailItems = selectedZone
    ? onShelf.filter((r) => r.ShelfZone === selectedZone)
    : onShelf;

  const searchFiltered = searchQuery
    ? detailItems.filter((r) => {
        const q = searchQuery.toLowerCase();
        return (
          r.ReceiptCode?.toLowerCase().includes(q) ||
          r.OrderCode?.toLowerCase().includes(q) ||
          r.Location?.toLowerCase().includes(q) ||
          r.ShelfRow?.toLowerCase().includes(q)
        );
      })
    : detailItems;

  return (
    <div className="space-y-6">
      <a href="/warehouse-vn" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
        <ArrowLeft className="w-4 h-4" />Quay lại kho VN
      </a>

      <PageHeader title="Tồn kho" description="Quản lý tồn kho theo khu vực kệ" />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard title="Tổng trên kệ" value={totalOnShelf} icon={Package} borderColor="border-l-cyan-500" />
        <KpiCard
          title="Tồn > 7 ngày"
          value={totalAging}
          icon={Clock}
          borderColor="border-l-orange-500"
          subtitle="cần chú ý"
          subtitleClassName={totalAging > 0 ? "text-orange-500" : undefined}
        />
        <KpiCard title="Chưa phân khu" value={noZone} icon={MapPin} borderColor="border-l-gray-400" />
        <KpiCard title="Khu vực" value={ZONES.length} icon={MapPin} borderColor="border-l-blue-500" />
      </div>

      {/* Zone cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {zoneData.map(({ zone, count, aging }) => {
          const colors = ZONE_COLORS[zone];
          const isSelected = selectedZone === zone;
          return (
            <button
              key={zone}
              onClick={() => setSelectedZone(isSelected ? null : zone)}
              className={cn(
                "p-4 rounded-xl border-2 transition-all text-left",
                isSelected
                  ? "border-[#4F5FD9] ring-2 ring-[#4F5FD9]/20 bg-indigo-50"
                  : `${colors.border} ${colors.bg} hover:shadow-md`
              )}
            >
              <div className={cn("text-2xl font-bold", isSelected ? "text-[#2D3A8C]" : colors.text)}>
                {zone}
              </div>
              <div className="text-sm font-semibold text-gray-900 mt-2">{count} kiện</div>
              {aging > 0 && (
                <div className="flex items-center gap-1 text-xs text-orange-600 mt-1">
                  <AlertTriangle className="w-3 h-3" />
                  {aging} tồn lâu
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã phiếu, mã đơn, vị trí..."
            className="w-full h-10 pl-10 pr-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]"
          />
        </div>
        {selectedZone && (
          <button
            onClick={() => setSelectedZone(null)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            Hiển thị tất cả
          </button>
        )}
      </div>

      {/* Detail table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : searchFiltered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Package className="w-12 h-12 mb-3" />
          <p className="text-sm">{selectedZone ? `Khu ${selectedZone} trống` : "Không có kiện nào trên kệ"}</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">
              {selectedZone ? `Khu ${selectedZone}` : "Tất cả khu"} — {searchFiltered.length} kiện
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  {["Mã phiếu", "Mã đơn", "Khu", "Vị trí", "Kiện", "Kg", "Tồn (ngày)", "QC", "Ngày nhận"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {searchFiltered.map((r) => {
                  const days = r.createdAt ? differenceInDays(new Date(), new Date(r.createdAt)) : 0;
                  const isAging = days > 14;
                  const isWarning = days > 7 && days <= 14;
                  return (
                    <tr key={r.id} className={cn("hover:bg-gray-50", isAging && "bg-red-50/30", isWarning && "bg-yellow-50/30")}>
                      <td className="px-4 py-3">
                        <a href={`/warehouse-vn/${r.id}`} className="text-[#4F5FD9] hover:underline font-medium">{r.ReceiptCode}</a>
                      </td>
                      <td className="px-4 py-3">
                        {r.OrderId ? <a href={`/orders/${r.OrderId}`} className="text-[#4F5FD9] hover:underline">{r.OrderCode}</a> : "---"}
                      </td>
                      <td className="px-4 py-3">
                        {r.ShelfZone ? (
                          <span className={cn(
                            "px-2 py-0.5 rounded text-xs font-medium",
                            ZONE_COLORS[r.ShelfZone]?.bg || "bg-gray-100",
                            ZONE_COLORS[r.ShelfZone]?.text || "text-gray-600"
                          )}>{r.ShelfZone}</span>
                        ) : "---"}
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-700">{r.ShelfRow || r.Location || "---"}</td>
                      <td className="px-4 py-3 text-gray-700">{r.PackagesReceived ?? 0}</td>
                      <td className="px-4 py-3 text-gray-700">{r.WeightKg ? `${r.WeightKg}` : "---"}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "font-medium",
                          isAging ? "text-red-600" : isWarning ? "text-orange-600" : "text-gray-700"
                        )}>
                          {days}d {isAging && <AlertTriangle className="w-3 h-3 inline ml-0.5" />}
                        </span>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={r.QCStatus || "Chưa kiểm"} /></td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(r.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
