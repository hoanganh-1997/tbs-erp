"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Package, CheckCircle, Clock, Inbox, ShieldAlert, Eye } from "lucide-react";
import { toast } from "sonner";
import { cn, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import {
  getWarehouseCnReceipts,
  updateWarehouseCnReceipt,
  type WarehouseCnReceipt,
} from "@/lib/warehouse-cn-receipts";

const STATUS_TABS = [
  "Tất cả",
  "Chờ nhận",
  "Đã nhận",
  "Đã kiểm",
  "Trên kệ",
  "Đã đóng gói",
  "Đã xuất",
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

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
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

export default function WarehouseCnPage() {
  const [receipts, setReceipts] = useState<WarehouseCnReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Tất cả");
  const [scanQuery, setScanQuery] = useState("");
  const [searchApplied, setSearchApplied] = useState("");
  const [unidentifiedOnly, setUnidentifiedOnly] = useState(false);
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getWarehouseCnReceipts({
        take: 200,
        sortField: "createdAt",
        sortDirection: "desc",
      });
      setReceipts(data);
    } catch {
      toast.error("Lỗi tải dữ liệu kho TQ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // KPI counts
  const kpiCounts = useMemo(() => ({
    choNhan: receipts.filter((r) => r.Status === "Chờ nhận").length,
    daNhan: receipts.filter((r) => r.Status === "Đã nhận").length,
    trenKe: receipts.filter((r) => r.Status === "Trên kệ").length,
    unidentified: receipts.filter((r) => r.IsUnidentified).length,
  }), [receipts]);

  const filtered = receipts.filter((r) => {
    if (activeTab !== "Tất cả" && r.Status !== activeTab) return false;
    if (searchApplied && !r.TrackingCN?.toLowerCase().includes(searchApplied.toLowerCase())) return false;
    if (unidentifiedOnly && !r.IsUnidentified) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleScan = () => {
    setSearchApplied(scanQuery.trim());
    setPage(1);
  };

  const handleReceive = async (receipt: WarehouseCnReceipt) => {
    try {
      await updateWarehouseCnReceipt(receipt.id, { Status: "Đã nhận" });
      toast.success(`Đã nhận hàng ${receipt.ReceiptCode}`);
      fetchData();
    } catch {
      toast.error("Lỗi cập nhật trạng thái");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kho Trung Quốc"
        description="Nhận hàng kho TQ"
        actionLabel="Nhận hàng mới"
        actionHref="/warehouse-cn/new"
      />

      {/* KPI Cards */}
      {loading ? (
        <KpiSkeleton />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            title="Chờ nhận"
            value={kpiCounts.choNhan}
            icon={Clock}
            borderColor="border-l-yellow-400"
            subtitle="Kiện đang chờ xử lý"
            subtitleClassName="text-yellow-600"
          />
          <KpiCard
            title="Đã nhận"
            value={kpiCounts.daNhan}
            icon={Package}
            borderColor="border-l-blue-400"
            subtitle="Kiện đã nhận vào kho"
            subtitleClassName="text-blue-600"
          />
          <KpiCard
            title="Trên kệ"
            value={kpiCounts.trenKe}
            icon={Inbox}
            borderColor="border-l-cyan-400"
            subtitle="Kiện đã xếp kệ"
            subtitleClassName="text-cyan-600"
          />
          <KpiCard
            title="Chưa xác định"
            value={kpiCounts.unidentified}
            icon={ShieldAlert}
            borderColor="border-l-red-400"
            subtitle="Kiện không khớp đơn"
            subtitleClassName="text-red-600"
          />
        </div>
      )}

      {/* Scan input card */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={scanQuery}
              onChange={(e) => setScanQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScan()}
              placeholder="Quét mã vận đơn (Enter để tra cứu)"
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

      {/* Unidentified filter */}
      <label className="inline-flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
        <input
          type="checkbox"
          checked={unidentifiedOnly}
          onChange={(e) => { setUnidentifiedOnly(e.target.checked); setPage(1); }}
          className="rounded border-gray-300"
        />
        Chỉ kiện không xác định
      </label>

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
        <EmptyState />
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  {["Mã phiếu", "Mã đơn", "Tracking CN", "Kiện", "Cân nặng", "CBM", "QC", "Tem", "Trạng thái", "Đại lý", "Ngày tạo", ""].map(
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
                {paginated.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => window.location.href = `/warehouse-cn/${r.id}`}>
                    <td className="px-4 py-3 text-sm font-medium text-[#4F5FD9] hover:text-[#3B4CC0]">
                      {r.ReceiptCode}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {r.OrderId ? (
                        <a
                          href={`/orders/${r.OrderId}`}
                          className="text-[#4F5FD9] hover:text-[#3B4CC0] hover:underline"
                        >
                          {r.OrderCode}
                        </a>
                      ) : (
                        <span className="text-gray-400">---</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 font-mono">
                      {r.TrackingCN || "---"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {r.PackagesReceived ?? 0}/{r.PackagesExpected ?? 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {r.WeightKg ? `${r.WeightKg} kg` : "---"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {r.CBM ?? "---"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.QCStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.LabelStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.Status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {r.Agent || "---"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(r.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <a
                          href={`/warehouse-cn/${r.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-gray-300 hover:bg-gray-50 text-gray-600 rounded-lg text-xs font-medium transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Xem
                        </a>
                        {r.Status === "Chờ nhận" && (
                          <button
                            onClick={() => handleReceive(r)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#4F5FD9] hover:bg-[#3B4CC0] text-white rounded-lg text-xs font-medium transition-colors"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Nhận hàng
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length} phiếu
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
