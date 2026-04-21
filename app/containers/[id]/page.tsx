"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Circle,
  Package,
  Plus,
  Ship,
  Truck,
  X,
  CheckCircle2,
  Loader2,
  Scan,
  Shield,
  Activity,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import {
  getContainer,
  updateContainer,
  type Container,
} from "@/lib/containers";
import {
  getContainerItems,
  createContainerItem,
  type ContainerItem,
  type CreateContainerItemInput,
} from "@/lib/container-items";
import {
  getWarehouseCnReceipts,
  updateWarehouseCnReceipt,
  type WarehouseCnReceipt,
} from "@/lib/warehouse-cn-receipts";
import { getOrders, type Order } from "@/lib/orders";
import {
  getCustomsDeclarations,
  type CustomsDeclaration,
} from "@/lib/customs-declarations";

// ---------- Constants ----------

const STATUS_FLOW = [
  "Lập kế hoạch",
  "Đặt chỗ",
  "Đang xếp",
  "Đã đóng",
  "Đang vận chuyển",
  "Tại biên giới",
  "Hải quan",
  "Đã thông quan",
  "Đã về kho",
  "Đang dỡ",
  "Hoàn tất",
];

const STATUS_DATE_MAP: Record<string, (c: Container) => string | undefined> = {
  "Đặt chỗ": (c) => c.BookingDate,
  "Đang vận chuyển": (c) => c.ActualDeparture,
  "Đã về kho": (c) => c.ActualArrival,
};

// ---------- Skeleton / Loading ----------

function DetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded" />
      <div className="grid grid-cols-2 gap-6">
        <div className="h-40 bg-gray-100 rounded-xl" />
        <div className="h-40 bg-gray-100 rounded-xl" />
      </div>
      <div className="h-32 bg-gray-100 rounded-xl" />
      <div className="h-64 bg-gray-100 rounded-xl" />
    </div>
  );
}

// ---------- Fill Rate Display ----------

