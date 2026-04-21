"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Package,
  MapPin,
  FileText,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  ClipboardCheck,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { ShelfPicker } from "@/components/shelf-picker";
import {
  getWarehouseVnReceipt,
  updateWarehouseVnReceipt,
  type WarehouseVnReceipt,
} from "@/lib/warehouse-vn-receipts";
import { createTrackingEvent } from "@/lib/tracking-events";

const STATUS_FLOW: Record<string, string> = {
  "Đã dỡ": "Đã kiểm",
  "Đã kiểm": "Trên kệ",
  "Trên kệ": "Đang pick",
  "Đang pick": "Đã đóng gói",
  "Đã đóng gói": "Chờ giao",
  "Chờ giao": "Đã giao",
};

const STATUS_ACTION_LABELS: Record<string, string> = {
  "Đã dỡ": "Xác nhận kiểm tra",
  "Đã kiểm": "Lên kệ",
  "Trên kệ": "Bắt đầu pick",
  "Đang pick": "Đã đóng gói",
  "Đã đóng gói": "Chuyển chờ giao",
  "Chờ giao": "Xác nhận đã giao",
};

const QC_OPTIONS = ["Chưa kiểm", "Đạt", "Lỗi", "Chờ xử lý"];

function InfoRow({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start gap-2", className)}>
      <span className="text-xs text-gray-500 uppercase tracking-wide min-w-[120px] pt-0.5">{label}</span>
      <span className="text-sm text-gray-900 font-medium">{value || "---"}</span>
    </div>
  );
}

function StatusFlowIndicator({ currentStatus }: { currentStatus: string }) {
  const allStatuses = ["Đã dỡ", "Đã kiểm", "Trên kệ", "Đang pick", "Đã đóng gói", "Chờ giao", "Đã giao"];
  const currentIndex = allStatuses.indexOf(currentStatus);

  return (
    <div className="flex items-center gap-1 overflow-x-auto py-2">
      {allStatuses.map((status, i) => {
        const isCompleted = i < currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <div key={status} className="flex items-center gap-1">
            <span className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
              isCompleted && "bg-green-100 text-green-700",
              isCurrent && "bg-[#4F5FD9] text-white",
              !isCompleted && !isCurrent && "bg-gray-100 text-gray-400"
            )}>
              {isCompleted && <CheckCircle className="w-3 h-3" />}
              {status}
            </span>
            {i < allStatuses.length - 1 && <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />}
          </div>
        );
      })}
    </div>
  );
}

