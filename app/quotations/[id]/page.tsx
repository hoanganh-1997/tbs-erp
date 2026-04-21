"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getQuotation, updateQuotation, type Quotation } from "@/lib/quotations";
import {
  getQuotationItems,
  createQuotationItem,
  updateQuotationItem,
  deleteQuotationItem,
  type QuotationItem,
} from "@/lib/quotation-items";
import { getApprovals, createApproval, type Approval } from "@/lib/approvals";
import { getCustomer } from "@/lib/customers";
import { getLead, type Lead } from "@/lib/leads";
import { createOrder, getOrders, type Order } from "@/lib/orders";
import { createOrderItem } from "@/lib/order-items";
import { formatCurrency, formatDate, generateCode } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import {
  ArrowLeft, FileText, DollarSign, ShoppingCart, StickyNote, Send,
  CheckCircle, XCircle, Pencil, Save, X, Plus, Trash2, Loader2,
  ShieldCheck, AlertTriangle, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

// ─── Helpers ─────────────────────────────────────────

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className ?? "h-4 w-full"}`} />;
}

function SectionCard({ title, icon: Icon, action, children }: {
  title: string; icon: React.ElementType; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="bg-white border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
        <div className="flex items-center gap-2.5">
          <Icon className="w-5 h-5 text-[#4F5FD9]" />
          <h2 className="text-base font-semibold text-[#2D3A8C]">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function DetailRow({ label, value, href }: { label: string; value: React.ReactNode; href?: string }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      {href ? (
        <Link href={href} className="text-sm font-medium text-[#4F5FD9] hover:text-[#3B4CC0]">{value}</Link>
      ) : (
        <span className="text-sm font-medium text-gray-900">{value || "---"}</span>
      )}
    </div>
  );
}

function getApprovalChain(discountPercent: number, totalVND: number): string {
  if (totalVND > 100_000_000) return "Leader + KT TT → GĐ KD → BGĐ";
  if (discountPercent > 5) return "Leader + KT TT → GĐ KD → BGĐ";
  if (discountPercent > 3) return "Leader + KT TT → GĐ KD";
  if (discountPercent > 0) return "Leader + KT TT";
  return "";
}

function getApprovalSteps(chain: string): number {
  if (!chain) return 0;
  return chain.split("→").length;
}

// ─── Main Page ───────────────────────────────────────

export default function QuotationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [approval, setApproval] = useState<Approval | null>(null);
  const [sourceLead, setSourceLead] = useState<Lead | null>(null);
  const [linkedOrders, setLinkedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showConvertModal, setShowConvertModal] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    CustomerName: "", ServiceFeeVND: 0, ShippingFeeVND: 0,
    ExchangeRate: 3500, DiscountPercent: 0, Notes: "", ValidUntil: "",
  });
  const [editItems, setEditItems] = useState<Array<{
    id: string; isNew?: boolean; ProductName: string; SKU: string;
    ProductLink: string; Attributes: string; Quantity: number; UnitPriceCNY: number;
  }>>([]);

  // ─── Fetch Data ──────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [q, itemsRes, approvalsRes, ordersRes] = await Promise.all([
        getQuotation(id),
        getQuotationItems({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
        getApprovals({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
        getOrders({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
      ]);
      setQuotation(q);
      setItems(itemsRes.data.filter((i) => i.QuotationId === id));
      // Bug #12: linked orders via QuotationId
      setLinkedOrders(ordersRes.data.filter((o) => o.QuotationId === id));

      const relatedApproval = approvalsRes.data.find(
        (a) => a.ReferenceId === id && a.ReferenceType === "quotation"
      );
      setApproval(relatedApproval || null);

      // Bug #12: fetch source lead if any
      if (q.LeadId) {
        try {
          const lead = await getLead(q.LeadId);
          setSourceLead(lead);
        } catch {
          // Lead may have been deleted
        }
      }

      // Auto-expire check
      if (q.ValidUntil && (q.Status === "Nháp" || q.Status === "Đã gửi")) {
        const expiry = new Date(q.ValidUntil);
        if (expiry < new Date()) {
          await updateQuotation(id, { Status: "Hết hạn" });
          setQuotation((prev) => prev ? { ...prev, Status: "Hết hạn" } : prev);
          toast.info("Báo giá đã hết hạn tự động");
        }
      }
    } catch {
      toast.error("Lỗi tải thông tin báo giá");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Derived ─────────────────────────────────────
  const serviceTypes = useMemo(() => {
    if (!quotation?.ServiceTypes) return [];
    return Array.isArray(quotation.ServiceTypes)
      ? quotation.ServiceTypes
      : String(quotation.ServiceTypes).split(",").filter(Boolean);
  }, [quotation?.ServiceTypes]);

  const needsApproval = (quotation?.DiscountPercent ?? 0) > 0;
  const approvalApproved = approval?.Status === "Đã duyệt";
  const canFinalize = !needsApproval || approvalApproved;

  // ─── Enter Edit Mode ────────────────────────────
  function startEditing() {
    if (!quotation) return;
    setEditForm({
      CustomerName: quotation.CustomerName || "",
      ServiceFeeVND: quotation.ServiceFeeVND ?? 0,
      ShippingFeeVND: quotation.ShippingFeeVND ?? 0,
      ExchangeRate: quotation.ExchangeRate ?? 3500,
      DiscountPercent: quotation.DiscountPercent ?? 0,
      Notes: quotation.Notes || "",
      ValidUntil: quotation.ValidUntil ? quotation.ValidUntil.split("T")[0] : "",
    });
    setEditItems(items.map((i) => ({
      id: i.id, ProductName: i.ProductName || "", SKU: i.SKU || "",
      ProductLink: i.ProductLink || "", Attributes: i.Attributes || "",
      Quantity: i.Quantity ?? 1, UnitPriceCNY: i.UnitPriceCNY ?? 0,
    })));
    setEditing(true);
  }

  // ─── Save Edit ──────────────────────────────────
  async function handleSave() {
    setSaving(true);
    try {
      const totalCNY = editItems.reduce((s, i) => s + i.Quantity * i.UnitPriceCNY, 0);
      const subTotal = totalCNY * editForm.ExchangeRate + editForm.ServiceFeeVND + editForm.ShippingFeeVND;
      const discountAmount = Math.round((subTotal * editForm.DiscountPercent) / 100);
      const totalVND = subTotal - discountAmount;

      await updateQuotation(id, {
        CustomerName: editForm.CustomerName,
        ServiceFeeVND: editForm.ServiceFeeVND,
        ShippingFeeVND: editForm.ShippingFeeVND,
        ExchangeRate: editForm.ExchangeRate,
        DiscountPercent: editForm.DiscountPercent,
        DiscountAmount: discountAmount,
        TotalCNY: totalCNY,
        TotalVND: totalVND,
        Notes: editForm.Notes,
        ValidUntil: editForm.ValidUntil || undefined,
      });

      // Update existing items, create new ones, delete removed ones
      const existingIds = new Set(editItems.filter((i) => !i.isNew).map((i) => i.id));
      const toDelete = items.filter((i) => !existingIds.has(i.id));

      await Promise.all([
        ...toDelete.map((i) => deleteQuotationItem(i.id)),
        ...editItems.filter((i) => !i.isNew).map((i) =>
          updateQuotationItem(i.id, {
            ProductName: i.ProductName, SKU: i.SKU, ProductLink: i.ProductLink,
            Attributes: i.Attributes, Quantity: i.Quantity, UnitPriceCNY: i.UnitPriceCNY,
            TotalCNY: i.Quantity * i.UnitPriceCNY,
          })
        ),
        ...editItems.filter((i) => i.isNew && i.ProductName.trim()).map((i) =>
          createQuotationItem({
            QuotationId: id, ProductName: i.ProductName, SKU: i.SKU,
            ProductLink: i.ProductLink, Attributes: i.Attributes,
            Quantity: i.Quantity, UnitPriceCNY: i.UnitPriceCNY,
            TotalCNY: i.Quantity * i.UnitPriceCNY,
          })
        ),
      ]);

      toast.success("Cập nhật báo giá thành công");
      setEditing(false);
      fetchData();
    } catch {
      toast.error("Lỗi cập nhật báo giá");
    } finally {
      setSaving(false);
    }
  }

  // ─── Status Actions ─────────────────────────────
  async function handleSendToCustomer() {
    if (!quotation) return;
    if (items.length === 0) { toast.error("Cần có ít nhất 1 mặt hàng"); return; }

    setActionLoading("send");
    try {
      // Create approval if discount > 0%
      if ((quotation.DiscountPercent ?? 0) > 0 && !approval) {
        const chain = getApprovalChain(quotation.DiscountPercent ?? 0, quotation.TotalVND ?? 0);
        const steps = getApprovalSteps(chain);
        await createApproval({
          ApprovalCode: generateCode("PD"),
          Type: "Giảm giá",
          ReferenceType: "quotation",
          ReferenceId: id,
          ReferenceCode: quotation.QuotationCode,
          RequestedBy: quotation.SaleOwner || "Sale",
          CurrentApprover: chain.split("→")[0]?.trim() || "",
          ApprovalChain: chain,
          CurrentStep: 1,
          TotalSteps: steps,
          Status: "Chờ duyệt",
          SLAHours: quotation.DiscountPercent! > 3 ? 4 : 2,
          Summary: `Giảm giá ${quotation.DiscountPercent}% cho ${quotation.QuotationCode}`,
          Amount: quotation.DiscountAmount,
        });
      }

      await updateQuotation(id, { Status: "Đã gửi" });
      toast.success("Đã gửi báo giá cho khách hàng");
      fetchData();
    } catch (err) {
      console.error("Lỗi gửi báo giá:", err);
      toast.error("Lỗi gửi báo giá");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject() {
    setActionLoading("reject");
    try {
      await updateQuotation(id, { Status: "Từ chối" });
      toast.success("Đã cập nhật: Khách hàng từ chối");
      fetchData();
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái:", err);
      toast.error("Lỗi cập nhật trạng thái");
    } finally {
      setActionLoading(null);
    }
  }

  // ─── Convert to Order ───────────────────────────
  async function handleConvertToOrder() {
    if (!quotation) return;
    setActionLoading("convert");
    try {
      // 1. Update quotation status
      await updateQuotation(id, { Status: "Đã chốt", IsFinal: true });

      // 2. Fetch customer delivery info
      let customerData: { CompanyName?: string; DeliveryAddress?: string; ReceiverName?: string; ReceiverPhone?: string } = {};
      if (quotation.CustomerId) {
        try {
          const cust = await getCustomer(quotation.CustomerId);
          customerData = {
            CompanyName: cust.CompanyName,
            DeliveryAddress: cust.DeliveryAddress,
            ReceiverName: cust.ReceiverName,
            ReceiverPhone: cust.ReceiverPhone,
          };
        } catch { /* customer not found, continue without */ }
      }

      // 3. Create order
      const orderCode = generateCode("DH");
      const order = await createOrder({
        OrderCode: orderCode,
        CustomerId: quotation.CustomerId,
        CustomerName: quotation.CustomerName,
        CompanyName: customerData.CompanyName,
        ServiceTypes: serviceTypes,
        Status: "Nháp",
        StageNumber: 1,
        Branch: quotation.Branch,
        SaleOwner: quotation.SaleOwner,
        ItemsTotalCNY: quotation.TotalCNY,
        ServiceFeeVND: quotation.ServiceFeeVND,
        ShippingFeeVND: quotation.ShippingFeeVND,
        TotalVND: quotation.TotalVND,
        ExchangeRate: quotation.ExchangeRate,
        DeliveryAddress: customerData.DeliveryAddress,
        ReceiverName: customerData.ReceiverName,
        ReceiverPhone: customerData.ReceiverPhone,
        Priority: "Thường",
        QuotationId: id,
        Notes: `Tạo từ báo giá ${quotation.QuotationCode}`,
      });

      const orderId = order?.id || (order as any)?.data?.id;

      // 4. Copy items
      if (orderId && items.length > 0) {
        await Promise.all(
          items.map((item) =>
            createOrderItem({
              OrderId: orderId,
              ProductName: item.ProductName,
              ProductLink: item.ProductLink,
              SKU: item.SKU,
              Attributes: item.Attributes,
              Quantity: item.Quantity,
              UnitPriceCNY: item.UnitPriceCNY,
              TotalCNY: item.TotalCNY,
              Status: "Chờ mua",
            })
          )
        );
      }

      toast.success(`Đã tạo đơn hàng ${orderCode}`);
      setShowConvertModal(false);
      router.push(`/orders/${orderId}`);
    } catch (err) {
      console.error("Lỗi tạo đơn hàng từ báo giá:", err);
      toast.error("Lỗi tạo đơn hàng từ báo giá");
    } finally {
      setActionLoading(null);
    }
  }

  // ─── Edit Items Helpers ─────────────────────────
  function addEditItem() {
    setEditItems((prev) => [...prev, {
      id: Math.random().toString(36).slice(2, 10),
      isNew: true, ProductName: "", SKU: "", ProductLink: "",
      Attributes: "", Quantity: 1, UnitPriceCNY: 0,
    }]);
  }

  function removeEditItem(itemId: string) {
    if (editItems.length <= 1) return;
    setEditItems((prev) => prev.filter((i) => i.id !== itemId));
  }

  function updateEditItem(itemId: string, field: string, value: any) {
    setEditItems((prev) => prev.map((i) => i.id === itemId ? { ...i, [field]: value } : i));
  }

  const editTotalCNY = editItems.reduce((s, i) => s + i.Quantity * i.UnitPriceCNY, 0);
  const editSubTotal = editTotalCNY * editForm.ExchangeRate + editForm.ServiceFeeVND + editForm.ShippingFeeVND;
  const editDiscountAmount = Math.round((editSubTotal * editForm.DiscountPercent) / 100);
  const editFinalTotal = editSubTotal - editDiscountAmount;

  // ─── Loading ────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <SkeletonBlock className="h-8 w-48" />
        <SkeletonBlock className="h-5 w-32" />
        {Array.from({ length: 3 }).map((_, i) => <SkeletonBlock key={i} className="h-48 w-full" />)}
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="p-6">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
        <p className="text-gray-500">Không tìm thấy báo giá.</p>
      </div>
    );
  }

  const fmtNum = (n: number) => new Intl.NumberFormat("vi-VN").format(n);
  const isEditable = quotation.Status === "Nháp";
  const isSent = quotation.Status === "Đã gửi";

  return (
    <div className="p-6 space-y-6">
      {/* ─── Header ─────────────────────────────── */}
      <div>
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ArrowLeft className="w-4 h-4" /> Báo giá
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#2D3A8C]">{quotation.QuotationCode}</h1>
            <p className="text-gray-500 mt-1">{quotation.CustomerName}</p>
          </div>
          <StatusBadge status={quotation.Status} />
        </div>
      </div>

      {/* ─── Status Action Bar ──────────────────── */}
      {(isEditable || isSent) && !editing && (
        <div className="bg-white border rounded-xl p-4 flex flex-wrap items-center gap-3">
          {isEditable && (
            <>
              <button
                onClick={startEditing}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Pencil className="w-4 h-4" /> Chỉnh sửa
              </button>
              <button
                onClick={handleSendToCustomer}
                disabled={actionLoading === "send"}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#4F5FD9] text-white rounded-lg text-sm font-medium hover:bg-[#3B4CC0] disabled:opacity-50 transition-colors"
              >
                {actionLoading === "send" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Gửi khách hàng
              </button>
            </>
          )}
          {isSent && (
            <>
              <button
                onClick={() => canFinalize ? setShowConvertModal(true) : toast.error("Cần phê duyệt giảm giá trước khi chốt")}
                disabled={actionLoading === "convert"}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  canFinalize
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                )}
              >
                {actionLoading === "convert" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Chốt & Tạo đơn hàng
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading === "reject"}
                className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                {actionLoading === "reject" ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                KH từ chối
              </button>
            </>
          )}
        </div>
      )}

      {/* ─── Edit Mode Bar ──────────────────────── */}
      {editing && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
          <p className="text-sm text-blue-700 font-medium">Đang chỉnh sửa báo giá</p>
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-white transition-colors">
              <X className="w-4 h-4" /> Hủy
            </button>
            <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-[#4F5FD9] text-white rounded-lg text-sm font-medium hover:bg-[#3B4CC0] disabled:opacity-50 transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </div>
      )}

      {/* ─── Discount Approval Banner ───────────── */}
      {needsApproval && approval && (
        <div className={cn(
          "border rounded-xl p-4 flex items-start gap-3",
          approval.Status === "Đã duyệt" ? "bg-green-50 border-green-200" :
          approval.Status === "Từ chối" ? "bg-red-50 border-red-200" :
          "bg-yellow-50 border-yellow-200"
        )}>
          {approval.Status === "Đã duyệt" ? (
            <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : approval.Status === "Từ chối" ? (
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className={cn("text-sm font-medium",
              approval.Status === "Đã duyệt" ? "text-green-800" :
              approval.Status === "Từ chối" ? "text-red-800" : "text-yellow-800"
            )}>
              Phê duyệt giảm giá {quotation.DiscountPercent}%: {approval.Status}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Chuỗi duyệt: {approval.ApprovalChain} — Bước {approval.CurrentStep}/{approval.TotalSteps}
            </p>
            {approval.DecisionNote && (
              <p className="text-xs text-gray-500 mt-1">Ghi chú: {approval.DecisionNote}</p>
            )}
          </div>
        </div>
      )}

      {needsApproval && !approval && quotation.Status === "Nháp" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800">
              Giảm giá {quotation.DiscountPercent}% cần phê duyệt
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Khi gửi khách hàng, hệ thống sẽ tự động tạo yêu cầu phê duyệt: {getApprovalChain(quotation.DiscountPercent ?? 0, quotation.TotalVND ?? 0)}
            </p>
          </div>
        </div>
      )}

      {/* ─── Quotation Info ─────────────────────── */}
      {!editing ? (
        <>
          <SectionCard title="Thông tin báo giá" icon={FileText}>
            <DetailRow label="Mã báo giá" value={quotation.QuotationCode} />
            <DetailRow label="Khách hàng" value={quotation.CustomerName} href={quotation.CustomerId ? `/customers/${quotation.CustomerId}` : undefined} />
            {sourceLead && (
              <DetailRow
                label="Lead nguồn"
                value={`${sourceLead.LeadCode || ""} — ${sourceLead.FullName || ""}`}
                href={`/leads/${sourceLead.id}`}
              />
            )}
            <DetailRow label="Loại dịch vụ" value={
              serviceTypes.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {serviceTypes.map((st) => (
                    <span key={st} className="inline-block px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">{st.trim()}</span>
                  ))}
                </div>
              ) : "---"
            } />
            <DetailRow label="Sale phụ trách" value={quotation.SaleOwner} />
            <DetailRow label="Chi nhánh" value={quotation.Branch} />
            <DetailRow label="Trạng thái" value={<StatusBadge status={quotation.Status} />} />
            <DetailRow label="Hiệu lực đến" value={formatDate(quotation.ValidUntil)} />
            <DetailRow label="Ngày tạo" value={formatDate(quotation.createdAt)} />
          </SectionCard>

          {/* Bug #12: Linked Orders */}
          {linkedOrders.length > 0 && (
            <SectionCard title="Đơn hàng đã chốt" icon={ShoppingCart}>
              <div className="overflow-x-auto -mx-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mã đơn</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tổng VND</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {linkedOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-3">
                          <Link href={`/orders/${o.id}`} className="text-[#4F5FD9] hover:text-[#3B4CC0] font-medium hover:underline">
                            {o.OrderCode || "---"}
                          </Link>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={o.Status} /></td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(o.TotalVND)}</td>
                        <td className="px-6 py-3 text-gray-500 text-xs">{formatDate(o.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}

          {/* Financial */}
          <SectionCard title="Tài chính" icon={DollarSign}>
            <DetailRow label="Tổng tiền CNY" value={quotation.TotalCNY ? formatCurrency(quotation.TotalCNY, "CNY") : "---"} />
            <DetailRow label="Tỷ giá" value={quotation.ExchangeRate ? fmtNum(quotation.ExchangeRate) : "---"} />
            <DetailRow label="Phí dịch vụ" value={formatCurrency(quotation.ServiceFeeVND)} />
            <DetailRow label="Phí vận chuyển" value={formatCurrency(quotation.ShippingFeeVND)} />
            {(quotation.DiscountPercent ?? 0) > 0 && (
              <>
                <DetailRow label="Giảm giá" value={`${quotation.DiscountPercent}%`} />
                <DetailRow label="Số tiền giảm" value={formatCurrency(quotation.DiscountAmount)} />
              </>
            )}
            <div className="grid grid-cols-[140px_1fr] gap-3 py-3 border-t border-gray-200 mt-2">
              <span className="text-sm font-semibold text-gray-700">Tổng cộng VND</span>
              <span className="text-lg font-bold text-[#2D3A8C]">{formatCurrency(quotation.TotalVND)}</span>
            </div>
          </SectionCard>

          {/* Items */}
          <SectionCard title="Danh sách hàng hóa" icon={ShoppingCart}>
            {items.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Chưa có hàng hóa trong báo giá này</p>
            ) : (
              <div className="overflow-x-auto -mx-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">SKU</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Thuộc tính</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">SL</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Đơn giá (CNY)</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-3 text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {item.ProductLink ? (
                            <a href={item.ProductLink} target="_blank" rel="noopener noreferrer" className="text-[#4F5FD9] hover:text-[#3B4CC0] inline-flex items-center gap-1">
                              {item.ProductName || "---"} <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (item.ProductName || "---")}
                        </td>
                        <td className="px-4 py-3 text-gray-600 font-mono text-xs">{item.SKU || "---"}</td>
                        <td className="px-4 py-3 text-gray-600">{item.Attributes || "---"}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{item.Quantity ?? 0}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{item.UnitPriceCNY ? formatCurrency(item.UnitPriceCNY, "CNY") : "---"}</td>
                        <td className="px-6 py-3 text-right font-medium text-gray-900">{item.TotalCNY ? formatCurrency(item.TotalCNY, "CNY") : "---"}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200">
                      <td colSpan={6} className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Tổng CNY</td>
                      <td className="px-6 py-3 text-right text-base font-bold text-[#2D3A8C]">
                        {formatCurrency(items.reduce((s, i) => s + (i.TotalCNY ?? 0), 0), "CNY")}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </SectionCard>

          {/* Notes */}
          {quotation.Notes && (
            <SectionCard title="Ghi chú" icon={StickyNote}>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{quotation.Notes}</p>
            </SectionCard>
          )}
        </>
      ) : (
        /* ─── EDIT MODE ─────────────────────────── */
        <>
          <SectionCard title="Thông tin báo giá" icon={FileText}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Khách hàng</label>
                <input
                  value={editForm.CustomerName}
                  onChange={(e) => setEditForm((f) => ({ ...f, CustomerName: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tỷ giá (VNĐ/CNY)</label>
                  <input
                    type="number" value={editForm.ExchangeRate}
                    onChange={(e) => setEditForm((f) => ({ ...f, ExchangeRate: Number(e.target.value) || 0 }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giảm giá (%)</label>
                  <input
                    type="number" min={0} max={100} value={editForm.DiscountPercent}
                    onChange={(e) => setEditForm((f) => ({ ...f, DiscountPercent: Math.min(100, Math.max(0, Number(e.target.value) || 0)) }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phí dịch vụ (VNĐ)</label>
                  <input
                    type="number" value={editForm.ServiceFeeVND}
                    onChange={(e) => setEditForm((f) => ({ ...f, ServiceFeeVND: Number(e.target.value) || 0 }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phí vận chuyển (VNĐ)</label>
                  <input
                    type="number" value={editForm.ShippingFeeVND}
                    onChange={(e) => setEditForm((f) => ({ ...f, ShippingFeeVND: Number(e.target.value) || 0 }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hiệu lực đến</label>
                <input
                  type="date" value={editForm.ValidUntil}
                  onChange={(e) => setEditForm((f) => ({ ...f, ValidUntil: e.target.value }))}
                  className="w-full max-w-xs border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                <textarea
                  value={editForm.Notes} rows={3}
                  onChange={(e) => setEditForm((f) => ({ ...f, Notes: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none resize-none"
                />
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tổng hàng hóa (CNY)</span>
                  <span className="font-medium">{formatCurrency(editTotalCNY, "CNY")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Quy đổi VND</span>
                  <span className="font-medium">{fmtNum(editTotalCNY * editForm.ExchangeRate)} đ</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">+ Phí dịch vụ + Vận chuyển</span>
                  <span className="font-medium">{fmtNum(editForm.ServiceFeeVND + editForm.ShippingFeeVND)} đ</span>
                </div>
                {editForm.DiscountPercent > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>- Giảm giá {editForm.DiscountPercent}%</span>
                    <span>-{fmtNum(editDiscountAmount)} đ</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold border-t pt-2">
                  <span className="text-[#2D3A8C]">Thành tiền</span>
                  <span className="text-[#2D3A8C]">{fmtNum(editFinalTotal)} đ</span>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Edit Items */}
          <SectionCard
            title="Danh sách hàng hóa"
            icon={ShoppingCart}
            action={
              <button onClick={addEditItem} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#4F5FD9] border border-[#4F5FD9] rounded-lg hover:bg-blue-50 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Thêm hàng
              </button>
            }
          >
            <div className="space-y-4">
              {editItems.map((item, idx) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-500">Mặt hàng #{idx + 1}</span>
                    {editItems.length > 1 && (
                      <button onClick={() => removeEditItem(item.id)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Tên sản phẩm</label>
                      <input value={item.ProductName} onChange={(e) => updateEditItem(item.id, "ProductName", e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">SKU</label>
                      <input value={item.SKU} onChange={(e) => updateEditItem(item.id, "SKU", e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Link sản phẩm</label>
                      <input value={item.ProductLink} onChange={(e) => updateEditItem(item.id, "ProductLink", e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Thuộc tính</label>
                      <input value={item.Attributes} onChange={(e) => updateEditItem(item.id, "Attributes", e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Số lượng</label>
                      <input type="number" min={1} value={item.Quantity} onChange={(e) => updateEditItem(item.id, "Quantity", Number(e.target.value) || 1)}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Đơn giá (CNY)</label>
                      <input type="number" min={0} value={item.UnitPriceCNY} onChange={(e) => updateEditItem(item.id, "UnitPriceCNY", Number(e.target.value) || 0)}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none" />
                    </div>
                  </div>
                  <div className="mt-2 text-right text-sm text-gray-500">
                    Thành tiền: <span className="font-medium text-gray-800">{formatCurrency(item.Quantity * item.UnitPriceCNY, "CNY")}</span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </>
      )}

      {/* ─── Convert to Order Modal ─────────────── */}
      {showConvertModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-[#2D3A8C] mb-2">Chốt & Tạo đơn hàng</h2>
            <p className="text-sm text-gray-600 mb-4">
              Xác nhận chốt báo giá <strong>{quotation.QuotationCode}</strong> và tạo đơn hàng mới?
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Khách hàng</span>
                <span className="font-medium">{quotation.CustomerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Dịch vụ</span>
                <span className="font-medium">{serviceTypes.join(", ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tổng VND</span>
                <span className="font-bold text-[#2D3A8C]">{formatCurrency(quotation.TotalVND)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Số mặt hàng</span>
                <span className="font-medium">{items.length}</span>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowConvertModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Hủy</button>
              <button
                onClick={handleConvertToOrder}
                disabled={actionLoading === "convert"}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 transition-colors"
              >
                {actionLoading === "convert" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
