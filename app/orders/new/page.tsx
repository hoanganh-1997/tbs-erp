"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createOrder } from "@/lib/orders";
import { getCustomers, type Customer } from "@/lib/customers";
import { generateCode } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const SERVICE_TYPES = ["VCT", "MHH", "UTXNK", "LCLCN"];

export default function CreateOrderPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const [orderCode] = useState(() => generateCode("DH"));
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

  useEffect(() => {
    async function loadCustomers() {
      try {
        const { data } = await getCustomers({ take: 200, sortField: "createdAt", sortDirection: "desc" });
        setCustomers(data);
      } catch {
        toast.error("Không thể tải danh sách khách hàng");
      } finally {
        setLoadingCustomers(false);
      }
    }
    loadCustomers();
  }, []);

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
    setDeliveryAddress(customer.DeliveryAddress || "");
    setReceiverName(customer.ReceiverName || "");
    setReceiverPhone(customer.ReceiverPhone || "");
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
    if (serviceTypes.length === 0) newErrors.serviceTypes = "Vui lòng chọn ít nhất 1 loại dịch vụ";
    if (!branch) newErrors.branch = "Vui lòng chọn chi nhánh";
    if (!customerId) newErrors.customerId = "Vui lòng chọn khách hàng";
    if (!deliveryAddress.trim()) newErrors.deliveryAddress = "Vui lòng nhập địa chỉ giao hàng";
    if (!receiverName.trim()) newErrors.receiverName = "Vui lòng nhập tên người nhận";
    if (!receiverPhone.trim()) newErrors.receiverPhone = "Vui lòng nhập SĐT người nhận";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Bug #1: synchronous guard against double-submit
    if (submittingRef.current) return;
    if (!validate()) {
      // Bug #2: scroll to first error field
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
      await createOrder({
        OrderCode: orderCode,
        Branch: branch,
        ServiceTypes: serviceTypes,
        Priority: priority,
        CustomerId: customerId,
        CustomerName: customerName,
        CompanyName: companyName,
        DeliveryAddress: deliveryAddress,
        ReceiverName: receiverName,
        ReceiverPhone: receiverPhone,
        EstimatedDelivery: estimatedDelivery || undefined,
        Notes: notes || undefined,
        Status: "Nháp",
        StageNumber: 1,
      });
      toast.success("Tạo đơn hàng thành công");
      router.push("/orders");
    } catch {
      toast.error("Không thể tạo đơn hàng. Vui lòng thử lại.");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]/20 focus:border-[#4F5FD9]";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </Link>
          <h1 className="text-3xl font-bold text-[#2D3A8C]">Tạo đơn hàng mới</h1>
          <p className="text-gray-500 mt-1">Điền thông tin đơn hàng</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Thông tin chung */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-[#2D3A8C] mb-4">Thông tin chung</h2>
            <div className="grid grid-cols-2 gap-4">
              {/* Mã đơn hàng */}
              <div>
                <label className={labelClass}>Mã đơn hàng</label>
                <input
                  type="text"
                  value={orderCode}
                  readOnly
                  className={`${inputClass} bg-gray-50`}
                />
              </div>

              {/* Chi nhánh */}
              <div>
                <label className={labelClass}>
                  Chi nhánh <span className="text-red-500">*</span>
                </label>
                <select
                  value={branch}
                  data-invalid={errors.branch ? "true" : undefined}
                  onChange={(e) => {
                    setBranch(e.target.value);
                    setErrors((prev) => ({ ...prev, branch: "" }));
                  }}
                  className={inputClass}
                >
                  <option value="">-- Chọn chi nhánh --</option>
                  <option value="HN">HN</option>
                  <option value="HCM">HCM</option>
                </select>
                {errors.branch && <p className="text-xs text-red-500 mt-1">{errors.branch}</p>}
              </div>

              {/* Loại dịch vụ */}
              <div>
                <label className={labelClass}>
                  Loại dịch vụ <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-3 mt-1">
                  {SERVICE_TYPES.map((type) => (
                    <label key={type} className="inline-flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={serviceTypes.includes(type)}
                        onChange={() => handleToggleService(type)}
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
                  onChange={(e) => setPriority(e.target.value)}
                  className={inputClass}
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
            <h2 className="text-lg font-semibold text-[#2D3A8C] mb-4">Khách hàng</h2>
            <div className="grid grid-cols-2 gap-4">
              {/* Customer search */}
              <div className="col-span-2 relative">
                <label className={labelClass}>
                  Khách hàng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerSearch}
                  data-invalid={errors.customerId ? "true" : undefined}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setShowCustomerDropdown(true);
                    // Root-cause #1: reset customerId bất cứ khi nào text thay đổi
                    // User phải click lại suggestion để chọn
                    setCustomerId("");
                    setCustomerName("");
                    setCompanyName("");
                    setDeliveryAddress("");
                    setReceiverName("");
                    setReceiverPhone("");
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                  placeholder={loadingCustomers ? "Đang tải..." : "Tìm kiếm khách hàng..."}
                  disabled={loadingCustomers}
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
                          <span className="text-gray-400 ml-2">— {c.CompanyName}</span>
                        )}
                        {c.CustomerCode && (
                          <span className="text-gray-400 ml-2">({c.CustomerCode})</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {showCustomerDropdown &&
                  customerSearch &&
                  filteredCustomers.length === 0 &&
                  !loadingCustomers && (
                    <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm text-gray-400">
                      Không tìm thấy khách hàng
                    </div>
                  )}
                {errors.customerId && (
                  <p className="text-xs text-red-500 mt-1">{errors.customerId}</p>
                )}
              </div>

              {/* Tên khách hàng */}
              <div>
                <label className={labelClass}>Tên khách hàng</label>
                <input
                  type="text"
                  value={customerName}
                  readOnly
                  className={`${inputClass} bg-gray-50`}
                  placeholder="Tự động điền"
                />
              </div>

              {/* Công ty */}
              <div>
                <label className={labelClass}>Công ty</label>
                <input
                  type="text"
                  value={companyName}
                  readOnly
                  className={`${inputClass} bg-gray-50`}
                  placeholder="Tự động điền"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Giao hàng */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-[#2D3A8C] mb-4">Giao hàng</h2>
            <div className="grid grid-cols-2 gap-4">
              {/* Địa chỉ giao hàng */}
              <div className="col-span-2">
                <label className={labelClass}>
                  Địa chỉ giao hàng <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={deliveryAddress}
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

              {/* Người nhận */}
              <div>
                <label className={labelClass}>
                  Người nhận <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={receiverName}
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

              {/* SĐT người nhận */}
              <div>
                <label className={labelClass}>
                  SĐT người nhận <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={receiverPhone}
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

              {/* Ngày giao dự kiến */}
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
            <h2 className="text-lg font-semibold text-[#2D3A8C] mb-4">Ghi chú</h2>
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
              href="/orders"
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Hủy
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-[#4F5FD9] text-white rounded-full text-sm font-medium hover:bg-[#4050C8] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Đang tạo..." : "Tạo đơn hàng"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
