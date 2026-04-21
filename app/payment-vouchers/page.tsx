"use client";

import { useEffect, useState, useCallback } from "react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { toast } from "sonner";
import { getPaymentVouchers } from "@/lib/payment-vouchers";
import type { PaymentVoucher } from "@/lib/payment-vouchers";
import { FileText, Flag, AlertTriangle } from "lucide-react";

const TYPE_TABS = ["Tất cả", "Phiếu thu", "Phiếu chi"] as const;
const STATUS_TABS = ["Tất cả", "Nháp", "Chờ KT duyệt", "KT đã duyệt", "Chờ BGĐ chi", "Đã chi", "Từ chối"] as const;
const PAGE_SIZE = 20;

function TypeBadge({ type }: { type: string | undefined }) {
  if (!type) return null;
  const isThu = type === "Phiếu thu";
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
      isThu ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
    )}>
      {type === "Phiếu thu" ? "Thu" : "Chi"}
    </span>
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

function FlagIndicator({ isFlagged, reason }: { isFlagged?: boolean; reason?: string }) {
  if (!isFlagged) return <span className="text-gray-300">---</span>;
  return (
    <div className="relative group">
      <Flag className="w-4 h-4 text-red-500 fill-red-500" />
      {reason && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
          <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 max-w-xs whitespace-normal shadow-lg">
            {reason}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PaymentVouchersPage() {
  const [data, setData] = useState<PaymentVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeTab, setTypeTab] = useState<string>("Tất cả");
  const [statusTab, setStatusTab] = useState<string>("Tất cả");
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPaymentVouchers({ take: 200, sortField: "createdAt", sortDirection: "desc" });
      setData(res.data);
    } catch {
      toast.error("Lỗi tải dữ liệu phiếu thu chi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Filter
  let filtered = data;
  if (typeTab !== "Tất cả") filtered = filtered.filter((r) => r.Type === typeTab);
  if (statusTab !== "Tất cả") filtered = filtered.filter((r) => r.Status === statusTab);
  if (flaggedOnly) filtered = filtered.filter((r) => r.IsFlagged === true);

  // Pagination
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <PageHeader
        title="Phiếu thu chi"
        description="Quản lý phiếu thu chi"
        actionLabel="Tạo phiếu"
        actionHref="/payment-vouchers/new"
      />

      {/* Type tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => { setTypeTab(tab); setPage(1); }}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
              typeTab === tab
                ? "border-[#4F5FD9] text-[#4F5FD9]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Status sub-tabs + flagged filter */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 flex-wrap">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => { setStatusTab(tab); setPage(1); }}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-full border transition-colors",
                statusTab === tab
                  ? "bg-[#4F5FD9] text-white border-[#4F5FD9]"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={flaggedOnly}
            onChange={(e) => { setFlaggedOnly(e.target.checked); setPage(1); }}
            className="rounded border-gray-300 text-[#4F5FD9] focus:ring-[#4F5FD9]"
          />
          <Flag className="w-3.5 h-3.5 text-red-500" />
          Chỉ hiện phiếu bị cờ
        </label>
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState title="Không có phiếu" description="Chưa có phiếu thu chi nào" icon={FileText} />
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mã phiếu</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Loại</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mã đơn</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">KH / NCC</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Loại CP</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Số tiền</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tiền tệ</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cờ</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Người tạo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{r.VoucherCode}</td>
                    <td className="px-4 py-3"><TypeBadge type={r.Type} /></td>
                    <td className="px-4 py-3">
                      {r.OrderCode ? (
                        <a href={`/orders/${r.OrderId}`} className="text-[#4F5FD9] hover:text-[#3B4CC0] font-medium">{r.OrderCode}</a>
                      ) : "---"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{r.CustomerName || r.SupplierName || "---"}</td>
                    <td className="px-4 py-3 text-gray-600">{r.ExpenseType || "---"}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(r.Amount, r.Currency || "VND")}</td>
                    <td className="px-4 py-3 text-gray-600">{r.Currency}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.Status} /></td>
                    <td className="px-4 py-3 text-center"><FlagIndicator isFlagged={r.IsFlagged} reason={r.FlagReason} /></td>
                    <td className="px-4 py-3 text-gray-600">{r.CreatedBy || "---"}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(r.createdAt)}</td>
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
