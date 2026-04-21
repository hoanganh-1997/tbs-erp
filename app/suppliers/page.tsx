"use client";

import { useEffect, useState, useMemo } from "react";
import { getSuppliers, createSupplier } from "@/lib/suppliers";
import type { Supplier } from "@/lib/suppliers";
import { cn, formatDate, generateCode } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import { Search, X, ChevronLeft, ChevronRight, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

const STATUSES = ["Tất cả", "Hoạt động", "Tạm ngưng", "Đã khóa"] as const;
const CATEGORIES = ["Hàng hóa", "Vận tải", "Kho bãi", "Thông quan", "Khác"];
const COUNTRIES = ["Trung Quốc", "Việt Nam", "Khác"];
const PAGE_SIZE = 20;

function renderStars(rating: number | undefined) {
  const r = Math.round(rating || 0);
  return (
    <span className="text-yellow-500 tracking-wider text-sm">
      {"★".repeat(Math.min(r, 5))}{"☆".repeat(Math.max(5 - r, 0))}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 bg-gray-200 rounded w-1/3" />
      <div className="h-6 bg-gray-100 rounded w-1/4" />
      <div className="flex gap-2 mt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-24 bg-gray-100 rounded-full" />
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded" />
        ))}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
        <Search className="w-6 h-6 text-gray-400" />
      </div>
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );
}

function AddSupplierModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (s: Supplier) => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    CompanyName: "", ContactName: "", Phone: "", Email: "", Address: "",
    Country: "", Category: "", PaymentTerms: "", BankAccount: "", BankName: "", TaxCode: "",
  });

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.CompanyName.trim()) { toast.error("Vui lòng nhập tên công ty"); return; }
    setSubmitting(true);
    try {
      const result = await createSupplier({
        SupplierCode: generateCode("NCC"),
        CompanyName: form.CompanyName,
        ContactName: form.ContactName,
        Phone: form.Phone,
        Email: form.Email,
        Address: form.Address,
        Country: form.Country || undefined,
        Category: form.Category || undefined,
        PaymentTerms: form.PaymentTerms,
        BankAccount: form.BankAccount,
        BankName: form.BankName,
        TaxCode: form.TaxCode,
        Status: "Hoạt động",
        Rating: 0,
        IsApproved: false,
      });
      toast.success("Thêm nhà cung cấp thành công");
      onCreated(result);
      onClose();
      setForm({ CompanyName: "", ContactName: "", Phone: "", Email: "", Address: "", Country: "", Category: "", PaymentTerms: "", BankAccount: "", BankName: "", TaxCode: "" });
    } catch {
      toast.error("Lỗi khi thêm nhà cung cấp");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-[#2D3A8C]">Thêm nhà cung cấp</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã NCC</label>
              <input value={generateCode("NCC")} disabled className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên công ty *</label>
              <input value={form.CompanyName} onChange={e => setForm(p => ({ ...p, CompanyName: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Người liên hệ</label>
              <input value={form.ContactName} onChange={e => setForm(p => ({ ...p, ContactName: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Điện thoại</label>
              <input value={form.Phone} onChange={e => setForm(p => ({ ...p, Phone: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input value={form.Email} onChange={e => setForm(p => ({ ...p, Email: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quốc gia</label>
              <select value={form.Country} onChange={e => setForm(p => ({ ...p, Country: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none">
                <option value="">-- Chọn --</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
              <select value={form.Category} onChange={e => setForm(p => ({ ...p, Category: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none">
                <option value="">-- Chọn --</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Điều khoản TT</label>
              <input value={form.PaymentTerms} onChange={e => setForm(p => ({ ...p, PaymentTerms: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số tài khoản</label>
              <input value={form.BankAccount} onChange={e => setForm(p => ({ ...p, BankAccount: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngân hàng</label>
              <input value={form.BankName} onChange={e => setForm(p => ({ ...p, BankName: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
              <input value={form.Address} onChange={e => setForm(p => ({ ...p, Address: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã số thuế</label>
              <input value={form.TaxCode} onChange={e => setForm(p => ({ ...p, TaxCode: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 border rounded-lg hover:bg-gray-50">Hủy</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 text-sm font-medium text-white bg-[#4F5FD9] rounded-lg hover:bg-[#3B4CC0] disabled:opacity-50">
              {submitting ? "Đang lưu..." : "Thêm NCC"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SuppliersPage() {
  const [data, setData] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState("Tất cả");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data: suppliers } = await getSuppliers({ take: 200, sortField: "createdAt", sortDirection: "desc" });
        setData(suppliers);
      } catch {
        toast.error("Lỗi tải dữ liệu nhà cung cấp");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    let result = data;
    if (statusTab !== "Tất cả") result = result.filter(s => s.Status === statusTab);
    if (categoryFilter) result = result.filter(s => s.Category === categoryFilter);
    if (countryFilter) result = result.filter(s => s.Country === countryFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        (s.SupplierCode || "").toLowerCase().includes(q) ||
        (s.CompanyName || "").toLowerCase().includes(q) ||
        (s.ContactName || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [data, statusTab, categoryFilter, countryFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { "Tất cả": data.length };
    STATUSES.forEach(s => { if (s !== "Tất cả") counts[s] = data.filter(d => d.Status === s).length; });
    return counts;
  }, [data]);

  if (loading) return <div className="p-6"><LoadingSkeleton /></div>;

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Nhà cung cấp" description="Quản lý nhà cung cấp" actionLabel="Thêm NCC" onAction={() => setShowAdd(true)} />

      {/* Status tabs */}
      <div className="flex gap-1 border-b">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => { setStatusTab(s); setPage(1); }}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
              statusTab === s ? "border-[#4F5FD9] text-[#4F5FD9]" : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            {s} <span className="text-xs text-gray-400 ml-1">({statusCounts[s] || 0})</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Tìm mã, tên công ty, người liên hệ..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
          className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none"
        >
          <option value="">Danh mục</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={countryFilter}
          onChange={e => { setCountryFilter(e.target.value); setPage(1); }}
          className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none"
        >
          <option value="">Quốc gia</option>
          {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {(categoryFilter || countryFilter) && (
          <button onClick={() => { setCategoryFilter(""); setCountryFilter(""); setPage(1); }} className="text-sm text-[#4F5FD9] hover:text-[#3B4CC0]">
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Table */}
      {paged.length === 0 ? (
        <EmptyState message="Không tìm thấy nhà cung cấp nào" />
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mã NCC</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tên công ty</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Người LH</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Điện thoại</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Quốc gia</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Danh mục</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Đánh giá</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phê duyệt</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paged.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-[#4F5FD9]">{s.SupplierCode || "---"}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{s.CompanyName || "---"}</td>
                    <td className="px-4 py-3 text-gray-600">{s.ContactName || "---"}</td>
                    <td className="px-4 py-3 text-gray-600">{s.Phone || "---"}</td>
                    <td className="px-4 py-3 text-gray-600">{s.Country || "---"}</td>
                    <td className="px-4 py-3">
                      {s.Category ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{s.Category}</span>
                      ) : "---"}
                    </td>
                    <td className="px-4 py-3">{renderStars(s.Rating)}</td>
                    <td className="px-4 py-3 text-center">
                      {s.IsApproved ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400 mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={s.Status} /></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(s.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-gray-500">
            Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length} kết quả
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600 px-2">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <AddSupplierModal open={showAdd} onClose={() => setShowAdd(false)} onCreated={s => setData(prev => [s, ...prev])} />
    </div>
  );
}
