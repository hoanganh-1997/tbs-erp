"use client";

import { useState } from "react";
import { Search, Package, MapPin, Truck, Phone } from "lucide-react";
import { toast } from "sonner";
import { cn, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import { TrackingTimeline, type TimelineStep } from "@/components/tracking-timeline";
import { ETADisplay } from "@/components/eta-display";
import { getOrders, type Order } from "@/lib/orders";
import { getWarehouseCnReceipts, type WarehouseCnReceipt } from "@/lib/warehouse-cn-receipts";
import { getContainers, type Container } from "@/lib/containers";
import { getContainerItems, type ContainerItem } from "@/lib/container-items";
import { getWarehouseVnReceipts, type WarehouseVnReceipt } from "@/lib/warehouse-vn-receipts";
import { getDeliveryOrders, type DeliveryOrder } from "@/lib/delivery-orders";
import { getCustomers, type Customer } from "@/lib/customers";

const SEARCH_MODES = ["Theo kiện hàng", "Theo container", "Theo SĐT"];

interface PackageResult {
  order: Order | null;
  cnReceipt: WarehouseCnReceipt | null;
  container: Container | null;
  vnReceipt: WarehouseVnReceipt | null;
  delivery: DeliveryOrder | null;
  timeline: TimelineStep[];
}

interface ContainerResult {
  container: Container;
  items: (ContainerItem & { orderCode?: string })[];
}

interface PhoneResult {
  customer: Customer;
  orders: (Order & {
    cnReceipt?: WarehouseCnReceipt | null;
    container?: Container | null;
    vnReceipt?: WarehouseVnReceipt | null;
    delivery?: DeliveryOrder | null;
    timeline: TimelineStep[];
  })[];
}

function buildTimeline(
  order: Order | null,
  cnReceipt: WarehouseCnReceipt | null,
  container: Container | null,
  vnReceipt: WarehouseVnReceipt | null,
  delivery: DeliveryOrder | null
): TimelineStep[] {
  return [
    { label: "Đã tạo đơn", date: order?.createdAt || null, reached: !!order },
    { label: "Hàng về kho TQ", date: cnReceipt?.createdAt || null, reached: !!cnReceipt },
    { label: "Đóng container", date: container?.ETD || null, reached: !!container },
    {
      label: "Đang vận chuyển",
      date: container?.ActualDeparture || null,
      reached: !!container && ["Đang vận chuyển", "Tại biên giới", "Hải quan", "Đã thông quan", "Đã về kho", "Đang dỡ", "Hoàn tất"].includes(container.Status || ""),
    },
    {
      label: "Thông quan",
      date: null,
      reached: !!container && ["Đã thông quan", "Đã về kho", "Đang dỡ", "Hoàn tất"].includes(container.Status || ""),
    },
    { label: "Về kho VN", date: vnReceipt?.createdAt || null, reached: !!vnReceipt },
    {
      label: "Đang giao",
      date: delivery?.createdAt || null,
      reached: !!delivery && ["Đang giao", "Đã giao"].includes(delivery.Status || ""),
    },
    {
      label: "Đã giao",
      date: order?.ActualDelivery || null,
      reached: delivery?.Status === "Đã giao" || order?.Status === "Đã giao" || order?.Status === "Hoàn thành",
    },
  ];
}

function PackageResultView({ result }: { result: PackageResult }) {
  const reachedCount = result.timeline.filter((s) => s.reached).length;
  const progress = Math.round((reachedCount / result.timeline.length) * 100);
  const isDelivered = result.order?.Status === "Đã giao" || result.order?.Status === "Hoàn thành";

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-[#2D3A8C]">Tiến trình: {reachedCount}/{result.timeline.length} bước</span>
          <span className="text-sm font-bold text-[#4F5FD9]">{progress}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-[#4F5FD9] rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-3">
          <ETADisplay
            eta={result.container?.ETA}
            isDelivered={isDelivered}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order info */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm lg:col-span-1">
          <h3 className="text-sm font-semibold text-[#2D3A8C] mb-4">Thông tin đơn hàng</h3>
          {result.order ? (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Mã đơn</span>
                <a href={`/orders/${result.order.id}`} className="text-[#4F5FD9] hover:underline font-medium">{result.order.OrderCode}</a>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Khách hàng</span>
                <span className="text-gray-900">{result.order.CustomerName || "---"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Trạng thái</span>
                <StatusBadge status={result.order.Status} />
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Dịch vụ</span>
                <div className="flex gap-1">
                  {result.order.ServiceTypes?.map((st) => (
                    <span key={st} className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs font-medium">{st}</span>
                  ))}
                </div>
              </div>
              {result.cnReceipt && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tracking CN</span>
                    <span className="text-gray-900 font-mono text-xs">{result.cnReceipt.TrackingCN}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Cân nặng</span>
                    <span>{result.cnReceipt.WeightKg ? `${result.cnReceipt.WeightKg} kg` : "---"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">CBM</span>
                    <span>{result.cnReceipt.CBM ?? "---"}</span>
                  </div>
                </>
              )}
              {result.container && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Container</span>
                  <span className="font-mono text-xs">{result.container.ContainerCode}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Không tìm thấy đơn hàng</p>
          )}
        </div>

        {/* Timeline */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-semibold text-[#2D3A8C] mb-4">Lộ trình vận chuyển</h3>
          <TrackingTimeline steps={result.timeline} />
        </div>
      </div>
    </div>
  );
}

function ContainerResultView({ result }: { result: ContainerResult }) {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#2D3A8C]">{result.container.ContainerCode}</h3>
            <div className="flex items-center gap-3 mt-2">
              <span className="px-2 py-0.5 rounded bg-gray-100 text-xs font-medium text-gray-700">{result.container.ContainerType}</span>
              <span className="text-sm text-gray-500">{result.container.Route}</span>
              <StatusBadge status={result.container.Status} />
            </div>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p>ETD: {formatDate(result.container.ETD)}</p>
            <p>ETA: {formatDate(result.container.ETA)}</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
          <div><p className="text-xs text-gray-500">Nhà vận chuyển</p><p className="text-sm font-medium mt-0.5">{result.container.CarrierName || "---"}</p></div>
          <div><p className="text-xs text-gray-500">Kho đích</p><p className="text-sm font-medium mt-0.5">{result.container.DestinationWarehouse || "---"}</p></div>
          <div><p className="text-xs text-gray-500">Tổng kiện</p><p className="text-sm font-medium mt-0.5">{result.container.TotalPackages ?? 0}</p></div>
          <div><p className="text-xs text-gray-500">Tỷ lệ lấp</p><p className="text-sm font-medium mt-0.5">{result.container.FillRate ?? 0}%</p></div>
        </div>
        <div className="mt-4">
          <ETADisplay eta={result.container.ETA} isDelivered={result.container.Status === "Hoàn tất"} />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Kiện hàng ({result.items.length})</h3>
        </div>
        {result.items.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">Không có kiện hàng</div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50">
              {["Mã đơn", "Kiện", "Cân nặng", "CBM", "Ngày load"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {result.items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3"><a href={`/orders/${item.OrderId}`} className="text-[#4F5FD9] hover:underline font-medium">{item.OrderCode || item.orderCode || "---"}</a></td>
                  <td className="px-4 py-3 text-gray-700">{item.Packages ?? 0}</td>
                  <td className="px-4 py-3 text-gray-700">{item.WeightKg ? `${item.WeightKg} kg` : "---"}</td>
                  <td className="px-4 py-3 text-gray-700">{item.CBM ?? "---"}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(item.LoadedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function PhoneResultView({ result }: { result: PhoneResult }) {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-[#2D3A8C] mb-2">Khách hàng</h3>
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold text-gray-900">{result.customer.CompanyName || result.customer.ContactName}</span>
          <span className="text-sm text-gray-500">{result.customer.Phone}</span>
          <StatusBadge status={result.customer.Tier} />
        </div>
        <p className="text-sm text-gray-500 mt-1">{result.orders.length} đơn hàng</p>
      </div>

      {result.orders.map((order) => {
        const reachedCount = order.timeline.filter((s) => s.reached).length;
        const progress = Math.round((reachedCount / order.timeline.length) * 100);
        return (
          <div key={order.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <a href={`/orders/${order.id}`} className="text-base font-bold text-[#4F5FD9] hover:underline">{order.OrderCode}</a>
                <StatusBadge status={order.Status} />
                <div className="flex gap-1">
                  {order.ServiceTypes?.map((st) => (
                    <span key={st} className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs font-medium">{st}</span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[#4F5FD9]">{progress}%</span>
                <ETADisplay
                  eta={order.container?.ETA}
                  isDelivered={order.Status === "Đã giao" || order.Status === "Hoàn thành"}
                  className="text-xs"
                />
              </div>
            </div>
            <TrackingTimeline steps={order.timeline} orientation="horizontal" />
          </div>
        );
      })}
    </div>
  );
}

export default function TrackingPage() {
  const [searchMode, setSearchMode] = useState("Theo kiện hàng");
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [packageResult, setPackageResult] = useState<PackageResult | null>(null);
  const [containerResult, setContainerResult] = useState<ContainerResult | null>(null);
  const [phoneResult, setPhoneResult] = useState<PhoneResult | null>(null);
  const [searched, setSearched] = useState(false);

  const clearResults = () => {
    setPackageResult(null);
    setContainerResult(null);
    setPhoneResult(null);
  };

  const searchPackage = async () => {
    setSearching(true);
    setSearched(true);
    clearResults();
    try {
      const [ordersRes, cnRes, containersRes, itemsRes, vnRes, deliveryRes] = await Promise.all([
        getOrders({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
        getWarehouseCnReceipts({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
        getContainers({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
        getContainerItems({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
        getWarehouseVnReceipts({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
        getDeliveryOrders({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
      ]);

      const q = query.trim().toLowerCase();
      let order = ordersRes.data.find((o) => o.OrderCode?.toLowerCase() === q);
      let cnReceipt = cnRes.data.find((r) => r.TrackingCN?.toLowerCase() === q || r.OrderCode?.toLowerCase() === q);
      if (!order && cnReceipt?.OrderId) order = ordersRes.data.find((o) => o.id === cnReceipt!.OrderId);
      if (order && !cnReceipt) cnReceipt = cnRes.data.find((r) => r.OrderId === order!.id) || null;

      const containerItem = itemsRes.data.find((ci) => ci.OrderId === order?.id);
      const container = containerItem ? containersRes.data.find((c) => c.id === containerItem.ContainerId) || null : null;
      const vnReceipt = vnRes.data.find((r) => r.OrderId === order?.id) || null;
      const delivery = deliveryRes.data.find((d) => d.OrderId === order?.id) || null;

      if (!order && !cnReceipt) {
        toast.error("Không tìm thấy kiện hàng");
      } else {
        const timeline = buildTimeline(order || null, cnReceipt || null, container, vnReceipt, delivery);
        setPackageResult({ order: order || null, cnReceipt: cnReceipt || null, container, vnReceipt, delivery, timeline });
      }
    } catch {
      toast.error("Lỗi tra cứu");
    } finally {
      setSearching(false);
    }
  };

  const searchContainer = async () => {
    setSearching(true);
    setSearched(true);
    clearResults();
    try {
      const [containersRes, itemsRes] = await Promise.all([
        getContainers({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
        getContainerItems({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
      ]);
      const q = query.trim().toLowerCase();
      const container = containersRes.data.find((c) => c.ContainerCode?.toLowerCase() === q);
      if (!container) {
        toast.error("Không tìm thấy container");
      } else {
        const items = itemsRes.data.filter((ci) => ci.ContainerId === container.id);
        setContainerResult({ container, items });
      }
    } catch {
      toast.error("Lỗi tra cứu");
    } finally {
      setSearching(false);
    }
  };

  const searchPhone = async () => {
    setSearching(true);
    setSearched(true);
    clearResults();
    try {
      const [customersRes, ordersRes, cnRes, containersRes, itemsRes, vnRes, deliveryRes] = await Promise.all([
        getCustomers({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
        getOrders({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
        getWarehouseCnReceipts({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
        getContainers({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
        getContainerItems({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
        getWarehouseVnReceipts({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
        getDeliveryOrders({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
      ]);

      const q = query.trim();
      const customer = customersRes.data.find((c) => c.Phone?.includes(q));
      if (!customer) {
        toast.error("Không tìm thấy khách hàng");
        return;
      }

      const customerOrders = ordersRes.data.filter((o) => o.CustomerId === customer.id);
      if (customerOrders.length === 0) {
        toast.error("Khách hàng không có đơn hàng");
        return;
      }

      const enriched = customerOrders.map((order) => {
        const cnReceipt = cnRes.data.find((r) => r.OrderId === order.id) || null;
        const ci = itemsRes.data.find((c) => c.OrderId === order.id);
        const container = ci ? containersRes.data.find((c) => c.id === ci.ContainerId) || null : null;
        const vnReceipt = vnRes.data.find((r) => r.OrderId === order.id) || null;
        const delivery = deliveryRes.data.find((d) => d.OrderId === order.id) || null;
        const timeline = buildTimeline(order, cnReceipt, container, vnReceipt, delivery);
        return { ...order, cnReceipt, container, vnReceipt, delivery, timeline };
      });

      setPhoneResult({ customer, orders: enriched });
    } catch {
      toast.error("Lỗi tra cứu");
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = () => {
    if (!query.trim()) {
      toast.error("Vui lòng nhập mã tra cứu");
      return;
    }
    if (searchMode === "Theo kiện hàng") searchPackage();
    else if (searchMode === "Theo container") searchContainer();
    else searchPhone();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Theo dõi"
        description="Tra cứu tình trạng kiện hàng, container & khách hàng"
        secondaryActionLabel="Lịch sử sự kiện"
        onSecondaryAction={() => window.location.href = "/tracking/events"}
      />

      {/* Mode tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {SEARCH_MODES.map((mode) => (
          <button
            key={mode}
            onClick={() => { setSearchMode(mode); clearResults(); setSearched(false); }}
            className={cn(
              "px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
              searchMode === mode ? "border-[#4F5FD9] text-[#4F5FD9]" : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Search input */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex gap-3">
          <div className="relative flex-1">
            {searchMode === "Theo SĐT" ? (
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            ) : (
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            )}
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder={
                searchMode === "Theo kiện hàng"
                  ? "Nhập mã vận đơn (Tracking CN) hoặc mã đơn hàng"
                  : searchMode === "Theo container"
                    ? "Nhập mã container"
                    : "Nhập số điện thoại khách hàng"
              }
              className="w-full h-12 text-lg pl-12 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]"
            />
          </div>
          <button onClick={handleSearch} disabled={searching} className="h-12 px-6 bg-[#4F5FD9] hover:bg-[#3B4CC0] text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {searching ? "Đang tìm..." : "Tra cứu"}
          </button>
        </div>
      </div>

      {/* Loading */}
      {searching && (
        <div className="space-y-4">
          <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      )}

      {/* Results */}
      {!searching && packageResult && <PackageResultView result={packageResult} />}
      {!searching && containerResult && <ContainerResultView result={containerResult} />}
      {!searching && phoneResult && <PhoneResultView result={phoneResult} />}

      {/* Empty states */}
      {!searching && searched && !packageResult && !containerResult && !phoneResult && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Package className="w-12 h-12 mb-3" />
          <p className="text-sm">Không tìm thấy kết quả</p>
        </div>
      )}

      {!searched && !searching && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-300">
          <MapPin className="w-16 h-16 mb-4" />
          <p className="text-sm text-gray-400">Nhập mã để tra cứu tình trạng vận chuyển</p>
        </div>
      )}
    </div>
  );
}
