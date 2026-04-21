"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Car, Plus, X, Wrench, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { cn, formatDate, generateCode } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import {
  getVehicles,
  createVehicle,
  updateVehicle,
  type Vehicle,
  type CreateVehicleInput,
} from "@/lib/vehicles";

const STATUS_TABS = ["Tất cả", "Sẵn sàng", "Đang sử dụng", "Bảo trì", "Ngưng hoạt động"] as const;
const VEHICLE_TYPES = ["Xe tải 1T", "Xe tải 2.5T", "Xe tải 5T", "Xe con"] as const;
const VEHICLE_STATUSES = ["Sẵn sàng", "Đang sử dụng", "Bảo trì", "Ngưng hoạt động"] as const;
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

function CreateVehicleModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [licensePlate, setLicensePlate] = useState("");
  const [vehicleType, setVehicleType] = useState<string>(VEHICLE_TYPES[0]);
  const [brand, setBrand] = useState("");
  const [maxWeight, setMaxWeight] = useState<number | "">(1000);
  const [maxCBM, setMaxCBM] = useState<number | "">(10);
  const [currentDriver, setCurrentDriver] = useState("");
  const [insuranceExpiry, setInsuranceExpiry] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
    if (!licensePlate.trim()) {
      toast.error("Vui lòng nhập biển số xe");
      return;
    }

    setSaving(true);
    try {
      const input: CreateVehicleInput = {
        VehicleCode: generateCode("XE"),
        LicensePlate: licensePlate.trim(),
        VehicleType: vehicleType,
        Brand: brand.trim() || undefined,
        MaxWeight: Number(maxWeight) || undefined,
        MaxCBM: Number(maxCBM) || undefined,
        Status: "Sẵn sàng",
        CurrentDriver: currentDriver.trim() || undefined,
        InsuranceExpiry: insuranceExpiry || undefined,
        Notes: notes.trim() || undefined,
      };
      await createVehicle(input);
      toast.success("Đã thêm phương tiện mới");
      onCreated();
      onClose();
      // Reset form
      setLicensePlate("");
      setBrand("");
      setMaxWeight(1000);
      setMaxCBM(10);
      setCurrentDriver("");
      setInsuranceExpiry("");
      setNotes("");
    } catch {
      toast.error("Lỗi khi tạo phương tiện");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl w-full max-w-lg mx-4 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-[#2D3A8C]">Thêm phương tiện mới</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Biển số xe <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value)}
              placeholder="30A-12345"
              className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Loại xe</label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent"
              >
                {VEHICLE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Hãng xe</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Hyundai, Isuzu..."
                className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tải trọng tối đa (kg)</label>
              <input
                type="number"
                min={0}
                value={maxWeight}
                onChange={(e) => setMaxWeight(e.target.value === "" ? "" : parseInt(e.target.value))}
                className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">CBM tối đa</label>
              <input
                type="number"
                min={0}
                step="0.1"
                value={maxCBM}
                onChange={(e) => setMaxCBM(e.target.value === "" ? "" : parseFloat(e.target.value))}
                className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Tài xế hiện tại</label>
            <input
              type="text"
              value={currentDriver}
              onChange={(e) => setCurrentDriver(e.target.value)}
              placeholder="Tên tài xế (nếu có)"
              className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Hạn bảo hiểm</label>
            <input
              type="date"
              value={insuranceExpiry}
              onChange={(e) => setInsuranceExpiry(e.target.value)}
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
            {saving ? "Đang tạo..." : "Thêm phương tiện"}
          </button>
        </div>
      </div>
    </div>
  );
}

function VehicleStatusToggle({
  vehicle,
  onUpdated,
}: {
  vehicle: Vehicle;
  onUpdated: () => void;
}) {
  const [updating, setUpdating] = useState(false);

  const nextStatusMap: Record<string, string> = {
    "Sẵn sàng": "Bảo trì",
    "Bảo trì": "Sẵn sàng",
    "Đang sử dụng": "Sẵn sàng",
    "Ngưng hoạt động": "Sẵn sàng",
  };

  const nextStatus = vehicle.Status ? nextStatusMap[vehicle.Status] : undefined;
  if (!nextStatus) return null;

  const isReactivate = nextStatus === "Sẵn sàng";

  const handleToggle = async () => {
    setUpdating(true);
    try {
      await updateVehicle(vehicle.id, { Status: nextStatus });
      toast.success(`Đã chuyển trạng thái: ${nextStatus}`);
      onUpdated();
    } catch {
      toast.error("Lỗi cập nhật trạng thái");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={updating}
      className={cn(
        "text-xs font-medium whitespace-nowrap disabled:opacity-50",
        isReactivate
          ? "text-green-600 hover:text-green-700"
          : "text-orange-600 hover:text-orange-700"
      )}
    >
      {isReactivate ? (
        <span className="inline-flex items-center gap-1">
          <CheckCircle className="w-3.5 h-3.5" />
          Kích hoạt
        </span>
      ) : (
        <span className="inline-flex items-center gap-1">
          <Wrench className="w-3.5 h-3.5" />
          Bảo trì
        </span>
      )}
    </button>
  );
}

export default function VehiclesPage() {
  const [data, setData] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("Tất cả");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getVehicles({ take: 200, sortField: "createdAt", sortDirection: "desc" });
      setData(res.data);
    } catch {
      toast.error("Lỗi tải dữ liệu phương tiện");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = data.filter((v) => {
    if (activeTab !== "Tất cả" && v.Status !== activeTab) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (
        !(v.LicensePlate || "").toLowerCase().includes(q) &&
        !(v.VehicleCode || "").toLowerCase().includes(q) &&
        !(v.Brand || "").toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Phương tiện"
        description="Quản lý phương tiện vận chuyển"
        actionLabel="Thêm phương tiện"
        onAction={() => setShowCreateModal(true)}
      />

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Tìm biển số, mã xe, hãng xe..."
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
              ({data.filter((v) => tab === "Tất cả" || v.Status === tab).length})
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Không có phương tiện"
          description={search ? "Thử thay đổi từ khóa tìm kiếm" : "Thêm phương tiện mới để bắt đầu"}
          icon={Car}
          action={
            !search ? (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 bg-[#4F5FD9] hover:bg-[#3B4CC0] text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Thêm phương tiện
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
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mã xe</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Biển số</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Loại xe</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Hãng</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tải trọng</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tài xế</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 font-mono text-xs">
                      {v.VehicleCode || "---"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {v.LicensePlate || "---"}
                    </td>
                    <td className="px-4 py-3">
                      {v.VehicleType ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                          {v.VehicleType}
                        </span>
                      ) : "---"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{v.Brand || "---"}</td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {v.MaxWeight ? `${v.MaxWeight} kg` : "---"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={v.Status} />
                    </td>
                    <td className="px-4 py-3 text-gray-700">{v.CurrentDriver || "---"}</td>
                    <td className="px-4 py-3">
                      <VehicleStatusToggle vehicle={v} onUpdated={fetchData} />
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
      <CreateVehicleModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={fetchData}
      />
    </div>
  );
}
