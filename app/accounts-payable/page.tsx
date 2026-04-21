"use client";

import { useEffect, useState, useCallback } from "react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { toast } from "sonner";
import { getAccountsPayable } from "@/lib/accounts-payable";
import type { AccountPayable } from "@/lib/accounts-payable";
import { FileText } from "lucide-react";

const STATUS_TABS = ["Tất cả", "Mở", "Đã duyệt", "TT một phần", "Đã TT"] as const;
const PAGE_SIZE = 20;

function SummaryCard({ label, value, borderColor }: { label: string; value: string; borderColor: string }) {
  return (
    <div className={cn("bg-white rounded-lg border p-5", borderColor)}>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-12 bg-gray-100 rounded" />
      ))}
    </div>
  );
}

export default function AccountsPayablePage() {
  const [data, setData] = useState<AccountPayable[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("Tất cả");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAccountsPayable({ take: 200, sortField: "createdAt", sortDirection: "desc" });
      setData(res.data);
    } catch {
      toast.error("Lỗi tải dữ liệu công nợ phải trả");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Summary
  const totalPayable = data.reduce((s, r) => s + (r.InvoiceAmount ?? 0), 0);
  const totalPaid = data.reduce((s, r) => s + (r.PaidAmount ?? 0), 0);
  const totalRemaining = data.reduce((s, r) => s + (r.Remaining ?? 0), 0);

  // Filter by tab
  const filtered = activeTab === "Tất cả" ? data : data.filter((r) => r.Status === activeTab);

  // Pagination
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <PageHeader title="Công nợ phải trả" description="Quản lý công nợ nhà cung cấp" />

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard label="Tổng phải trả" value={formatCurrency(totalPayable)} borderColor="border-l-4 border-l-red-500" />
        <SummaryCard label="Đã trả" value={formatCurrency(totalPaid)} borderColor="border-l-4 border-l-green-500" />
        <SummaryCard label="Còn lại" value={formatCurrency(totalRemaining)} borderColor="border-l-4 border-l-orange-500" />
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setPage(1); }}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
              activeTab === tab
                ? "border-[#4F5FD9] text-[#4F5FD9]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState title="Không có công nợ" description="Chưa có dữ liệu công nợ phải trả" icon={FileText} />
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mã AP</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nhà cung cấp</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tổng HĐ</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tiền tệ</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Đã trả</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Còn lại</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Hạn TT</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mã phiếu chi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{r.APCode}</td>
                    <td className="px-4 py-3 text-gray-700">{r.SupplierName}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(r.InvoiceAmount, r.Currency || "VND")}</td>
                    <td className="px-4 py-3 text-gray-600">{r.Currency}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(r.PaidAmount, r.Currency || "VND")}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(r.Remaining, r.Currency || "VND")}</td>
                    <td className="px-4 py-3 text-gray-700">{formatDate(r.DueDate)}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.Status} /></td>
                    <td className="px-4 py-3 text-gray-600">{r.VoucherId || "---"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Hiện {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50"
                >
                  Trước
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
