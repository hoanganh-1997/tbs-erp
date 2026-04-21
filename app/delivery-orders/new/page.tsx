"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Search,
  Truck,
  User,
  CalendarDays,
  Package,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import { cn, generateCode, formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { getOrders, type Order } from "@/lib/orders";
import { getDrivers, type Driver } from "@/lib/drivers";
import { getVehicles, type Vehicle } from "@/lib/vehicles";
import {
  createDeliveryOrder,
  type CreateDeliveryOrderInput,
} from "@/lib/delivery-orders";

const TIME_SLOTS = ["Sáng (8-12h)", "Chiều (13-17h)", "Cả ngày"] as const;

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

function OrderSearchResult({
  order,
  onSelect,
}: {
  order: Order;
  onSelect: (o: Order) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(order)}
      className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
    >
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-gray-900">{order.OrderCode}</span>
          <span className="text-xs text-gray-500 ml-2">{order.CustomerName}</span>
        </div>
        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
          {order.Status}
        </span>
      </div>
      {order.DeliveryAddress && (
        <p className="text-xs text-gray-500 mt-0.5 truncate">{order.DeliveryAddress}</p>
      )}
    </button>
  );
}

export default function DeliveryOrderNewPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Search / selection state
  const [orderSearch, setOrderSearch] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Form state
  const [customerName, setCustomerName] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [timeSlot, setTimeSlot] = useState<string>(TIME_SLOTS[0]);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [packages, setPackages] = useState<number | "">(1);
  const [codAmount, setCodAmount] = useState<number | "">(0);

  // Load data
  useEffect(() => {
    async function load() {
      try {
        const [ordersRes, driversRes, vehiclesRes] = await Promise.all([
          getOrders({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
          getDrivers({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
          getVehicles({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
        ]);

        // Only show orders at kho VN status
        const vnOrders = ordersRes.data.filter((o) => o.Status === "Tại kho VN");
        setOrders(vnOrders);

        // Only active drivers
        const activeDrivers = driversRes.data.filter((d) => d.Status === "Đang hoạt động");
        setDrivers(activeDrivers);

        // Only ready vehicles
        const readyVehicles = vehiclesRes.data.filter((v) => v.Status === "Sẵn sàng");
        setVehicles(readyVehicles);
      } catch {
        toast.error("Lỗi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Filter orders by search
  const filteredOrders = orders.filter((o) => {
    if (!orderSearch.trim()) return false;
    const q = orderSearch.toLowerCase();
    return (
      (o.OrderCode || "").toLowerCase().includes(q) ||
      (o.CustomerName || "").toLowerCase().includes(q)
    );
  });

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    setOrderSearch(order.OrderCode || "");
    setShowResults(false);
    // Auto-fill from order
    setCustomerName(order.CustomerName || "");
    setDeliveryAddress(order.DeliveryAddress || "");
    setReceiverName(order.ReceiverName || "");
    setReceiverPhone(order.ReceiverPhone || "");
  };

  // When driver is selected, auto-set vehicle if driver has an assigned one
  const handleDriverSelect = (driverId: string) => {
    setSelectedDriverId(driverId);
    const driver = drivers.find((d) => d.id === driverId);
    if (driver?.AssignedVehicleId) {
      const assignedVehicle = vehicles.find((v) => v.id === driver.AssignedVehicleId);
      if (assignedVehicle) {
        setSelectedVehicleId(assignedVehicle.id);
      }
    }
  };

  const selectedDriver = drivers.find((d) => d.id === selectedDriverId);
  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  const handleSave = async () => {
    if (!selectedOrder) {
      toast.error("Vui lòng chọn đơn hàng");
      return;
    }
    if (!scheduledDate) {
      toast.error("Vui lòng chọn ngày giao hàng");
      return;
    }
    if (!selectedDriverId) {
      toast.error("Vui lòng chọn tài xế");
      return;
    }

    setSaving(true);
    try {
      const input: CreateDeliveryOrderInput = {
        DeliveryCode: generateCode("GH"),
        OrderId: selectedOrder.id,
        OrderCode: selectedOrder.OrderCode,
        CustomerId: selectedOrder.CustomerId,
        CustomerName: customerName.trim() || undefined,
        DeliveryAddress: deliveryAddress.trim() || undefined,
        ReceiverName: receiverName.trim() || undefined,
        ReceiverPhone: receiverPhone.trim() || undefined,
        ScheduledDate: scheduledDate || undefined,
        TimeSlot: timeSlot,
        Driver: selectedDriver?.FullName || undefined,
        Vehicle: selectedVehicle?.LicensePlate || undefined,
        Packages: Number(packages) || 1,
        Status: "Chờ xếp lịch",
        CODAmount: Number(codAmount) || 0,
        CODCollected: 0,
        CODSubmitted: false,
      };

      await createDeliveryOrder(input);
      toast.success("Đã tạo lệnh giao hàng");
      router.push("/delivery-orders");
    } catch {
      toast.error("Lỗi khi tạo lệnh giao hàng");
    } finally {
      setSaving(false);
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
        <PageHeader title="Tạo lệnh giao hàng" description="Đang tải dữ liệu..." />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
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

      <PageHeader
        title="Tạo lệnh giao hàng"
        description="Tạo lệnh giao hàng cho đơn hàng tại kho VN"
      />

      {/* Step 1: Search & select order */}
      <SectionCard title="Chọn đơn hàng" icon={Search}>
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={orderSearch}
              onChange={(e) => {
                setOrderSearch(e.target.value);
                setShowResults(true);
                if (!e.target.value.trim()) {
                  setSelectedOrder(null);
                }
              }}
              onFocus={() => orderSearch.trim() && setShowResults(true)}
              placeholder="Tìm kiếm theo mã đơn hoặc tên khách hàng..."
              className="w-full h-12 pl-12 pr-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent"
            />
          </div>

          {/* Search results dropdown */}
          {showResults && filteredOrders.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredOrders.slice(0, 10).map((order) => (
                <OrderSearchResult
                  key={order.id}
                  order={order}
                  onSelect={handleSelectOrder}
                />
              ))}
            </div>
          )}

          {showResults && orderSearch.trim() && filteredOrders.length === 0 && !selectedOrder && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-sm text-gray-500 text-center">
              Không tìm thấy đơn hàng tại kho VN
            </div>
          )}
        </div>

        {selectedOrder && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-green-800">{selectedOrder.OrderCode}</span>
              <span className="text-green-600">-</span>
              <span className="text-green-700">{selectedOrder.CustomerName}</span>
            </div>
            {selectedOrder.DeliveryAddress && (
              <p className="text-xs text-green-600 mt-1">{selectedOrder.DeliveryAddress}</p>
            )}
          </div>
        )}

        {orders.length === 0 && (
          <p className="text-sm text-gray-500 mt-3">
            Không có đơn hàng nào ở trạng thái &quot;Tại kho VN&quot;
          </p>
        )}
      </SectionCard>

      {/* Step 2: Receiver info */}
      {selectedOrder && (
        <SectionCard title="Thông tin nhận hàng" icon={User}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Khách hàng</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Người nhận <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">SĐT người nhận</label>
              <input
                type="text"
                value={receiverPhone}
                onChange={(e) => setReceiverPhone(e.target.value)}
                className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Địa chỉ giao hàng <span className="text-red-500">*</span>
              </label>
              <textarea
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent resize-none"
              />
            </div>
          </div>
        </SectionCard>
      )}

      {/* Step 3: Schedule */}
      {selectedOrder && (
        <SectionCard title="Lịch giao hàng" icon={CalendarDays}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Ngày giao hàng <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Khung giờ</label>
              <div className="flex gap-2">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setTimeSlot(slot)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
                      timeSlot === slot
                        ? "bg-[#4F5FD9] text-white border-[#4F5FD9]"
                        : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                    )}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Step 4: Driver & Vehicle */}
      {selectedOrder && (
        <SectionCard title="Tài xế & Phương tiện" icon={Truck}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Tài xế <span className="text-red-500">*</span>
              </label>
              {drivers.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">Không có tài xế đang hoạt động</p>
              ) : (
                <select
                  value={selectedDriverId}
                  onChange={(e) => handleDriverSelect(e.target.value)}
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent"
                >
                  <option value="">-- Chọn tài xế --</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.FullName} ({d.DriverCode}) {d.AssignedVehicle ? `- Xe: ${d.AssignedVehicle}` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Phương tiện</label>
              {vehicles.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">Không có phương tiện sẵn sàng</p>
              ) : (
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent"
                >
                  <option value="">-- Chọn phương tiện --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.LicensePlate} - {v.VehicleType} ({v.VehicleCode})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </SectionCard>
      )}

      {/* Step 5: Packages & COD */}
      {selectedOrder && (
        <SectionCard title="Kiện hàng & COD" icon={Package}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Số kiện hàng</label>
              <input
                type="number"
                min={1}
                value={packages}
                onChange={(e) => setPackages(e.target.value === "" ? "" : parseInt(e.target.value))}
                className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Tiền thu hộ (COD)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  min={0}
                  value={codAmount}
                  onChange={(e) =>
                    setCodAmount(e.target.value === "" ? "" : parseFloat(e.target.value))
                  }
                  className="w-full h-10 pl-9 pr-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent"
                />
              </div>
              {Number(codAmount) > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {formatCurrency(Number(codAmount))}
                </p>
              )}
            </div>
          </div>
        </SectionCard>
      )}

      {/* Save / Cancel */}
      {selectedOrder && (
        <div className="flex items-center gap-3 pb-8">
          <button
            onClick={() => router.push("/delivery-orders")}
            className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-8 py-3 bg-[#4F5FD9] hover:bg-[#3B4CC0] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Đang tạo..." : "Tạo lệnh giao hàng"}
          </button>
        </div>
      )}
    </div>
  );
}
