"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { getLeads, createLead } from "@/lib/leads";
import type { Lead } from "@/lib/leads";
import { cn, formatDate, generateCode } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import { Search, X, ChevronLeft, ChevronRight, LayoutList, Columns3, Phone as PhoneIcon } from "lucide-react";
import { toast } from "sonner";

const STATUSES = ["Tất cả", "Mới", "Đang khai thác", "Đã giao Sale", "Đang tư vấn", "Đã báo giá", "Thành KH", "Thất bại"] as const;
const SOURCES = ["Facebook", "TikTok", "Website", "Zalo", "Giới thiệu", "Khác"];
const RATINGS = ["Nóng", "Ấm", "Lạnh", "Xấu"];
const BRANCHES = ["HN", "HCM"];
const PAGE_SIZE = 20;

const RATING_COLORS: Record<string, string> = {
  "Nóng": "bg-red-500",
  "Ấm": "bg-orange-400",
  "Lạnh": "bg-blue-400",
  "Xấu": "bg-gray-400",
};

const PIPELINE_STATUSES = ["Mới", "Đang khai thác", "Đã giao Sale", "Đang tư vấn", "Đã báo giá"] as const;
const PIPELINE_COLORS: Record<string, string> = {
  "Mới": "bg-blue-50",
  "Đang khai thác": "bg-yellow-50",
  "Đã giao Sale": "bg-orange-50",
  "Đang tư vấn": "bg-purple-50",
  "Đã báo giá": "bg-indigo-50",
};

function RatingDot({ rating }: { rating: string | undefined }) {
  if (!rating) return null;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", RATING_COLORS[rating] || "bg-gray-400")} />
      {rating}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 bg-gray-200 rounded w-1/3" />
      <div className="h-6 bg-gray-100 rounded w-1/4" />
      <div className="flex gap-2 mt-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-24 bg-gray-100 rounded-full" />
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded" />
        ))}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
        <Search className="w-6 h-6 text-gray-400" />
      </div>
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );
}

function AddLeadModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (lead: Lead) => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ FullName: "", Phone: "", Source: "", Rating: "", Needs: "", Branch: "" });

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.FullName.trim() || !form.Phone.trim()) {
      toast.error("Vui lòng nhập họ tên và số điện thoại");
      return;
    }
    setSubmitting(true);
    try {
      const lead = await createLead({
        ...form,
        Status: "Mới",
        LeadCode: generateCode("LD"),
      });
      toast.success("Tạo lead thành công");
      onCreated(lead);
      onClose();
      setForm({ FullName: "", Phone: "", Source: "", Rating: "", Needs: "", Branch: "" });
    } catch {
      toast.error("Lỗi khi tạo lead");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#2D3A8C]">Thêm lead mới</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.FullName}
              onChange={(e) => setForm({ ...form, FullName: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]/30 focus:border-[#4F5FD9]"
              placeholder="Nhập họ tên"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.Phone}
              onChange={(e) => setForm({ ...form, Phone: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]/30 focus:border-[#4F5FD9]"
              placeholder="Nhập số điện thoại"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nguồn</label>
              <select
                value={form.Source}
                onChange={(e) => setForm({ ...form, Source: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]/30 focus:border-[#4F5FD9]"
              >
                <option value="">Chọn nguồn</option>
                {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Đánh giá</label>
              <select
                value={form.Rating}
                onChange={(e) => setForm({ ...form, Rating: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]/30 focus:border-[#4F5FD9]"
              >
                <option value="">Chọn đánh giá</option>
                {RATINGS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nhu cầu</label>
            <textarea
              value={form.Needs}
              onChange={(e) => setForm({ ...form, Needs: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]/30 focus:border-[#4F5FD9]"
              placeholder="Mô tả nhu cầu"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chi nhánh</label>
            <select
              value={form.Branch}
              onChange={(e) => setForm({ ...form, Branch: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]/30 focus:border-[#4F5FD9]"
            >
              <option value="">Chọn chi nhánh</option>
              {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Hủy
            </button>
            <button type="submit" disabled={submitting} className="px-5 py-2 text-sm font-medium text-white bg-[#4F5FD9] hover:bg-[#3B4CC0] rounded-lg transition-colors disabled:opacity-50">
              {submitting ? "Đang tạo..." : "Tạo lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PipelineCard({ lead }: { lead: Lead }) {
  return (
    <Link href={`/leads/${lead.id}`}>
      <div className="border border-gray-200 rounded-lg p-3 bg-white hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium text-gray-900 truncate">{lead.FullName || "---"}</span>
          <RatingDot rating={lead.Rating} />
        </div>
        {lead.Phone && (
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
            <PhoneIcon className="w-3 h-3" />
            {lead.Phone}
          </div>
        )}
        <div className="flex items-center gap-1.5 flex-wrap">
          {lead.Source && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-gray-300 text-gray-600">
              {lead.Source}
            </span>
          )}
          {lead.SaleOwner && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              {lead.SaleOwner}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function PipelineView({ leads }: { leads: Lead[] }) {
  const grouped = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    for (const s of PIPELINE_STATUSES) map[s] = [];
    for (const lead of leads) {
      const status = lead.Status || "";
      if (status in map) map[status].push(lead);
    }
    return map;
  }, [leads]);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {PIPELINE_STATUSES.map((status) => (
        <div key={status} className={cn("flex-shrink-0 w-72 rounded-xl p-3", PIPELINE_COLORS[status])}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{status}</h3>
            <span className="text-xs font-medium text-gray-500 bg-white rounded-full px-2 py-0.5">
              {grouped[status].length}
            </span>
          </div>
          <div className="space-y-2">
            {grouped[status].length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">Trống</p>
            ) : (
              grouped[status].map((lead) => <PipelineCard key={lead.id} lead={lead} />)
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tất cả");
  const [sourceFilter, setSourceFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "pipeline">("list");

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const { data } = await getLeads({ take: 200, sortField: "createdAt", sortDirection: "desc" });
      setLeads(data);
    } catch {
      toast.error("Lỗi khi tải danh sách lead");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let result = leads;

    if (statusFilter !== "Tất cả") {
      result = result.filter((l) => l.Status === statusFilter);
    }
    if (sourceFilter) {
      result = result.filter((l) => (l.Source || "").trim().toLowerCase() === sourceFilter.trim().toLowerCase());
    }
    if (ratingFilter) {
      result = result.filter((l) => (l.Rating || "").trim().toLowerCase() === ratingFilter.trim().toLowerCase());
    }
    if (branchFilter) {
      result = result.filter((l) => (l.Branch || "").trim().toLowerCase() === branchFilter.trim().toLowerCase());
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (l) =>
          (l.FullName || "").toLowerCase().includes(q) ||
          (l.Phone || "").toLowerCase().includes(q) ||
          (l.LeadCode || "").toLowerCase().includes(q)
      );
    }

    return result;
  }, [leads, statusFilter, sourceFilter, ratingFilter, branchFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, sourceFilter, ratingFilter, branchFilter, search]);

  const handleLeadCreated = (lead: Lead) => {
    setLeads((prev) => [lead, ...prev]);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <PageHeader
        title="Lead (KH tiềm năng)"
        description="Quản lý khách hàng tiềm năng"
        actionLabel="Thêm lead"
        onAction={() => setShowAddForm(true)}
      />

      {/* View mode tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setViewMode("list")}
          className={cn(
            "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors",
            viewMode === "list"
              ? "bg-[#4F5FD9] text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          <LayoutList className="w-4 h-4" />
          Danh sách
        </button>
        <button
          onClick={() => setViewMode("pipeline")}
          className={cn(
            "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors",
            viewMode === "pipeline"
              ? "bg-[#4F5FD9] text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          <Columns3 className="w-4 h-4" />
          Pipeline
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {STATUSES.map((s) => {
          const count = s === "Tất cả" ? leads.length : leads.filter((l) => l.Status === s).length;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors",
                statusFilter === s
                  ? "bg-[#4F5FD9] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {s} ({count})
            </button>
          );
        })}
      </div>

      {/* Search + Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo tên, SĐT, mã lead..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]/30 focus:border-[#4F5FD9]"
          />
        </div>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]/30 focus:border-[#4F5FD9]"
        >
          <option value="">Tất cả nguồn</option>
          {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]/30 focus:border-[#4F5FD9]"
        >
          <option value="">Tất cả đánh giá</option>
          {RATINGS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]/30 focus:border-[#4F5FD9]"
        >
          <option value="">Tất cả chi nhánh</option>
          {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {/* Content */}
      {viewMode === "list" ? (
        <>
          {filtered.length === 0 ? (
            <EmptyState message="Không có lead nào phù hợp với bộ lọc" />
          ) : (
            <>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mã lead</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Họ tên</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">SĐT</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nguồn</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Đánh giá</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sale</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginated.map((lead) => (
                        <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <Link href={`/leads/${lead.id}`} className="text-sm font-medium text-[#4F5FD9] hover:text-[#3B4CC0] hover:underline">
                              {lead.LeadCode || "---"}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{lead.FullName || "---"}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{lead.Phone || "---"}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{lead.Source || "---"}</td>
                          <td className="px-4 py-3 text-sm"><RatingDot rating={lead.Rating} /></td>
                          <td className="px-4 py-3"><StatusBadge status={lead.Status} /></td>
                          <td className="px-4 py-3 text-sm text-gray-600">{lead.SaleOwner || "---"}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{formatDate(lead.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Record count + Pagination */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length} bản ghi
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .reduce<(number | string)[]>((acc, p, idx, arr) => {
                      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      typeof p === "string" ? (
                        <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-sm">...</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={cn(
                            "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                            page === p ? "bg-[#4F5FD9] text-white" : "hover:bg-gray-100 text-gray-600"
                          )}
                        >
                          {p}
                        </button>
                      )
                    )}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      ) : (
        <PipelineView leads={filtered} />
      )}

      <AddLeadModal open={showAddForm} onClose={() => setShowAddForm(false)} onCreated={handleLeadCreated} />
    </div>
  );
}
