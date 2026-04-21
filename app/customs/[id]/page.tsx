"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Shield,
  Package,
  FileText,
  Receipt,
  Clock,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { KpiCard } from "@/components/kpi-card";
import { CustomsStatusFlow } from "@/components/customs-status-flow";
import { DocumentChecklist } from "@/components/document-checklist";
import { TaxBreakdown } from "@/components/tax-breakdown";
import { InspectionChannelBadge } from "@/components/inspection-channel-badge";
import {
  getCustomsDeclaration,
  updateCustomsDeclaration,
  type CustomsDeclaration,
} from "@/lib/customs-declarations";
import {
  getCustomsDeclarationItems,
  type CustomsDeclarationItem,
} from "@/lib/customs-declaration-items";
import { getTrackingEvents, createTrackingEvent, type TrackingEvent } from "@/lib/tracking-events";
import { updateContainer } from "@/lib/containers";
import { getContainerItems } from "@/lib/container-items";
import { updateOrder } from "@/lib/orders";

const STATUS_FLOW: Record<string, string> = {
  "Chuẩn bị hồ sơ": "Đã nộp tờ khai",
  "Đã nộp tờ khai": "Chờ kiểm hóa",
  "Chờ kiểm hóa": "Đang kiểm hóa",
  "Đang kiểm hóa": "Chờ nộp thuế",
  "Chờ nộp thuế": "Đã nộp thuế",
  "Đã nộp thuế": "Đã thông quan",
};

const STATUS_ACTION_LABELS: Record<string, string> = {
  "Chuẩn bị hồ sơ": "Nộp tờ khai",
  "Đã nộp tờ khai": "Chờ kiểm hóa",
  "Chờ kiểm hóa": "Bắt đầu kiểm",
  "Đang kiểm hóa": "Chờ nộp thuế",
  "Chờ nộp thuế": "Xác nhận nộp thuế",
  "Đã nộp thuế": "Hoàn thành thông quan",
};

const TABS = ["Tổng quan", "Hàng hóa", "Thuế & Phí", "Lịch sử"];

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-xs text-gray-500 uppercase tracking-wide min-w-[130px] pt-0.5">{label}</span>
      <span className="text-sm text-gray-900 font-medium">{value || "---"}</span>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-64 bg-gray-100 rounded animate-pulse" />
      <div className="h-16 bg-gray-100 rounded-xl animate-pulse" />
      <div className="grid grid-cols-2 gap-6">
        <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}

