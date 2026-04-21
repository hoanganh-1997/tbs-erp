"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createContract } from "@/lib/contracts";
import { getCustomers } from "@/lib/customers";
import { getOrders } from "@/lib/orders";
import type { Customer } from "@/lib/customers";
import type { Order } from "@/lib/orders";
import { generateCode, formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Info } from "lucide-react";

const CURRENCIES = ["VND", "CNY", "USD"];

export default function NewContractPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [prefillOrder, setPrefillOrder] = useState<Order | null>(null);

  // Form state
  const [contractCode] = useState(() => generateCode("HD"));
  const [title, setTitle] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [linkedOrderId, setLinkedOrderId] = useState("");
  const [linkedOrderCode, setLinkedOrderCode] = useState("");
  const [contractValue, setContractValue] = useState<number>(0);
  const [currency, setCurrency] = useState("VND");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saleOwner, setSaleOwner] = useState("");
  const [notes, setNotes] = useState("");

  // ─── Fetch customers + prefill from order ────
  useEffect(() => {
    async function load() {
      try {
        const [custRes, ordersRes] = await Promise.all([
          getCustomers({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
          orderId ? getOrders({ take: 200, sortField: "createdAt", sortDirection: "desc" }) : Promise.resolve({ data: [], total: 0 }),
        ]);
        setCustomers(custRes.data || []);

        if (orderId) {
          const order = (ordersRes.data || []).find((o: Order) => o.id === orderId);
          if (order) {
            setPrefillOrder(order);
            setCustomerName(order.CustomerName || "");
            setCustomerId(order.CustomerId || "");
            setLinkedOrderId(order.id);
            setLinkedOrderCode(order.OrderCode || "");
            setContractValue(order.TotalVND || 0);
            setSaleOwner(order.SaleOwner || "");
            setTitle(`Hợp đồng dịch vụ - ${order.OrderCode || ""}`);
          }
        }
      } catch {
        setCustomers([]);
      }
    }
    load();
  }, [orderId]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers.slice(0, 10);
    const s = customerSearch.toLowerCase();
    return customers
      .filter((c) => (c.CompanyName || c.ContactName || "").toLowerCase().includes(s))
      .slice(0, 10);
  }, [customers, customerSearch]);

  // ─── Validation ──────────────────────────────
  function validate(): string | null {
    if (!title.trim()) return "Vui lòng nhập tiêu đề hợp đồng";
    if (!customerName.trim()) return "Vui lòng nhập tên khách hàng";
    // Root-cause #1: phải chọn KH từ gợi ý (có customerId) để đảm bảo liên kết dữ liệu
    if (!customerId) return "Vui lòng chọn khách hàng từ danh sách gợi ý";
    if (contractValue <= 0) return "Giá trị hợp đồng phải > 0";
    if (endDate && startDate && new Date(endDate) < new Date(startDate)) {
      return "Ngày kết thúc phải sau ngày bắt đầu";
    }
    return null;
  }

  // ─── Submit ──────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Bug #1: synchronous guard against double-submit
    if (submittingRef.current) return;
    const err = validate();
    if (err) { toast.error(err); return; }

    submittingRef.current = true;
    setSubmitting(true);
    try {
      const contract = await createContract({
        ContractCode: contractCode,
        Title: title,
        CustomerName: customerName,
        CustomerId: customerId || undefined,
        OrderId: linkedOrderId || undefined,
        OrderCode: linkedOrderCode || undefined,
        ContractValue: contractValue,
        Currency: currency,
        StartDate: startDate || undefined,
        EndDate: endDate || undefined,
        SaleOwner: saleOwner || undefined,
        Notes: notes || undefined,
        Status: "Nháp",
      });

      const newId = contract?.id || (contract as any)?.data?.id;
      toast.success("Tạo hợp đồng thành công!");
      router.push(`/contracts/${newId}`);
    } catch {
      toast.error("Lỗi khi tạo hợp đồng. Vui lòng thử lại.");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  const fmtNum = (n: number) => new Intl.NumberFormat("vi-VN").format(n);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/contracts" className="inline-flex items-center text-sm text-[#4F5FD9] hover:underline mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Quay lại danh sách
        </Link>

        <PageHeader title="Tạo hợp đồng mới" />

        {/* Pre-fill banner */}
        {prefillOrder && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              Tự động điền từ đơn hàng <span className="font-medium">{prefillOrder.OrderCode}</span>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-8">
          {/* Section 1: Thông tin chung */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-[#2D3A8C] mb-4">Thông tin chung</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã hợp đồng</label>
                <input type="text" value={contractCode} readOnly className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sale phụ trách</label>
                <input
                  type="text" value={saleOwner}
                  onChange={(e) => setSaleOwner(e.target.value)}
                  placeholder="Nhập tên sale..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]/40 focus:border-[#4F5FD9]"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề hợp đồng *</label>
                <input
                  type="text" value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Hợp đồng dịch vụ vận chuyển..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]/40 focus:border-[#4F5FD9]"
                />
              </div>
            </div>
          </section>

          {/* Section 2: Khách hàng */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-[#2D3A8C] mb-4">Khách hàng</h2>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên khách hàng *</label>
              <input
                type="text" value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  setCustomerSearch(e.target.value);
                  setShowCustomerDropdown(true);
                  setCustomerId("");
                }}
                onFocus={() => setShowCustomerDropdown(true)}
                onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                placeholder="Tìm khách hàng..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]/40 focus:border-[#4F5FD9]"
              />
              {showCustomerDropdown && filteredCustomers.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredCustomers.map((c) => (
                    <button
                      key={c.id} type="button"
                      onMouseDown={() => {
                        setCustomerName(c.CompanyName || c.ContactName || "");
                        setCustomerId(c.id);
                        setShowCustomerDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-medium">{c.CompanyName || c.ContactName}</span>
                      {c.CustomerCode && <span className="text-gray-400 ml-2 text-xs">{c.CustomerCode}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Section 3: Liên kết đơn hàng */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-[#2D3A8C] mb-4">Liên kết đơn hàng</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã đơn hàng</label>
                <input
                  type="text" value={linkedOrderCode}
                  onChange={(e) => setLinkedOrderCode(e.target.value)}
                  placeholder="VD: DH-240408-001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]/40 focus:border-[#4F5FD9]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID đơn hàng</label>
                <input
                  type="text" value={linkedOrderId}
                  onChange={(e) => setLinkedOrderId(e.target.value)}
                  placeholder="Tự động điền từ đơn hàng"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-500"
                  readOnly={!!prefillOrder}
                />
              </div>
            </div>
          </section>

          {/* Section 4: Giá trị & Thời hạn */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-[#2D3A8C] mb-4">Giá trị & Thời hạn</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giá trị hợp đồng *</label>
                <input
                  type="number" min={0} value={contractValue}
                  onChange={(e) => setContractValue(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]/40 focus:border-[#4F5FD9]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiền tệ</label>
                <select
                  value={currency} onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]/40 focus:border-[#4F5FD9]"
                >
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
                <input
                  type="date" value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]/40 focus:border-[#4F5FD9]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
                <input
                  type="date" value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]/40 focus:border-[#4F5FD9]"
                />
              </div>
            </div>

            {/* Value summary */}
            {contractValue > 0 && (
              <div className="mt-4 bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between text-base font-bold">
                  <span className="text-[#2D3A8C]">Giá trị hợp đồng</span>
                  <span className="text-[#2D3A8C]">{formatCurrency(contractValue, currency)}</span>
                </div>
              </div>
            )}
          </section>

          {/* Section 5: Ghi chú */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-[#2D3A8C] mb-4">Ghi chú</h2>
            <textarea
              value={notes} onChange={(e) => setNotes(e.target.value)}
              rows={3} placeholder="Nhập ghi chú..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]/40 focus:border-[#4F5FD9] resize-none"
            />
          </section>

          {/* Submit */}
          <div className="flex items-center justify-end space-x-3">
            <Link href="/contracts" className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Hủy
            </Link>
            <button
              type="submit" disabled={submitting}
              className="inline-flex items-center px-5 py-2 text-sm font-medium text-white bg-[#4F5FD9] rounded-lg hover:bg-[#3D4DB8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Tạo hợp đồng
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
