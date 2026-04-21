"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Package,
  Ruler,
  ShieldCheck,
  Tag,
  Wrench,
  Clock,
  User,
  ChevronRight,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import {
  getWarehouseCnReceipt,
  updateWarehouseCnReceipt,
  type WarehouseCnReceipt,
} from "@/lib/warehouse-cn-receipts";

// Status flow for quick advancement
const STATUS_FLOW: Record<string, string> = {
  "Chờ nhận": "Đã nhận",
  "Đã nhận": "Đã kiểm",
  "Đã kiểm": "Trên kệ",
  "Trên kệ": "Đang pick",
  "Đang pick": "Đã đóng gói",
  "Đã đóng gói": "Đã load",
  "Đã load": "Đã xuất",
};

// --- Helper components ---

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-gray-100 rounded animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
      </div>
      <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
    </div>
  );
}

function InfoRow({ label, value, href }: { label: string; value: React.ReactNode; href?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-500 uppercase tracking-wide">{label}</span>
      {href ? (
        <a
          href={href}
          className="text-sm font-medium text-[#4F5FD9] hover:text-[#3B4CC0] hover:underline inline-flex items-center gap-1"
        >
          {value}
          <ExternalLink className="w-3 h-3" />
        </a>
      ) : (
        <span className="text-sm font-medium text-gray-900">{value || "---"}</span>
      )}
    </div>
  );
}

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-[#4F5FD9]" />
        <h2 className="text-base font-semibold text-[#2D3A8C]">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function ProgressBar({ received, expected }: { received: number; expected: number }) {
  const pct = expected > 0 ? Math.min(100, Math.round((received / expected) * 100)) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
        <span>
          Tiến độ: {received}/{expected} kiện
        </span>
        <span>{pct}%</span>
      </div>
      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            pct >= 100 ? "bg-green-500" : pct > 0 ? "bg-[#4F5FD9]" : "bg-gray-200"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StatusFlowButton({
  currentStatus,
  onAdvance,
  advancing,
}: {
  currentStatus: string | undefined;
  onAdvance: () => void;
  advancing: boolean;
}) {
  const nextStatus = currentStatus ? STATUS_FLOW[currentStatus] : undefined;
  if (!nextStatus) return null;

  return (
    <button
      onClick={onAdvance}
      disabled={advancing}
      className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#4F5FD9] hover:bg-[#3B4CC0] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
    >
      {advancing ? (
        <RefreshCw className="w-4 h-4 animate-spin" />
      ) : (
        <ChevronRight className="w-4 h-4" />
      )}
      Chuyển sang: {nextStatus}
    </button>
  );
}

// --- Main page ---

export default function WarehouseCnDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [receipt, setReceipt] = useState<WarehouseCnReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  const fetchReceipt = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getWarehouseCnReceipt(id);
      setReceipt(data);
    } catch {
      setError(true);
      toast.error("Lỗi tải thông tin phiếu nhận");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchReceipt();
  }, [fetchReceipt]);

  const handleAdvanceStatus = async () => {
    if (!receipt?.Status) return;
    const next = STATUS_FLOW[receipt.Status];
    if (!next) return;

    setAdvancing(true);
    try {
      await updateWarehouseCnReceipt(receipt.id, { Status: next });
      toast.success(`Đã chuyển sang: ${next}`);
      fetchReceipt();
    } catch {
      toast.error("Lỗi cập nhật trạng thái");
    } finally {
      setAdvancing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <DetailSkeleton />
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.push("/warehouse-cn")}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </button>
        <EmptyState
          title="Không tìm thấy phiếu"
          description="Phiếu nhận hàng không tồn tại hoặc đã bị xóa"
          icon={Package}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push("/warehouse-cn")}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại kho TQ
      </button>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-[#2D3A8C]">
              {receipt.ReceiptCode}
            </h1>
            <StatusBadge status={receipt.Status} />
          </div>
          {receipt.IsUnidentified && (
            <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
              Kiện không xác định
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <StatusFlowButton
            currentStatus={receipt.Status}
            onAdvance={handleAdvanceStatus}
            advancing={advancing}
          />
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic info */}
        <SectionCard title="Thông tin chung" icon={Package}>
          <div className="space-y-0.5">
            <InfoRow
              label="Mã đơn hàng"
              value={receipt.OrderCode || "---"}
              href={receipt.OrderId ? `/orders/${receipt.OrderId}` : undefined}
            />
            <InfoRow label="Tracking CN" value={<span className="font-mono">{receipt.TrackingCN}</span>} />
            <InfoRow label="Đại lý" value={receipt.Agent} />
            <InfoRow label="Sale xác nhận" value={receipt.VerifiedBySale ? "Da" : "Chua"} />
            <InfoRow label="Ngày xác nhận" value={formatDate(receipt.VerifiedAt)} />
            <InfoRow label="Ngày tạo" value={formatDate(receipt.createdAt)} />
            <InfoRow label="Cập nhật" value={formatDate(receipt.updatedAt)} />
          </div>
        </SectionCard>

        {/* Dimensions */}
        <SectionCard title="Kích thước & cân nặng" icon={Ruler}>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <span className="text-xs text-gray-500 uppercase tracking-wide">Cân nặng</span>
              <p className="text-lg font-semibold text-gray-900">{receipt.WeightKg ?? 0} kg</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <span className="text-xs text-gray-500 uppercase tracking-wide">CBM</span>
              <p className="text-lg font-semibold text-gray-900">{receipt.CBM ?? 0}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <span className="text-xs text-gray-500 uppercase tracking-wide">L x W x H</span>
              <p className="text-lg font-semibold text-gray-900">
                {receipt.LengthCm ?? 0} x {receipt.WidthCm ?? 0} x {receipt.HeightCm ?? 0} cm
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <span className="text-xs text-gray-500 uppercase tracking-wide">TL tính cước</span>
              <p className="text-lg font-semibold text-gray-900">
                {receipt.ChargeableWeight ?? 0} kg
              </p>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* QC & Label */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SectionCard title="Kiểm tra chất lượng" icon={ShieldCheck}>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Trạng thái QC:</span>
              <StatusBadge status={receipt.QCStatus} />
            </div>
            {receipt.QCNotes && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500">Ghi chú QC</span>
                <p className="text-sm text-gray-700 mt-1">{receipt.QCNotes}</p>
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Kiểm tra tem nhãn" icon={Tag}>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Trạng thái tem:</span>
              <StatusBadge status={receipt.LabelStatus} />
            </div>
            {receipt.InternalBarcode && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500">Mã nội bộ</span>
                <p className="text-sm text-gray-700 font-mono mt-1">{receipt.InternalBarcode}</p>
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Package counter */}
      <SectionCard title="Kiện hàng" icon={Package}>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 bg-gray-50 rounded-lg text-center">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Dự kiến</span>
            <p className="text-2xl font-bold text-gray-900">{receipt.PackagesExpected ?? 0}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg text-center">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Đã nhận</span>
            <p className="text-2xl font-bold text-gray-900">{receipt.PackagesReceived ?? 0}</p>
          </div>
        </div>
        <ProgressBar
          received={receipt.PackagesReceived ?? 0}
          expected={receipt.PackagesExpected ?? 0}
        />
      </SectionCard>

      {/* Extra Services */}
      {receipt.ExtraServices && receipt.ExtraServices.length > 0 && (
        <SectionCard title="Dịch vụ gia tăng" icon={Wrench}>
          <div className="flex flex-wrap gap-2">
            {receipt.ExtraServices.map((s) => (
              <span
                key={s}
                className="inline-flex items-center px-3 py-1.5 bg-[#4F5FD9]/10 text-[#4F5FD9] rounded-full text-xs font-medium"
              >
                {s}
              </span>
            ))}
          </div>
          {receipt.ExtraServiceFee != null && receipt.ExtraServiceFee > 0 && (
            <p className="text-sm text-gray-500 mt-3">
              Phí dịch vụ: <span className="font-medium text-gray-900">{receipt.ExtraServiceFee.toLocaleString()} d</span>
            </p>
          )}
        </SectionCard>
      )}

      {/* Timestamps */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-500 uppercase tracking-wide">Thoi gian</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Tao:</span>
            <p className="font-medium text-gray-900">{formatDate(receipt.createdAt)}</p>
          </div>
          <div>
            <span className="text-gray-500">Cap nhat:</span>
            <p className="font-medium text-gray-900">{formatDate(receipt.updatedAt)}</p>
          </div>
          {receipt.VerifiedAt && (
            <div>
              <span className="text-gray-500">Xac nhan:</span>
              <p className="font-medium text-gray-900">{formatDate(receipt.VerifiedAt)}</p>
            </div>
          )}
          {receipt.Agent && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <div>
                <span className="text-gray-500">Dai ly:</span>
                <p className="font-medium text-gray-900">{receipt.Agent}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
