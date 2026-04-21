"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getLead, updateLead } from "@/lib/leads";
import type { Lead } from "@/lib/leads";
import { createCustomer, getCustomer } from "@/lib/customers";
import { getLeadActivities, createLeadActivity } from "@/lib/lead-activities";
import type { LeadActivity } from "@/lib/lead-activities";
import { cn, formatDate, generateCode } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import {
  ArrowLeft,
  Plus,
  Phone as PhoneIcon,
  MessageSquare,
  Mail,
  Users,
  StickyNote,
  UserPlus,
  FileText,
  UserCheck,
  XCircle,
  Pencil,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { toast } from "sonner";

const RATING_COLORS: Record<string, string> = {
  "Nóng": "bg-red-500",
  "Ấm": "bg-orange-400",
  "Lạnh": "bg-blue-400",
  "Xấu": "bg-gray-400",
};

const ACTIVITY_TYPE_ICONS: Record<string, typeof PhoneIcon> = {
  "Gọi điện": PhoneIcon,
  "Zalo": MessageSquare,
  "Email": Mail,
  "Gặp mặt": Users,
  "Ghi chú": StickyNote,
};

const ACTIVITY_TYPES = ["Gọi điện", "Zalo", "Email", "Gặp mặt", "Ghi chú"];

const STATUS_FLOW = ["Mới", "Đang khai thác", "Đã giao Sale", "Đang tư vấn", "Đã báo giá", "Thành KH"];

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
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6 animate-pulse">
      <div className="h-5 w-24 bg-gray-200 rounded" />
      <div className="h-8 w-1/3 bg-gray-200 rounded" />
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <div className="h-48 bg-gray-100 rounded-xl" />
          <div className="h-64 bg-gray-100 rounded-xl" />
        </div>
        <div className="space-y-4">
          <div className="h-40 bg-gray-100 rounded-xl" />
          <div className="h-32 bg-gray-100 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">{label}</dt>
      <dd className="text-sm text-gray-900">{value || "---"}</dd>
    </div>
  );
}

function AssignDialog({ open, onClose, onAssign }: { open: boolean; onClose: () => void; onAssign: (name: string) => void }) {
  const [name, setName] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h3 className="text-lg font-bold text-[#2D3A8C] mb-4">Chuyển cho Sale</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Tên Sale</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]/30 focus:border-[#4F5FD9]"
            placeholder="Nhập tên Sale"
          />
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Hủy
          </button>
          <button
            onClick={() => { if (name.trim()) { onAssign(name.trim()); setName(""); } }}
            className="px-4 py-2 text-sm font-medium text-white bg-[#4F5FD9] hover:bg-[#3B4CC0] rounded-lg transition-colors"
          >
            Chuyển
          </button>
        </div>
      </div>
    </div>
  );
}

