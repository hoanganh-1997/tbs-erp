"use client";

import { useEffect, useState, useCallback, useMemo, memo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createQuotation, updateQuotation } from "@/lib/quotations";
import { createQuotationItem } from "@/lib/quotation-items";
import { getAllCustomers } from "@/lib/customers";
import { getLead, updateLead } from "@/lib/leads";
import { getExchangeRates } from "@/lib/exchange-rates";
import { createApprovalRequest, type ApprovalStep } from "@/lib/inforact-sdk-ext";
import { generateCode, formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Loader2, AlertTriangle, Info } from "lucide-react";

interface LineItem {
  id: string;
  ProductName: string;
  SKU: string;
  ProductLink: string;
  Attributes: string;
  Quantity: number;
  UnitPriceCNY: number;
}

const SERVICE_TYPES = ["VCT", "MHH", "UTXNK", "LCLCN"];
const SERVICE_LABELS: Record<string, string> = {
  VCT: "Vận chuyển thuần",
  MHH: "Mua hàng hộ",
  UTXNK: "Ủy thác XNK",
  LCLCN: "LCL chính ngạch",
};

function generateItemId() {
  return Math.random().toString(36).substring(2, 10);
}

function emptyItem(): LineItem {
  return { id: generateItemId(), ProductName: "", SKU: "", ProductLink: "", Attributes: "", Quantity: 1, UnitPriceCNY: 0 };
}

