"use client";

import { useEffect, useState, useMemo } from "react";
import { listApprovals } from "@/lib/approvals";
import type { Approval } from "@/lib/approvals";
import { getCurrentUser, decideApproval, listGroups, type CurrentUser, type GroupMember } from "@/lib/inforact-sdk-ext";
import { cn, formatDate, formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Search, X, ChevronLeft, ChevronRight, Clock, AlertTriangle, CheckCircle, XCircle, ShieldCheck, Lock } from "lucide-react";
import { toast } from "sonner";

const STATUS_TABS = ["Chờ duyệt", "Đã duyệt", "Từ chối"] as const;
const PAGE_SIZE = 20;

const TYPE_COLORS: Record<string, string> = {
  "Giảm giá": "bg-orange-100 text-orange-700",
  "Hủy đơn": "bg-red-100 text-red-700",
  "Phiếu chi": "bg-green-100 text-green-700",
  "Container plan": "bg-blue-100 text-blue-700",
  "Xuất kho": "bg-purple-100 text-purple-700",
  "Ân hạn": "bg-yellow-100 text-yellow-700",
  "Miễn cọc": "bg-gray-100 text-gray-600",
};

function TypeBadge({ type }: { type: string | undefined }) {
  if (!type) return null;
  const style = TYPE_COLORS[type] || "bg-gray-100 text-gray-600";
  return <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium", style)}>{type}</span>;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 bg-gray-200 rounded w-1/3" />
      <div className="h-6 bg-gray-100 rounded w-1/4" />
      <div className="flex gap-2 mt-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-8 w-28 bg-gray-100 rounded-full" />
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
        <ShieldCheck className="w-6 h-6 text-gray-400" />
      </div>
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );
}