function FillRateDisplay({
  totalCBM,
  maxCBM,
  fillRate,
  totalPackages,
}: {
  totalCBM: number;
  maxCBM: number;
  fillRate: number;
  totalPackages: number;
}) {
  const pct = Math.min(100, fillRate);
  const color =
    pct >= 85
      ? "text-green-600"
      : pct >= 70
      ? "text-yellow-600"
      : "text-red-600";
  const barColor =
    pct >= 85
      ? "bg-green-500"
      : pct >= 70
      ? "bg-yellow-500"
      : "bg-red-500";

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
        Tỷ lệ lấp đầy
      </h3>
      <div className="flex items-center gap-8">
        {/* Circular display */}
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="10"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke={
                pct >= 85
                  ? "#22c55e"
                  : pct >= 70
                  ? "#eab308"
                  : "#ef4444"
              }
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * 263.9} 263.9`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-2xl font-bold", color)}>
              {fillRate}%
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 space-y-3">
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-500">CBM</span>
              <span className="font-medium text-gray-900">
                {totalCBM.toFixed(2)} / {maxCBM.toFixed(2)} m3
              </span>
            </div>
            <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", barColor)}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Package className="w-4 h-4 text-gray-400" />
            <span className="text-gray-500">Tổng kiện:</span>
            <span className="font-semibold text-gray-900">
              {totalPackages}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Info Grid ----------

function InfoGrid({ container }: { container: Container }) {
  const infoLeft = [
    { label: "Nha van chuyen", value: container.CarrierName },
    { label: "Ma tau / xe", value: container.VesselCode },
    { label: "So seal", value: container.SealNumber },
    { label: "Kho dich", value: container.DestinationWarehouse },
  ];
  const infoRight = [
    { label: "Ngay dat cho", value: formatDate(container.BookingDate) },
    { label: "ETD", value: formatDate(container.ETD) },
    { label: "ETA", value: formatDate(container.ETA) },
    { label: "Khoi hanh thuc te", value: formatDate(container.ActualDeparture) },
    { label: "Den thuc te", value: formatDate(container.ActualArrival) },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Thong tin van chuyen
        </h3>
        <dl className="space-y-3">
          {infoLeft.map((item) => (
            <div key={item.label} className="flex justify-between">
              <dt className="text-sm text-gray-500">{item.label}</dt>
              <dd className="text-sm font-medium text-gray-900">
                {item.value || "---"}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Lich trinh
        </h3>
        <dl className="space-y-3">
          {infoRight.map((item) => (
            <div key={item.label} className="flex justify-between">
              <dt className="text-sm text-gray-500">{item.label}</dt>
              <dd className="text-sm font-medium text-gray-900">
                {item.value || "---"}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

// ---------- Packing List Table ----------

function PackingListTable({
  items,
  loading,
}: {
  items: ContainerItem[];
  loading: boolean;
}) {
  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => ({
        packages: acc.packages + (item.Packages ?? 0),
        weight: acc.weight + (item.WeightKg ?? 0),
        cbm: acc.cbm + (item.CBM ?? 0),
      }),
      { packages: 0, weight: 0, cbm: 0 }
    );
  }, [items]);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl">
        <EmptyState
          title="Chua co kien hang"
          description="Thêm kiện hàng vào container tu danh sach phieu nhap"
          icon={Package}
        />
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              {[
                "Ma don",
                "So kien",
                "Trọng lượng (kg)",
                "CBM",
                "Ngay load",
                "Scan",
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
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm">
                  {item.OrderCode ? (
                    <Link
                      href={`/orders/${item.OrderId}`}
                      className="text-[#4F5FD9] hover:underline font-medium"
                    >
                      {item.OrderCode}
                    </Link>
                  ) : (
                    <span className="text-gray-400">---</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {item.Packages ?? 0}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {(item.WeightKg ?? 0).toFixed(1)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {(item.CBM ?? 0).toFixed(3)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {formatDate(item.LoadedAt)}
                </td>
                <td className="px-4 py-3">
                  {item.ScanVerified ? (
                    <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> OK
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">---</span>
                  )}
                </td>
              </tr>
            ))}
            {/* Total row */}
            <tr className="bg-gray-50 font-semibold">
              <td className="px-4 py-3 text-sm text-gray-900">Tong</td>
              <td className="px-4 py-3 text-sm text-gray-900">
                {totals.packages}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">
                {totals.weight.toFixed(1)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">
                {totals.cbm.toFixed(3)}
              </td>
              <td className="px-4 py-3" />
              <td className="px-4 py-3" />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------- Container Timeline ----------

function ContainerTimeline({ currentStatus }: { currentStatus: string }) {
  const currentIdx = STATUS_FLOW.indexOf(currentStatus);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-6">
        Tien trinh van chuyen
      </h3>
      <div className="relative">
        {STATUS_FLOW.map((status, idx) => {
          const reached = idx <= currentIdx;
          const isCurrent = idx === currentIdx;
          const isLast = idx === STATUS_FLOW.length - 1;

          return (
            <div key={status} className="flex gap-4 relative">
              {/* Vertical line */}
              {!isLast && (
                <div
                  className={cn(
                    "absolute left-[15px] top-[30px] w-0.5 h-full",
                    reached && !isCurrent ? "bg-green-400" : "bg-gray-200"
                  )}
                />
              )}

              {/* Icon */}
              <div className="relative z-10 flex-shrink-0">
                {reached ? (
                  <div
                    className={cn(
                      "w-[30px] h-[30px] rounded-full flex items-center justify-center",
                      isCurrent
                        ? "bg-[#4F5FD9] ring-4 ring-[#4F5FD9]/20"
                        : "bg-green-500"
                    )}
                  >
                    {isCurrent ? (
                      <Circle className="w-3.5 h-3.5 text-white fill-white" />
                    ) : (
                      <Check className="w-3.5 h-3.5 text-white" />
                    )}
                  </div>
                ) : (
                  <div className="w-[30px] h-[30px] rounded-full border-2 border-gray-300 bg-white flex items-center justify-center">
                    <Circle className="w-3 h-3 text-gray-300" />
                  </div>
                )}
              </div>

              {/* Label */}
              <div className="pb-8 pt-1">
                <p
                  className={cn(
                    "text-sm font-medium",
                    isCurrent
                      ? "text-[#2D3A8C]"
                      : reached
                      ? "text-gray-900"
                      : "text-gray-400"
                  )}
                >
                  {status}
                </p>
                {isCurrent && (
                  <span className="text-xs text-[#4F5FD9] font-medium">
                    Hien tai
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Add Items Modal ----------

function AddItemsModal({
  open,
  onClose,
  containerId,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  containerId: string;
  onAdded: () => void;
}) {
  const [receipts, setReceipts] = useState<WarehouseCnReceipt[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const fetchEligible = async () => {
      setLoading(true);
      try {
        const [receiptsRes, ordersRes] = await Promise.all([
          getWarehouseCnReceipts({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
          getOrders({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
        ]);

        // Build set of order IDs with UTXNK or LCLCN service types
        const eligibleOrderIds = new Set(
          ordersRes.data
            .filter(
              (o) =>
                o.ServiceTypes &&
                (o.ServiceTypes.includes("UTXNK") ||
                  o.ServiceTypes.includes("LCLCN"))
            )
            .map((o) => o.id)
        );

        // Filter receipts: Status="Trên kệ", QCStatus="Đạt", !IsUnidentified, eligible order
        const eligible = receiptsRes.data.filter(
          (r) =>
            r.Status === "Trên kệ" &&
            r.QCStatus === "Đạt" &&
            !r.IsUnidentified &&
            r.OrderId &&
            eligibleOrderIds.has(r.OrderId)
        );

        if (!cancelled) {
          setReceipts(eligible);
          setSelected(new Set());
        }
      } catch {
        toast.error("Lỗi tải danh sách phiếu nhập");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchEligible();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === receipts.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(receipts.map((r) => r.id)));
    }
  };

  const handleAdd = async () => {
    if (selected.size === 0) {
      toast.error("Chon it nhat 1 phieu nhap");
      return;
    }
    setSaving(true);
    try {
      const selectedReceipts = receipts.filter((r) => selected.has(r.id));

      // Create container items
      for (const receipt of selectedReceipts) {
        const input: CreateContainerItemInput = {
          ContainerId: containerId,
          OrderId: receipt.OrderId,
          OrderCode: receipt.OrderCode,
          ReceiptId: receipt.id,
          Packages: receipt.PackagesReceived ?? 0,
          WeightKg: receipt.WeightKg ?? 0,
          CBM: receipt.CBM ?? 0,
          LoadedAt: new Date().toISOString(),
          ScanVerified: false,
        };
        await createContainerItem(input);

        // Update receipt status to "Đã load"
        await updateWarehouseCnReceipt(receipt.id, { Status: "Đã load" });
      }

      // Recalculate container totals
      const { data: allItems } = await getContainerItems({ take: 200, sortField: "createdAt", sortDirection: "desc" });
      const containerItems = allItems.filter(
        (i) => i.ContainerId === containerId
      );
      const newTotalCBM = containerItems.reduce(
        (sum, i) => sum + (i.CBM ?? 0),
        0
      );
      const newTotalPackages = containerItems.reduce(
        (sum, i) => sum + (i.Packages ?? 0),
        0
      );

      // Get current container to get MaxCBM
      const currentContainer = await getContainer(containerId);
      const maxCBM = currentContainer.MaxCBM ?? 1;
      const newFillRate = Math.round((newTotalCBM / maxCBM) * 100);

      await updateContainer(containerId, {
        TotalCBM: newTotalCBM,
        TotalPackages: newTotalPackages,
        FillRate: newFillRate,
      });

      toast.success(`Da them ${selectedReceipts.length} kien hang`);
      onAdded();
      onClose();
    } catch {
      toast.error("Lỗi thêm kiện hàng");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-[#2D3A8C]">
              Thêm kiện hàng vào container
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Chọn phiếu nhập đủ điều kiện (Trên kệ, QC Đạt, UTXNK/LCLCN)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">
                Đang tải...
              </span>
            </div>
          ) : receipts.length === 0 ? (
            <EmptyState
              title="Không có phiếu nhập đủ điều kiện"
              description="Cần phiếu nhập có trạng thái 'Trên kệ', QC 'Đạt', và dịch vụ UTXNK hoặc LCLCN"
            />
          ) : (
            <div>
              {/* Select all */}
              <label className="flex items-center gap-2 mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.size === receipts.length}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded border-gray-300 text-[#4F5FD9] focus:ring-[#4F5FD9]"
                />
                <span className="text-sm font-medium text-gray-700">
                  Chon tat ca ({receipts.length})
                </span>
              </label>

              <div className="space-y-2">
                {receipts.map((r) => (
                  <label
                    key={r.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                      selected.has(r.id)
                        ? "border-[#4F5FD9] bg-[#4F5FD9]/5"
                        : "border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(r.id)}
                      onChange={() => toggleSelect(r.id)}
                      className="w-4 h-4 rounded border-gray-300 text-[#4F5FD9] focus:ring-[#4F5FD9]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {r.ReceiptCode || r.id.slice(0, 8)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {r.OrderCode}
                        </span>
                      </div>
                      <div className="flex gap-4 mt-0.5 text-xs text-gray-500">
                        <span>{r.PackagesReceived ?? 0} kien</span>
                        <span>{(r.WeightKg ?? 0).toFixed(1)} kg</span>
                        <span>{(r.CBM ?? 0).toFixed(3)} m3</span>
                      </div>
                    </div>
                    <Scan className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <span className="text-sm text-gray-500">
            Da chon: {selected.size} phieu nhap
          </span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Huy
            </button>
            <button
              onClick={handleAdd}
              disabled={saving || selected.size === 0}
              className="px-5 py-2 text-sm bg-[#4F5FD9] hover:bg-[#3B4CC0] text-white rounded-lg font-medium disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Đang thêm..." : `Thêm ${selected.size} kiện`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Action Buttons ----------

function ActionButtons({
  container,
  onStatusChange,
  onOpenAddItems,
}: {
  container: Container;
  onStatusChange: (newStatus: string, extra?: Record<string, any>) => void;
  onOpenAddItems: () => void;
}) {
  const status = container.Status ?? "";

  const buttons: {
    label: string;
    action: () => void;
    primary: boolean;
    icon?: React.ReactNode;
  }[] = [];

  if (status === "Lập kế hoạch") {
    buttons.push({
      label: "Dat cho",
      action: () =>
        onStatusChange("Đặt chỗ", {
          BookingDate: new Date().toISOString(),
        }),
      primary: true,
      icon: <Ship className="w-3.5 h-3.5" />,
    });
  }
  if (status === "Đặt chỗ") {
    buttons.push({
      label: "Bat dau xep",
      action: () => onStatusChange("Đang xếp"),
      primary: true,
      icon: <Package className="w-3.5 h-3.5" />,
    });
  }
  if (status === "Đang xếp") {
    buttons.push({
      label: "Thêm kiện",
      action: onOpenAddItems,
      primary: false,
      icon: <Plus className="w-3.5 h-3.5" />,
    });
    buttons.push({
      label: "Dong cont",
      action: () => {
        if (!container.SealNumber) {
          toast.error("Can nhap so seal truoc khi dong container");
          return;
        }
        onStatusChange("Đã đóng");
      },
      primary: true,
    });
  }
  if (status === "Đã đóng") {
    buttons.push({
      label: "Van chuyen",
      action: () =>
        onStatusChange("Đang vận chuyển", {
          ActualDeparture: new Date().toISOString(),
        }),
      primary: true,
      icon: <Truck className="w-3.5 h-3.5" />,
    });
  }
  if (status === "Đang vận chuyển") {
    buttons.push({
      label: "Tai bien gioi",
      action: () => onStatusChange("Tại biên giới"),
      primary: true,
    });
  }
  if (status === "Tại biên giới") {
    buttons.push({
      label: "Hai quan",
      action: () => onStatusChange("Hải quan"),
      primary: true,
    });
  }
  if (status === "Hải quan") {
    buttons.push({
      label: "Thong quan",
      action: () => onStatusChange("Đã thông quan"),
      primary: true,
    });
  }
  if (status === "Đã thông quan") {
    buttons.push({
      label: "Da ve kho",
      action: () =>
        onStatusChange("Đã về kho", {
          ActualArrival: new Date().toISOString(),
        }),
      primary: true,
    });
  }
  if (status === "Đã về kho") {
    buttons.push({
      label: "Bat dau do",
      action: () => onStatusChange("Đang dỡ"),
      primary: true,
    });
  }
  if (status === "Đang dỡ") {
    buttons.push({
      label: "Hoan tat",
      action: () => onStatusChange("Hoàn tất"),
      primary: true,
      icon: <Check className="w-3.5 h-3.5" />,
    });
  }

  if (buttons.length === 0) return null;

  return (
    <div className="flex gap-2 flex-wrap">
      {buttons.map((btn) => (
        <button
          key={btn.label}
          onClick={btn.action}
          className={cn(
            "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            btn.primary
              ? "bg-[#4F5FD9] hover:bg-[#3B4CC0] text-white"
              : "border border-gray-300 text-gray-700 hover:bg-gray-50"
          )}
        >
          {btn.icon}
          {btn.label}
        </button>
      ))}
    </div>
  );
}

// ---------- Main Page ----------

export default function ContainerDetailPage() {
  const params = useParams();
  const containerId = params.id as string;

  const [container, setContainer] = useState<Container | null>(null);
  const [items, setItems] = useState<ContainerItem[]>([]);
  const [customsDecl, setCustomsDecl] = useState<CustomsDeclaration | null>(null);
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchContainer = useCallback(async () => {
    try {
      const data = await getContainer(containerId);
      setContainer(data);
    } catch {
      toast.error("Lỗi tải thông tin container");
    } finally {
      setLoading(false);
    }
  }, [containerId]);

  const fetchItems = useCallback(async () => {
    setItemsLoading(true);
    try {
      const { data } = await getContainerItems({ take: 200, sortField: "createdAt", sortDirection: "desc" });
      const filtered = data.filter((i) => i.ContainerId === containerId);
      setItems(filtered);
    } catch {
      toast.error("Lỗi tải danh sách kiện hàng");
    } finally {
      setItemsLoading(false);
    }
  }, [containerId]);

  const fetchCustomsDecl = useCallback(async () => {
    try {
      const { data } = await getCustomsDeclarations({ take: 200, sortField: "createdAt", sortDirection: "desc" });
      const match = data.find((d) => d.ContainerId === containerId);
      setCustomsDecl(match ?? null);
    } catch {
      // non-critical - silently ignore
    }
  }, [containerId]);

  useEffect(() => {
    fetchContainer();
    fetchItems();
    fetchCustomsDecl();
  }, [fetchContainer, fetchItems, fetchCustomsDecl]);

  const handleStatusChange = async (
    newStatus: string,
    extra?: Record<string, any>
  ) => {
    if (!container) return;
    try {
      await updateContainer(container.id, { Status: newStatus, ...extra });
      toast.success(`Trạng thái → ${newStatus}`);
      fetchContainer();
    } catch {
      toast.error("Lỗi cập nhật trạng thái");
    }
  };

  const handleItemsAdded = () => {
    fetchContainer();
    fetchItems();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Link
          href="/containers"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lai
        </Link>
        <DetailSkeleton />
      </div>
    );
  }

  if (!container) {
    return (
      <div className="space-y-6">
        <Link
          href="/containers"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lai
        </Link>
        <EmptyState
          title="Không tìm thấy container"
          description="Container không tồn tại hoặc đã bị xóa"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/containers"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lai danh sach
      </Link>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-[#2D3A8C]">
              {container.ContainerCode || "---"}
            </h1>
            <span className="inline-flex px-2.5 py-0.5 rounded-lg bg-gray-100 text-xs font-medium text-gray-700">
              {container.ContainerType || "---"}
            </span>
            <span className="text-sm text-gray-500">
              {container.Route || "---"}
            </span>
            <StatusBadge status={container.Status} />
          </div>
          <ActionButtons
            container={container}
            onStatusChange={handleStatusChange}
            onOpenAddItems={() => setShowAddModal(true)}
          />
        </div>
      </div>

      {/* Info grid */}
      <InfoGrid container={container} />

      {/* Related links */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Liên kết nhanh</h3>
        <div className="flex flex-wrap gap-2">
          {customsDecl ? (
            <Link
              href={`/customs/${customsDecl.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Shield className="w-4 h-4 text-[#4F5FD9]" />
              Tờ khai: {customsDecl.DeclarationCode}
              <StatusBadge status={customsDecl.Status} />
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>
          ) : (
            <Link
              href={`/customs/new?containerId=${containerId}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-gray-300 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <Shield className="w-4 h-4" />
              Chưa có tờ khai — Tạo mới
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>
          )}
          <Link
            href={`/tracking/events?q=${encodeURIComponent(container.ContainerCode ?? "")}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Activity className="w-4 h-4 text-[#4F5FD9]" />
            Lịch sử sự kiện
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Link>
        </div>
      </div>

      {/* Fill rate */}
      <FillRateDisplay
        totalCBM={container.TotalCBM ?? 0}
        maxCBM={container.MaxCBM ?? 1}
        fillRate={container.FillRate ?? 0}
        totalPackages={container.TotalPackages ?? 0}
      />

      {/* Packing list + Timeline side by side on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#2D3A8C]">
              Danh sách kiện hàng
            </h2>
            {container.Status === "Đang xếp" && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm kiện
              </button>
            )}
          </div>
          <PackingListTable items={items} loading={itemsLoading} />
        </div>
        <div>
          <ContainerTimeline currentStatus={container.Status ?? ""} />
        </div>
      </div>

      {/* Add items modal */}
      <AddItemsModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        containerId={containerId}
        onAdded={handleItemsAdded}
      />
    </div>
  );
}
