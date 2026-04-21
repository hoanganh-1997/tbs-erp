"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getOrder, updateOrder, type Order } from "@/lib/orders";
import { getCustomers, type Customer } from "@/lib/customers";
import { createOrderHistory } from "@/lib/order-history";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

const SERVICE_TYPES = ["VCT", "MHH", "UTXNK", "LCLCN"];

// Only Nháp and Chờ duyệt can edit most fields
const EDITABLE_STATUSES = ["Nháp", "Chờ duyệt"];

// Later statuses can only edit delivery info + notes
const DELIVERY_EDITABLE_STATUSES = [
  "Đã xác nhận", "Đang tìm hàng", "Đã đặt hàng", "Tại kho TQ",
  "Trong container", "Đang vận chuyển", "Tại cửa khẩu",
  "Đang thông quan", "Tại kho VN",
];

export default function EditOrderPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  // Form state
  const [branch, setBranch] = useState("");
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [priority, setPriority] = useState("Thường");
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [estimatedDelivery, setEstimatedDelivery] = useState("");
  const [notes, setNotes] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load order + customers
  useEffect(() => {
    async function load() {
      try {
        const [orderData, { data: customerData }] = await Promise.all([
          getOrder(orderId),
          getCustomers({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
        ]);
        setOrder(orderData);
        setCustomers(customerData);

        // Pre-fill form
        setBranch(orderData.Branch || "");
        setServiceTypes(
          Array.isArray(orderData.ServiceTypes)
            ? orderData.ServiceTypes
            : typeof orderData.ServiceTypes === "string" && orderData.ServiceTypes
              ? (orderData.ServiceTypes as string).split(",").map((s: string) => s.trim())
              : []
        );
        setPriority(orderData.Priority || "Thường");
        setCustomerId(orderData.CustomerId || "");
        setCustomerName(orderData.CustomerName || "");
        setCompanyName(orderData.CompanyName || "");
        setDeliveryAddress(orderData.DeliveryAddress || "");
        setReceiverName(orderData.ReceiverName || "");
        setReceiverPhone(orderData.ReceiverPhone || "");
        setEstimatedDelivery(orderData.EstimatedDelivery || "");
        setNotes(orderData.Notes || "");
        setCustomerSearch(orderData.CustomerName || orderData.CompanyName || "");
      } catch {
        toast.error("Không thể tải đơn hàng");
        router.push("/orders");
      } finally {
        setPageLoading(false);
      }
    }
    if (orderId) load();
  }, [orderId, router]);

  const currentStatus = order?.Status ?? "";
  const isFullEdit = EDITABLE_STATUSES.includes(currentStatus);
  const isDeliveryEdit = DELIVERY_EDITABLE_STATUSES.includes(currentStatus);
  const canEdit = isFullEdit || isDeliveryEdit;

  const filteredCustomers = customers.filter(
    (c) =>
      (c.ContactName || "").toLowerCase().includes(customerSearch.toLowerCase()) ||
      (c.CompanyName || "").toLowerCase().includes(customerSearch.toLowerCase()) ||
      (c.CustomerCode || "").toLowerCase().includes(customerSearch.toLowerCase())
  );

  function handleSelectCustomer(customer: Customer) {
    setCustomerId(customer.id);
    setCustomerName(customer.ContactName || "");
    setCompanyName(customer.CompanyName || "");
    setDeliveryAddress(customer.DeliveryAddress || deliveryAddress);
    setReceiverName(customer.ReceiverName || receiverName);
    setReceiverPhone(customer.ReceiverPhone || receiverPhone);
    setCustomerSearch(customer.ContactName || customer.CompanyName || "");
    setShowCustomerDropdown(false);
    setErrors((prev) => ({ ...prev, customerId: "" }));
  }

  function handleToggleService(type: string) {
    setServiceTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (isFullEdit) {
      if (serviceTypes.length === 0) newErrors.serviceTypes = "Vui lòng chọn ít nhất 1 loại dịch vụ";
      if (!branch) newErrors.branch = "Vui lòng chọn chi nhánh";
      if (!customerId) newErrors.customerId = "Vui lòng chọn khách hàng";
    }
    if (!deliveryAddress.trim()) newErrors.deliveryAddress = "Vui lòng nhập địa chỉ giao hàng";
    if (!receiverName.trim()) newErrors.receiverName = "Vui lòng nhập tên người nhận";
    if (!receiverPhone.trim()) newErrors.receiverPhone = "Vui lòng nhập SĐT người nhận";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;
    if (!validate()) {
      setTimeout(() => {
        const first = document.querySelector("[data-invalid=true]") as HTMLElement | null;
        if (first) {
          first.scrollIntoView({ block: "center", behavior: "smooth" });
          first.focus();
        }
      }, 50);
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    try {
      const updateData: Record<string, unknown> = {
        DeliveryAddress: deliveryAddress,
        ReceiverName: receiverName,
        ReceiverPhone: receiverPhone,
        EstimatedDelivery: estimatedDelivery || undefined,
        Notes: notes || undefined,
      };

      if (isFullEdit) {
        updateData.Branch = branch;
        updateData.ServiceTypes = serviceTypes;
        updateData.Priority = priority;
        updateData.CustomerId = customerId;
        updateData.CustomerName = customerName;
        updateData.CompanyName = companyName;
      }

      await updateOrder(orderId, updateData);
      await createOrderHistory({
        OrderId: orderId,
        FromStatus: currentStatus,
        ToStatus: currentStatus,
        Action: "Cập nhật thông tin đơn hàng",
        PerformedBy: "Sale",
      });

      toast.success("Đã cập nhật đơn hàng");
      router.push(`/orders/${orderId}`);
    } catch {
      toast.error("Không thể cập nhật đơn hàng. Vui lòng thử lại.");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#4F5FD9] animate-spin" />
      </div>
    );
  }

  if (!order || !canEdit) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto text-center py-16">
          <p className="text-gray-500 mb-4">
            {!order
              ? "Không tìm thấy đơn hàng"
              : `Không thể sửa đơn hàng ở trạng thái "${currentStatus}"`}
          </p>
          <Link href={`/orders/${orderId}`} className="text-[#4F5FD9] hover:underline">
            Quay lại chi tiết đơn hàng
          </Link>
        </div>
      </div>
    );
  }

  const inputClass =
    "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]/20 focus:border-[#4F5FD9]";
  const disabledInputClass =
    "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/orders/${orderId}`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại chi tiết
          </Link>
          <h1 className="text-3xl font-bold text-[#2D3A8C]">
            Sửa đơn hàng — {order.OrderCode}
          </h1>
          <p className="text-gray-500 mt-1">
            {isFullEdit
              ? "Cập nhật toàn bộ thông tin đơn hàng"
              : "Chỉ có thể sửa thông tin giao hàng và ghi chú ở trạng thái này"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Thông tin chung */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-[#2D3A8C] mb-4">
              Thông tin chung
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {/* Mã đơn hàng */}
              <div>
                <label className={labelClass}>Mã đơn hàng</label>
                <input
                  type="text"
                  value={order.OrderCode || ""}
                  readOnly
                  className={disabledInputClass}
                />
              </div>

              {/* Chi nhánh */}
              <div>
                <label className={labelClass}>
                  Chi nhánh {isFullEdit && <span className="text-red-500">*</span>}
                </label>
                <select
                  value={branch}
                  disabled={!isFullEdit}
                  data-invalid={errors.branch ? "true" : undefined}
                  onChange={(e) => {
                    setBranch(e.target.value);
                    setErrors((prev) => ({ ...prev, branch: "" }));
                  }}
                  className={isFullEdit ? inputClass : disabledInputClass}
                >
                  <option value="">-- Chọn chi nhánh --</option>
                  <option value="HN">HN</option>
                  <option value="HCM">HCM</option>
                </select>
                {errors.branch && (
                  <p className="text-xs text-red-500 mt-1">{errors.branch}</p>
                )}
              </div>

              {/* Loại dịch vụ */}
              <div>
                <label className={labelClass}>
                  Loại dịch vụ {isFullEdit && <span className="text-red-500">*</span>}
                </label>
                <div className="flex flex-wrap gap-3 mt-1">
                  {SERVICE_TYPES.map((type) => (
                    <label
                      key={type}
                      className={`inline-flex items-center gap-2 text-sm ${isFullEdit ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
                    >
                      <input
                        type="checkbox"
                        checked={serviceTypes.includes(type)}
                        onChange={() => handleToggleService(type)}
                        disabled={!isFullEdit}
                        className="w-4 h-4 rounded border-gray-300 text-[#4F5FD9] focus:ring-[#4F5FD9]"
                      />
                      {type}
                    </label>
                  ))}
                </div>
                {errors.serviceTypes && (
                  <p className="text-xs text-red-500 mt-1">{errors.serviceTypes}</p>
                )}
              </div>

              {/* Ưu tiên */}
              <div>
                <label className={labelClass}>Ưu tiên</label>
                <select
                  value={priority}
                  disabled={!isFullEdit}
                  onChange={(e) => setPriority(e.target.value)}
                  className={isFullEdit ? inputClass : disabledInputClass}
                >
                  <option value="Thường">Thường</option>
                  <option value="Gấp">Gấp</option>
                  <option value="VIP">VIP</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Khách hàng */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-[#2D3A8C] mb-4">
              Khách hàng
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {/* Customer search */}
              <div className="col-span-2 relative">
                <label className={labelClass}>
                  Khách hàng {isFullEdit && <span className="text-red-500">*</span>}
                </label>
                {isFullEdit ? (
                  <>
                    <input
                      type="text"
                      value={customerSearch}
                      data-invalid={errors.customerId ? "true" : undefined}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setShowCustomerDropdown(true);
                        setCustomerId("");
                        setCustomerName("");
                        setCompanyName("");
                      }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                      placeholder="Tìm kiếm khách hàng..."
                      className={inputClass}
                    />
                    {showCustomerDropdown && customerSearch && filteredCustomers.length > 0 && (
                      <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {filteredCustomers.map((c) => (
                          <button
                            type="button"
                            key={c.id}
                            onClick={() => handleSelectCustomer(c)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0"
                          >
                            <span className="font-medium">{c.ContactName}</span>
                            {c.CompanyName && (
                              <span className="text-gray-400 ml-2">
                                — {c.CompanyName}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <input
                    type="text"
                    value={customerName || companyName || "---"}
                    readOnly
                    className={disabledInputClass}
                  />
                )}
                {errors.customerId && (
                  <p className="text-xs text-red-500 mt-1">{errors.customerId}</p>
                )}
              </div>

              <div>
                <label className={labelClass}>Tên khách hàng</label>
                <input
                  type="text"
                  value={customerName}
                  readOnly
                  className={disabledInputClass}
                  placeholder="Tự động điền"
                />
              </div>
              <div>
                <label className={labelClass}>Công ty</label>
                <input
                  type="text"
                  value={companyName}
                  readOnly
                  className={disabledInputClass}
                  placeholder="Tự động điền"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Giao hàng */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-[#2D3A8C] mb-4">
              Giao hàng
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={labelClass}>
                  Địa chỉ giao hàng <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={deliveryAddress}
                  data-invalid={errors.deliveryAddress ? "true" : undefined}
                  onChange={(e) => {
                    setDeliveryAddress(e.target.value);
                    setErrors((prev) => ({ ...prev, deliveryAddress: "" }));
                  }}
                  rows={2}
                  className={inputClass}
                  placeholder="Nhập địa chỉ giao hàng"
                />
                {errors.deliveryAddress && (
                  <p className="text-xs text-red-500 mt-1">{errors.deliveryAddress}</p>
                )}
              </div>

              <div>
                <label className={labelClass}>
                  Người nhận <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={receiverName}
                  data-invalid={errors.receiverName ? "true" : undefined}
                  onChange={(e) => {
                    setReceiverName(e.target.value);
                    setErrors((prev) => ({ ...prev, receiverName: "" }));
                  }}
                  className={inputClass}
                  placeholder="Tên người nhận"
                />
                {errors.receiverName && (
                  <p className="text-xs text-red-500 mt-1">{errors.receiverName}</p>
                )}
              </div>

              <div>
                <label className={labelClass}>
                  SĐT người nhận <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={receiverPhone}
                  data-invalid={errors.receiverPhone ? "true" : undefined}
                  onChange={(e) => {
                    setReceiverPhone(e.target.value);
                    setErrors((prev) => ({ ...prev, receiverPhone: "" }));
                  }}
                  className={inputClass}
                  placeholder="Số điện thoại"
                />
                {errors.receiverPhone && (
                  <p className="text-xs text-red-500 mt-1">{errors.receiverPhone}</p>
                )}
              </div>

              <div>
                <label className={labelClass}>Ngày giao dự kiến</label>
                <input
                  type="date"
                  value={estimatedDelivery}
                  onChange={(e) => setEstimatedDelivery(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Ghi chú */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-[#2D3A8C] mb-4">
              Ghi chú
            </h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={inputClass}
              placeholder="Ghi chú thêm (không bắt buộc)"
            />
          </div>

          {/* Submit buttons */}
          <div className="flex items-center justify-end gap-3">
            <Link
              href={`/orders/${orderId}`}
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Hủy
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-[#4F5FD9] text-white rounded-full text-sm font-medium hover:bg-[#4050C8] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
