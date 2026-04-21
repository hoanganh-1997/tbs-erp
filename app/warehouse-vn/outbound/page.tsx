"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Package, Truck, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { cn, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import {
  getWarehouseVnReceipts,
  updateWarehouseVnReceipt,
  type WarehouseVnReceipt,
} from "@/lib/warehouse-vn-receipts";
import { getDeliveryOrders, type DeliveryOrder } from "@/lib/delivery-orders";

const OUTBOUND_STATUSES = ["Đang pick", "Đã đóng gói", "Chờ giao"];

export default function WarehouseVnOutboundPage() {
  const [receipts, setReceipts] = useState<WarehouseVnReceipt[]>([]);
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Tất cả");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rcpRes, doRes] = await Promise.all([
        getWarehouseVnReceipts({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
        getDeliveryOrders({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
      ]);
      setReceipts(rcpRes.data.filter((r) => OUTBOUND_STATUSES.includes(r.Status || "")));
      setDeliveryOrders(doRes.data);
    } catch {
      toast.error("Lỗi tải dữ liệu xuất kho");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const picking = receipts.filter((r) => r.Status === "Đang pick").length;
  const packed = receipts.filter((r) => r.Status === "Đã đóng gói").length;
  const ready = receipts.filter((r) => r.Status === "Chờ giao").length;

  const filtered = activeTab === "Tất cả"
    ? receipts
    : receipts.filter((r) => r.Status === activeTab);

  // Group by delivery order
  const grouped = new Map<string, { delivery: DeliveryOrder | null; receipts: WarehouseVnReceipt[] }>();
  for (const r of filtered) {
    const key = r.DeliveryOrderId || "__unassigned__";
    if (!grouped.has(key)) {
      const delivery = deliveryOrders.find((d) => d.id === key) || null;
      grouped.set(key, { delivery, receipts: [] });
    }
    grouped.get(key)!.receipts.push(r);
  }

  const handleAdvanceStatus = async (receipt: WarehouseVnReceipt) => {
    const flow: Record<string, string> = {
      "Đang pick": "Đã đóng gói",
      "Đã đóng gói": "Chờ giao",
    };
    const next = flow[receipt.Status || ""];
    if (!next) return;

    try {
      await updateWarehouseVnReceipt(receipt.id, { Status: next });
      toast.success(`${receipt.ReceiptCode} → ${next}`);
      fetchData();
    } catch {
      toast.error("Lỗi cập nhật");
    }
  };

  const tabs = ["Tất cả", ...OUTBOUND_STATUSES];

  return (
    <div className="space-y-6">
      <a href="/warehouse-vn" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
        <ArrowLeft className="w-4 h-4" />Quay lại kho VN
      </a>

      <PageHeader title="Xuất kho" description="Quản lý pick — đóng gói — chờ giao" />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard title="Đang pick" value={picking} icon={Package} borderColor="border-l-blue-500" />
        <KpiCard title="Đã đóng gói" value={packed} icon={CheckCircle} borderColor="border-l-indigo-500" />
        <KpiCard title="Chờ giao" value={ready} icon={Truck} borderColor="border-l-green-500" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => {
          const count = tab === "Tất cả" ? receipts.length : receipts.filter((r) => r.Status === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                activeTab === tab ? "border-[#4F5FD9] text-[#4F5FD9]" : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              {tab} <span className="text-xs text-gray-400 ml-1">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Package className="w-12 h-12 mb-3" />
          <p className="text-sm">Không có kiện hàng nào đang xuất kho</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([key, group]) => (
            <div key={key} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              {/* Group header */}
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Truck className="w-5 h-5 text-[#4F5FD9]" />
                  {group.delivery ? (
                    <div>
                      <a href={`/delivery-orders/${group.delivery.id}`} className="text-sm font-semibold text-[#4F5FD9] hover:underline">
                        {group.delivery.DeliveryCode}
                      </a>
                      <span className="text-xs text-gray-500 ml-2">
                        {group.delivery.ReceiverName} — {group.delivery.DeliveryAddress}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm font-medium text-gray-500">Chưa gán lệnh giao</span>
                  )}
                </div>
                <span className="text-xs text-gray-500 font-medium">{group.receipts.length} kiện</span>
              </div>

              {/* Items */}
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/50">
                    {["Mã phiếu", "Mã đơn", "Khu/Kệ", "Kiện", "Kg", "Trạng thái", "Thao tác"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {group.receipts.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <a href={`/warehouse-vn/${r.id}`} className="text-[#4F5FD9] hover:underline font-medium">{r.ReceiptCode}</a>
                      </td>
                      <td className="px-4 py-3">
                        {r.OrderId ? <a href={`/orders/${r.OrderId}`} className="text-[#4F5FD9] hover:underline">{r.OrderCode}</a> : "---"}
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-700">
                        {r.ShelfZone}{r.ShelfRow ? `-${r.ShelfRow}` : ""} {!r.ShelfZone && (r.Location || "---")}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{r.PackagesReceived ?? 0}</td>
                      <td className="px-4 py-3 text-gray-700">{r.WeightKg ? `${r.WeightKg}` : "---"}</td>
                      <td className="px-4 py-3"><StatusBadge status={r.Status} /></td>
                      <td className="px-4 py-3">
                        {r.Status !== "Chờ giao" && (
                          <button
                            onClick={() => handleAdvanceStatus(r)}
                            className="px-2.5 py-1 bg-[#4F5FD9] hover:bg-[#3B4CC0] text-white rounded-md text-xs font-medium"
                          >
                            {r.Status === "Đang pick" ? "Đóng gói" : "Chờ giao"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
