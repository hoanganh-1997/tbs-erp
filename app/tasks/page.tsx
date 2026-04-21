"use client";

import { useEffect, useState, useMemo } from "react";
import { getOrderHistories } from "@/lib/order-history";
import type { OrderHistoryEntry } from "@/lib/order-history";
import { cn, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import { Search, Clock, ArrowRight, ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";
import { toast } from "sonner";

const TABS = ["Tất cả", "Của tôi", "Quá hạn"] as const;
const DEPT_CHIPS = ["Sale", "Kho", "KT", "XNK"] as const;
const PAGE_SIZE = 20;

const DEPT_KEYWORDS: Record<string, string[]> = {
  "Sale": ["sale", "kinh doanh", "báo giá", "đặt hàng", "xác nhận"],
  "Kho": ["kho", "nhập kho", "xuất kho", "container", "giao hàng"],
  "KT": ["kế toán", "thanh toán", "phiếu chi", "cọc", "thu tiền"],
  "XNK": ["xuất nhập khẩu", "thông quan", "hải quan", "customs"],
};

function matchesDept(entry: OrderHistoryEntry, dept: string): boolean {
  const action = (entry.Action || "").toLowerCase();
  const note = (entry.Note || "").toLowerCase();
  const toStatus = (entry.ToStatus || "").toLowerCase();
  const keywords = DEPT_KEYWORDS[dept] || [];
  return keywords.some(kw => action.includes(kw) || note.includes(kw) || toStatus.includes(kw));
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 bg-gray-200 rounded w-1/3" />
      <div className="h-6 bg-gray-100 rounded w-1/4" />
      <div className="flex gap-2 mt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-16 bg-gray-100 rounded-full" />
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
        <ClipboardList className="w-6 h-6 text-gray-400" />
      </div>
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );
}

function TaskCard({ entry }: { entry: OrderHistoryEntry }) {
  return (
    <div className="border rounded-xl p-4 hover:shadow-md transition-shadow bg-white">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 text-sm">{entry.Action || "Hoạt động"}</p>
          {entry.Note && <p className="text-gray-500 text-xs mt-1 line-clamp-2">{entry.Note}</p>}
          <div className="flex flex-wrap items-center gap-3 mt-3">
            {entry.OrderId && (
              <span className="inline-flex items-center text-xs font-medium text-[#4F5FD9] bg-blue-50 px-2 py-1 rounded-md">
                {entry.OrderId}
              </span>
            )}
            {entry.PerformedBy && (
              <span className="text-xs text-gray-500">
                bởi <span className="font-medium text-gray-700">{entry.PerformedBy}</span>
              </span>
            )}
            {(entry.FromStatus || entry.ToStatus) && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                {entry.FromStatus && <StatusBadge status={entry.FromStatus} />}
                {entry.FromStatus && entry.ToStatus && <ArrowRight className="w-3 h-3 text-gray-400" />}
                {entry.ToStatus && <StatusBadge status={entry.ToStatus} />}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
          <Clock className="w-3.5 h-3.5" />
          {formatDate(entry.createdAt)}
        </div>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const [data, setData] = useState<OrderHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("Tất cả");
  const [activeDepts, setActiveDepts] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data: histories } = await getOrderHistories({ take: 200, sortField: "createdAt", sortDirection: "desc" });
        setData(histories);
      } catch {
        toast.error("Lỗi tải dữ liệu công việc");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleDept = (dept: string) => {
    setActiveDepts(prev => {
      const next = new Set(prev);
      if (next.has(dept)) next.delete(dept);
      else next.add(dept);
      return next;
    });
    setPage(1);
  };

  const filtered = useMemo(() => {
    let result = data;
    if (activeDepts.size > 0) {
      result = result.filter(e => Array.from(activeDepts).some(dept => matchesDept(e, dept)));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(e =>
        (e.Action || "").toLowerCase().includes(q) ||
        (e.Note || "").toLowerCase().includes(q) ||
        (e.OrderId || "").toLowerCase().includes(q) ||
        (e.PerformedBy || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [data, activeDepts, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) return <div className="p-6"><LoadingSkeleton /></div>;

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Công việc" description="Quản lý công việc" />

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setPage(1); }}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
              activeTab === tab ? "border-[#4F5FD9] text-[#4F5FD9]" : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Department filter chips */}
      <div className="bg-gray-50 rounded-lg p-3 flex flex-wrap gap-2 items-center">
        <span className="text-xs font-medium text-gray-500 mr-1">Phòng ban:</span>
        {DEPT_CHIPS.map(dept => (
          <button
            key={dept}
            onClick={() => toggleDept(dept)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              activeDepts.has(dept)
                ? "bg-[#4F5FD9] text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
            )}
          >
            {dept}
          </button>
        ))}
        {activeDepts.size > 0 && (
          <button onClick={() => { setActiveDepts(new Set()); setPage(1); }} className="text-xs text-[#4F5FD9] hover:text-[#3B4CC0] ml-2">
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Tìm theo mô tả, mã đơn, người thực hiện..."
          className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none"
        />
      </div>

      {/* Task cards */}
      {paged.length === 0 ? (
        <EmptyState message="Không có công việc nào" />
      ) : (
        <div className="space-y-3">
          {paged.map(entry => (
            <TaskCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-gray-500">
            Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length} hoạt động
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600 px-2">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
