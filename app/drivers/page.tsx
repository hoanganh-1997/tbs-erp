"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, UserCheck, Plus, X, Phone } from "lucide-react";
import { toast } from "sonner";
import { cn, formatDate, generateCode } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import {
  getDrivers,
  createDriver,
  type Driver,
  type CreateDriverInput,
} from "@/lib/drivers";

const STATUS_TABS = ["Tất cả", "Đang hoạt động", "Nghỉ phép", "Nghỉ việc"] as const;
const DRIVER_STATUSES = ["Đang hoạt động", "Nghỉ phép", "Nghỉ việc"] as const;
const PAGE_SIZE = 20;

function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-12 bg-gray-100 rounded" />
      ))}
    </div>
  );
}

function CreateDriverModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseExpiry, setLicenseExpiry] = useState("");
  const [assignedVehicle, setAssignedVehicle] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      toast.error("Vui lòng nhập họ tên tài xế");
      return;
    }
    if (!phone.trim()) {
      toast.error("Vui lòng nhập số điện thoại");
      return;
    }

    setSaving(true);
    try {
      const input: CreateDriverInput = {
        DriverCode: generateCode("TX"),
        FullName: fullName.trim(),
        Phone: phone.trim(),
        LicenseNumber: licenseNumber.trim() || undefined,
        LicenseExpiry: licenseExpiry || undefined,
        AssignedVehicle: assignedVehicle.trim() || undefined,
        Status: "Đang hoạt động",
        TodayDeliveries: 0,
        TotalDeliveries: 0,
        Notes: notes.trim() || undefined,
      };
      await createDriver(input);
      toast.success("Đã thêm tài xế mới");
      onCreated();
      onClose();
      // Reset form
      setFullName("");
      setPhone("");
      setLicenseNumber("");
      setLicenseExpiry("");
      setAssignedVehicle("");
      setNotes("");
    } catch {
      toast.error("Lỗi khi tạo tài xế");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl w-full max-w-lg mx-4 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-[#2D3A8C]">Thêm tài xế mới</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Họ tên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0912345678"
              className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Số bằng lái</label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="B2-12345"
                className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Hạn bằng lái</label>
              <input
                type="date"
                value={licenseExpiry}
                onChange={(e) => setLicenseExpiry(e.target.value)}
                className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Phương tiện phân công</label>
            <input
              type="text"
              value={assignedVehicle}
              onChange={(e) => setAssignedVehicle(e.target.value)}
              placeholder="Biển số xe (nếu có)"
              className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Ghi chú</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
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
            {saving ? "Đang tạo..." : "Thêm tài xế"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DriversPage() {
  const [data, setData] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("Tất cả");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDrivers({ take: 200, sortField: "createdAt", sortDirection: "desc" });
      setData(res.data);
    } catch {
      toast.error("Lỗi tải dữ liệu tài xế");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = data.filter((d) => {
    if (activeTab !== "Tất cả" && d.Status !== activeTab) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (
        !(d.FullName || "").toLowerCase().includes(q) &&
        !(d.Phone || "").toLowerCase().includes(q) &&
        !(d.DriverCode || "").toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Tài xế"
        description="Quản lý tài xế giao hàng"
        actionLabel="Thêm tài xế"
        onAction={() => setShowCreateModal(true)}
      />

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Tìm tên, SĐT, mã tài xế..."
          className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none"
        />
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setPage(1); }}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
              activeTab === tab
                ? "border-[#4F5FD9] text-[#4F5FD9]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            {tab}
            <span className="ml-1.5 text-xs text-gray-400">
              ({data.filter((d) => tab === "Tất cả" || d.Status === tab).length})
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Không có tài xế"
          description={search ? "Thử thay đổi từ khóa tìm kiếm" : "Thêm tài xế mới để bắt đầu"}
          icon={UserCheck}
          action={
            !search ? (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 bg-[#4F5FD9] hover:bg-[#3B4CC0] text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Thêm tài xế
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mã TX</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Họ tên</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">SĐT</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Bằng lái</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phương tiện</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tổng chuyến</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 font-mono text-xs">
                      {d.DriverCode || "---"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {d.FullName || "---"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {d.Phone ? (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          {d.Phone}
                        </span>
                      ) : "---"}
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-xs font-mono">
                      {d.LicenseNumber || "---"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {d.AssignedVehicle || <span className="text-gray-400">Chưa phân công</span>}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={d.Status} />
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 font-medium">
                      {d.TotalDeliveries ?? 0}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {formatDate(d.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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

      {/* Create modal */}
      <CreateDriverModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={fetchData}
      />
    </div>
  );
}
