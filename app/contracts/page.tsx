"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { getContracts, updateContract, deleteContract } from "@/lib/contracts";
import type { Contract } from "@/lib/contracts";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import { Search, ChevronLeft, ChevronRight, FileSignature, TrendingUp, Clock, CheckCircle, Send, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const STATUS_TABS = [
  { key: "all", label: "Tất cả" },
  { key: "Nháp", label: "Nháp" },
  { key: "Chờ ký", label: "Chờ ký" },
  { key: "Đã ký", label: "Đã ký" },
  { key: "Đang thực hiện", label: "Đang thực hiện" },
  { key: "Hoàn thành", label: "Hoàn thành" },
  { key: "Đã hủy", label: "Đã hủy" },
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
          <div className="h-4 bg-gray-200 rounded w-36" />
          <div className="h-4 bg-gray-200 rounded w-28" />
          <div className="h-4 bg-gray-200 rounded w-20" />
          <div className="h-4 bg-gray-200 rounded w-24" />
        </div>
      ))}
    </div>
  );
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await getContracts({ take: 200, sortField: "createdAt", sortDirection: "desc" });
        setContracts(res.data || []);
      } catch {
        setContracts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // ─── KPI ──────────────────────────────────────
  const kpi = useMemo(() => {
    const total = contracts.length;
    const active = contracts.filter((c) => c.Status === "Đang thực hiện").length;
    const pending = contracts.filter((c) => c.Status === "Chờ ký").length;
    const completed = contracts.filter((c) => c.Status === "Hoàn thành").length;
    const totalValue = contracts
      .filter((c) => c.Status !== "Đã hủy")
      .reduce((s, c) => s + (c.ContractValue ?? 0), 0);

    // Sắp hết hạn: EndDate within 30 days
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 86400000);
    const expiringSoon = contracts.filter((c) => {
      if (c.Status !== "Đang thực hiện" || !c.EndDate) return false;
      const end = new Date(c.EndDate);
      return end >= now && end <= in30Days;
    }).length;

    return { total, active, pending, completed, totalValue, expiringSoon };
  }, [contracts]);

  // ─── Filters ──────────────────────────────────
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: contracts.length };
    STATUS_TABS.forEach((t) => {
      if (t.key !== "all") counts[t.key] = contracts.filter((c) => c.Status === t.key).length;
    });
    return counts;
  }, [contracts]);

  const filtered = useMemo(() => {
    let list = contracts;
    if (activeTab !== "all") list = list.filter((c) => c.Status === activeTab);
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter((c) =>
        (c.ContractCode || "").toLowerCase().includes(s) ||
        (c.CustomerName || "").toLowerCase().includes(s) ||
        (c.Title || "").toLowerCase().includes(s) ||
        (c.SaleOwner || "").toLowerCase().includes(s)
      );
    }
    return list;
  }, [contracts, activeTab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => { setCurrentPage(1); }, [activeTab, search]);

  const formatDate = (d: string | undefined) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("vi-VN");
  };

  // ─── Quick Actions ────────────────────────────
  async function handleQuickSend(c: Contract) {
    if (!c.Title?.trim() || !c.CustomerName?.trim() || !c.ContractValue || c.ContractValue <= 0) {
      toast.error("Hợp đồng cần có tiêu đề, khách hàng và giá trị > 0 trước khi gửi ký");
      return;
    }
    setActionLoadingId(c.id);
    try {
      await updateContract(c.id, { Status: "Chờ ký" });
      setContracts((prev) => prev.map((item) => item.id === c.id ? { ...item, Status: "Chờ ký" } : item));
      toast.success(`Đã gửi ký ${c.ContractCode}`);
    } catch {
      toast.error("Lỗi gửi ký hợp đồng");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleQuickDelete(c: Contract) {
    if (!confirm(`Xóa hợp đồng ${c.ContractCode}?`)) return;
    setActionLoadingId(c.id);
    try {
      await deleteContract(c.id);
      setContracts((prev) => prev.filter((item) => item.id !== c.id));
      toast.success(`Đã xóa ${c.ContractCode}`);
    } catch {
      toast.error("Lỗi xóa hợp đồng");
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Hợp đồng"
        description="Quản lý hợp đồng"
        actionLabel="Tạo hợp đồng"
        actionHref="/contracts/new"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Tổng hợp đồng" value={kpi.total} sub={formatCurrency(kpi.totalValue)} icon={FileSignature} color="bg-blue-100 text-blue-600" />
        <KpiCard label="Đang hiệu lực" value={kpi.active} icon={CheckCircle} color="bg-green-100 text-green-600" />
        <KpiCard label="Chờ ký" value={kpi.pending} icon={Clock} color="bg-yellow-100 text-yellow-600" />
        <KpiCard
          label="Sắp hết hạn"
          value={kpi.expiringSoon}
          sub={kpi.expiringSoon > 0 ? "Trong 30 ngày tới" : undefined}
          icon={AlertTriangle}
          color={kpi.expiringSoon > 0 ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"}
        />
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
          placeholder="Tìm mã hợp đồng, khách hàng, tiêu đề, sale..."
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
            <FileSignature className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Không tìm thấy hợp đồng nào.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mã HĐ</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Khách hàng</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tiêu đề</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Giá trị</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sale</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ngày ký</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paged.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm">
                      <Link href={`/contracts/${c.id}`} className="text-[#4F5FD9] hover:underline font-medium">
                        {c.ContractCode}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{c.CustomerName || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-[200px] truncate">{c.Title || "—"}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">{formatCurrency(c.ContractValue, c.Currency)}</td>
                    <td className="px-4 py-3 text-sm"><StatusBadge status={c.Status} /></td>
                    <td className="px-4 py-3 text-sm text-gray-600">{c.SaleOwner || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(c.SignDate)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(c.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {c.Status === "Nháp" && (
                          <>
                            <button
                              onClick={() => handleQuickSend(c)}
                              disabled={actionLoadingId === c.id}
                              title="Gửi ký"
                              className="p-1.5 text-[#4F5FD9] hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
                            >
                              {actionLoadingId === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleQuickDelete(c)}
                              disabled={actionLoadingId === c.id}
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
              Hiển thị <span className="font-medium">{(currentPage - 1) * PAGE_SIZE + 1}</span> – <span className="font-medium">{Math.min(currentPage * PAGE_SIZE, filtered.length)}</span> trong <span className="font-medium">{filtered.length}</span> hợp đồng
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
    </div>
  );
}
