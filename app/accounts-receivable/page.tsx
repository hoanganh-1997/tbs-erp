"use client";

import { useEffect, useState, useCallback } from "react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { toast } from "sonner";
import { getAccountsReceivable, updateAccountReceivable } from "@/lib/accounts-receivable";
import type { AccountReceivable } from "@/lib/accounts-receivable";
import { Receipt, X } from "lucide-react";

const STATUS_TABS = ["Tất cả", "Chưa thu", "Thu một phần", "Quá hạn", "Đã thu", "Xóa nợ"] as const;
const PAGE_SIZE = 20;

function AgingCard({ label, borderColor, count, amount }: { label: string; borderColor: string; count: number; amount: number }) {
  return (
    <div className={cn("bg-white rounded-lg border p-4", borderColor)}>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-xl font-bold text-gray-900 mt-1">{count} <span className="text-sm font-normal text-gray-500">khoản</span></p>
      <p className="text-sm font-semibold text-gray-700 mt-0.5">{formatCurrency(amount)}</p>
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

function PaymentModal({ ar, onClose, onSave }: { ar: AccountReceivable; onClose: () => void; onSave: (id: string, amount: number) => void }) {
  const [amount, setAmount] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const remaining = (ar.Remaining ?? 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) { toast.error("Số tiền phải > 0"); return; }
    if (val > remaining) { toast.error("Số tiền vượt quá số còn lại"); return; }
    setSaving(true);
    try {
      await onSave(ar.id, val);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#2D3A8C]">Thu tiền - {ar.ARCode}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="mb-4 space-y-1 text-sm text-gray-600">
          <p>Khách hàng: <span className="font-medium text-gray-900">{ar.CustomerName}</span></p>
          <p>Tổng hóa đơn: <span className="font-medium">{formatCurrency(ar.InvoiceAmount)}</span></p>
          <p>Đã thu: <span className="font-medium">{formatCurrency(ar.PaidAmount)}</span></p>
          <p>Còn lại: <span className="font-bold text-red-600">{formatCurrency(remaining)}</span></p>
        </div>
        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền thu</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Nhập số tiền"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none"
            min={1}
            max={remaining}
            autoFocus
          />
          <div className="flex justify-end gap-3 mt-5">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Hủy</button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-medium text-white bg-[#4F5FD9] hover:bg-[#3B4CC0] rounded-lg disabled:opacity-50 transition-colors"
            >
              {saving ? "Đang lưu..." : "Xác nhận thu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AccountsReceivablePage() {
  const [data, setData] = useState<AccountReceivable[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("Tất cả");
  const [page, setPage] = useState(1);
  const [paymentAR, setPaymentAR] = useState<AccountReceivable | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAccountsReceivable({ take: 200, sortField: "createdAt", sortDirection: "desc" });
      setData(res.data);
    } catch {
      toast.error("Lỗi tải dữ liệu công nợ phải thu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Aging buckets
  const now = new Date();
  function daysDiff(dueDate: string | undefined) {
    if (!dueDate) return 0;
    const due = new Date(dueDate);
    return Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  }

  const unpaid = data.filter((r) => r.Status !== "Đã thu" && r.Status !== "Xóa nợ");
  const inTime = unpaid.filter((r) => daysDiff(r.DueDate) <= 0);
  const d1_15 = unpaid.filter((r) => { const d = daysDiff(r.DueDate); return d >= 1 && d <= 15; });
  const d16_30 = unpaid.filter((r) => { const d = daysDiff(r.DueDate); return d >= 16 && d <= 30; });
  const d31_60 = unpaid.filter((r) => { const d = daysDiff(r.DueDate); return d >= 31 && d <= 60; });
  const d60plus = unpaid.filter((r) => daysDiff(r.DueDate) > 60);

  function sumAmount(items: AccountReceivable[]) {
    return items.reduce((s, r) => s + (r.Remaining ?? 0), 0);
  }

  // Filter by tab
  const filtered = activeTab === "Tất cả" ? data : data.filter((r) => r.Status === activeTab);

  // Pagination
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function isOverdue(r: AccountReceivable) {
    if (!r.DueDate) return false;
    return new Date(r.DueDate) < now && r.Status !== "Đã thu" && r.Status !== "Xóa nợ";
  }

  async function handlePayment(id: string, amount: number) {
    const ar = data.find((r) => r.id === id);
    if (!ar) return;
    const newPaid = (ar.PaidAmount ?? 0) + amount;
    const newRemaining = (ar.InvoiceAmount ?? 0) - newPaid;
    const newStatus = newRemaining <= 0 ? "Đã thu" : "Thu một phần";
    try {
      await updateAccountReceivable(id, { PaidAmount: newPaid, Remaining: newRemaining, Status: newStatus });
      toast.success("Thu tiền thành công");
      setPaymentAR(null);
      fetchData();
    } catch {
      toast.error("Lỗi cập nhật thu tiền");
    }
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <PageHeader title="Công nợ phải thu" description="Quản lý công nợ khách hàng" />

      {/* Aging cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <AgingCard label="Trong hạn" borderColor="border-l-4 border-l-green-500" count={inTime.length} amount={sumAmount(inTime)} />
        <AgingCard label="1-15 ngày" borderColor="border-l-4 border-l-yellow-500" count={d1_15.length} amount={sumAmount(d1_15)} />
        <AgingCard label="16-30 ngày" borderColor="border-l-4 border-l-orange-500" count={d16_30.length} amount={sumAmount(d16_30)} />
        <AgingCard label="31-60 ngày" borderColor="border-l-4 border-l-red-500" count={d31_60.length} amount={sumAmount(d31_60)} />
        <AgingCard label="> 60 ngày" borderColor="border-l-4 border-l-red-800" count={d60plus.length} amount={sumAmount(d60plus)} />
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
        <EmptyState title="Không có công nợ" description="Chưa có dữ liệu công nợ phải thu" icon={Receipt} />
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mã AR</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mã đơn</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Khách hàng</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Hóa đơn</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Đã thu</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Còn lại</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Hạn thu</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sale</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{r.ARCode}</td>
                    <td className="px-4 py-3">
                      <a href={`/orders/${r.OrderId}`} className="text-[#4F5FD9] hover:text-[#3B4CC0] font-medium">{r.OrderCode}</a>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{r.CustomerName}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(r.InvoiceAmount)}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(r.PaidAmount)}</td>
                    <td className={cn("px-4 py-3 text-right font-bold", isOverdue(r) ? "text-red-600" : "text-gray-900")}>
                      {formatCurrency(r.Remaining)}
                    </td>
                    <td className={cn("px-4 py-3", isOverdue(r) ? "text-red-600" : "text-gray-700")}>
                      {formatDate(r.DueDate)}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={r.Status} /></td>
                    <td className="px-4 py-3 text-gray-600">{r.SaleOwner}</td>
                    <td className="px-4 py-3">
                      {r.Status !== "Đã thu" && r.Status !== "Xóa nợ" && (
                        <button
                          onClick={() => setPaymentAR(r)}
                          className="text-xs font-medium text-[#4F5FD9] hover:text-[#3B4CC0] whitespace-nowrap"
                        >
                          Thu tiền
                        </button>
                      )}
                    </td>
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

      {/* Payment modal */}
      {paymentAR && (
        <PaymentModal ar={paymentAR} onClose={() => setPaymentAR(null)} onSave={handlePayment} />
      )}
    </div>
  );
}
