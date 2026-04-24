"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { listQuotations, updateQuotation, deleteQuotation } from "@/lib/quotations";
import type { Quotation } from "@/lib/quotations";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import { Search, ChevronLeft, ChevronRight, FileText, TrendingUp, Clock, CheckCircle, Send, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const STATUS_TABS = [
  { key: "all", label: "Tất cả" },
  { key: "Nháp", label: "Nháp" },
  { key: "Đã gửi", label: "Đã gửi" },
  { key: "Đã chốt", label: "Đã chốt" },
  { key: "Từ chối", label: "Từ chối" },
  { key: "Hết hạn", label: "Hết hạn" },
];

const PAGE_SIZE = 20;

function KpiCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string; icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500">{label}</span>
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", color)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="p-6 space-y-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="animate-pulse flex space-x-4">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-4 bg-gray-200 rounded w-32" />
          <div className="h-4 bg-gray-200 rounded w-20" />
          <div className="h-4 bg-gray-200 rounded w-28" />
          <div className="h-4 bg-gray-200 rounded w-16" />
          <div className="h-4 bg-gray-200 rounded w-20" />
        </div>
      ))}
    </div>
  );
}

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Quotation | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await listQuotations({ take: 200, sort: [{ field: "createdAt", direction: "desc" }] });
        setQuotations(res.data || []);
      } catch {
        setQuotations([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // ─── KPI ──────────────────────────────────────
  const kpi = useMemo(() => {
    const total = quotations.length;
    const draft = quotations.filter((q) => q.Status === "Nháp").length;
    const sent = quotations.filter((q) => q.Status === "Đã gửi").length;
    const confirmed = quotations.filter((q) => q.Status === "Đã chốt").length;
    const totalValue = quotations.reduce((s, q) => s + (q.TotalVND ?? 0), 0);
    const confirmedValue = quotations.filter((q) => q.Status === "Đã chốt").reduce((s, q) => s + (q.TotalVND ?? 0), 0);
    const conversionRate = total > 0 ? Math.round((confirmed / total) * 100) : 0;
    return { total, draft, sent, confirmed, totalValue, confirmedValue, conversionRate };
  }, [quotations]);

  // ─── Filters ──────────────────────────────────
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: quotations.length };
    STATUS_TABS.forEach((t) => {
      if (t.key !== "all") counts[t.key] = quotations.filter((q) => q.Status === t.key).length;
    });
    return counts;
  }, [quotations]);

  const filtered = useMemo(() => {
    let list = quotations;
    if (activeTab !== "all") list = list.filter((q) => q.Status === activeTab);
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter((q) =>
        (q.QuotationCode || "").toLowerCase().includes(s) ||
        (q.CustomerName || "").toLowerCase().includes(s) ||
        (q.SaleOwner || "").toLowerCase().includes(s)
      );
    }
    return list;
  }, [quotations, activeTab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => { setCurrentPage(1); }, [activeTab, search]);

  const formatDate = (d: string | undefined) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("vi-VN");
  };

  // ─── Quick Actions ────────────────────────────
  async function handleQuickSend(q: Quotation) {
    setActionLoadingId(q.id);
    try {
      await updateQuotation(q.id, { Status: "Đã gửi" });
      setQuotations((prev) => prev.map((item) => item.id === q.id ? { ...item, Status: "Đã gửi" } : item));
      toast.success(`Đã gửi ${q.QuotationCode}`);
    } catch {
      toast.error("Lỗi gửi báo giá");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setActionLoadingId(deleteTarget.id);
    try {
      await deleteQuotation(deleteTarget.id);
      setQuotations((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      toast.success(`Đã xóa ${deleteTarget.QuotationCode}`);
    } catch {
      toast.error("Lỗi xóa báo giá");
    } finally {
      setActionLoadingId(null);
      setDeleteTarget(null);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Báo giá"
        description="Quản lý báo giá"
        actionLabel="Tạo báo giá"
        actionHref="/quotations/new"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Tổng báo giá" value={kpi.total} sub={formatCurrency(kpi.totalValue)} icon={FileText} color="bg-blue-100 text-blue-600" />
        <KpiCard label="Chờ gửi" value={kpi.draft} icon={Clock} color="bg-yellow-100 text-yellow-600" />
        <KpiCard label="Đã gửi KH" value={kpi.sent} icon={Send} color="bg-purple-100 text-purple-600" />
        <KpiCard label="Đã chốt" value={kpi.confirmed} sub={`Tỷ lệ chốt: ${kpi.conversionRate}%`} icon={TrendingUp} color="bg-green-100 text-green-600" />
      </div>

      {/* Status tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-1 overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "whitespace-nowrap pb-3 px-3 border-b-2 text-sm font-medium transition-colors",
                activeTab === tab.key
                  ? "border-[#4F5FD9] text-[#4F5FD9]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              {tab.label}
              <span className={cn(
                "ml-2 rounded-full px-2 py-0.5 text-xs",
                activeTab === tab.key ? "bg-[#4F5FD9]/10 text-[#4F5FD9]" : "bg-gray-100 text-gray-500"
              )}>
                {statusCounts[tab.key] ?? 0}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Tìm mã báo giá, khách hàng, sale..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]/40 focus:border-[#4F5FD9]"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <TableSkeleton />
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Không tìm thấy báo giá nào.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mã báo giá</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Khách hàng</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Loại DV</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Tổng VNĐ</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Giảm giá</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sale</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paged.map((q) => (
                  <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm">
                      <Link href={`/quotations/${q.id}`} className="text-[#4F5FD9] hover:underline font-medium">
                        {q.QuotationCode}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{q.CustomerName || "—"}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(q.ServiceTypes) ? q.ServiceTypes : String(q.ServiceTypes || "").split(",").filter(Boolean))
                          .map((st: string) => (
                            <span key={st} className="inline-block px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">{st.trim()}</span>
                          ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">{formatCurrency(q.TotalVND)}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                      {q.DiscountPercent != null && q.DiscountPercent > 0 ? `${q.DiscountPercent}%` : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm"><StatusBadge status={q.Status} /></td>
                    <td className="px-4 py-3 text-sm text-gray-600">{q.SaleOwner || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(q.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {q.Status === "Nháp" && (
                          <>
                            <button
                              onClick={() => handleQuickSend(q)}
                              disabled={actionLoadingId === q.id}
                              title="Gửi KH"
                              className="p-1.5 text-[#4F5FD9] hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
                            >
                              {actionLoadingId === q.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => setDeleteTarget(q)}
                              disabled={actionLoadingId === q.id}
                              title="Xóa"
                              className="p-1.5 text-red-400 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Hiển thị <span className="font-medium">{(currentPage - 1) * PAGE_SIZE + 1}</span> – <span className="font-medium">{Math.min(currentPage * PAGE_SIZE, filtered.length)}</span> trong <span className="font-medium">{filtered.length}</span> báo giá
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-gray-600">{currentPage} / {totalPages}</span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-md border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Xác nhận xóa</h3>
            <p className="text-sm text-gray-600 mb-4">
              Bạn có chắc muốn xóa báo giá <strong>{deleteTarget.QuotationCode}</strong>? Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={actionLoadingId === deleteTarget.id}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 transition-colors"
              >
                {actionLoadingId === deleteTarget.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
