"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getOrder, updateOrder, type Order } from "@/lib/orders";
import { getOrderItems, createOrderItem, type OrderItem } from "@/lib/order-items";
import { getOrderHistories, createOrderHistory, type OrderHistoryEntry } from "@/lib/order-history";
import { createOrder } from "@/lib/orders";
import { getPaymentVouchers, type PaymentVoucher } from "@/lib/payment-vouchers";
import { getWarehouseCnReceipts, type WarehouseCnReceipt } from "@/lib/warehouse-cn-receipts";
import { getWarehouseVnReceipts, type WarehouseVnReceipt } from "@/lib/warehouse-vn-receipts";
import { getDeliveryOrders, type DeliveryOrder } from "@/lib/delivery-orders";
import { getAccountsReceivable, type AccountReceivable } from "@/lib/accounts-receivable";
import { getQuotation, type Quotation } from "@/lib/quotations";
import { formatCurrency, formatDate, generateCode } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import {
  ConfirmTransitionDialog,
  CancelOrderDialog,
  HoldOrderDialog,
} from "@/components/order-action-dialogs";
import {
  ArrowLeft,
  Check,
  Package,
  DollarSign,
  Truck,
  Clock,
  ChevronRight,
  FileText,
  ShoppingCart,
  Pencil,
  Copy,
  XCircle,
  Pause,
  Play,
  MoreHorizontal,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const STAGE_LABELS: Record<number, string> = {
  1: "Tiếp nhận",
  2: "Báo giá",
  3: "Cọc",
  4: "Mua hàng",
  5: "Kho TQ",
  6: "Đóng gói",
  7: "Container",
  8: "Vận chuyển",
  9: "Thông quan",
  10: "Kho VN",
  11: "Giao hàng",
  12: "Quyết toán",
  13: "Hoàn thành",
};

// Next status label for the button text
const NEXT_ACTION_LABEL: Record<string, string> = {
  "Nháp": "Gửi duyệt",
  "Chờ duyệt": "Xác nhận",
  "Đã xác nhận": "Tiếp tục",
  "Đang tìm hàng": "Đặt hàng",
  "Đã đặt hàng": "Nhập kho TQ",
  "Tại kho TQ": "Tiếp tục",
  "Trong container": "Vận chuyển",
  "Đang vận chuyển": "Tiếp tục",
  "Tại cửa khẩu": "Thông quan",
  "Đang thông quan": "Nhập kho VN",
  "Tại kho VN": "Giao hàng",
  "Đang giao": "Xác nhận giao",
  "Đã giao": "Hoàn thành",
};

// Determine the next status based on current status + service types
function getNextStatus(current: string, serviceTypes: string[]): string | null {
  switch (current) {
    case "Nháp": return "Chờ duyệt";
    case "Chờ duyệt": return "Đã xác nhận";
    case "Đã xác nhận":
      return (serviceTypes.includes("MHH") || serviceTypes.includes("UTXNK"))
        ? "Đang tìm hàng" : "Tại kho TQ";
    case "Đang tìm hàng": return "Đã đặt hàng";
    case "Đã đặt hàng": return "Tại kho TQ";
    case "Tại kho TQ":
      return (serviceTypes.includes("UTXNK") || serviceTypes.includes("LCLCN"))
        ? "Trong container" : "Đang vận chuyển";
    case "Trong container": return "Đang vận chuyển";
    case "Đang vận chuyển":
      return (serviceTypes.includes("UTXNK") || serviceTypes.includes("LCLCN"))
        ? "Tại cửa khẩu" : "Tại kho VN";
    case "Tại cửa khẩu": return "Đang thông quan";
    case "Đang thông quan": return "Tại kho VN";
    case "Tại kho VN": return "Đang giao";
    case "Đang giao": return "Đã giao";
    case "Đã giao": return "Hoàn thành";
    default: return null;
  }
}

// Map status to stage number for the timeline
const STATUS_TO_STAGE: Record<string, number> = {
  "Nháp": 1, "Chờ duyệt": 1, "Đã xác nhận": 3,
  "Đang tìm hàng": 4, "Đã đặt hàng": 4,
  "Tại kho TQ": 5, "Trong container": 7,
  "Đang vận chuyển": 8, "Tại cửa khẩu": 9,
  "Đang thông quan": 9, "Tại kho VN": 10,
  "Đang giao": 11, "Đã giao": 12, "Hoàn thành": 13,
};

// Statuses that allow editing
const EDITABLE_STATUSES = ["Nháp", "Chờ duyệt"];

// Statuses that can be cancelled
const CANCELLABLE_STATUSES = [
  "Nháp", "Chờ duyệt", "Đã xác nhận", "Đang tìm hàng", "Đã đặt hàng",
  "Tại kho TQ", "Trong container", "Đang vận chuyển",
];

// Statuses that can be put on hold
const HOLDABLE_STATUSES = [
  "Chờ duyệt", "Đã xác nhận", "Đang tìm hàng", "Đã đặt hàng",
  "Tại kho TQ", "Trong container", "Đang vận chuyển", "Tại cửa khẩu",
  "Đang thông quan", "Tại kho VN", "Đang giao",
];

const TABS = ["Tổng quan", "Hàng hóa", "Tài chính", "Logistics", "Lịch sử"] as const;
type TabName = (typeof TABS)[number];

function parseServiceTypes(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string" && raw.trim()) return raw.split(",").map(s => s.trim());
  return [];
}

function getRequiredStages(serviceTypes: string[]): number[] {
  const base = [1, 2, 3, 5, 6, 8, 10, 11, 12, 13];
  if (serviceTypes?.includes("MHH") || serviceTypes?.includes("UTXNK"))
    base.push(4);
  if (serviceTypes?.includes("UTXNK") || serviceTypes?.includes("LCLCN"))
    base.push(7, 9);
  return base.sort((a, b) => a - b);
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className ?? "h-4 w-full"}`}
    />
  );
}

function OrderTimeline({
  stages,
  currentStage,
}: {
  stages: number[];
  currentStage: number;
}) {
  return (
    <div className="bg-white rounded-xl border p-6 mt-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">
        Tiến trình đơn hàng
      </h3>
      <div className="flex items-start overflow-x-auto pb-2">
        {stages.map((stage, idx) => {
          const isPast = stage < currentStage;
          const isCurrent = stage === currentStage;
          const isLast = idx === stages.length - 1;

          return (
            <div key={stage} className="flex items-start flex-shrink-0">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    isPast
                      ? "bg-green-500 text-white"
                      : isCurrent
                        ? "bg-blue-500 text-white ring-2 ring-blue-200"
                        : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {isPast ? <Check className="w-4 h-4" /> : stage}
                </div>
                <span className="text-[10px] text-gray-500 mt-1.5 text-center w-16 leading-tight">
                  {STAGE_LABELS[stage]}
                </span>
              </div>
              {!isLast && (
                <div
                  className={`h-0.5 w-8 mt-4 flex-shrink-0 ${
                    isPast ? "bg-green-500" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OverviewTab({ order, sourceQuote }: { order: Order; sourceQuote: Quotation | null }) {
  const stages = getRequiredStages(parseServiceTypes(order.ServiceTypes));
  const currentStage = order.StageNumber ?? 1;
  // recompile hint v2
  return (
    <div>
      {/* Bug #11: Back-links row */}
      {(order.CustomerId || order.QuotationId || sourceQuote?.LeadId) && (
        <div className="bg-white rounded-xl border p-4 mb-6 flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="text-sm text-gray-500">Liên kết nguồn:</span>
          {order.CustomerId && (
            <Link href={`/customers/${order.CustomerId}`} className="inline-flex items-center gap-1 text-sm font-medium text-[#4F5FD9] hover:text-[#3B4CC0] hover:underline">
              Khách hàng: {order.CustomerName || order.CompanyName || "---"}
            </Link>
          )}
          {order.QuotationId && (
            <Link href={`/quotations/${order.QuotationId}`} className="inline-flex items-center gap-1 text-sm font-medium text-[#4F5FD9] hover:text-[#3B4CC0] hover:underline">
              Báo giá nguồn: {sourceQuote?.QuotationCode || order.QuotationId}
            </Link>
          )}
          {sourceQuote?.LeadId && (
            <Link href={`/leads/${sourceQuote.LeadId}`} className="inline-flex items-center gap-1 text-sm font-medium text-[#4F5FD9] hover:text-[#3B4CC0] hover:underline">
              Lead nguồn
            </Link>
          )}
        </div>
      )}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Customer Info */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Thông tin khách hàng
          </h3>
          <div className="grid grid-cols-2 gap-y-3 gap-x-4">
            <div>
              <p className="text-sm text-gray-500">Khách hàng</p>
              <p className="text-sm font-medium">
                {order.CustomerName || "---"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Công ty</p>
              <p className="text-sm font-medium">
                {order.CompanyName || "---"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Chi nhánh</p>
              <p className="text-sm font-medium">{order.Branch || "---"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">NV Sale</p>
              <p className="text-sm font-medium">{order.SaleOwner || "---"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Địa chỉ giao</p>
              <p className="text-sm font-medium">
                {order.DeliveryAddress || "---"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Người nhận</p>
              <p className="text-sm font-medium">
                {order.ReceiverName || "---"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">SĐT nhận</p>
              <p className="text-sm font-medium">
                {order.ReceiverPhone || "---"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Dự kiến giao</p>
              <p className="text-sm font-medium">
                {formatDate(order.EstimatedDelivery)}
              </p>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Tài chính tổng quan
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Tiền hàng (CNY)</span>
              <span className="text-sm font-medium">
                {formatCurrency(order.ItemsTotalCNY, "CNY")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Tỷ giá</span>
              <span className="text-sm font-medium">
                {order.ExchangeRate
                  ? `1 CNY = ${new Intl.NumberFormat("vi-VN").format(order.ExchangeRate)} VND`
                  : "---"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Phí dịch vụ</span>
              <span className="text-sm font-medium">
                {formatCurrency(order.ServiceFeeVND)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Phí vận chuyển</span>
              <span className="text-sm font-medium">
                {formatCurrency(order.ShippingFeeVND)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Thuế</span>
              <span className="text-sm font-medium">
                {formatCurrency(order.TaxVND)}
              </span>
            </div>
            <div className="border-t pt-3 flex justify-between">
              <span className="text-lg font-bold text-gray-900">Tổng cộng</span>
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(order.TotalVND)}
              </span>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <StatusBadge status={order.DepositStatus} />
              <StatusBadge status={order.PaymentStatus} />
            </div>
          </div>
        </div>
      </div>

      {/* Order Timeline */}
      <OrderTimeline stages={stages} currentStage={currentStage} />
    </div>
  );
}

function GoodsTab({
  items,
  loading,
}: {
  items: OrderItem[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border p-6 space-y-3">
        {[1, 2, 3].map((i) => (
          <SkeletonBlock key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium text-gray-500">STT</th>
              <th className="px-4 py-3 font-medium text-gray-500">
                Sản phẩm
              </th>
              <th className="px-4 py-3 font-medium text-gray-500">SKU</th>
              <th className="px-4 py-3 font-medium text-gray-500 text-right">
                SL
              </th>
              <th className="px-4 py-3 font-medium text-gray-500 text-right">
                Đã nhận TQ
              </th>
              <th className="px-4 py-3 font-medium text-gray-500 text-right">
                Đã nhận VN
              </th>
              <th className="px-4 py-3 font-medium text-gray-500 text-right">
                Đơn giá (CNY)
              </th>
              <th className="px-4 py-3 font-medium text-gray-500 text-right">
                Thành tiền (CNY)
              </th>
              <th className="px-4 py-3 font-medium text-gray-500">
                Trạng thái
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                  Chưa có hàng hóa
                </td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">
                        {item.ProductName || "---"}
                      </span>
                      {item.ProductLink && (
                        <a
                          href={item.ProductLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                    {item.Attributes && (
                      <span className="text-xs text-gray-400">
                        {item.Attributes}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {item.SKU || "---"}
                  </td>
                  <td className="px-4 py-3 text-right">{item.Quantity ?? 0}</td>
                  <td className="px-4 py-3 text-right">
                    {item.QuantityReceivedCN ?? 0}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {item.QuantityReceivedVN ?? 0}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatCurrency(item.UnitPriceCNY, "CNY")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatCurrency(item.TotalCNY, "CNY")}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.Status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FinanceTab({
  vouchers,
  arRecords,
  loading,
}: {
  vouchers: PaymentVoucher[];
  arRecords: AccountReceivable[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <SkeletonBlock key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  const totalAR = arRecords.reduce(
    (sum, r) => sum + (r.InvoiceAmount ?? 0),
    0
  );
  const totalPaid = arRecords.reduce((sum, r) => sum + (r.PaidAmount ?? 0), 0);
  const totalRemaining = arRecords.reduce(
    (sum, r) => sum + (r.Remaining ?? 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Tổng phải thu</p>
          <p className="text-xl font-bold mt-1">{formatCurrency(totalAR)}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Đã thu</p>
          <p className="text-xl font-bold mt-1 text-green-600">
            {formatCurrency(totalPaid)}
          </p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Còn lại</p>
          <p className="text-xl font-bold mt-1 text-red-600">
            {formatCurrency(totalRemaining)}
          </p>
        </div>
      </div>

      {/* Payment vouchers */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-4 py-3 border-b">
          <h3 className="text-sm font-semibold text-gray-700">
            Phiếu thu / chi
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-500">
                  Mã phiếu
                </th>
                <th className="px-4 py-3 font-medium text-gray-500">Loại</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-right">
                  Số tiền
                </th>
                <th className="px-4 py-3 font-medium text-gray-500">
                  Trạng thái
                </th>
                <th className="px-4 py-3 font-medium text-gray-500">
                  Ngày tạo
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {vouchers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    Chưa có phiếu thu/chi
                  </td>
                </tr>
              ) : (
                vouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">
                      {v.VoucherCode || "---"}
                    </td>
                    <td className="px-4 py-3">{v.Type || "---"}</td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(v.Amount, v.Currency ?? "VND")}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={v.Status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDate(v.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Accounts Receivable */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-4 py-3 border-b">
          <h3 className="text-sm font-semibold text-gray-700">Công nợ</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-500">Mã AR</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-right">
                  Số tiền
                </th>
                <th className="px-4 py-3 font-medium text-gray-500 text-right">
                  Đã thu
                </th>
                <th className="px-4 py-3 font-medium text-gray-500 text-right">
                  Còn lại
                </th>
                <th className="px-4 py-3 font-medium text-gray-500">
                  Hạn thu
                </th>
                <th className="px-4 py-3 font-medium text-gray-500">
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {arRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    Chưa có công nợ
                  </td>
                </tr>
              ) : (
                arRecords.map((ar) => (
                  <tr key={ar.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">
                      {ar.ARCode || "---"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(ar.InvoiceAmount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(ar.PaidAmount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(ar.Remaining)}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDate(ar.DueDate)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={ar.Status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function LogisticsTab({
  cnReceipts,
  vnReceipts,
  deliveries,
  loading,
}: {
  cnReceipts: WarehouseCnReceipt[];
  vnReceipts: WarehouseVnReceipt[];
  deliveries: DeliveryOrder[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <SkeletonBlock key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  const hasAny =
    cnReceipts.length > 0 || vnReceipts.length > 0 || deliveries.length > 0;

  if (!hasAny) {
    return (
      <div className="bg-white rounded-xl border p-8 text-center text-gray-400">
        Chưa có dữ liệu logistics
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Kho TQ */}
      {cnReceipts.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center gap-2">
            <Package className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-700">Kho TQ</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500">
                    Mã phiếu
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-500">
                    Tracking
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-right">
                    Kiện nhận
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-right">
                    Trọng lượng
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-500">
                    QC
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-500">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {cnReceipts.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">
                      {r.ReceiptCode || "---"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {r.TrackingCN || "---"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.PackagesReceived ?? 0}/{r.PackagesExpected ?? 0}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.WeightKg ? `${r.WeightKg} kg` : "---"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.QCStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.Status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Kho VN */}
      {vnReceipts.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center gap-2">
            <Package className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-700">Kho VN</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500">
                    Mã phiếu
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-500">Kho</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-right">
                    Kiện nhận
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-right">
                    Trọng lượng
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-500">
                    Vị trí
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-500">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {vnReceipts.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">
                      {r.ReceiptCode || "---"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {r.Warehouse || "---"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.PackagesReceived ?? 0}/{r.PackagesExpected ?? 0}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.WeightKg ? `${r.WeightKg} kg` : "---"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {r.Location || "---"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.Status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Giao hàng */}
      {deliveries.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center gap-2">
            <Truck className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-700">Giao hàng</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500">
                    Mã giao
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-500">
                    Người nhận
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-500">
                    Tài xế
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-500">
                    Ngày giao
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-right">
                    Kiện
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-500">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {deliveries.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">
                      {d.DeliveryCode || "---"}
                    </td>
                    <td className="px-4 py-3">
                      <div>{d.ReceiverName || "---"}</div>
                      <div className="text-xs text-gray-400">
                        {d.ReceiverPhone || ""}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {d.Driver || "---"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDate(d.ScheduledDate)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {d.Packages ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={d.Status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function HistoryTab({
  entries,
  loading,
}: {
  entries: OrderHistoryEntry[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <SkeletonBlock key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-8 text-center text-gray-400">
        Chưa có lịch sử
      </div>
    );
  }

  const sorted = [...entries].sort(
    (a, b) =>
      new Date(b.createdAt ?? 0).getTime() -
      new Date(a.createdAt ?? 0).getTime()
  );

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="relative">
        {sorted.map((entry, idx) => (
          <div key={entry.id} className="flex gap-4 pb-6 last:pb-0">
            {/* Timeline line + circle */}
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-[#4F5FD9] flex-shrink-0 mt-1.5" />
              {idx < sorted.length - 1 && (
                <div className="w-0.5 flex-1 bg-gray-200 mt-1" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {entry.FromStatus && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    {entry.FromStatus}
                  </span>
                )}
                {entry.FromStatus && entry.ToStatus && (
                  <ChevronRight className="w-3 h-3 text-gray-400" />
                )}
                {entry.ToStatus && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                    {entry.ToStatus}
                  </span>
                )}
              </div>
              {entry.Action && (
                <p className="text-sm font-medium text-gray-800 mt-1">
                  {entry.Action}
                </p>
              )}
              {entry.Note && (
                <p className="text-sm text-gray-500 mt-0.5">{entry.Note}</p>
              )}
              <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                {entry.PerformedBy && <span>{entry.PerformedBy}</span>}
                <span>{formatDate(entry.createdAt)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [sourceQuote, setSourceQuote] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabName>("Tổng quan");

  // Tab data
  const [items, setItems] = useState<OrderItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsLoaded, setItemsLoaded] = useState(false);

  const [vouchers, setVouchers] = useState<PaymentVoucher[]>([]);
  const [arRecords, setArRecords] = useState<AccountReceivable[]>([]);
  const [financeLoading, setFinanceLoading] = useState(false);
  const [financeLoaded, setFinanceLoaded] = useState(false);

  const [cnReceipts, setCnReceipts] = useState<WarehouseCnReceipt[]>([]);
  const [vnReceipts, setVnReceipts] = useState<WarehouseVnReceipt[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
  const [logisticsLoading, setLogisticsLoading] = useState(false);
  const [logisticsLoaded, setLogisticsLoaded] = useState(false);

  const [history, setHistory] = useState<OrderHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Load order
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await getOrder(orderId);
        setOrder(data);
        // Fetch source quote for back-links (Bug #11)
        if (data.QuotationId) {
          try {
            const q = await getQuotation(data.QuotationId);
            setSourceQuote(q);
          } catch {
            // Quote may have been deleted — ignore
          }
        }
      } catch (err) {
        console.error("Failed to load order:", err);
      } finally {
        setLoading(false);
      }
    }
    if (orderId) load();
  }, [orderId]);

  // Lazy load tab data
  useEffect(() => {
    if (!order) return;

    if (activeTab === "Hàng hóa" && !itemsLoaded) {
      setItemsLoading(true);
      getOrderItems({ filters: { OrderId: order.id } })
        .then((res) => {
          setItems(res.data);
          setItemsLoaded(true);
        })
        .catch(console.error)
        .finally(() => setItemsLoading(false));
    }

    if (activeTab === "Tài chính" && !financeLoaded) {
      setFinanceLoading(true);
      Promise.all([
        getPaymentVouchers({
          filters: { OrderId: order.id },
        }),
        getAccountsReceivable({
          filters: { OrderId: order.id },
        }),
      ])
        .then(([vRes, arRes]) => {
          setVouchers(vRes.data);
          setArRecords(arRes.data);
          setFinanceLoaded(true);
        })
        .catch(console.error)
        .finally(() => setFinanceLoading(false));
    }

    if (activeTab === "Logistics" && !logisticsLoaded) {
      setLogisticsLoading(true);
      Promise.all([
        getWarehouseCnReceipts({
          filters: { OrderId: order.id },
        }),
        getWarehouseVnReceipts({
          filters: { OrderId: order.id },
        }),
        getDeliveryOrders({
          filters: { OrderId: order.id },
        }),
      ])
        .then(([cnRes, vnRes, delRes]) => {
          setCnReceipts(cnRes.data);
          setVnReceipts(vnRes.data);
          setDeliveries(delRes.data);
          setLogisticsLoaded(true);
        })
        .catch(console.error)
        .finally(() => setLogisticsLoading(false));
    }

    if (activeTab === "Lịch sử" && !historyLoaded) {
      setHistoryLoading(true);
      getOrderHistories({
        filters: { OrderId: order.id },
      })
        .then((res) => {
          setHistory(res.data);
          setHistoryLoaded(true);
        })
        .catch(console.error)
        .finally(() => setHistoryLoading(false));
    }
  }, [
    activeTab,
    order,
    itemsLoaded,
    financeLoaded,
    logisticsLoaded,
    historyLoaded,
  ]);

  // --- Action state ---
  const [actionLoading, setActionLoading] = useState(false);
  const [showTransitionDialog, setShowTransitionDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showHoldDialog, setShowHoldDialog] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  const serviceTypes = order ? parseServiceTypes(order.ServiceTypes) : [];
  const currentStatus = order?.Status ?? "";
  const nextStatus = getNextStatus(currentStatus, serviceTypes);
  const nextActionLabel = NEXT_ACTION_LABEL[currentStatus] || null;
  const canEdit = EDITABLE_STATUSES.includes(currentStatus);
  const canCancel = CANCELLABLE_STATUSES.includes(currentStatus);
  const canHold = HOLDABLE_STATUSES.includes(currentStatus);
  const isOnHold = currentStatus === "Tạm giữ";
  const isFinalStatus = currentStatus === "Hoàn thành" || currentStatus === "Đã hủy";

  const reloadOrder = useCallback(async () => {
    try {
      const data = await getOrder(orderId);
      setOrder(data);
    } catch (err) {
      console.error("Failed to reload order:", err);
    }
  }, [orderId]);

  // Handler: Transition to next status
  async function handleTransition() {
    if (!order || !nextStatus) return;
    setActionLoading(true);
    try {
      const newStage = STATUS_TO_STAGE[nextStatus] ?? order.StageNumber;
      await updateOrder(order.id, { Status: nextStatus, StageNumber: newStage });
      await createOrderHistory({
        OrderId: order.id,
        FromStatus: currentStatus,
        ToStatus: nextStatus,
        Action: `Chuyển trạng thái sang "${nextStatus}"`,
        PerformedBy: "Sale",
      });
      toast.success(`Đã chuyển trạng thái sang "${nextStatus}"`);
      setShowTransitionDialog(false);
      setHistoryLoaded(false);
      await reloadOrder();
    } catch {
      toast.error("Không thể chuyển trạng thái. Vui lòng thử lại.");
    } finally {
      setActionLoading(false);
    }
  }

  // Handler: Cancel order
  async function handleCancel(reason: string) {
    if (!order) return;
    setActionLoading(true);
    try {
      await updateOrder(order.id, { Status: "Đã hủy", CancelReason: reason });
      await createOrderHistory({
        OrderId: order.id,
        FromStatus: currentStatus,
        ToStatus: "Đã hủy",
        Action: "Hủy đơn hàng",
        Note: reason,
        PerformedBy: "Sale",
      });
      toast.success("Đã hủy đơn hàng");
      setShowCancelDialog(false);
      setHistoryLoaded(false);
      await reloadOrder();
    } catch {
      toast.error("Không thể hủy đơn hàng. Vui lòng thử lại.");
    } finally {
      setActionLoading(false);
    }
  }

  // Handler: Hold order
  async function handleHold(note: string) {
    if (!order) return;
    setActionLoading(true);
    try {
      await updateOrder(order.id, { Status: "Tạm giữ" });
      await createOrderHistory({
        OrderId: order.id,
        FromStatus: currentStatus,
        ToStatus: "Tạm giữ",
        Action: "Tạm giữ đơn hàng",
        Note: note || undefined,
        PerformedBy: "Sale",
      });
      toast.success("Đã tạm giữ đơn hàng");
      setShowHoldDialog(false);
      setHistoryLoaded(false);
      await reloadOrder();
    } catch {
      toast.error("Không thể tạm giữ đơn hàng. Vui lòng thử lại.");
    } finally {
      setActionLoading(false);
    }
  }

  // Handler: Release from hold (restore previous status from history)
  async function handleRelease() {
    if (!order) return;
    setActionLoading(true);
    try {
      // Find the most recent history entry that transitioned TO "Tạm giữ"
      const { data: histData } = await getOrderHistories({
        filters: { OrderId: order.id },
        sortField: "createdAt",
        sortDirection: "desc",
        take: 10,
      });
      const holdEntry = histData.find((h) => h.ToStatus === "Tạm giữ");
      const previousStatus = holdEntry?.FromStatus || "Nháp";
      const prevStage = STATUS_TO_STAGE[previousStatus] ?? 1;

      await updateOrder(order.id, { Status: previousStatus, StageNumber: prevStage });
      await createOrderHistory({
        OrderId: order.id,
        FromStatus: "Tạm giữ",
        ToStatus: previousStatus,
        Action: `Mở lại đơn hàng — khôi phục "${previousStatus}"`,
        PerformedBy: "Sale",
      });
      toast.success(`Đã mở lại đơn hàng — trạng thái: "${previousStatus}"`);
      setHistoryLoaded(false);
      await reloadOrder();
    } catch {
      toast.error("Không thể mở lại đơn hàng. Vui lòng thử lại.");
    } finally {
      setActionLoading(false);
    }
  }

  // Handler: Clone order
  async function handleClone() {
    if (!order) return;
    setActionLoading(true);
    try {
      // Create new order with same data
      const newOrder = await createOrder({
        OrderCode: generateCode("DH"),
        CustomerId: order.CustomerId,
        CustomerName: order.CustomerName,
        CompanyName: order.CompanyName,
        ServiceTypes: parseServiceTypes(order.ServiceTypes),
        Status: "Nháp",
        StageNumber: 1,
        Branch: order.Branch,
        SaleOwner: order.SaleOwner,
        LeaderName: order.LeaderName,
        ExchangeRate: order.ExchangeRate,
        DeliveryAddress: order.DeliveryAddress,
        ReceiverName: order.ReceiverName,
        ReceiverPhone: order.ReceiverPhone,
        Priority: order.Priority,
        Notes: order.Notes ? `[Nhân bản từ ${order.OrderCode}] ${order.Notes}` : `Nhân bản từ ${order.OrderCode}`,
        DepositStatus: "Chưa cọc",
        PaymentStatus: "Chưa TT",
      });

      // Clone order items
      if (!itemsLoaded) {
        const { data: srcItems } = await getOrderItems({
          filters: { OrderId: order.id },
        });
        for (const item of srcItems) {
          await createOrderItem({
            OrderId: newOrder.id,
            ProductName: item.ProductName,
            ProductLink: item.ProductLink,
            SKU: item.SKU,
            Attributes: item.Attributes,
            Quantity: item.Quantity,
            UnitPriceCNY: item.UnitPriceCNY,
            TotalCNY: item.TotalCNY,
            HSCode: item.HSCode,
            SupplierId: item.SupplierId,
            Status: "Chờ mua",
          });
        }
      } else {
        for (const item of items) {
          await createOrderItem({
            OrderId: newOrder.id,
            ProductName: item.ProductName,
            ProductLink: item.ProductLink,
            SKU: item.SKU,
            Attributes: item.Attributes,
            Quantity: item.Quantity,
            UnitPriceCNY: item.UnitPriceCNY,
            TotalCNY: item.TotalCNY,
            HSCode: item.HSCode,
            SupplierId: item.SupplierId,
            Status: "Chờ mua",
          });
        }
      }

      await createOrderHistory({
        OrderId: newOrder.id,
        ToStatus: "Nháp",
        Action: `Nhân bản từ đơn ${order.OrderCode}`,
        PerformedBy: "Sale",
      });

      toast.success(`Đã nhân bản thành ${newOrder.OrderCode}`);
      router.push(`/orders/${newOrder.id}`);
    } catch {
      toast.error("Không thể nhân bản đơn hàng. Vui lòng thử lại.");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <SkeletonBlock className="h-8 w-48" />
        <SkeletonBlock className="h-12 w-96" />
        <div className="grid lg:grid-cols-2 gap-6">
          <SkeletonBlock className="h-64 w-full" />
          <SkeletonBlock className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">Không tìm thấy đơn hàng</p>
        <Link
          href="/orders"
          className="text-[#4F5FD9] hover:underline mt-2 inline-block"
        >
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </Link>

        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#2D3A8C]">
              {order.OrderCode || "---"}
            </h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <StatusBadge status={order.Status} />
              {parseServiceTypes(order.ServiceTypes).map((st) => (
                <span
                  key={st}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
                >
                  {st}
                </span>
              ))}
              {order.Priority && order.Priority !== "Thường" && (
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    order.Priority === "VIP"
                      ? "bg-orange-100 text-orange-700"
                      : order.Priority === "Gấp"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {order.Priority}
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Next Step */}
            {nextStatus && nextActionLabel && !isFinalStatus && !isOnHold && (
              <button
                onClick={() => setShowTransitionDialog(true)}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 bg-[#4F5FD9] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#3d4cc0] transition-colors disabled:opacity-50"
              >
                {nextActionLabel}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {/* Release from Hold */}
            {isOnHold && (
              <button
                onClick={handleRelease}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                Mở lại
              </button>
            )}

            {/* Edit button */}
            {canEdit && (
              <Link
                href={`/orders/${order.id}/edit`}
                className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <Pencil className="w-4 h-4" />
                Sửa
              </Link>
            )}

            {/* More actions dropdown */}
            {!isFinalStatus && (
              <div className="relative">
                <button
                  onClick={() => setShowActionsMenu(!showActionsMenu)}
                  className="inline-flex items-center gap-1 border border-gray-300 text-gray-700 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {showActionsMenu && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowActionsMenu(false)} />
                    <div className="absolute right-0 mt-1 z-40 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-48">
                      {/* Clone */}
                      <button
                        onClick={() => { setShowActionsMenu(false); handleClone(); }}
                        disabled={actionLoading}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <Copy className="w-4 h-4" />
                        Nhân bản đơn
                      </button>
                      {/* Hold */}
                      {canHold && !isOnHold && (
                        <button
                          onClick={() => { setShowActionsMenu(false); setShowHoldDialog(true); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-orange-600 hover:bg-orange-50"
                        >
                          <Pause className="w-4 h-4" />
                          Tạm giữ
                        </button>
                      )}
                      {/* Cancel */}
                      {canCancel && (
                        <button
                          onClick={() => { setShowActionsMenu(false); setShowCancelDialog(true); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4" />
                          Hủy đơn
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Clone for final statuses too */}
            {isFinalStatus && (
              <button
                onClick={handleClone}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <Copy className="w-4 h-4" />
                Nhân bản
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <div className="flex gap-6">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-[#4F5FD9] text-[#4F5FD9] font-medium"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "Tổng quan" && <OverviewTab order={order} sourceQuote={sourceQuote} />}
      {activeTab === "Hàng hóa" && (
        <GoodsTab items={items} loading={itemsLoading} />
      )}
      {activeTab === "Tài chính" && (
        <FinanceTab
          vouchers={vouchers}
          arRecords={arRecords}
          loading={financeLoading}
        />
      )}
      {activeTab === "Logistics" && (
        <LogisticsTab
          cnReceipts={cnReceipts}
          vnReceipts={vnReceipts}
          deliveries={deliveries}
          loading={logisticsLoading}
        />
      )}
      {activeTab === "Lịch sử" && (
        <HistoryTab entries={history} loading={historyLoading} />
      )}

      {/* Action Dialogs */}
      <ConfirmTransitionDialog
        open={showTransitionDialog}
        onClose={() => setShowTransitionDialog(false)}
        onConfirm={handleTransition}
        loading={actionLoading}
        fromStatus={currentStatus}
        toStatus={nextStatus ?? ""}
      />
      <CancelOrderDialog
        open={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleCancel}
        loading={actionLoading}
      />
      <HoldOrderDialog
        open={showHoldDialog}
        onClose={() => setShowHoldDialog(false)}
        onConfirm={handleHold}
        loading={actionLoading}
      />
    </div>
  );
}
