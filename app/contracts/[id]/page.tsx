"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getContract, updateContract, createContract, type Contract } from "@/lib/contracts";
import { getOrders, type Order } from "@/lib/orders";
import { getCustomers, type Customer } from "@/lib/customers";
import { formatCurrency, formatDate, generateCode } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import {
  ArrowLeft, FileSignature, Calendar, DollarSign, StickyNote,
  Edit3, Save, X, Send, CheckCircle, XCircle, Play, Trophy,
  Loader2, AlertTriangle, Info, Copy, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CURRENCIES = ["VND", "CNY", "USD"];

// ─── Allowed transitions ─────────────────────
function getAllowedTransitions(status: string): { label: string; newStatus: string; icon: React.ElementType; color: string; confirm?: string }[] {
  switch (status) {
    case "Nháp":
      return [
        { label: "Gửi ký", newStatus: "Chờ ký", icon: Send, color: "bg-[#4F5FD9] hover:bg-[#3D4DB8] text-white" },
        { label: "Hủy hợp đồng", newStatus: "Đã hủy", icon: XCircle, color: "bg-white border border-red-300 text-red-600 hover:bg-red-50", confirm: "Xác nhận hủy hợp đồng này?" },
      ];
    case "Chờ ký":
      return [
        { label: "Xác nhận đã ký", newStatus: "Đã ký", icon: CheckCircle, color: "bg-green-600 hover:bg-green-700 text-white" },
        { label: "Hủy hợp đồng", newStatus: "Đã hủy", icon: XCircle, color: "bg-white border border-red-300 text-red-600 hover:bg-red-50", confirm: "Xác nhận hủy hợp đồng này?" },
      ];
    case "Đã ký":
      return [
        { label: "Kích hoạt", newStatus: "Đang thực hiện", icon: Play, color: "bg-[#4F5FD9] hover:bg-[#3D4DB8] text-white" },
      ];
    case "Đang thực hiện":
      return [
        { label: "Hoàn thành", newStatus: "Hoàn thành", icon: Trophy, color: "bg-green-600 hover:bg-green-700 text-white" },
        { label: "Hủy hợp đồng", newStatus: "Đã hủy", icon: XCircle, color: "bg-white border border-red-300 text-red-600 hover:bg-red-50", confirm: "Hợp đồng đang thực hiện. Xác nhận hủy?" },
      ];
    default:
      return [];
  }
}

function canEdit(status: string): boolean {
  return status === "Nháp" || status === "Chờ ký";
}

function canRenew(status: string): boolean {
  return status === "Hoàn thành" || status === "Đang thực hiện";
}

// ─── Skeleton ─────────────────────────────────
function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className ?? "h-4 w-full"}`} />;
}

// ─── DetailRow ────────────────────────────────
function DetailRow({ label, value, href }: { label: string; value: React.ReactNode; href?: string }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      {href ? (
        <Link href={href} className="text-sm font-medium text-[#4F5FD9] hover:text-[#3B4CC0] inline-flex items-center gap-1">
          {value} <ExternalLink className="w-3 h-3" />
        </Link>
      ) : (
        <span className="text-sm font-medium text-gray-900">{value || "---"}</span>
      )}
    </div>
  );
}

// ─── SectionCard ──────────────────────────────
function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-white border rounded-xl overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b bg-gray-50">
        <Icon className="w-5 h-5 text-[#4F5FD9]" />
        <h2 className="text-base font-semibold text-[#2D3A8C]">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─── Edit Form (inline) ──────────────────────
function EditForm({
  contract, onSave, onCancel, saving,
}: {
  contract: Contract; onSave: (data: Partial<Contract>) => void; onCancel: () => void; saving: boolean;
}) {
  const [title, setTitle] = useState(contract.Title || "");
  const [customerName, setCustomerName] = useState(contract.CustomerName || "");
  const [contractValue, setContractValue] = useState(contract.ContractValue || 0);
  const [currency, setCurrency] = useState(contract.Currency || "VND");
  const [startDate, setStartDate] = useState(contract.StartDate ? contract.StartDate.split("T")[0] : "");
  const [endDate, setEndDate] = useState(contract.EndDate ? contract.EndDate.split("T")[0] : "");
  const [saleOwner, setSaleOwner] = useState(contract.SaleOwner || "");
  const [notes, setNotes] = useState(contract.Notes || "");

  function handleSave() {
    if (!title.trim()) { toast.error("Tiêu đề không được để trống"); return; }
    if (!customerName.trim()) { toast.error("Khách hàng không được để trống"); return; }
    if (contractValue <= 0) { toast.error("Giá trị hợp đồng phải > 0"); return; }
    if (endDate && startDate && new Date(endDate) < new Date(startDate)) {
      toast.error("Ngày kết thúc phải sau ngày bắt đầu"); return;
    }
    onSave({
      Title: title,
      CustomerName: customerName,
      ContractValue: contractValue,
      Currency: currency,
      StartDate: startDate || undefined,
      EndDate: endDate || undefined,
      SaleOwner: saleOwner || undefined,
      Notes: notes || undefined,
    });
  }

  const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]/40 focus:border-[#4F5FD9]";

  return (
    <div className="space-y-6">
      <SectionCard title="Chỉnh sửa hợp đồng" icon={Edit3}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Khách hàng *</label>
            <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sale phụ trách</label>
            <input type="text" value={saleOwner} onChange={(e) => setSaleOwner(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Giá trị HĐ *</label>
            <input type="number" min={0} value={contractValue} onChange={(e) => setContractValue(Number(e.target.value) || 0)} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tiền tệ</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputCls}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={cn(inputCls, "resize-none")} />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 mt-6">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <X className="w-4 h-4 inline mr-1" /> Hủy
          </button>
          <button onClick={handleSave} disabled={saving}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#4F5FD9] rounded-lg hover:bg-[#3D4DB8] transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
            Lưu thay đổi
          </button>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Main Page ────────────────────────────────
export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [contract, setContract] = useState<Contract | null>(null);
  const [relatedOrders, setRelatedOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRenewConfirm, setShowRenewConfirm] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const data = await getContract(params.id as string);
        setContract(data);
      } catch {
        toast.error("Lỗi tải thông tin hợp đồng");
      } finally {
        setLoading(false);
      }
    }
    if (params.id) fetchData();
  }, [params.id]);

  // Bug #14: Load orders within contract period with matching customerId
  useEffect(() => {
    if (!contract?.CustomerId) return;
    setLoadingOrders(true);
    getOrders({ take: 200, sortField: "createdAt", sortDirection: "desc" })
      .then(({ data }) => {
        const startMs = contract.StartDate ? new Date(contract.StartDate).getTime() : -Infinity;
        const endMs = contract.EndDate ? new Date(contract.EndDate).getTime() : Infinity;
        setRelatedOrders(
          data.filter((o) => {
            if (o.CustomerId !== contract.CustomerId) return false;
            const created = o.createdAt ? new Date(o.createdAt).getTime() : 0;
            return created >= startMs && created <= endMs;
          })
        );
      })
      .catch(() => { /* silent */ })
      .finally(() => setLoadingOrders(false));
  }, [contract?.CustomerId, contract?.StartDate, contract?.EndDate]);

  // ─── Auto-checks ────────────────────────────
  const warnings = useMemo(() => {
    if (!contract) return [];
    const w: { type: "warning" | "info"; message: string }[] = [];
    const today = new Date().toISOString().split("T")[0];

    if (contract.Status === "Đang thực hiện" && contract.EndDate && contract.EndDate.split("T")[0] < today) {
      w.push({ type: "warning", message: "Hợp đồng đã quá hạn kết thúc" });
    }
    if (contract.Status === "Đã ký" && contract.StartDate && contract.StartDate.split("T")[0] <= today) {
      w.push({ type: "info", message: "Hợp đồng đã đến ngày bắt đầu — sẵn sàng kích hoạt" });
    }
    return w;
  }, [contract]);

  // ─── Status transition ──────────────────────
  async function handleTransition(newStatus: string, confirmMsg?: string) {
    if (!contract) return;
    if (confirmMsg && !confirm(confirmMsg)) return;

    // Validate before sending for signing
    if (newStatus === "Chờ ký") {
      if (!contract.Title?.trim()) { toast.error("Cần có tiêu đề hợp đồng"); return; }
      if (!contract.CustomerName?.trim()) { toast.error("Cần có khách hàng"); return; }
      if (!contract.ContractValue || contract.ContractValue <= 0) { toast.error("Giá trị hợp đồng phải > 0"); return; }
    }

    setActionLoading(true);
    try {
      const updates: Record<string, any> = { Status: newStatus };
      // Auto-fill SignDate when marking as signed
      if (newStatus === "Đã ký" && !contract.SignDate) {
        updates.SignDate = new Date().toISOString();
      }
      await updateContract(contract.id, updates);
      setContract((prev) => prev ? { ...prev, ...updates } : prev);
      toast.success(`Đã chuyển trạng thái sang "${newStatus}"`);
    } catch {
      toast.error("Lỗi chuyển trạng thái");
    } finally {
      setActionLoading(false);
    }
  }

  // ─── Save edit ──────────────────────────────
  async function handleSave(data: Partial<Contract>) {
    if (!contract) return;
    setSaving(true);
    try {
      await updateContract(contract.id, data);
      setContract((prev) => prev ? { ...prev, ...data } : prev);
      setEditing(false);
      toast.success("Đã lưu thay đổi");
    } catch {
      toast.error("Lỗi lưu thay đổi");
    } finally {
      setSaving(false);
    }
  }

  // ─── Renew contract ────────────────────────
  async function handleRenew() {
    if (!contract) return;

    setShowRenewConfirm(false);
    setActionLoading(true);
    try {
      const newStartDate = contract.EndDate
        ? new Date(new Date(contract.EndDate).getTime() + 86400000).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

      const renewed = await createContract({
        ContractCode: generateCode("HD"),
        Title: `${contract.Title} (Gia hạn)`,
        CustomerName: contract.CustomerName,
        CustomerId: contract.CustomerId,
        OrderId: contract.OrderId,
        OrderCode: contract.OrderCode,
        ContractValue: contract.ContractValue,
        Currency: contract.Currency,
        StartDate: newStartDate,
        SaleOwner: contract.SaleOwner,
        Notes: `Gia hạn từ ${contract.ContractCode}`,
        Status: "Nháp",
      });

      const newId = renewed?.id || (renewed as any)?.data?.id;
      toast.success("Đã tạo hợp đồng gia hạn");
      router.push(`/contracts/${newId}`);
    } catch {
      toast.error("Lỗi tạo hợp đồng gia hạn");
    } finally {
      setActionLoading(false);
    }
  }

  // ─── Render ─────────────────────────────────
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <SkeletonBlock className="h-8 w-48" />
        <SkeletonBlock className="h-5 w-32" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="p-6">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
        <p className="text-gray-500">Không tìm thấy hợp đồng.</p>
      </div>
    );
  }

  const transitions = getAllowedTransitions(contract.Status || "");

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <Link href="/contracts" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ArrowLeft className="w-4 h-4" /> Hợp đồng
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#2D3A8C]">{contract.ContractCode}</h1>
            {contract.Title && <p className="text-gray-500 mt-1">{contract.Title}</p>}
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={contract.Status} />
          </div>
        </div>
      </div>

      {/* Warnings & suggestions */}
      {warnings.map((w, i) => (
        <div
          key={i}
          className={cn(
            "p-3 rounded-lg flex items-start gap-2 border",
            w.type === "warning" ? "bg-yellow-50 border-yellow-200" : "bg-blue-50 border-blue-200"
          )}
        >
          {w.type === "warning" ? (
            <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
          ) : (
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          )}
          <p className={cn("text-sm", w.type === "warning" ? "text-yellow-800" : "text-blue-800")}>
            {w.message}
          </p>
        </div>
      ))}

      {/* Action bar */}
      {(transitions.length > 0 || canEdit(contract.Status || "") || canRenew(contract.Status || "")) && (
        <div className="flex items-center gap-2 flex-wrap">
          {canEdit(contract.Status || "") && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Edit3 className="w-4 h-4" /> Chỉnh sửa
            </button>
          )}
          {transitions.map((t) => (
            <button
              key={t.newStatus}
              onClick={() => handleTransition(t.newStatus, t.confirm)}
              disabled={actionLoading}
              className={cn("inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50", t.color)}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <t.icon className="w-4 h-4" />}
              {t.label}
            </button>
          ))}
          {canRenew(contract.Status || "") && (
            <button
              onClick={() => setShowRenewConfirm(true)}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-[#4F5FD9] text-[#4F5FD9] rounded-lg hover:bg-[#4F5FD9]/5 transition-colors disabled:opacity-50"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
              Gia hạn
            </button>
          )}

          {/* Renew confirmation modal */}
          {showRenewConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
                <h3 className="text-lg font-semibold text-[#2D3A8C] mb-2">Gia hạn hợp đồng</h3>
                <p className="text-sm text-gray-600 mb-6">Tạo hợp đồng gia hạn mới từ hợp đồng này?</p>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setShowRenewConfirm(false)} className="px-4 py-2 text-sm font-medium text-gray-700 border rounded-lg hover:bg-gray-50">Hủy</button>
                  <button onClick={handleRenew} className="px-4 py-2 text-sm font-medium text-white bg-[#4F5FD9] rounded-lg hover:bg-[#3B4CC0]">Xác nhận</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit mode or View mode */}
      {editing ? (
        <EditForm contract={contract} onSave={handleSave} onCancel={() => setEditing(false)} saving={saving} />
      ) : (
        <>
          {/* Contract info */}
          <SectionCard title="Thông tin hợp đồng" icon={FileSignature}>
            <DetailRow label="Mã hợp đồng" value={contract.ContractCode} />
            <DetailRow label="Tiêu đề" value={contract.Title} />
            <DetailRow
              label="Khách hàng"
              value={contract.CustomerName}
              href={contract.CustomerId ? `/customers/${contract.CustomerId}` : undefined}
            />
            <DetailRow
              label="Đơn hàng"
              value={contract.OrderCode}
              href={contract.OrderId ? `/orders/${contract.OrderId}` : undefined}
            />
            <DetailRow label="Sale phụ trách" value={contract.SaleOwner} />
            <DetailRow label="Trạng thái" value={<StatusBadge status={contract.Status} />} />
          </SectionCard>

          {/* Financial */}
          <SectionCard title="Giá trị hợp đồng" icon={DollarSign}>
            <DetailRow label="Giá trị" value={formatCurrency(contract.ContractValue, contract.Currency)} />
            <DetailRow label="Tiền tệ" value={contract.Currency} />
          </SectionCard>

          {/* Dates */}
          <SectionCard title="Thời hạn" icon={Calendar}>
            <DetailRow label="Ngày ký" value={formatDate(contract.SignDate)} />
            <DetailRow label="Ngày bắt đầu" value={formatDate(contract.StartDate)} />
            <DetailRow label="Ngày kết thúc" value={formatDate(contract.EndDate)} />
            <DetailRow label="Ngày tạo" value={formatDate(contract.createdAt)} />
          </SectionCard>

          {/* Bug #14: Related Orders */}
          <SectionCard title="Đơn hàng trong khuôn khổ hợp đồng" icon={FileSignature}>
            {loadingOrders ? (
              <SkeletonBlock className="h-20 w-full" />
            ) : !contract.CustomerId ? (
              <p className="text-sm text-gray-400 text-center py-4">Hợp đồng chưa liên kết khách hàng — không thể tổng hợp đơn hàng.</p>
            ) : relatedOrders.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Chưa có đơn hàng nào trong thời gian hợp đồng.</p>
            ) : (
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
                    {relatedOrders.map((o) => (
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
                  <tfoot>
                    <tr className="border-t-2 border-gray-200">
                      <td colSpan={2} className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Tổng giá trị đơn hàng</td>
                      <td className="px-4 py-3 text-right text-base font-bold text-[#2D3A8C]">
                        {formatCurrency(relatedOrders.reduce((s, o) => s + (o.TotalVND ?? 0), 0))}
                      </td>
                      <td className="px-6 py-3 text-xs text-gray-500">{relatedOrders.length} đơn</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </SectionCard>

          {/* Notes */}
          {contract.Notes && (
            <SectionCard title="Ghi chú" icon={StickyNote}>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{contract.Notes}</p>
            </SectionCard>
          )}
        </>
      )}
    </div>
  );
}
