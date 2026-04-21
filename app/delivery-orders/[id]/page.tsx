"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Truck,
  User,
  MapPin,
  CalendarDays,
  Package,
  DollarSign,
  CheckCircle,
  ChevronRight,
  XCircle,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatDate, formatCurrency } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import {
  getDeliveryOrder,
  updateDeliveryOrder,
  type DeliveryOrder,
} from "@/lib/delivery-orders";
import { updateOrder } from "@/lib/orders";

function InfoRow({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-2", className)}>
      <span className="text-xs text-gray-500 uppercase tracking-wide min-w-[120px] pt-0.5">
        {label}
      </span>
      <span className="text-sm text-gray-900 font-medium">{value || "---"}</span>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-64 bg-gray-100 rounded animate-pulse" />
      <div className="bg-white rounded-xl border p-6 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-5 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}

function StatusFlowIndicator({ currentStatus }: { currentStatus: string }) {
  const allStatuses = ["Chờ xếp lịch", "Đã xếp lịch", "Đang giao", "Đã giao"];
  const isFailed = currentStatus === "Giao lỗi" || currentStatus === "Trả lại";
  const currentIndex = isFailed ? 2 : allStatuses.indexOf(currentStatus);

  return (
    <div className="flex items-center gap-1 overflow-x-auto py-2">
      {allStatuses.map((status, i) => {
        const isCompleted = i < currentIndex;
        const isCurrent = !isFailed && i === currentIndex;
        return (
          <div key={status} className="flex items-center gap-1">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap",
                isCompleted && "bg-green-100 text-green-700",
                isCurrent && "bg-[#4F5FD9] text-white",
                !isCompleted && !isCurrent && "bg-gray-100 text-gray-400"
              )}
            >
              {isCompleted && <CheckCircle className="w-3 h-3" />}
              {status}
            </span>
            {i < allStatuses.length - 1 && (
              <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
            )}
          </div>
        );
      })}
      {isFailed && (
        <>
          <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-red-100 text-red-700 whitespace-nowrap">
            <XCircle className="w-3 h-3" />
            {currentStatus}
          </span>
        </>
      )}
    </div>
  );
}

function FailureReasonModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl w-full max-w-md mx-4 p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900">Lý do giao lỗi</h3>
        </div>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Nhập lý do giao hàng thất bại..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent resize-none"
        />
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={() => {
              if (!reason.trim()) {
                toast.error("Vui lòng nhập lý do");
                return;
              }
              onConfirm(reason.trim());
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Xác nhận giao lỗi
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DeliveryOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [delivery, setDelivery] = useState<DeliveryOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showFailureModal, setShowFailureModal] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDeliveryOrder(id);
      setDelivery(data);
    } catch {
      toast.error("Lỗi tải dữ liệu lệnh giao hàng");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSchedule = async () => {
    setUpdating(true);
    try {
      await updateDeliveryOrder(id, { Status: "Đã xếp lịch" });
      toast.success("Đã xếp lịch giao hàng");
      fetchData();
    } catch {
      toast.error("Lỗi cập nhật trạng thái");
    } finally {
      setUpdating(false);
    }
  };

  const handleStartDelivery = async () => {
    setUpdating(true);
    try {
      await updateDeliveryOrder(id, { Status: "Đang giao" });
      toast.success("Bắt đầu giao hàng");
      fetchData();
    } catch {
      toast.error("Lỗi cập nhật trạng thái");
    } finally {
      setUpdating(false);
    }
  };

  const handleComplete = async () => {
    if (!delivery) return;
    setUpdating(true);
    try {
      await updateDeliveryOrder(id, { Status: "Đã giao" });
      // Also update the order status
      if (delivery.OrderId) {
        await updateOrder(delivery.OrderId, { Status: "Đã giao" });
      }
      toast.success("Hoàn thành giao hàng");
      fetchData();
    } catch {
      toast.error("Lỗi cập nhật trạng thái");
    } finally {
      setUpdating(false);
    }
  };

  const handleFailure = async (reason: string) => {
    setUpdating(true);
    try {
      await updateDeliveryOrder(id, { Status: "Giao lỗi", FailureReason: reason });
      toast.success("Đã ghi nhận giao lỗi");
      setShowFailureModal(false);
      fetchData();
    } catch {
      toast.error("Lỗi cập nhật trạng thái");
    } finally {
      setUpdating(false);
    }
  };

  const handleReturn = async () => {
    setUpdating(true);
    try {
      await updateDeliveryOrder(id, { Status: "Trả lại" });
      toast.success("Đã trả lại hàng");
      fetchData();
    } catch {
      toast.error("Lỗi cập nhật trạng thái");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.push("/delivery-orders")}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </button>
        <DetailSkeleton />
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.push("/delivery-orders")}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </button>
        <div className="text-center py-16 text-gray-500">Không tìm thấy lệnh giao hàng</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => router.push("/delivery-orders")}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại
      </button>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-[#2D3A8C]">{delivery.DeliveryCode}</h1>
            <StatusBadge status={delivery.Status} />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Tạo lúc {formatDate(delivery.createdAt)}
          </p>
        </div>

        {/* Status action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {delivery.Status === "Chờ xếp lịch" && (
            <button
              onClick={handleSchedule}
              disabled={updating}
              className="inline-flex items-center gap-2 bg-[#4F5FD9] hover:bg-[#3B4CC0] text-white rounded-lg px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
            >
              <CalendarDays className="w-4 h-4" />
              Xếp lịch
            </button>
          )}

          {delivery.Status === "Đã xếp lịch" && (
            <button
              onClick={handleStartDelivery}
              disabled={updating}
              className="inline-flex items-center gap-2 bg-[#4F5FD9] hover:bg-[#3B4CC0] text-white rounded-lg px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Truck className="w-4 h-4" />
              Bắt đầu giao
            </button>
          )}

          {delivery.Status === "Đang giao" && (
            <>
              <button
                onClick={handleComplete}
                disabled={updating}
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-lg px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                Hoàn thành
              </button>
              <button
                onClick={() => setShowFailureModal(true)}
                disabled={updating}
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded-lg px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                Giao lỗi
              </button>
            </>
          )}

          {delivery.Status === "Giao lỗi" && (
            <button
              onClick={handleReturn}
              disabled={updating}
              className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              Trả lại
            </button>
          )}
        </div>
      </div>

      {/* Status flow */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-[#2D3A8C] mb-3">Tiến trình giao hàng</h3>
        <StatusFlowIndicator currentStatus={delivery.Status || "Chờ xếp lịch"} />
      </div>

      {/* Failure reason */}
      {(delivery.Status === "Giao lỗi" || delivery.Status === "Trả lại") &&
        delivery.FailureReason && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="text-sm font-semibold text-red-800">Lý do giao lỗi</h3>
            </div>
            <p className="text-sm text-red-700">{delivery.FailureReason}</p>
          </div>
        )}

      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order info */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-[#4F5FD9]" />
            <h2 className="text-base font-semibold text-[#2D3A8C]">Thông tin đơn hàng</h2>
          </div>
          <div className="space-y-3">
            <InfoRow
              label="Mã đơn"
              value={
                delivery.OrderId ? (
                  <a
                    href={`/orders/${delivery.OrderId}`}
                    className="text-[#4F5FD9] hover:text-[#3B4CC0] hover:underline"
                  >
                    {delivery.OrderCode}
                  </a>
                ) : (
                  delivery.OrderCode || "---"
                )
              }
            />
            <InfoRow label="Khách hàng" value={delivery.CustomerName} />
            <InfoRow label="Số kiện" value={delivery.Packages ?? 0} />
          </div>
        </div>

        {/* Receiver info */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-[#4F5FD9]" />
            <h2 className="text-base font-semibold text-[#2D3A8C]">Thông tin nhận hàng</h2>
          </div>
          <div className="space-y-3">
            <InfoRow label="Người nhận" value={delivery.ReceiverName} />
            <InfoRow label="SĐT" value={delivery.ReceiverPhone} />
            <InfoRow
              label="Địa chỉ"
              value={
                delivery.DeliveryAddress ? (
                  <span className="flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                    {delivery.DeliveryAddress}
                  </span>
                ) : (
                  "---"
                )
              }
            />
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="w-5 h-5 text-[#4F5FD9]" />
            <h2 className="text-base font-semibold text-[#2D3A8C]">Lịch giao hàng</h2>
          </div>
          <div className="space-y-3">
            <InfoRow label="Ngày giao" value={formatDate(delivery.ScheduledDate)} />
            <InfoRow label="Khung giờ" value={delivery.TimeSlot} />
            <InfoRow label="Tài xế" value={delivery.Driver} />
            <InfoRow label="Phương tiện" value={delivery.Vehicle} />
          </div>
        </div>

        {/* COD */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-[#4F5FD9]" />
            <h2 className="text-base font-semibold text-[#2D3A8C]">Thu hộ (COD)</h2>
          </div>
          <div className="space-y-3">
            <InfoRow
              label="Số tiền COD"
              value={
                <span className="text-lg font-semibold">
                  {formatCurrency(delivery.CODAmount)}
                </span>
              }
            />
            <InfoRow
              label="Đã thu"
              value={
                <span className="text-lg font-semibold">
                  {formatCurrency(delivery.CODCollected)}
                </span>
              }
            />
            <InfoRow
              label="Đã nộp"
              value={
                delivery.CODSubmitted ? (
                  <span className="inline-flex items-center gap-1 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    Đã nộp
                  </span>
                ) : (
                  <span className="text-yellow-600">Chưa nộp</span>
                )
              }
            />
          </div>
        </div>
      </div>

      {/* Failure modal */}
      <FailureReasonModal
        open={showFailureModal}
        onClose={() => setShowFailureModal(false)}
        onConfirm={handleFailure}
      />
    </div>
  );
}
