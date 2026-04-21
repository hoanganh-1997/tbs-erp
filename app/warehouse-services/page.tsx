"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Wrench,
  Plus,
  X,
  CheckCircle,
  DollarSign,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatDate, formatCurrency, generateCode } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import {
  getWarehouseServices,
  createWarehouseService,
  updateWarehouseService,
  type WarehouseService,
  type CreateWarehouseServiceInput,
} from "@/lib/warehouse-services";

const STATUS_TABS = ["Tất cả", "Chờ xử lý", "Đang xử lý", "Hoàn thành", "Đã tính phí"];
const SERVICE_TYPES = ["Kiểm đếm", "Đóng gói lại", "Kiện gỗ", "Ảnh chi tiết", "Video mở kiện"];
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

function CreateServiceModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [serviceType, setServiceType] = useState(SERVICE_TYPES[0]);
  const [orderCode, setOrderCode] = useState("");
  const [quantity, setQuantity] = useState<number | "">(1);
  const [unitPrice, setUnitPrice] = useState<number | "">(0);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const totalFee = (Number(quantity) || 0) * (Number(unitPrice) || 0);

  const handleSubmit = async () => {
    if (!serviceType) {
      toast.error("Vui lòng chọn loại dịch vụ");
      return;
    }
    setSaving(true);
    try {
      const input: CreateWarehouseServiceInput = {
        ServiceCode: generateCode("DV"),
        ServiceType: serviceType,
        OrderCode: orderCode.trim() || undefined,
        Quantity: Number(quantity) || 1,
        UnitPrice: Number(unitPrice) || 0,
        TotalFee: totalFee,
        Status: "Chờ xử lý",
        Notes: notes.trim() || undefined,
      };
      await createWarehouseService(input);
      toast.success("Đã tạo dịch vụ mới");
      onCreated();
      onClose();
      // Reset form
      setServiceType(SERVICE_TYPES[0]);
      setOrderCode("");
      setQuantity(1);
      setUnitPrice(0);
      setNotes("");
    } catch {
      toast.error("Lỗi khi tạo dịch vụ");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#2D3A8C]">Tạo dịch vụ mới</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Service type */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Loại dịch vụ *</label>
            <div className="flex flex-wrap gap-2">
              {SERVICE_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setServiceType(t)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-medium border transition-colors",
                    serviceType === t
                      ? "bg-[#4F5FD9] text-white border-[#4F5FD9]"
                      : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                  )}
                >
                  {t}
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

          {/* Quantity & Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Số lượng</label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value === "" ? "" : parseInt(e.target.value))}
                className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Đơn giá (VND)</label>
              <input
                type="number"
                min={0}
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value === "" ? "" : parseFloat(e.target.value))}
                className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Total */}
          <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
            <span className="text-sm text-gray-500">Tổng phí</span>
            <span className="text-lg font-semibold text-gray-900">{formatCurrency(totalFee)}</span>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Ghi chú</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
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
            <Plus className="w-4 h-4" />
            {saving ? "Đang tạo..." : "Tạo dịch vụ"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Main page ---

export default function WarehouseServicesPage() {
  const [services, setServices] = useState<WarehouseService[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchApplied, setSearchApplied] = useState("");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getWarehouseServices({
        take: 200,
        sortField: "createdAt",
        sortDirection: "desc",
      });
      setServices(data);
    } catch {
      toast.error("Lỗi tải dữ liệu dịch vụ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    return services.filter((s) => {
      if (activeTab !== "Tất cả" && s.Status !== activeTab) return false;
      if (
        searchApplied &&
        !s.OrderCode?.toLowerCase().includes(searchApplied.toLowerCase()) &&
        !s.ServiceCode?.toLowerCase().includes(searchApplied.toLowerCase())
      )
        return false;
      return true;
    });
  }, [services, activeTab, searchApplied]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = () => {
    setSearchApplied(searchQuery.trim());
    setPage(1);
  };

  const handleComplete = async (service: WarehouseService) => {
    try {
      await updateWarehouseService(service.id, {
        Status: "Hoàn thành",
        CompletedAt: new Date().toISOString(),
      });
      toast.success(`Đã hoàn thành ${service.ServiceCode}`);
      fetchData();
    } catch {
      toast.error("Lỗi cập nhật trạng thái");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dịch vụ kho"
        description="Quản lý dịch vụ kho bãi tại Trung Quốc"
        actionLabel="Tạo dịch vụ"
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
              placeholder="Tìm theo mã đơn hoặc mã dịch vụ..."
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
              ({services.filter((s) => tab === "Tất cả" || s.Status === tab).length})
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton />
      ) : paginated.length === 0 ? (
        <EmptyState
          title="Chưa có dịch vụ"
          description="Tạo dịch vụ mới để bắt đầu"
          icon={Wrench}
          action={
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#4F5FD9] hover:bg-[#3B4CC0] text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tạo dịch vụ
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
                    "Mã dịch vụ",
                    "Mã đơn",
                    "Loại dịch vụ",
                    "SL",
                    "Đơn giá",
                    "Tổng phí",
                    "Trạng thái",
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
                {paginated.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {s.ServiceCode}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {s.OrderCode ? (
                        s.OrderId ? (
                          <a
                            href={`/orders/${s.OrderId}`}
                            className="text-[#4F5FD9] hover:text-[#3B4CC0] hover:underline"
                          >
                            {s.OrderCode}
                          </a>
                        ) : (
                          <span className="text-[#4F5FD9]">{s.OrderCode}</span>
                        )
                      ) : (
                        <span className="text-gray-400">---</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{s.ServiceType || "---"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{s.Quantity ?? 0}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatCurrency(s.UnitPrice)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {formatCurrency(s.TotalFee)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={s.Status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{s.CompletedBy || "---"}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(s.createdAt)}</td>
                    <td className="px-4 py-3">
                      {(s.Status === "Chờ xử lý" || s.Status === "Đang xử lý") && (
                        <button
                          onClick={() => handleComplete(s)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Hoàn thành
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
              {Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length} dịch vụ
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
      <CreateServiceModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={fetchData}
      />
    </div>
  );
}
