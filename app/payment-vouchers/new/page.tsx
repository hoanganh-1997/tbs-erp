"use client";

import { useEffect, useState, useMemo } from "react";
import { cn, formatCurrency, generateCode } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { toast } from "sonner";
import { createPaymentVoucher, getPaymentVouchers } from "@/lib/payment-vouchers";
import { getOrders } from "@/lib/orders";
import { getExchangeRates } from "@/lib/exchange-rates";
import type { Order } from "@/lib/orders";
import type { PaymentVoucher } from "@/lib/payment-vouchers";
import type { ExchangeRate } from "@/lib/exchange-rates";
import { uploadFile, type AttachmentRef } from "@/lib/inforact-sdk-ext";
import { ArrowLeft, AlertTriangle, Search, Check, Paperclip, X as XIcon } from "lucide-react";
import { useRouter } from "next/navigation";

const EXPENSE_TYPES = ["Cọc", "Thanh toán NCC", "Thuế NK", "VAT", "Cước VC", "Phí cảng", "Phí giao hàng", "Phát sinh", "Hoàn tiền", "COD"];

function OrderSearch({ orders, selectedOrderId, onSelect }: { orders: Order[]; selectedOrderId: string; onSelect: (o: Order) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!query) return orders.slice(0, 20);
    const q = query.toLowerCase();
    return orders.filter((o) => o.OrderCode?.toLowerCase().includes(q) || o.CustomerName?.toLowerCase().includes(q)).slice(0, 20);
  }, [orders, query]);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">Mã đơn hàng <span className="text-red-500">*</span></label>
      {selectedOrder ? (
        <div className="flex items-center justify-between border border-gray-300 rounded-lg px-3 py-2">
          <span className="text-sm font-medium text-gray-900">{selectedOrder.OrderCode} - {selectedOrder.CustomerName}</span>
          <button onClick={() => { onSelect({ id: "" } as Order); setQuery(""); }} className="text-xs text-gray-400 hover:text-gray-600">Xóa</button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Tìm mã đơn hoặc tên KH..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none"
          />
          {open && filtered.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filtered.map((o) => (
                <button
                  key={o.id}
                  onClick={() => { onSelect(o); setQuery(""); setOpen(false); }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between"
                >
                  <span><span className="font-medium text-[#4F5FD9]">{o.OrderCode}</span> - {o.CustomerName}</span>
                  <span className="text-xs text-gray-400">{formatCurrency(o.TotalVND)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function NewPaymentVoucherPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [existingVouchers, setExistingVouchers] = useState<PaymentVoucher[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [type, setType] = useState<"Phiếu thu" | "Phiếu chi">("Phiếu thu");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [expenseType, setExpenseType] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [currency, setCurrency] = useState("VND");
  const [exchangeRate, setExchangeRate] = useState<string>("");
  const [beneficiary, setBeneficiary] = useState("");
  const [reason, setReason] = useState("");
  const [attachments, setAttachments] = useState<AttachmentRef[]>([]);
  const [uploading, setUploading] = useState(false);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      try {
        const [ordRes, pvRes, erRes] = await Promise.all([
          getOrders({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
          getPaymentVouchers({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
          getExchangeRates({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
        ]);
        setOrders(ordRes.data);
        setExistingVouchers(pvRes.data);
        setExchangeRates(erRes.data);
      } catch {
        toast.error("Lỗi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Auto-fill exchange rate when currency changes
  useEffect(() => {
    if (currency === "VND") {
      setExchangeRate("1");
      return;
    }
    const todayStr = new Date().toISOString().slice(0, 10);
    const rate = exchangeRates.find(
      (r) => r.FromCurrency === currency && r.Date?.startsWith(todayStr)
    );
    if (rate?.Rate) {
      setExchangeRate(String(rate.Rate));
    }
  }, [currency, exchangeRates]);

  const voucherCode = useMemo(() => generateCode(type === "Phiếu thu" ? "PT" : "PC"), [type]);

  // Anti-fraud FLAG rules
  const flagWarnings: string[] = [];

  if (selectedOrder && amount) {
    const orderVouchers = existingVouchers.filter((v) => v.OrderId === selectedOrder.id && v.Type === "Phiếu chi");
    const totalExpenses = orderVouchers.reduce((s, v) => s + (v.Amount ?? 0), 0) + parseFloat(amount || "0");
    const orderRevenue = selectedOrder.TotalVND ?? 0;
    if (orderRevenue > 0 && totalExpenses > orderRevenue * 0.9) {
      flagWarnings.push(`Tổng chi phí (${formatCurrency(totalExpenses)}) > 90% doanh thu đơn hàng (${formatCurrency(orderRevenue)})`);
    }
  }

  if (expenseType === "Phát sinh" && parseFloat(amount || "0") > 5000000) {
    flagWarnings.push(`Phiếu "Phát sinh" có số tiền > 5,000,000 VND`);
  }

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const outsideHours = currentHour < 8 || (currentHour === 17 && currentMinute > 30) || currentHour > 17;
  if (outsideHours) {
    flagWarnings.push("Phiếu được tạo ngoài giờ hành chính (8:00-17:30)");
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};

    if (!selectedOrder?.id) {
      errs.order = "Bắt buộc gắn mã đơn hàng";
    }
    if (!expenseType) {
      errs.expenseType = "Vui lòng chọn loại chi phí";
    }
    if (!amount || parseFloat(amount) <= 0) {
      errs.amount = "Số tiền phải > 0";
    }
    if (reason.length < 20) {
      errs.reason = "Lý do phải >= 20 ký tự";
    }
    if (type === "Phiếu chi" && !beneficiary.trim()) {
      errs.beneficiary = "Phiếu chi bắt buộc nhập người thụ hưởng";
    }
    if (type === "Phiếu chi" && attachments.length === 0) {
      errs.attachments = "Phiếu chi bắt buộc đính kèm chứng từ (hóa đơn/biên nhận)";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const uploaded = await Promise.all(files.map((f) => uploadFile(f)));
      setAttachments((prev) => [...prev, ...uploaded]);
      toast.success(`Đã tải lên ${uploaded.length} tệp`);
    } catch (err: any) {
      toast.error(`Lỗi tải tệp: ${err.message ?? "unknown"}`);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const isFlagged = flagWarnings.length > 0;
      await createPaymentVoucher({
        VoucherCode: voucherCode,
        Type: type,
        OrderId: selectedOrder?.id,
        OrderCode: selectedOrder?.OrderCode,
        CustomerId: type === "Phiếu thu" ? selectedOrder?.CustomerId : undefined,
        CustomerName: type === "Phiếu thu" ? selectedOrder?.CustomerName : undefined,
        ExpenseType: expenseType,
        Amount: parseFloat(amount),
        Currency: currency,
        ExchangeRate: parseFloat(exchangeRate || "0"),
        Beneficiary: beneficiary,
        Reason: reason,
        Status: "Nháp",
        IsFlagged: isFlagged,
        FlagReason: isFlagged ? flagWarnings.join("; ") : undefined,
        Attachments: attachments.length > 0 ? attachments : undefined,
      });
      toast.success("Tạo phiếu thành công");
      router.push("/payment-vouchers");
    } catch {
      toast.error("Lỗi tạo phiếu");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-4 bg-gray-100 rounded w-64" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <a href="/payment-vouchers" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#4F5FD9] transition-colors">
        <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
      </a>

      <PageHeader title="Tạo phiếu thu chi" />

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Loại phiếu */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="text-sm font-semibold text-[#2D3A8C] uppercase tracking-wider mb-4">Loại phiếu</h3>
          <div className="flex gap-4">
            {(["Phiếu thu", "Phiếu chi"] as const).map((t) => (
              <label key={t} className={cn(
                "flex items-center gap-3 px-5 py-3 rounded-lg border-2 cursor-pointer transition-all",
                type === t ? "border-[#4F5FD9] bg-[#4F5FD9]/5" : "border-gray-200 hover:border-gray-300"
              )}>
                <input
                  type="radio"
                  name="type"
                  checked={type === t}
                  onChange={() => setType(t)}
                  className="text-[#4F5FD9] focus:ring-[#4F5FD9]"
                />
                <span className={cn("text-sm font-medium", type === t ? "text-[#4F5FD9]" : "text-gray-700")}>{t}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Section 2: Thông tin */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="text-sm font-semibold text-[#2D3A8C] uppercase tracking-wider mb-4">Thông tin</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã phiếu</label>
              <input type="text" value={voucherCode} readOnly className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500" />
            </div>

            <OrderSearch
              orders={orders}
              selectedOrderId={selectedOrder?.id || ""}
              onSelect={(o) => setSelectedOrder(o.id ? o : null)}
            />
            {errors.order && <p className="text-xs text-red-500 -mt-2">{errors.order}</p>}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại chi phí <span className="text-red-500">*</span></label>
              <select
                value={expenseType}
                onChange={(e) => setExpenseType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none"
              >
                <option value="">-- Chọn loại --</option>
                {EXPENSE_TYPES.map((et) => (
                  <option key={et} value={et}>{et}</option>
                ))}
              </select>
              {errors.expenseType && <p className="text-xs text-red-500 mt-1">{errors.expenseType}</p>}
            </div>
          </div>
        </div>

        {/* Section 3: Số tiền */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="text-sm font-semibold text-[#2D3A8C] uppercase tracking-wider mb-4">Số tiền</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền <span className="text-red-500">*</span></label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none"
              />
              {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tiền tệ</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none"
              >
                <option value="VND">VND</option>
                <option value="CNY">CNY</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tỷ giá</label>
              <input
                type="number"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                placeholder="Tỷ giá"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Chi tiết */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="text-sm font-semibold text-[#2D3A8C] uppercase tracking-wider mb-4">Chi tiết</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Người thụ hưởng
                {type === "Phiếu chi" && <span className="text-red-500"> *</span>}
              </label>
              <input
                type="text"
                value={beneficiary}
                onChange={(e) => setBeneficiary(e.target.value)}
                placeholder="Tên người thụ hưởng"
                className={cn(
                  "w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none",
                  errors.beneficiary ? "border-red-400" : "border-gray-300",
                )}
              />
              {errors.beneficiary && (
                <p className="text-xs text-red-500 mt-1">{errors.beneficiary}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chứng từ đính kèm
                {type === "Phiếu chi" && <span className="text-red-500"> *</span>}
                <span className="text-xs font-normal text-gray-500 ml-2">
                  (hóa đơn, biên nhận — bắt buộc với phiếu chi)
                </span>
              </label>
              <label
                className={cn(
                  "flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                  errors.attachments
                    ? "border-red-400 bg-red-50"
                    : "border-gray-300 hover:border-[#4F5FD9] hover:bg-blue-50",
                  uploading && "opacity-60 cursor-wait",
                )}
              >
                <Paperclip className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {uploading ? "Đang tải lên..." : "Bấm để chọn tệp (PDF, JPG, PNG)"}
                </span>
                <input
                  type="file"
                  multiple
                  accept="application/pdf,image/*"
                  disabled={uploading}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {errors.attachments && (
                <p className="text-xs text-red-500 mt-1">{errors.attachments}</p>
              )}
              {attachments.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {attachments.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm"
                    >
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-[#4F5FD9] hover:underline"
                      >
                        {a.name}
                      </a>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {(a.size / 1024).toFixed(1)} KB
                      </span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(a.id)}
                        className="text-gray-400 hover:text-red-500 flex-shrink-0"
                        aria-label={`Remove ${a.name}`}
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lý do <span className="text-red-500">*</span></label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Nhập lý do chi tiết (tối thiểu 20 ký tự)..."
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none resize-none"
              />
              <div className="flex justify-between mt-1">
                {errors.reason ? (
                  <p className="text-xs text-red-500">{errors.reason}</p>
                ) : (
                  <span />
                )}
                <span className={cn("text-xs", reason.length < 20 ? "text-gray-400" : "text-green-600")}>{reason.length}/20</span>
              </div>
            </div>
          </div>
        </div>

        {/* Flag warnings */}
        {flagWarnings.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-yellow-800 mb-1">Cảnh báo chống gian lận</p>
                <p className="text-xs text-yellow-700 mb-2">Phiếu này sẽ bị gắn cờ khi tạo:</p>
                <ul className="space-y-1">
                  {flagWarnings.map((w, i) => (
                    <li key={i} className="text-xs text-yellow-700 flex items-start gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-yellow-500 mt-1.5 flex-shrink-0" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <a
            href="/payment-vouchers"
            className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Hủy
          </a>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 text-sm font-medium text-white bg-[#4F5FD9] hover:bg-[#3B4CC0] rounded-lg disabled:opacity-50 transition-colors inline-flex items-center gap-2"
          >
            {submitting ? "Đang tạo..." : (
              <>
                <Check className="w-4 h-4" />
                Tạo phiếu
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