export default function CustomsDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [decl, setDecl] = useState<CustomsDeclaration | null>(null);
  const [items, setItems] = useState<CustomsDeclarationItem[]>([]);
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState("Tổng quan");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [declData, itemsRes, eventsRes] = await Promise.all([
        getCustomsDeclaration(id),
        getCustomsDeclarationItems({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
        getTrackingEvents({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
      ]);
      setDecl(declData);
      setItems(itemsRes.data.filter((i) => i.DeclarationId === id));
      // Filter events for this container
      setEvents(
        eventsRes.data.filter(
          (e) =>
            e.ContainerId === declData.ContainerId &&
            ["Đã nộp tờ khai", "Đang kiểm hóa", "Đã thông quan", "Sự cố", "Ghi chú"].includes(e.EventType || "")
        )
      );
    } catch {
      toast.error("Lỗi tải dữ liệu tờ khai");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdvanceStatus = async () => {
    if (!decl?.Status) return;
    const nextStatus = STATUS_FLOW[decl.Status];
    if (!nextStatus) return;

    if (decl.Status === "Chuẩn bị hồ sơ" && decl.DocumentStatus === "Thiếu chứng từ") {
      toast.error("Chưa đủ chứng từ bắt buộc");
      return;
    }

    setUpdating(true);
    try {
      const updates: Record<string, any> = { Status: nextStatus };

      if (nextStatus === "Đã thông quan") {
        updates.ClearanceDate = new Date().toISOString();

        // Cascade: update container status
        if (decl.ContainerId) {
          await updateContainer(decl.ContainerId, { Status: "Đã thông quan" });
        }

        // Cascade: update all orders in container
        if (decl.ContainerId) {
          const { data: cItems } = await getContainerItems({ take: 200, sortField: "createdAt", sortDirection: "desc" });
          const orderIds = cItems
            .filter((ci) => ci.ContainerId === decl.ContainerId && ci.OrderId)
            .map((ci) => ci.OrderId!);

          for (const orderId of orderIds) {
            await updateOrder(orderId, { Status: "Tại kho VN" });
          }

          // Create tracking events
          for (const ci of cItems.filter((c) => c.ContainerId === decl.ContainerId)) {
            await createTrackingEvent({
              OrderId: ci.OrderId,
              OrderCode: ci.OrderCode,
              ContainerId: decl.ContainerId,
              ContainerCode: decl.ContainerCode,
              EventType: "Đã thông quan",
              Description: `Tờ khai ${decl.DeclarationCode} đã thông quan tại ${decl.CustomsOffice}`,
              Location: decl.CustomsOffice,
              Actor: decl.XNKStaff,
            });
          }
        }
      }

      // Log tracking event for status change
      if (nextStatus !== "Đã thông quan") {
        await createTrackingEvent({
          ContainerId: decl.ContainerId,
          ContainerCode: decl.ContainerCode,
          EventType: nextStatus === "Đã nộp tờ khai" ? "Đã nộp tờ khai" : "Ghi chú",
          Description: `Tờ khai ${decl.DeclarationCode}: ${decl.Status} → ${nextStatus}`,
          Location: decl.CustomsOffice,
          Actor: decl.XNKStaff,
        });
      }

      await updateCustomsDeclaration(id, updates);
      toast.success(`Cập nhật: ${nextStatus}`);
      fetchData();
    } catch {
      toast.error("Lỗi cập nhật trạng thái");
    } finally {
      setUpdating(false);
    }
  };

  const handleDocUpdate = async (field: string, value: boolean) => {
    if (!decl) return;
    try {
      const fieldMap: Record<string, string> = {
        hasCO: "HasCO",
        hasInvoice: "HasInvoice",
        hasPackingList: "HasPackingList",
        hasBillOfLading: "HasBillOfLading",
        hasInsurance: "HasInsurance",
      };
      const updates: Record<string, any> = { [fieldMap[field]]: value };

      // Recalculate doc status
      const newValues = {
        HasCO: field === "hasCO" ? value : decl.HasCO,
        HasInvoice: field === "hasInvoice" ? value : decl.HasInvoice,
        HasPackingList: field === "hasPackingList" ? value : decl.HasPackingList,
        HasBillOfLading: field === "hasBillOfLading" ? value : decl.HasBillOfLading,
      };
      const complete = newValues.HasCO && newValues.HasInvoice && newValues.HasPackingList && newValues.HasBillOfLading;
      updates.DocumentStatus = complete ? "Đủ chứng từ" : "Thiếu chứng từ";

      await updateCustomsDeclaration(id, updates);
      fetchData();
    } catch {
      toast.error("Lỗi cập nhật chứng từ");
    }
  };

  const handleHoldGoods = async () => {
    if (!decl) return;
    setUpdating(true);
    try {
      await updateCustomsDeclaration(id, { Status: "Bị giữ hàng" });
      toast.success("Đã đánh dấu bị giữ hàng");
      fetchData();
    } catch {
      toast.error("Lỗi cập nhật");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <button onClick={() => router.push("/customs")} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"><ArrowLeft className="w-4 h-4" />Quay lại</button>
        <DetailSkeleton />
      </div>
    );
  }

  if (!decl) {
    return (
      <div className="space-y-6">
        <button onClick={() => router.push("/customs")} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"><ArrowLeft className="w-4 h-4" />Quay lại</button>
        <div className="text-center py-16 text-gray-500">Không tìm thấy tờ khai</div>
      </div>
    );
  }

  const nextStatus = STATUS_FLOW[decl.Status || ""];
  const actionLabel = STATUS_ACTION_LABELS[decl.Status || ""];
  const isCleared = decl.Status === "Đã thông quan";
  const isHeld = decl.Status === "Bị giữ hàng";

  return (
    <div className="space-y-6">
      <button onClick={() => router.push("/customs")} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
        <ArrowLeft className="w-4 h-4" />Quay lại
      </button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-[#2D3A8C]">{decl.DeclarationCode}</h1>
            <StatusBadge status={decl.Status} />
            <InspectionChannelBadge channel={decl.InspectionType} />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Container: <a href={`/containers/${decl.ContainerId}`} className="text-[#4F5FD9] hover:underline">{decl.ContainerCode}</a>
            {" — "}Cửa khẩu: {decl.CustomsOffice}
            {" — "}Tạo lúc {formatDate(decl.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isCleared && !isHeld && (
            <button
              onClick={handleHoldGoods}
              disabled={updating}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <AlertTriangle className="w-4 h-4" />
              Giữ hàng
            </button>
          )}
          {nextStatus && actionLabel && (
            <button
              onClick={handleAdvanceStatus}
              disabled={updating}
              className="inline-flex items-center gap-2 bg-[#4F5FD9] hover:bg-[#3B4CC0] text-white rounded-lg px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
              {actionLabel}
            </button>
          )}
        </div>
      </div>

      {/* Status flow */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <CustomsStatusFlow currentStatus={decl.Status || "Chuẩn bị hồ sơ"} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Số đơn hàng" value={decl.TotalOrdersCount ?? 0} icon={Package} borderColor="border-l-blue-500" />
        <KpiCard title="Tổng CBM" value={decl.TotalCBM?.toFixed(2) || "0"} icon={Package} borderColor="border-l-indigo-500" />
        <KpiCard title="Tổng thuế" value={formatCurrency(decl.TotalTaxVND)} icon={Receipt} borderColor="border-l-green-500" />
        <KpiCard title="Chứng từ" value={decl.DocumentStatus || "---"} icon={FileText} borderColor={decl.DocumentStatus === "Đủ chứng từ" ? "border-l-green-500" : "border-l-orange-500"} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
              activeTab === tab ? "border-[#4F5FD9] text-[#4F5FD9]" : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab: Tổng quan */}
      {activeTab === "Tổng quan" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-semibold text-[#2D3A8C] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#4F5FD9]" />Thông tin khai báo
            </h3>
            <InfoRow label="Mã tờ khai" value={decl.DeclarationCode} />
            <InfoRow label="Số TK HQ" value={decl.DeclarationNumber || "Chưa có"} />
            <InfoRow label="Loại" value={decl.DeclarationType} />
            <InfoRow label="Cửa khẩu" value={decl.CustomsOffice} />
            <InfoRow label="Kênh kiểm hóa" value={<InspectionChannelBadge channel={decl.InspectionType} />} />
            <InfoRow label="NV XNK" value={decl.XNKStaff} />
            <InfoRow label="Đại lý TQ" value={decl.BrokerName} />
            <InfoRow label="Ngày đăng ký" value={formatDate(decl.RegisterDate)} />
            <InfoRow label="Ngày thông quan" value={formatDate(decl.ClearanceDate)} />
            {decl.Notes && <InfoRow label="Ghi chú" value={decl.Notes} />}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-[#2D3A8C] mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#4F5FD9]" />Chứng từ
            </h3>
            <DocumentChecklist
              hasCO={decl.HasCO || false}
              hasInvoice={decl.HasInvoice || false}
              hasPackingList={decl.HasPackingList || false}
              hasBillOfLading={decl.HasBillOfLading || false}
              hasInsurance={decl.HasInsurance || false}
              editable={!isCleared && !isHeld}
              onChange={handleDocUpdate}
            />
          </div>
        </div>
      )}

      {/* Tab: Hàng hóa */}
      {activeTab === "Hàng hóa" && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Hàng hóa trong tờ khai ({items.length} đơn)</h3>
          </div>
          {items.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">Không có dữ liệu</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    {["Mã đơn", "Khách hàng", "Mô tả", "HS Code", "SL", "Kg", "CBM", "Giá CNY", "Thuế NK", "VAT"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <a href={`/orders/${item.OrderId}`} className="text-[#4F5FD9] hover:underline font-medium">{item.OrderCode}</a>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{item.CustomerName || "---"}</td>
                      <td className="px-4 py-3 text-gray-700">{item.ProductDescription || "---"}</td>
                      <td className="px-4 py-3 font-mono text-gray-700">{item.HSCode || "---"}</td>
                      <td className="px-4 py-3 text-gray-700 text-center">{item.Quantity ?? 0}</td>
                      <td className="px-4 py-3 text-gray-700">{item.WeightKg ?? 0}</td>
                      <td className="px-4 py-3 text-gray-700">{item.CBM ?? 0}</td>
                      <td className="px-4 py-3 text-gray-700">{formatCurrency(item.ValueCNY, "CNY")}</td>
                      <td className="px-4 py-3 text-gray-700">{formatCurrency(item.ImportTaxVND)}</td>
                      <td className="px-4 py-3 text-gray-700">{formatCurrency(item.VATAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Thuế & Phí */}
      {activeTab === "Thuế & Phí" && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm max-w-lg">
          <h3 className="text-sm font-semibold text-[#2D3A8C] mb-4 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#4F5FD9]" />Bảng thuế & phí
          </h3>
          <TaxBreakdown
            importTaxVND={decl.ImportTaxVND || 0}
            vatAmount={decl.VATAmount || 0}
            specialTaxVND={decl.SpecialTaxVND || 0}
            customsFeesVND={decl.CustomsFeesVND || 0}
            totalTaxVND={decl.TotalTaxVND || 0}
            totalValueCNY={decl.TotalValueCNY}
          />
        </div>
      )}

      {/* Tab: Lịch sử */}
      {activeTab === "Lịch sử" && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#4F5FD9]" />Lịch sử sự kiện
            </h3>
          </div>
          {events.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">Chưa có sự kiện</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {events.map((e) => (
                <div key={e.id} className="px-5 py-4 flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-[#4F5FD9] mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={e.EventType} />
                      <span className="text-xs text-gray-500">{formatDate(e.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{e.Description}</p>
                    {e.Location && <p className="text-xs text-gray-500 mt-0.5">Vị trí: {e.Location}</p>}
                    {e.Actor && <p className="text-xs text-gray-500">Người thực hiện: {e.Actor}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