function DecisionDialog({ open, type, onClose, onConfirm }: { open: boolean; type: "approve" | "reject"; onClose: () => void; onConfirm: (note: string) => void }) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleConfirm = async () => {
    setSubmitting(true);
    await onConfirm(note);
    setSubmitting(false);
    setNote("");
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-semibold text-[#2D3A8C]">
            {type === "approve" ? "Xác nhận duyệt" : "Xác nhận từ chối"}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              placeholder={type === "approve" ? "Ghi chú phê duyệt (tùy chọn)..." : "Lý do từ chối..."}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none resize-none"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 border rounded-lg hover:bg-gray-50">Hủy</button>
            <button
              onClick={handleConfirm}
              disabled={submitting}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50",
                type === "approve"
                  ? "bg-[#4F5FD9] text-white hover:bg-[#3B4CC0]"
                  : "bg-red-600 text-white hover:bg-red-700"
              )}
            >
              {submitting ? "Đang xử lý..." : type === "approve" ? "Duyệt" : "Từ chối"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function canDecide(
  approval: Approval,
  user: CurrentUser | null,
  groupMembers: Map<string, GroupMember[]>,
): boolean {
  if (!user) return false;
  if (approval.Status !== "Chờ duyệt" && approval.Status !== "Đã leo thang") return false;
  const groupId = approval.CurrentApprover;
  const requiredTitle = approval.CurrentApproverTitle;
  if (!groupId || !requiredTitle) return false;
  const members = groupMembers.get(groupId);
  if (!members) return false;
  return members.some((m) => m.userId === user.id && m.title === requiredTitle);
}

function ApprovalCard({ approval, currentUser, groupMembers, onApprove, onReject }: { approval: Approval; currentUser: CurrentUser | null; groupMembers: Map<string, GroupMember[]>; onApprove: () => void; onReject: () => void }) {
  const isOverdue = approval.SLADeadline && new Date(approval.SLADeadline) < new Date();
  const isPending = approval.Status === "Chờ duyệt";
  const canAct = canDecide(approval, currentUser, groupMembers);

  return (
    <div className={cn("border rounded-xl p-5 bg-white hover:shadow-md transition-shadow", isOverdue && isPending && "border-red-200")}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-3">
          {/* Type + Reference */}
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type={approval.Type} />
            {approval.ReferenceCode && (
              <span className="text-sm font-medium text-[#4F5FD9]">{approval.ReferenceCode}</span>
            )}
            {isOverdue && isPending && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                <AlertTriangle className="w-3 h-3" />
                Quá hạn
              </span>
            )}
          </div>

          {/* Summary */}
          {approval.Summary && <p className="text-sm text-gray-700">{approval.Summary}</p>}

          {/* Details row */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
            {approval.RequestedBy && (
              <span>Yêu cầu bởi: <span className="font-medium text-gray-700">{approval.RequestedBy}</span></span>
            )}
            {approval.Amount != null && approval.Amount > 0 && (
              <span>Số tiền: <span className="font-semibold text-gray-900">{formatCurrency(approval.Amount)}</span></span>
            )}
            {approval.CurrentStep != null && approval.TotalSteps != null && (
              <span className="inline-flex items-center gap-1">
                Bước {approval.CurrentStep}/{approval.TotalSteps}
                <div className="w-16 h-1.5 bg-gray-200 rounded-full ml-1 overflow-hidden">
                  <div
                    className="h-full bg-[#4F5FD9] rounded-full transition-all"
                    style={{ width: `${((approval.CurrentStep || 0) / (approval.TotalSteps || 1)) * 100}%` }}
                  />
                </div>
              </span>
            )}
            {approval.SLADeadline && (
              <span className={cn("inline-flex items-center gap-1", isOverdue && isPending ? "text-red-600 font-medium" : "")}>
                <Clock className="w-3 h-3" />
                Hạn: {formatDate(approval.SLADeadline)}
              </span>
            )}
          </div>

          {/* Decision info (for decided approvals) */}
          {approval.DecisionNote && (
            <p className="text-xs text-gray-500 italic bg-gray-50 rounded-lg px-3 py-2">
              Ghi chú: {approval.DecisionNote}
            </p>
          )}
        </div>

        {/* Action buttons — gated by current approver */}
        {isPending && canAct && (
          <div className="flex flex-col gap-2 flex-shrink-0">
            <button
              onClick={onApprove}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4F5FD9] text-white rounded-lg text-sm font-medium hover:bg-[#3B4CC0] transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Duyệt
            </button>
            <button
              onClick={onReject}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Từ chối
            </button>
          </div>
        )}
        {isPending && !canAct && currentUser && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400 flex-shrink-0" title="Bạn không phải người duyệt bước này">
            <Lock className="w-3.5 h-3.5" />
            Chờ {approval.CurrentApproverTitle ?? ""} {approval.CurrentApprover}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ApprovalsPage() {
  const [data, setData] = useState<Approval[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [groupMembers, setGroupMembers] = useState<Map<string, GroupMember[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState<string>("Chờ duyệt");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<{ open: boolean; type: "approve" | "reject"; approvalId: string }>({ open: false, type: "approve", approvalId: "" });

  useEffect(() => {
    let cancelled = false;
    loadData();
    getCurrentUser()
      .then((u) => !cancelled && setCurrentUser(u))
      .catch(() => !cancelled && setCurrentUser(null));
    listGroups()
      .then((groups) => {
        if (cancelled) return;
        const map = new Map<string, GroupMember[]>();
        for (const g of groups) map.set(g.id, g.members);
        setGroupMembers(map);
      })
      .catch(() => !cancelled && setGroupMembers(new Map()));
    return () => {
      cancelled = true;
    };
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const { data: approvals } = await listApprovals({ take: 200, sort: [{ field: "createdAt", direction: "desc" }] });
      setData(approvals);
    } catch {
      toast.error("Lỗi tải dữ liệu phê duyệt");
    } finally {
      setLoading(false);
    }
  }

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    STATUS_TABS.forEach(s => { counts[s] = data.filter(a => a.Status === s).length; });
    return counts;
  }, [data]);

  const filtered = useMemo(() => {
    let result = data.filter(a => a.Status === statusTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(a =>
        (a.ApprovalCode || "").toLowerCase().includes(q) ||
        (a.ReferenceCode || "").toLowerCase().includes(q) ||
        (a.Summary || "").toLowerCase().includes(q) ||
        (a.RequestedBy || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [data, statusTab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDecision = async (note: string) => {
    const { type, approvalId } = dialog;
    const approval = data.find(a => a.id === approvalId);
    if (!approval) return;

    if (!canDecide(approval, currentUser, groupMembers)) {
      toast.error("Bạn không có quyền duyệt bước này");
      return;
    }

    try {
      await decideApproval(approvalId, type, note || undefined);
      toast.success(
        type === "approve"
          ? "Đã duyệt — chuyển bước tiếp theo hoặc hoàn tất"
          : "Đã từ chối yêu cầu"
      );
      setDialog({ open: false, type: "approve", approvalId: "" });
      await loadData();
    } catch (err: any) {
      toast.error(`Lỗi xử lý phê duyệt: ${err?.message ?? "unknown"}`);
    }
  };

  if (loading) return <div className="p-6"><LoadingSkeleton /></div>;

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Phê duyệt" description="Hộp thư phê duyệt" />

      {/* Status tabs */}
      <div className="flex gap-1 border-b">
        {STATUS_TABS.map(s => (
          <button
            key={s}
            onClick={() => { setStatusTab(s); setPage(1); }}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
              statusTab === s ? "border-[#4F5FD9] text-[#4F5FD9]" : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            {s}
            <span className={cn(
              "ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold",
              statusTab === s ? "bg-[#4F5FD9] text-white" : "bg-gray-100 text-gray-500"
            )}>
              {statusCounts[s] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Tìm mã phê duyệt, mã tham chiếu, nội dung..."
          className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none"
        />
      </div>

      {/* Approval cards */}
      {paged.length === 0 ? (
        <EmptyState message={statusTab === "Chờ duyệt" ? "Không có yêu cầu nào chờ duyệt" : "Không tìm thấy phê duyệt nào"} />
      ) : (
        <div className="space-y-3">
          {paged.map(approval => (
            <ApprovalCard
              key={approval.id}
              approval={approval}
              currentUser={currentUser}
              groupMembers={groupMembers}
              onApprove={() => setDialog({ open: true, type: "approve", approvalId: approval.id })}
              onReject={() => setDialog({ open: true, type: "reject", approvalId: approval.id })}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-gray-500">
            Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length} yêu cầu
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

      <DecisionDialog
        open={dialog.open}
        type={dialog.type}
        onClose={() => setDialog({ open: false, type: "approve", approvalId: "" })}
        onConfirm={handleDecision}
      />
    </div>
  );
}
