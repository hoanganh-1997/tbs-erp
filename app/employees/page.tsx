"use client";

import { useEffect, useState, useMemo } from "react";
import { getEmployees, createEmployee } from "@/lib/employees";
import type { Employee } from "@/lib/employees";
import { cn, formatDate, generateCode } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import { Search, X, ChevronLeft, ChevronRight, LayoutList, Users } from "lucide-react";
import { toast } from "sonner";

const DEPARTMENTS = ["Tất cả", "Ban Giám đốc", "Kinh doanh", "Tiếp thị", "Kế toán", "Xuất Nhập Khẩu", "Kho Trung Quốc", "Kho Việt Nam"] as const;
const EMP_STATUSES = ["Đang làm", "Thử việc", "Nghỉ phép", "Đã nghỉ"];
const ROLES = ["CEO", "COO", "CFO", "GĐ KD", "Leader", "Sale", "NV MKT", "CSKH", "KT TH", "KT TT", "KT CP", "TP XNK", "NV XNK", "Trưởng kho", "NV kho", "Tài xế", "Agent TQ"];
const BRANCHES = ["HN", "HCM"];
const PAGE_SIZE = 20;

const DEPT_COLORS: Record<string, string> = {
  "Ban Giám đốc": "bg-purple-100 text-purple-700",
  "Kinh doanh": "bg-blue-100 text-blue-700",
  "Tiếp thị": "bg-pink-100 text-pink-700",
  "Kế toán": "bg-green-100 text-green-700",
  "Xuất Nhập Khẩu": "bg-orange-100 text-orange-700",
  "Kho Trung Quốc": "bg-red-100 text-red-700",
  "Kho Việt Nam": "bg-yellow-100 text-yellow-700",
};