export default function WarehouseVnDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [receipt, setReceipt] = useState<WarehouseVnReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Editable fields
  const [notes, setNotes] = useState("");
  const [editingNotes, setEditingNotes] = useState(false);
  const [qcStatus, setQcStatus] = useState("");
  const [qcNotes, setQcNotes] = useState("");
  const [shelfZone, setShelfZone] = useState("");
  const [shelfRow, setShelfRow] = useState("");
  const [discrepancyNote, setDiscrepancyNote] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getWarehouseVnReceipt(id);
      setReceipt(data);
      setNotes(data.Notes || "");
      setQcStatus(data.QCStatus || "Chưa kiểm");
      setQcNotes(data.QCNotes || "");
      setShelfZone(data.ShelfZone || "");
      setShelfRow(data.ShelfRow || "");
      setDiscrepancyNote(data.DiscrepancyNote || "");
    } catch {
      toast.error("Lỗi tải dữ liệu phiếu nhận hàng");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdvanceStatus = async () => {
    if (!receipt?.Status) return;
    const nextStatus = STATUS_FLOW[receipt.Status];
    if (!nextStatus) return;

    // Validation: QC required before shelf
    if (receipt.Status === "Đã kiểm" && (!qcStatus || qcStatus === "Chưa kiểm")) {
      toast.error("Vui lòng hoàn thành kiểm tra QC trước khi lên kệ");
      return;
    }
    if (receipt.Status === "Đã kiểm" && qcStatus === "Lỗi") {
      toast.error("Hàng lỗi QC, không thể lên kệ. Xử lý lỗi trước.");
      return;
    }

    // Validation: shelf required before placing on shelf
    if (receipt.Status === "Đã kiểm" && !shelfZone) {
      toast.error("Vui lòng chọn khu vực kệ trước khi lên kệ");
      return;
    }

    // Validation: discrepancy must be resolved
    const discrepancy = receipt.Discrepancy ?? 0;
    if (discrepancy !== 0 && !receipt.DiscrepancyResolved && !discrepancyNote.trim()) {
      toast.error("Có chênh lệch kiện hàng, vui lòng ghi chú xử lý");
      return;
    }

    setUpdating(true);
    try {
      const updates: Record<string, any> = { Status: nextStatus };

      if (nextStatus === "Trên kệ") {
        updates.ShelfZone = shelfZone;
        updates.ShelfRow = shelfRow;
        updates.Location = shelfZone + (shelfRow ? `-${shelfRow}` : "");
        updates.QCStatus = qcStatus;
        updates.QCNotes = qcNotes;
      }
      if (nextStatus === "Đang pick") {
        updates.PickedAt = new Date().toISOString();
      }

      if (discrepancy !== 0 && discrepancyNote.trim()) {
        updates.DiscrepancyNote = discrepancyNote;
        updates.DiscrepancyResolved = true;
      }

      await updateWarehouseVnReceipt(id, updates);

      // Log tracking event
      const eventTypeMap: Record<string, string> = {
        "Đã kiểm": "Đã kiểm hàng",
        "Trên kệ": "Lên kệ",
        "Đang pick": "Ghi chú",
        "Chờ giao": "Ghi chú",
        "Đã giao": "Đã giao",
      };
      if (eventTypeMap[nextStatus]) {
        await createTrackingEvent({
          OrderId: receipt.OrderId,
          OrderCode: receipt.OrderCode,
          EventType: eventTypeMap[nextStatus],
          Description: `Kho VN: ${receipt.Status} → ${nextStatus}`,
          Location: receipt.Warehouse,
        });
      }

      toast.success(`Cập nhật trạng thái: ${nextStatus}`);
      fetchData();
    } catch {
      toast.error("Lỗi cập nhật trạng thái");
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveQC = async () => {
    setUpdating(true);
    try {
      await updateWarehouseVnReceipt(id, { QCStatus: qcStatus, QCNotes: qcNotes });
      toast.success("Đã lưu QC");
      fetchData();
    } catch {
      toast.error("Lỗi lưu QC");
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    setUpdating(true);
    try {
      await updateWarehouseVnReceipt(id, { Notes: notes });
      toast.success("Đã lưu ghi chú");
      setEditingNotes(false);
      fetchData();
    } catch {
      toast.error("Lỗi lưu ghi chú");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <button onClick={() => router.push("/warehouse-vn")} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"><ArrowLeft className="w-4 h-4" />Quay lại</button>
        <div className="space-y-4">
          <div className="h-8 w-64 bg-gray-100 rounded animate-pulse" />
          <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="space-y-6">
        <button onClick={() => router.push("/warehouse-vn")} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"><ArrowLeft className="w-4 h-4" />Quay lại</button>
        <div className="text-center py-16 text-gray-500">Không tìm thấy phiếu nhận hàng</div>
      </div>
    );
  }

  const discrepancy = receipt.Discrepancy ?? 0;
  const hasDiscrepancy = discrepancy !== 0;
  const nextStatus = receipt.Status ? STATUS_FLOW[receipt.Status] : undefined;
  const actionLabel = receipt.Status ? STATUS_ACTION_LABELS[receipt.Status] : undefined;

  return (
    <div className="space-y-6">
      <button onClick={() => router.push("/warehouse-vn")} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
        <ArrowLeft className="w-4 h-4" />Quay lại
      </button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-[#2D3A8C]">{receipt.ReceiptCode}</h1>
            <StatusBadge status={receipt.Status} />
            <StatusBadge status={receipt.Warehouse} />
            {receipt.QCStatus && receipt.QCStatus !== "Chưa kiểm" && (
              <StatusBadge status={receipt.QCStatus} />
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">Tạo lúc {formatDate(receipt.createdAt)}</p>
        </div>
        {nextStatus && actionLabel && (
          <button onClick={handleAdvanceStatus} disabled={updating} className="inline-flex items-center gap-2 bg-[#4F5FD9] hover:bg-[#3B4CC0] text-white rounded-lg px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-50">
            <ChevronRight className="w-4 h-4" />{actionLabel}
          </button>
        )}
      </div>

      {/* Status flow */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-[#2D3A8C] mb-3">Tiến trình xử lý</h3>
        <StatusFlowIndicator currentStatus={receipt.Status || "Đã dỡ"} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order & Container */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-[#4F5FD9]" />
            <h2 className="text-base font-semibold text-[#2D3A8C]">Thông tin đơn hàng</h2>
          </div>
          <div className="space-y-3">
            <InfoRow label="Mã đơn" value={receipt.OrderId ? (
              <a href={`/orders/${receipt.OrderId}`} className="text-[#4F5FD9] hover:underline">{receipt.OrderCode}</a>
            ) : receipt.OrderCode || "---"} />
            <InfoRow label="Container" value={receipt.ContainerId} />
            <InfoRow label="Người nhận" value={receipt.ReceivedBy} />
            <InfoRow label="Cập nhật" value={formatDate(receipt.updatedAt)} />
          </div>
        </div>

        {/* Packages */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-[#4F5FD9]" />
            <h2 className="text-base font-semibold text-[#2D3A8C]">Kiện hàng</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <span className="text-xs text-gray-500 uppercase">Dự kiến</span>
              <p className="text-2xl font-bold text-gray-900 mt-1">{receipt.PackagesExpected ?? 0}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <span className="text-xs text-gray-500 uppercase">Thực nhận</span>
              <p className="text-2xl font-bold text-gray-900 mt-1">{receipt.PackagesReceived ?? 0}</p>
            </div>
            <div className={cn("p-4 rounded-lg text-center", hasDiscrepancy ? "bg-red-50" : "bg-green-50")}>
              <span className="text-xs text-gray-500 uppercase">Chênh lệch</span>
              <p className={cn("text-2xl font-bold mt-1", hasDiscrepancy ? "text-red-600" : "text-green-600")}>
                {discrepancy > 0 ? `+${discrepancy}` : discrepancy}
              </p>
            </div>
          </div>
          {hasDiscrepancy && !receipt.DiscrepancyResolved && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>Chênh lệch chưa xử lý — cần ghi chú trước khi tiếp tục</span>
              </div>
              <textarea
                value={discrepancyNote}
                onChange={(e) => setDiscrepancyNote(e.target.value)}
                placeholder="Ghi chú xử lý chênh lệch..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] resize-none"
              />
            </div>
          )}
          {receipt.DiscrepancyResolved && receipt.DiscrepancyNote && (
            <div className="mt-3 p-3 bg-green-50 rounded-lg text-sm text-green-700">
              <CheckCircle className="w-4 h-4 inline mr-1" />
              Đã xử lý: {receipt.DiscrepancyNote}
            </div>
          )}
          {receipt.WeightKg != null && receipt.WeightKg > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <InfoRow label="Cân nặng" value={`${receipt.WeightKg} kg`} />
            </div>
          )}
        </div>
      </div>

      {/* QC Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardCheck className="w-5 h-5 text-[#4F5FD9]" />
          <h2 className="text-base font-semibold text-[#2D3A8C]">Kiểm tra chất lượng (QC)</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Kết quả QC</label>
            <div className="flex gap-2">
              {QC_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setQcStatus(opt)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                    qcStatus === opt
                      ? opt === "Đạt" ? "bg-green-100 text-green-700 border-green-300"
                        : opt === "Lỗi" ? "bg-red-100 text-red-700 border-red-300"
                          : opt === "Chờ xử lý" ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                            : "bg-gray-200 text-gray-700 border-gray-300"
                      : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Ghi chú QC</label>
            <input
              type="text"
              value={qcNotes}
              onChange={(e) => setQcNotes(e.target.value)}
              placeholder="Chi tiết kiểm tra..."
              className="w-full h-9 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]"
            />
          </div>
        </div>
        {qcStatus !== (receipt.QCStatus || "Chưa kiểm") || qcNotes !== (receipt.QCNotes || "") ? (
          <button onClick={handleSaveQC} disabled={updating} className="mt-3 px-4 py-2 bg-[#4F5FD9] hover:bg-[#3B4CC0] text-white rounded-lg text-sm font-medium disabled:opacity-50">
            Lưu QC
          </button>
        ) : null}
      </div>

      {/* Shelf assignment */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-[#4F5FD9]" />
          <h2 className="text-base font-semibold text-[#2D3A8C]">Vị trí lưu kho</h2>
        </div>
        {receipt.Status === "Đã kiểm" || !receipt.ShelfZone ? (
          <ShelfPicker
            zone={shelfZone}
            row={shelfRow}
            onZoneChange={setShelfZone}
            onRowChange={setShelfRow}
            disabled={receipt.Status !== "Đã kiểm" && receipt.Status !== "Đã dỡ"}
          />
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-mono font-semibold text-blue-900">
              {receipt.ShelfZone}{receipt.ShelfRow ? `-${receipt.ShelfRow}` : ""}
            </span>
          </div>
        )}
      </div>

      {/* Pick info */}
      {receipt.PickedAt && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-[#4F5FD9]" />
            <h2 className="text-base font-semibold text-[#2D3A8C]">Thông tin Pick</h2>
          </div>
          <div className="space-y-2">
            <InfoRow label="Picked tại" value={formatDate(receipt.PickedAt)} />
            <InfoRow label="Picked bởi" value={receipt.PickedBy} />
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#4F5FD9]" />
            <h2 className="text-base font-semibold text-[#2D3A8C]">Ghi chú</h2>
          </div>
          {!editingNotes && (
            <button onClick={() => setEditingNotes(true)} className="text-xs text-[#4F5FD9] hover:text-[#3B4CC0] font-medium">Sửa</button>
          )}
        </div>
        {editingNotes ? (
          <div className="space-y-3">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] resize-none" placeholder="Nhập ghi chú..." />
            <div className="flex gap-2">
              <button onClick={handleSaveNotes} disabled={updating} className="px-4 py-2 bg-[#4F5FD9] hover:bg-[#3B4CC0] text-white rounded-lg text-sm font-medium disabled:opacity-50">Lưu</button>
              <button onClick={() => { setEditingNotes(false); setNotes(receipt.Notes || ""); }} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Hủy</button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-700">{receipt.Notes || "Chưa có ghi chú"}</p>
        )}
      </div>
    </div>
  );
}