function FailureDialog({ open, onClose, onConfirm }: { open: boolean; onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h3 className="text-lg font-bold text-[#2D3A8C] mb-4">Đánh dấu thất bại</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Lý do thất bại</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]/30 focus:border-[#4F5FD9]"
            placeholder="Nhập lý do"
          />
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Hủy
          </button>
          <button
            onClick={() => { if (reason.trim()) { onConfirm(reason.trim()); setReason(""); } }}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}

function ActivityForm({ leadId, onCreated }: { leadId: string; onCreated: (a: LeadActivity) => void }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ ActivityType: "", Content: "", Result: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ActivityType || !form.Content.trim()) {
      toast.error("Vui lòng chọn loại và nhập nội dung");
      return;
    }
    setSubmitting(true);
    try {
      const activity = await createLeadActivity({
        LeadId: leadId,
        ActivityType: form.ActivityType,
        Content: form.Content,
        Result: form.Result,
        CreatedBy: "User",
      });
      toast.success("Thêm nhật ký thành công");
      onCreated(activity);
      setForm({ ActivityType: "", Content: "", Result: "" });
      setOpen(false);
    } catch {
      toast.error("Lỗi khi thêm nhật ký");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#4F5FD9] hover:text-[#3B4CC0] transition-colors"
      >
        <Plus className="w-4 h-4" />
        Thêm nhật ký
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Loại hoạt động</label>
        <select
          value={form.ActivityType}
          onChange={(e) => setForm(prev => ({ ...prev, ActivityType: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]/30 focus:border-[#4F5FD9]"
        >
          <option value="">Chọn loại</option>
          {ACTIVITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung</label>
        <textarea
          value={form.Content}
          onChange={(e) => setForm(prev => ({ ...prev, Content: e.target.value }))}
          rows={2}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]/30 focus:border-[#4F5FD9]"
          placeholder="Nhập nội dung"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Kết quả</label>
        <input
          type="text"
          value={form.Result}
          onChange={(e) => setForm(prev => ({ ...prev, Result: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]/30 focus:border-[#4F5FD9]"
          placeholder="Nhập kết quả"
        />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setOpen(false)} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
          Hủy
        </button>
        <button type="submit" disabled={submitting} className="px-4 py-1.5 text-sm font-medium text-white bg-[#4F5FD9] hover:bg-[#3B4CC0] rounded-lg transition-colors disabled:opacity-50">
          {submitting ? "Đang lưu..." : "Lưu"}
        </button>
      </div>
    </form>
  );
}

function StatusFlowVisual({ currentStatus, onStatusChange }: { currentStatus: string | undefined; onStatusChange?: (newStatus: string) => void }) {
  const currentIndex = STATUS_FLOW.indexOf(currentStatus || "");
  const isFailed = currentStatus === "Thất bại";

  return (
    <div className="space-y-0">
      {STATUS_FLOW.map((status, idx) => {
        const isCompleted = !isFailed && currentIndex >= 0 && idx < currentIndex;
        const isCurrent = !isFailed && status === currentStatus;
        const isNext = !isFailed && currentIndex >= 0 && idx === currentIndex + 1;
        const canClick = isNext && onStatusChange;
        return (
          <div
            key={status}
            className={cn("flex items-start gap-3", canClick && "cursor-pointer group")}
            onClick={canClick ? () => onStatusChange(status) : undefined}
          >
            <div className="flex flex-col items-center">
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              ) : isCurrent ? (
                <div className="w-5 h-5 rounded-full border-2 border-[#4F5FD9] bg-[#4F5FD9]/10 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-[#4F5FD9]" />
                </div>
              ) : (
                <Circle className={cn("w-5 h-5 flex-shrink-0", canClick ? "text-[#4F5FD9]/50 group-hover:text-[#4F5FD9]" : "text-gray-300")} />
              )}
              {idx < STATUS_FLOW.length - 1 && (
                <div className={cn("w-0.5 h-6", isCompleted ? "bg-green-300" : "bg-gray-200")} />
              )}
            </div>
            <span className={cn(
              "text-sm pt-0.5",
              isCurrent ? "font-semibold text-[#2D3A8C]" : isCompleted ? "text-green-700" : canClick ? "text-[#4F5FD9]/70 group-hover:text-[#4F5FD9] group-hover:font-medium" : "text-gray-400"
            )}>
              {status}
              {canClick && <span className="text-xs ml-1 opacity-0 group-hover:opacity-100 transition-opacity">(click để chuyển)</span>}
            </span>
          </div>
        );
      })}
      {isFailed && (
        <div className="flex items-start gap-3 mt-1">
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-sm font-semibold text-red-600 pt-0.5">Thất bại</span>
        </div>
      )}
    </div>
  );
}

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssign, setShowAssign] = useState(false);
  const [showFailure, setShowFailure] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leadData, activitiesData] = await Promise.all([
        getLead(id),
        getLeadActivities({ filters: { LeadId: id }, sortField: "createdAt", sortDirection: "desc", take: 200 }),
      ]);
      setLead(leadData);
      setActivities(activitiesData.data);
    } catch {
      toast.error("Lỗi khi tải thông tin lead");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSale = async (saleName: string) => {
    setActionLoading(true);
    try {
      await updateLead(id, { SaleOwner: saleName, Status: "Đã giao Sale" });
      setLead((prev) => prev ? { ...prev, SaleOwner: saleName, Status: "Đã giao Sale" } : prev);
      toast.success("Đã chuyển cho Sale thành công");
      setShowAssign(false);
    } catch {
      toast.error("Lỗi khi chuyển cho Sale");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvertToCustomer = async () => {
    if (!lead) return;
    // Idempotent: if already converted, just navigate
    if (lead.ConvertedCustomerId) {
      try {
        const existing = await getCustomer(lead.ConvertedCustomerId);
        toast.info(`Lead đã được chuyển thành KH ${existing.CustomerCode || ""}`);
        router.push(`/customers/${existing.id}`);
        return;
      } catch {
        // fall through to recreate if customer was deleted
      }
    }
    setActionLoading(true);
    try {
      // 1. Create customer record
      const customer = await createCustomer({
        CustomerCode: generateCode("KH"),
        CompanyName: lead.FullName || "",
        ContactName: lead.FullName || "",
        Phone: lead.Phone || "",
        Branch: lead.Branch || undefined,
        Tier: "Active",
        SaleOwner: lead.SaleOwner || "",
        LeaderName: lead.LeaderName || "",
        SourceLeadId: lead.id,
        DepositRate: 50,
      });
      // 2. Update lead with status + back-reference
      await updateLead(id, { Status: "Thành KH", ConvertedCustomerId: customer.id });
      setLead((prev) => prev ? { ...prev, Status: "Thành KH", ConvertedCustomerId: customer.id } : prev);
      toast.success(`Đã tạo KH ${customer.CustomerCode}`, {
        action: {
          label: "Xem",
          onClick: () => router.push(`/customers/${customer.id}`),
        },
      });
    } catch (err) {
      console.error("Chuyển thành KH thất bại:", err);
      toast.error("Lỗi khi chuyển thành khách hàng. Vui lòng thử lại.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleFailure = async (reason: string) => {
    setActionLoading(true);
    try {
      await updateLead(id, { Status: "Thất bại", FailureReason: reason });
      setLead((prev) => prev ? { ...prev, Status: "Thất bại", FailureReason: reason } : prev);
      toast.success("Đã đánh dấu thất bại");
      setShowFailure(false);
    } catch {
      toast.error("Lỗi khi cập nhật trạng thái");
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivityCreated = (activity: LeadActivity) => {
    setActivities((prev) => [activity, ...prev]);
  };

  if (loading) return <LoadingSkeleton />;

  if (!lead) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 text-center">
        <p className="text-gray-500">Không tìm thấy lead</p>
        <Link href="/leads" className="text-[#4F5FD9] hover:text-[#3B4CC0] text-sm mt-2 inline-block">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const handleStatusChange = async (newStatus: string) => {
    // "Thành KH" path must create a customer — delegate to handleConvertToCustomer
    if (newStatus === "Thành KH") {
      await handleConvertToCustomer();
      return;
    }
    setActionLoading(true);
    try {
      await updateLead(id, { Status: newStatus });
      setLead((prev) => prev ? { ...prev, Status: newStatus } : prev);
      toast.success(`Đã chuyển sang "${newStatus}"`);
    } catch {
      toast.error("Lỗi khi cập nhật trạng thái");
    } finally {
      setActionLoading(false);
    }
  };

  const status = lead.Status || "";
  const showAssignBtn = status === "Đang khai thác";
  const showQuoteBtn = status === "Đang tư vấn" || status === "Đã giao Sale";
  const showConvertBtn = status === "Đã báo giá";
  const showFailBtn = status !== "Thành KH" && status !== "Thất bại";

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Back */}
      <Link href="/leads" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#4F5FD9] transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Quay lại
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#2D3A8C]">{lead.FullName || "---"}</h1>
              <RatingDot rating={lead.Rating} />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-500">{lead.LeadCode}</span>
              <StatusBadge status={lead.Status} />
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {showAssignBtn && (
          <button
            onClick={() => setShowAssign(true)}
            disabled={actionLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#4F5FD9] hover:bg-[#3B4CC0] rounded-lg transition-colors disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" />
            Chuyển cho Sale
          </button>
        )}
        {showQuoteBtn && (
          <Link
            href={`/quotations/new?leadId=${lead.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#4F5FD9] hover:bg-[#3B4CC0] rounded-lg transition-colors"
          >
            <FileText className="w-4 h-4" />
            Tạo báo giá
          </Link>
        )}
        {showConvertBtn && (
          <button
            onClick={handleConvertToCustomer}
            disabled={actionLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <UserCheck className="w-4 h-4" />
            Chuyển thành KH
          </button>
        )}
        {showFailBtn && (
          <button
            onClick={() => setShowFailure(true)}
            disabled={actionLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 border border-red-300 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" />
            Thất bại
          </button>
        )}
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Lead info card */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-base font-semibold text-[#2D3A8C] mb-4">Thông tin lead</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
              <InfoRow label="Số điện thoại" value={lead.Phone} />
              <InfoRow label="Nguồn" value={lead.Source} />
              <InfoRow label="Chi nhánh" value={lead.Branch} />
              <InfoRow label="Marketing" value={lead.MarketingOwner} />
              <InfoRow label="CSKH" value={lead.CSKHOwner} />
              <InfoRow label="Sale" value={lead.SaleOwner} />
              <InfoRow label="Leader" value={lead.LeaderName} />
              <InfoRow label="Ngày tạo" value={formatDate(lead.createdAt)} />
              <div className="col-span-2 sm:col-span-3">
                <InfoRow label="Nhu cầu" value={lead.Needs} />
              </div>
              {lead.FailureReason && (
                <div className="col-span-2 sm:col-span-3">
                  <InfoRow label="Lý do thất bại" value={lead.FailureReason} />
                </div>
              )}
              {lead.ConvertedCustomerId && (
                <div className="col-span-2 sm:col-span-3">
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Đã chuyển thành KH</dt>
                  <dd className="text-sm">
                    <Link href={`/customers/${lead.ConvertedCustomerId}`} className="text-[#4F5FD9] hover:text-[#3B4CC0] font-medium hover:underline">
                      Xem khách hàng →
                    </Link>
                  </dd>
                </div>
              )}
            </div>
          </div>

          {/* Activity log card */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[#2D3A8C]">Nhật ký hoạt động</h2>
            </div>

            <div className="mb-4">
              <ActivityForm leadId={id} onCreated={handleActivityCreated} />
            </div>

            {activities.length === 0 ? (
              <div className="text-center py-8">
                <StickyNote className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Chưa có nhật ký hoạt động</p>
              </div>
            ) : (
              <div className="space-y-0">
                {activities.map((activity, idx) => {
                  const IconComponent = ACTIVITY_TYPE_ICONS[activity.ActivityType || ""] || StickyNote;
                  return (
                    <div key={activity.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <IconComponent className="w-4 h-4 text-gray-500" />
                        </div>
                        {idx < activities.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 min-h-[24px]" />}
                      </div>
                      <div className="pb-4 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-medium text-gray-900">{activity.ActivityType}</span>
                          <span className="text-xs text-gray-400">{formatDate(activity.createdAt)}</span>
                        </div>
                        <p className="text-sm text-gray-700">{activity.Content}</p>
                        {activity.Result && (
                          <p className="text-xs text-gray-500 mt-0.5">Kết quả: {activity.Result}</p>
                        )}
                        {activity.CreatedBy && (
                          <p className="text-xs text-gray-400 mt-0.5">Bởi: {activity.CreatedBy}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 1/3 */}
        <div className="space-y-6">
          {/* Status card */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-base font-semibold text-[#2D3A8C] mb-4">Trạng thái</h2>
            <div className="mb-4">
              <StatusBadge status={lead.Status} />
            </div>
            <StatusFlowVisual currentStatus={lead.Status} onStatusChange={actionLoading ? undefined : handleStatusChange} />
          </div>

          {/* Assignment card */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-base font-semibold text-[#2D3A8C] mb-4">Phân công</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Sale</p>
                  <p className="text-sm text-gray-900 mt-0.5">{lead.SaleOwner || "Chưa giao"}</p>
                </div>
                <button
                  onClick={() => setShowAssign(true)}
                  className="p-1.5 text-gray-400 hover:text-[#4F5FD9] hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="border-t border-gray-100 pt-3">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Leader</p>
                  <p className="text-sm text-gray-900 mt-0.5">{lead.LeaderName || "---"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <AssignDialog open={showAssign} onClose={() => setShowAssign(false)} onAssign={handleAssignSale} />
      <FailureDialog open={showFailure} onClose={() => setShowFailure(false)} onConfirm={handleFailure} />
    </div>
  );
}