function DeptBadge({ dept }: { dept: string | undefined }) {
  if (!dept) return <span className="text-gray-400">---</span>;
  const style = DEPT_COLORS[dept] || "bg-gray-100 text-gray-600";
  return <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium", style)}>{dept}</span>;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 bg-gray-200 rounded w-1/3" />
      <div className="h-6 bg-gray-100 rounded w-1/4" />
      <div className="flex gap-2 mt-4">
        {Array.from({ length: 6 }).map((_, i) => (
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
        <Users className="w-6 h-6 text-gray-400" />
      </div>
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );
}

function AddEmployeeModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (e: Employee) => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    FullName: "", Email: "", Phone: "", Department: "", Position: "", Role: "", Branch: "", StartDate: "", BaseSalary: "",
  });

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.FullName.trim()) { toast.error("Vui lòng nhập họ tên"); return; }
    if (!form.Department) { toast.error("Vui lòng chọn phòng ban"); return; }
    setSubmitting(true);
    try {
      const result = await createEmployee({
        EmployeeCode: generateCode("NV"),
        FullName: form.FullName,
        Email: form.Email,
        Phone: form.Phone,
        Department: form.Department || undefined,
        Position: form.Position,
        Role: form.Role || undefined,
        Branch: form.Branch || undefined,
        StartDate: form.StartDate || undefined,
        BaseSalary: form.BaseSalary ? Number(form.BaseSalary) : undefined,
        Status: "Đang làm",
      });
      toast.success("Thêm nhân viên thành công");
      onCreated(result);
      onClose();
      setForm({ FullName: "", Email: "", Phone: "", Department: "", Position: "", Role: "", Branch: "", StartDate: "", BaseSalary: "" });
    } catch {
      toast.error("Lỗi khi thêm nhân viên");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-[#2D3A8C]">Thêm nhân viên</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã NV</label>
              <input value={generateCode("NV")} disabled className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên *</label>
              <input value={form.FullName} onChange={e => setForm(p => ({ ...p, FullName: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input value={form.Email} onChange={e => setForm(p => ({ ...p, Email: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Điện thoại</label>
              <input value={form.Phone} onChange={e => setForm(p => ({ ...p, Phone: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phòng ban *</label>
              <select value={form.Department} onChange={e => setForm(p => ({ ...p, Department: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none">
                <option value="">-- Chọn --</option>
                {DEPARTMENTS.filter(d => d !== "Tất cả").map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chức vụ</label>
              <input value={form.Position} onChange={e => setForm(p => ({ ...p, Position: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
              <select value={form.Role} onChange={e => setForm(p => ({ ...p, Role: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none">
                <option value="">-- Chọn --</option>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chi nhánh</label>
              <select value={form.Branch} onChange={e => setForm(p => ({ ...p, Branch: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none">
                <option value="">-- Chọn --</option>
                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày vào làm</label>
              <input type="date" value={form.StartDate} onChange={e => setForm(p => ({ ...p, StartDate: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lương cơ bản</label>
              <input type="number" value={form.BaseSalary} onChange={e => setForm(p => ({ ...p, BaseSalary: e.target.value }))} placeholder="VND" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 border rounded-lg hover:bg-gray-50">Hủy</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 text-sm font-medium text-white bg-[#4F5FD9] rounded-lg hover:bg-[#3B4CC0] disabled:opacity-50">
              {submitting ? "Đang lưu..." : "Thêm nhân viên"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EmployeesPage() {
  const [data, setData] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptTab, setDeptTab] = useState("Tất cả");
  const [statusFilter, setStatusFilter] = useState("");
  const [groupByDept, setGroupByDept] = useState(false);
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data: employees } = await getEmployees({ take: 200, sortField: "createdAt", sortDirection: "desc" });
        setData(employees);
      } catch {
        toast.error("Lỗi tải dữ liệu nhân sự");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    let result = data;
    if (deptTab !== "Tất cả") result = result.filter(e => e.Department === deptTab);
    if (statusFilter) result = result.filter(e => e.Status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(e =>
        (e.EmployeeCode || "").toLowerCase().includes(q) ||
        (e.FullName || "").toLowerCase().includes(q) ||
        (e.Email || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [data, deptTab, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const deptCounts = useMemo(() => {
    const counts: Record<string, number> = { "Tất cả": data.length };
    DEPARTMENTS.forEach(d => { if (d !== "Tất cả") counts[d] = data.filter(e => e.Department === d).length; });
    return counts;
  }, [data]);

  const grouped = useMemo(() => {
    if (!groupByDept) return {};
    const groups: Record<string, Employee[]> = {};
    filtered.forEach(e => {
      const dept = e.Department || "Chưa phân bổ";
      if (!groups[dept]) groups[dept] = [];
      groups[dept].push(e);
    });
    return groups;
  }, [filtered, groupByDept]);

  if (loading) return <div className="p-6"><LoadingSkeleton /></div>;

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Nhân sự" description="Quản lý nhân sự" actionLabel="Thêm nhân viên" onAction={() => setShowAdd(true)} />

      {/* Department tabs */}
      <div className="flex gap-1 border-b overflow-x-auto">
        {DEPARTMENTS.map(d => (
          <button
            key={d}
            onClick={() => { setDeptTab(d); setPage(1); }}
            className={cn(
              "px-3 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
              deptTab === d ? "border-[#4F5FD9] text-[#4F5FD9]" : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            {d} <span className="text-xs text-gray-400 ml-1">({deptCounts[d] || 0})</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Tìm mã NV, họ tên, email..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none"
        >
          <option value="">Trạng thái</option>
          {EMP_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button
          onClick={() => setGroupByDept(v => !v)}
          className={cn(
            "inline-flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-colors",
            groupByDept ? "bg-[#4F5FD9] text-white border-[#4F5FD9]" : "text-gray-700 hover:bg-gray-50"
          )}
        >
          <LayoutList className="w-4 h-4" />
          Nhóm theo phòng ban
        </button>
      </div>

      {/* Grouped view */}
      {groupByDept ? (
        Object.keys(grouped).length === 0 ? (
          <EmptyState message="Không tìm thấy nhân viên nào" />
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([dept, employees]) => (
              <div key={dept} className="border rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 flex items-center gap-3">
                  <DeptBadge dept={dept} />
                  <span className="text-sm text-gray-500">({employees.length} nhân viên)</span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mã NV</th>
                      <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Họ tên</th>
                      <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Vai trò</th>
                      <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Chi nhánh</th>
                      <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {employees.map(emp => (
                      <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2.5 font-medium text-gray-900">{emp.EmployeeCode || "---"}</td>
                        <td className="px-4 py-2.5 font-medium text-gray-900">{emp.FullName || "---"}</td>
                        <td className="px-4 py-2.5 text-gray-600">{emp.Email || "---"}</td>
                        <td className="px-4 py-2.5 text-gray-600">{emp.Role || "---"}</td>
                        <td className="px-4 py-2.5 text-gray-600">{emp.Branch || "---"}</td>
                        <td className="px-4 py-2.5"><StatusBadge status={emp.Status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Flat table view */
        paged.length === 0 ? (
          <EmptyState message="Không tìm thấy nhân viên nào" />
        ) : (
          <>
            <div className="border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mã NV</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Họ tên</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Điện thoại</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phòng ban</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Chức vụ</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Vai trò</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Chi nhánh</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ngày vào</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paged.map(emp => (
                      <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">{emp.EmployeeCode || "---"}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{emp.FullName || "---"}</td>
                        <td className="px-4 py-3 text-gray-600">{emp.Email || "---"}</td>
                        <td className="px-4 py-3 text-gray-600">{emp.Phone || "---"}</td>
                        <td className="px-4 py-3"><DeptBadge dept={emp.Department} /></td>
                        <td className="px-4 py-3 text-gray-600">{emp.Position || "---"}</td>
                        <td className="px-4 py-3 text-gray-600">{emp.Role || "---"}</td>
                        <td className="px-4 py-3 text-gray-600">{emp.Branch || "---"}</td>
                        <td className="px-4 py-3"><StatusBadge status={emp.Status} /></td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(emp.StartDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-gray-500">
                  Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length} kết quả
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
          </>
        )
      )}

      <AddEmployeeModal open={showAdd} onClose={() => setShowAdd(false)} onCreated={e => setData(prev => [e, ...prev])} />
    </div>
  );
}
