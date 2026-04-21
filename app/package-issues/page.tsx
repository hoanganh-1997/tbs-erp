"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  AlertTriangle,
  Plus,
  X,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatDate, generateCode } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import {
  getPackageIssues,
  createPackageIssue,
  updatePackageIssue,
  type PackageIssue,
  type CreatePackageIssueInput,
} from "@/lib/package-issues";
import { getEmployees, type Employee } from "@/lib/employees";

const STATUS_TABS = ["Tất cả", "Mở", "Đang xử lý", "Chờ KH", "Đã giải quyết", "Đã đóng"];
const ISSUE_TYPES = [
  "Thiếu kiện",
  "Sai hàng",
  "Hàng hư hỏng",
  "Kiện không xác định",
  "Sai kích thước",
  "Nhãn sai",
];
const SEVERITY_OPTIONS = ["Nhẹ", "Trung bình", "Nặng", "Nghiêm trọng"];
const STATUS_OPTIONS = ["Mở", "Đang xử lý", "Chờ KH", "Đã giải quyết", "Đã đóng"];

const SEVERITY_COLORS: Record<string, string> = {
  "Nhẹ": "bg-gray-100 text-gray-600",
  "Trung bình": "bg-yellow-100 text-yellow-700",
  "Nặng": "bg-orange-100 text-orange-700",
  "Nghiêm trọng": "bg-red-100 text-red-700",
};

const PAGE_SIZE = 20;

// --- Helper components ---

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
      ))}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string | undefined }) {
  if (!severity) return null;
  const style = SEVERITY_COLORS[severity] || "bg-gray-100 text-gray-600";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap",
        style
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
      {severity}
    </span>
  );
}

function CreateIssueModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [issueType, setIssueType] = useState(ISSUE_TYPES[0]);
  const [severity, setSeverity] = useState(SEVERITY_OPTIONS[1]);
  const [orderCode, setOrderCode] = useState("");
  const [description, setDescription] = useState("");
  const [reportedBy, setReportedBy] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [saving, setSaving] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showReporterDropdown, setShowReporterDropdown] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);

  useEffect(() => {
    if (!open) return;
    getEmployees({ take: 200, sortField: "createdAt", sortDirection: "desc" }).then(res => setEmployees(res.data || [])).catch(() => {});
  }, [open]);

  const filteredReporters = useMemo(() => {
    if (!reportedBy.trim()) return employees.slice(0, 8);
    const q = reportedBy.toLowerCase();
    return employees.filter(e => (e.FullName || "").toLowerCase().includes(q)).slice(0, 8);
  }, [employees, reportedBy]);

  const filteredAssignees = useMemo(() => {
    if (!assignedTo.trim()) return employees.slice(0, 8);
    const q = assignedTo.toLowerCase();
    return employees.filter(e => (e.FullName || "").toLowerCase().includes(q)).slice(0, 8);
  }, [employees, assignedTo]);

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error("Vui lòng nhập mô tả vấn đề");
      return;
    }
    setSaving(true);
    try {
      const input: CreatePackageIssueInput = {
        IssueCode: generateCode("VD"),
        IssueType: issueType,
        Severity: severity,
        OrderCode: orderCode.trim() || undefined,
        Description: description.trim(),
        Status: "Mở",
        ReportedBy: reportedBy.trim() || undefined,
        AssignedTo: assignedTo.trim() || undefined,
      };
      await createPackageIssue(input);
      toast.success("Đã tạo vấn đề mới");
      onCreated();
      onClose();
      // Reset form
      setIssueType(ISSUE_TYPES[0]);
      setSeverity(SEVERITY_OPTIONS[1]);
      setOrderCode("");
      setDescription("");
      setReportedBy("");
      setAssignedTo("");
    } catch {
      toast.error("Lỗi khi tạo vấn đề");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#2D3A8C]">Báo cáo vấn đề kiện hàng</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Issue type */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Loại vấn đề *</label>
            <div className="flex flex-wrap gap-2">
              {ISSUE_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setIssueType(t)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-medium border transition-colors",
                    issueType === t
                      ? "bg-[#4F5FD9] text-white border-[#4F5FD9]"
                      : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Severity */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Mức độ *</label>
            <div className="flex flex-wrap gap-2">
              {SEVERITY_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSeverity(s)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-medium border transition-colors",
                    severity === s
                      ? "bg-[#4F5FD9] text-white border-[#4F5FD9]"
                      : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Order code */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Mã đơn hàng</label>
            <input
              type="text"
              value={orderCode}
              onChange={(e) => setOrderCode(e.target.value)}
              placeholder="VD: DH-240101-001"
              className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Mô tả vấn đề *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Mô tả chi tiết vấn đề..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent text-sm resize-none"
            />
          </div>

          {/* Reported by & Assigned to */}
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-xs font-medium text-gray-500 mb-1">Người báo cáo</label>
              <input
                type="text"
                value={reportedBy}
                onChange={(e) => { setReportedBy(e.target.value); setShowReporterDropdown(true); }}
                onFocus={() => setShowReporterDropdown(true)}
                onBlur={() => setTimeout(() => setShowReporterDropdown(false), 200)}
                placeholder="Tìm nhân viên..."
                className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent text-sm"
              />
              {showReporterDropdown && filteredReporters.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {filteredReporters.map(e => (
                    <button key={e.id} type="button" onMouseDown={() => { setReportedBy(e.FullName || ""); setShowReporterDropdown(false); }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">
                      <span className="font-medium">{e.FullName}</span>
                      {e.Department && <span className="text-gray-400 ml-2 text-xs">{e.Department}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <label className="block text-xs font-medium text-gray-500 mb-1">Người xử lý</label>
              <input
                type="text"
                value={assignedTo}
                onChange={(e) => { setAssignedTo(e.target.value); setShowAssigneeDropdown(true); }}
                onFocus={() => setShowAssigneeDropdown(true)}
                onBlur={() => setTimeout(() => setShowAssigneeDropdown(false), 200)}
                placeholder="Tìm nhân viên..."
                className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent text-sm"
              />
              {showAssigneeDropdown && filteredAssignees.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {filteredAssignees.map(e => (
                    <button key={e.id} type="button" onMouseDown={() => { setAssignedTo(e.FullName || ""); setShowAssigneeDropdown(false); }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">
                      <span className="font-medium">{e.FullName}</span>
                      {e.Department && <span className="text-gray-400 ml-2 text-xs">{e.Department}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#4F5FD9] hover:bg-[#3B4CC0] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            {saving ? "Đang tạo..." : "Tạo vấn đề"}
          </button>
        </div>
      </div>
    </div>
  );
}

function UpdateStatusModal({
  issue,
  open,
  onClose,
  onUpdated,
}: {
  issue: PackageIssue | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [status, setStatus] = useState(issue?.Status || "Mở");
  const [resolution, setResolution] = useState(issue?.Resolution || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (issue) {
      setStatus(issue.Status || "Mở");
      setResolution(issue.Resolution || "");
    }
  }, [issue]);

  const handleSubmit = async () => {
    if (!issue) return;
    setSaving(true);
    try {
      await updatePackageIssue(issue.id, {
        Status: status,
        Resolution: resolution.trim() || undefined,
      });
      toast.success(`Đã cập nhật trạng thái: ${status}`);
      onUpdated();
      onClose();
    } catch {
      toast.error("Lỗi cập nhật trạng thái");
    } finally {
      setSaving(false);
    }
  };

  if (!open || !issue) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#2D3A8C]">Cập nhật trạng thái</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <span className="text-xs text-gray-500">Mã vấn đề</span>
            <p className="text-sm font-medium text-gray-900">{issue.IssueCode}</p>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Trạng thái mới</label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-medium border transition-colors",
                    status === s
                      ? "bg-[#4F5FD9] text-white border-[#4F5FD9]"
                      : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Resolution */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Giải pháp / ghi chú</label>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              rows={3}
              placeholder="Mô tả cách xử lý..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent text-sm resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#4F5FD9] hover:bg-[#3B4CC0] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {saving ? "Đang lưu..." : "Cập nhật"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Main page ---

export default function PackageIssuesPage() {
  const [issues, setIssues] = useState<PackageIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchApplied, setSearchApplied] = useState("");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editIssue, setEditIssue] = useState<PackageIssue | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getPackageIssues({
        take: 200,
        sortField: "createdAt",
        sortDirection: "desc",
      });
      setIssues(data);
    } catch {
      toast.error("Lỗi tải dữ liệu vấn đề kiện hàng");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    return issues.filter((i) => {
      if (activeTab !== "Tất cả" && i.Status !== activeTab) return false;
      if (
        searchApplied &&
        !i.OrderCode?.toLowerCase().includes(searchApplied.toLowerCase()) &&
        !i.IssueCode?.toLowerCase().includes(searchApplied.toLowerCase()) &&
        !i.Description?.toLowerCase().includes(searchApplied.toLowerCase())
      )
        return false;
      return true;
    });
  }, [issues, activeTab, searchApplied]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = () => {
    setSearchApplied(searchQuery.trim());
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vấn đề kiện hàng"
        description="Theo dõi và xử lý vấn đề kiện hàng"
        actionLabel="Báo cáo vấn đề"
        onAction={() => setShowCreate(true)}
      />

      {/* Search */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Tìm theo mã đơn, mã vấn đề hoặc mô tả..."
              className="w-full h-12 text-lg pl-12 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSearch}
            className="h-12 px-6 bg-[#4F5FD9] hover:bg-[#3B4CC0] text-white rounded-lg text-sm font-medium transition-colors"
          >
            Tra cứu
          </button>
        </div>
        {searchApplied && (
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
            <span>Đang lọc: &quot;{searchApplied}&quot;</span>
            <button
              onClick={() => {
                setSearchApplied("");
                setSearchQuery("");
              }}
              className="text-[#4F5FD9] hover:text-[#3B4CC0] underline"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setPage(1);
            }}
            className={cn(
              "px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
              activeTab === tab
                ? "border-[#4F5FD9] text-[#4F5FD9]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            {tab}
            <span className="ml-1.5 text-xs text-gray-400">
              ({issues.filter((i) => tab === "Tất cả" || i.Status === tab).length})
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton />
      ) : paginated.length === 0 ? (
        <EmptyState
          title="Chưa có vấn đề"
          description="Chưa có vấn đề kiện hàng nào được báo cáo"
          icon={AlertTriangle}
          action={
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#4F5FD9] hover:bg-[#3B4CC0] text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Báo cáo vấn đề
            </button>
          }
        />
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  {[
                    "Mã vấn đề",
                    "Mã đơn",
                    "Loại",
                    "Mức độ",
                    "Trạng thái",
                    "Người báo cáo",
                    "Người xử lý",
                    "Ngày tạo",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((i) => (
                  <tr key={i.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{i.IssueCode}</td>
                    <td className="px-4 py-3 text-sm">
                      {i.OrderCode ? (
                        <span className="text-[#4F5FD9]">{i.OrderCode}</span>
                      ) : (
                        <span className="text-gray-400">---</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{i.IssueType || "---"}</td>
                    <td className="px-4 py-3">
                      <SeverityBadge severity={i.Severity} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={i.Status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{i.ReportedBy || "---"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{i.AssignedTo || "---"}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(i.createdAt)}</td>
                    <td className="px-4 py-3">
                      {i.Status !== "Đã đóng" && (
                        <button
                          onClick={() => setEditIssue(i)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 hover:bg-gray-50 text-gray-600 rounded-lg text-xs font-medium transition-colors"
                        >
                          Cập nhật
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Hiển thị {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length} vấn đề
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

      {/* Create Modal */}
      <CreateIssueModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={fetchData}
      />

      {/* Update Status Modal */}
      <UpdateStatusModal
        issue={editIssue}
        open={editIssue !== null}
        onClose={() => setEditIssue(null)}
        onUpdated={fetchData}
      />
    </div>
  );
}