const LineItemForm = memo(function LineItemForm({
  item, idx, canRemove, onUpdate, onRemove,
}: {
  item: LineItem; idx: number; canRemove: boolean;
  onUpdate: (id: string, field: keyof LineItem, value: any) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-500">Mặt hàng #{idx + 1}</span>
        {canRemove && (
          <button type="button" onClick={() => onRemove(item.id)} className="text-red-400 hover:text-red-600 transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Tên sản phẩm *</label>
          <input type="text" value={item.ProductName} onChange={(e) => onUpdate(item.id, "ProductName", e.target.value)}
            placeholder="Nhập tên sản phẩm" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]/40 focus:border-[#4F5FD9]" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">SKU</label>
          <input type="text" value={item.SKU} onChange={(e) => onUpdate(item.id, "SKU", e.target.value)}
            placeholder="Mã sản phẩm" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]/40 focus:border-[#4F5FD9]" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Link sản phẩm</label>
          <input type="text" value={item.ProductLink} onChange={(e) => onUpdate(item.id, "ProductLink", e.target.value)}
            placeholder="https://..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]/40 focus:border-[#4F5FD9]" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Thuộc tính</label>
          <input type="text" value={item.Attributes} onChange={(e) => onUpdate(item.id, "Attributes", e.target.value)}
            placeholder="Màu, size..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]/40 focus:border-[#4F5FD9]" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Số lượng</label>
          <input type="number" min={1} step="any" value={item.Quantity}
            onChange={(e) => onUpdate(item.id, "Quantity", e.target.value === "" ? 0 : Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]/40 focus:border-[#4F5FD9]" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Đơn giá (CNY)</label>
          <input type="number" min={0} step="any" value={item.UnitPriceCNY}
            onChange={(e) => onUpdate(item.id, "UnitPriceCNY", e.target.value === "" ? 0 : Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]/40 focus:border-[#4F5FD9]" />
        </div>
      </div>
      <div className="mt-2 text-right text-sm text-gray-500">
        Thành tiền: <span className="font-medium text-gray-800">{new Intl.NumberFormat("vi-VN").format(item.Quantity * item.UnitPriceCNY)} CNY</span>
      </div>
    </div>
  );
});

// GAP-SDK-006 v1.2 schema. BGĐ chưa có trong mapping table Inforact cấp —
// tạm map `grp_bgd` + LEADER, cần Lead/Inforact confirm trước khi chạy thật.
const STEP = {
  leaderKD:   { type: "group", groupId: "grp_kinh_doanh", title: "VICE_LEADER" } as ApprovalStep,
  gdKD:       { type: "group", groupId: "grp_kinh_doanh", title: "LEADER" }      as ApprovalStep,
  ktTT:       { type: "group", groupId: "grp_ke_toan",    title: "VICE_LEADER" } as ApprovalStep,
  bgd:        { type: "group", groupId: "grp_bgd",        title: "LEADER" }      as ApprovalStep,
};

function getApprovalChain(
  discountPercent: number,
  totalVND: number,
): { label: string; chain: ApprovalStep[]; slaHours: number } {
  if (totalVND > 100_000_000 || discountPercent > 5) {
    return {
      label: "Leader + KT TT → GĐ KD → BGĐ",
      chain: [STEP.leaderKD, STEP.ktTT, STEP.gdKD, STEP.bgd],
      slaHours: 4,
    };
  }
  if (discountPercent > 3) {
    return {
      label: "Leader + KT TT → GĐ KD",
      chain: [STEP.leaderKD, STEP.ktTT, STEP.gdKD],
      slaHours: 4,
    };
  }
  if (discountPercent > 0) {
    return {
      label: "Leader + KT TT",
      chain: [STEP.leaderKD, STEP.ktTT],
      slaHours: 2,
    };
  }
  return { label: "", chain: [], slaHours: 0 };
}

function getApprovalChainLabel(discountPercent: number, totalVND: number): string {
  return getApprovalChain(discountPercent, totalVND).label;
}

export default function NewQuotationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leadId = searchParams.get("leadId");

  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [todayRate, setTodayRate] = useState<number | null>(null);

  // Form state
  const [quotationCode] = useState(() => generateCode("BG"));
  const [branch, setBranch] = useState("HN");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [saleOwner, setSaleOwner] = useState("");

  // Cost
  const [exchangeRate, setExchangeRate] = useState<number>(3500);
  const [serviceFeeVND, setServiceFeeVND] = useState<number>(0);
  const [shippingFeeVND, setShippingFeeVND] = useState<number>(0);

  // Discount
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // Items
  const [items, setItems] = useState<LineItem[]>([emptyItem()]);

  // Notes
  const [notes, setNotes] = useState("");
  const [validUntil, setValidUntil] = useState("");

  // ─── Calculations ─────────────────────────────
  const totalCNY = useMemo(() => items.reduce((s, it) => s + it.Quantity * it.UnitPriceCNY, 0), [items]);
  const subTotal = useMemo(() => totalCNY * exchangeRate + serviceFeeVND + shippingFeeVND, [totalCNY, exchangeRate, serviceFeeVND, shippingFeeVND]);
  const discountAmount = useMemo(() => Math.round((subTotal * discountPercent) / 100), [subTotal, discountPercent]);
  const finalTotal = useMemo(() => subTotal - discountAmount, [subTotal, discountAmount]);
  const approvalChain = getApprovalChainLabel(discountPercent, finalTotal);

  // ─── Fetch customers + exchange rate ──────────
  useEffect(() => {
    async function load() {
      setLoadingCustomers(true);
      try {
        const [custRes, rateRes] = await Promise.all([
          getAllCustomers(),
          getExchangeRates({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
        ]);
        setCustomers(custRes.data || []);

        // Find latest CNY rate
        const latestCny = (rateRes.data || []).find((r: any) => r.FromCurrency === "CNY");
        if (latestCny?.Rate) {
          setExchangeRate(latestCny.Rate);
          setTodayRate(latestCny.Rate);
        }
      } catch {
        setCustomers([]);
      } finally {
        setLoadingCustomers(false);
      }
    }
    load();
  }, []);

  // Auto-fill from lead
  useEffect(() => {
    if (!leadId) return;
    async function loadLead() {
      try {
        const lead = await getLead(leadId);
        if (lead) {
          setCustomerName(lead.FullName || "");
          if (lead.SaleOwner) setSaleOwner(lead.SaleOwner);
          if (lead.Branch) setBranch(lead.Branch);
          // Parse Lead.Needs for service types (Bug #4)
          if (lead.Needs) {
            const needs = lead.Needs.toUpperCase();
            const detected = SERVICE_TYPES.filter((svc) =>
              new RegExp(`\\b${svc}\\b`, "i").test(needs)
            );
            if (detected.length > 0) setSelectedServices(detected);
          }
        }
      } catch {
        toast.error("Không tìm thấy thông tin Lead");
      }
    }
    loadLead();
  }, [leadId]);

  const filteredCustomers = useMemo(() => {
    const getName = (c: any) => c.CompanyName || c.ContactName || c.Name || c.CustomerName || "";
    if (!customerSearch.trim()) return customers.slice(0, 10);
    const s = customerSearch.toLowerCase();
    return customers.filter((c) => getName(c).toLowerCase().includes(s)).slice(0, 10);
  }, [customers, customerSearch]);

  // ─── Item management ──────────────────────────
  const updateItem = useCallback((id: string, field: keyof LineItem, value: any) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  }, []);
  const addItem = useCallback(() => setItems((prev) => [...prev, emptyItem()]), []);
  const removeItem = useCallback((id: string) => setItems((prev) => (prev.length <= 1 ? prev : prev.filter((it) => it.id !== id))), []);

  const toggleService = (svc: string) => {
    setSelectedServices((prev) => prev.includes(svc) ? prev.filter((s) => s !== svc) : [...prev, svc]);
  };

  // ─── Submit ───────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Bug #1: synchronous guard against double-submit
    if (submittingRef.current) return;
    if (!customerName.trim()) { toast.error("Vui lòng nhập tên khách hàng"); return; }
    // Root-cause #1: nếu không có leadId (flow từ Lead) thì bắt buộc chọn KH từ gợi ý
    if (!leadId && !customerId) {
      toast.error("Vui lòng chọn khách hàng từ danh sách gợi ý");
      return;
    }
    if (selectedServices.length === 0) { toast.error("Vui lòng chọn ít nhất một loại dịch vụ"); return; }
    if (!items.some((it) => it.ProductName.trim())) { toast.error("Vui lòng thêm ít nhất 1 mặt hàng"); return; }

    submittingRef.current = true;
    setSubmitting(true);
    try {
      const approval = getApprovalChain(discountPercent, finalTotal);
      const initialStatus = approval.chain.length > 0 ? "Chờ duyệt" : "Nháp";

      const quotation = await createQuotation({
        QuotationCode: quotationCode,
        Branch: branch,
        ServiceTypes: selectedServices,
        CustomerName: customerName,
        CustomerId: customerId,
        LeadId: leadId || undefined,
        TotalCNY: totalCNY,
        ExchangeRate: exchangeRate,
        ServiceFeeVND: serviceFeeVND,
        ShippingFeeVND: shippingFeeVND,
        TotalVND: finalTotal,
        DiscountPercent: discountPercent,
        DiscountAmount: discountAmount,
        Notes: notes,
        ValidUntil: validUntil || undefined,
        Status: initialStatus,
        SaleOwner: saleOwner,
      });

      const quotationId = quotation?.id || (quotation as any)?.data?.id;

      if (quotationId && approval.chain.length > 0) {
        try {
          await createApprovalRequest({
            referenceType: "quotation",
            referenceId: quotationId,
            referenceCode: quotationCode,
            type: "Giảm giá",
            approvalChain: approval.chain,
            slaHours: approval.slaHours,
            summary: `Báo giá ${quotationCode} — KH ${customerName}, giảm ${discountPercent}%, total ${formatCurrency(finalTotal)}`,
            amount: finalTotal,
            metadata: { discountPercent, totalVND: finalTotal, branch },
          });
        } catch (err) {
          console.error("Không tạo được approval request:", err);
          try {
            await updateQuotation(quotationId, { Status: "Nháp" });
          } catch (rollbackErr) {
            console.error("Rollback quotation status failed:", rollbackErr);
          }
          const msg = err instanceof Error ? err.message : "lỗi không xác định";
          toast.error(
            `Không tạo được yêu cầu duyệt (${msg}). Báo giá đã lưu ở trạng thái Nháp — mở lại để thử lại.`,
          );
        }
      }

      await Promise.all(
        items
          .filter((it) => it.ProductName.trim())
          .map((it) =>
            createQuotationItem({
              QuotationId: quotationId,
              ProductName: it.ProductName,
              SKU: it.SKU,
              ProductLink: it.ProductLink,
              Attributes: it.Attributes,
              Quantity: it.Quantity,
              UnitPriceCNY: it.UnitPriceCNY,
              TotalCNY: it.Quantity * it.UnitPriceCNY,
            })
          )
      );

      // Bug #3: auto-sync Lead.Status → "Đã báo giá" if quote created from lead
      if (leadId) {
        try {
          await updateLead(leadId, { Status: "Đã báo giá" });
        } catch (e) {
          console.warn("Không cập nhật được Lead.status:", e);
        }
      }

      toast.success("Tạo báo giá thành công!");
      router.push(`/quotations/${quotationId}`);
    } catch (err) {
      console.error("Lỗi khi tạo báo giá:", err);
      const msg = err instanceof Error ? err.message : "lỗi không xác định";
      toast.error(`Lỗi khi tạo báo giá: ${msg}. Vui lòng thử lại.`);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const fmtNum = (n: number) => new Intl.NumberFormat("vi-VN").format(n);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/quotations" className="inline-flex items-center text-sm text-[#4F5FD9] hover:underline mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Quay lại danh sách
        </Link>

        <PageHeader title="Tạo báo giá mới" />

        <form onSubmit={handleSubmit} className="mt-6 space-y-8">
          {/* Section 1: Thông tin chung */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-[#2D3A8C] mb-4">Thông tin chung</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã báo giá</label>
                <input type="text" value={quotationCode} readOnly className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chi nhánh</label>
                <select value={branch} onChange={(e) => setBranch(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]/40 focus:border-[#4F5FD9]">
                  <option value="HN">Hà Nội</option>
                  <option value="HCM">Hồ Chí Minh</option>
                </select>
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
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại dịch vụ</label>
              <div className="flex flex-wrap gap-3">
                {SERVICE_TYPES.map((svc) => (
                  <label key={svc} className="inline-flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox" checked={selectedServices.includes(svc)}
                      onChange={() => toggleService(svc)}
                      className="h-4 w-4 rounded border-gray-300 text-[#4F5FD9] focus:ring-[#4F5FD9]"
                    />
                    <span className="text-sm text-gray-700">{svc} <span className="text-gray-400">({SERVICE_LABELS[svc]})</span></span>
                  </label>
                ))}
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
                onChange={(e) => { setCustomerName(e.target.value); setCustomerSearch(e.target.value); setShowCustomerDropdown(true); setCustomerId(""); }}
                onFocus={() => setShowCustomerDropdown(true)}
                onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                placeholder="Tìm khách hàng..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]/40 focus:border-[#4F5FD9]"
              />
              {showCustomerDropdown && filteredCustomers.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {loadingCustomers ? (
                    <div className="p-3 text-sm text-gray-400">Đang tải...</div>
                  ) : (
                    filteredCustomers.map((c) => {
                      const name = c.CompanyName || c.ContactName || c.Name || c.CustomerName || "";
                      return (
                        <button
                          key={c.id} type="button"
                          onMouseDown={() => { setCustomerName(name); setCustomerId(c.id); setShowCustomerDropdown(false); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                        >
                          <span className="font-medium">{name}</span>
                          {c.CustomerCode && <span className="text-gray-400 ml-2 text-xs">{c.CustomerCode}</span>}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Section 3: Hàng hóa */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#2D3A8C]">Hàng hóa</h2>
              <button type="button" onClick={addItem} className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-[#4F5FD9] border border-[#4F5FD9] rounded-lg hover:bg-[#4F5FD9]/5 transition-colors">
                <Plus className="h-4 w-4 mr-1" /> Thêm hàng
              </button>
            </div>
            <div className="space-y-4">
              {items.map((item, idx) => (
                <LineItemForm key={item.id} item={item} idx={idx} canRemove={items.length > 1} onUpdate={updateItem} onRemove={removeItem} />
              ))}
            </div>
          </section>

          {/* Section 4: Chi phí & Giảm giá */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-[#2D3A8C] mb-4">Chi phí & Giảm giá</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tổng CNY (tự tính từ hàng hóa)</label>
                <input type="text" value={`${fmtNum(totalCNY)} CNY`} readOnly className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tỷ giá (VNĐ/CNY)
                  {todayRate && <span className="text-xs text-green-600 ml-2">Tự động: {fmtNum(todayRate)}</span>}
                </label>
                <input type="number" value={exchangeRate} onChange={(e) => setExchangeRate(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]/40 focus:border-[#4F5FD9]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phí dịch vụ (VNĐ)</label>
                <input type="number" value={serviceFeeVND} onChange={(e) => setServiceFeeVND(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]/40 focus:border-[#4F5FD9]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phí vận chuyển (VNĐ)</label>
                <input type="number" value={shippingFeeVND} onChange={(e) => setShippingFeeVND(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]/40 focus:border-[#4F5FD9]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giảm giá (%)</label>
                <input type="number" min={0} max={100} value={discountPercent}
                  onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]/40 focus:border-[#4F5FD9]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền giảm</label>
                <input type="text" value={`${fmtNum(discountAmount)} ₫`} readOnly className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-500" />
              </div>
            </div>

            {/* Discount warning */}
            {discountPercent > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Giảm giá {discountPercent}% cần phê duyệt</p>
                  <p className="text-xs text-yellow-700 mt-0.5">Chuỗi phê duyệt: {approvalChain}</p>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="mt-4 bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Hàng hóa (CNY → VND)</span>
                <span className="font-medium">{fmtNum(totalCNY * exchangeRate)} ₫</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">+ Phí dịch vụ + Vận chuyển</span>
                <span className="font-medium">{fmtNum(serviceFeeVND + shippingFeeVND)} ₫</span>
              </div>
              {discountPercent > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>- Giảm giá {discountPercent}%</span>
                  <span>-{fmtNum(discountAmount)} ₫</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold border-t pt-2">
                <span className="text-[#2D3A8C]">Thành tiền</span>
                <span className="text-[#2D3A8C]">{fmtNum(finalTotal)} ₫</span>
              </div>
            </div>
          </section>

          {/* Section 5: Ghi chú */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-[#2D3A8C] mb-4">Ghi chú</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Nhập ghi chú..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]/40 focus:border-[#4F5FD9] resize-none" />
              </div>
              <div className="max-w-xs">
                <label className="block text-sm font-medium text-gray-700 mb-1">Hiệu lực đến</label>
                <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]/40 focus:border-[#4F5FD9]" />
              </div>
            </div>
          </section>

          {/* Submit */}
          <div className="flex items-center justify-end space-x-3">
            <Link href="/quotations" className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Hủy</Link>
            <button type="submit" disabled={submitting}
              className="inline-flex items-center px-5 py-2 text-sm font-medium text-white bg-[#4F5FD9] rounded-lg hover:bg-[#3D4DB8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Tạo báo giá
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
