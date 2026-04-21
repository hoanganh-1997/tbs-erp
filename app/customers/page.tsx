"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { Search, Filter, X, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { getCustomers, createCustomer, type Customer } from "@/lib/customers";
import { cn, formatCurrency, formatDate, generateCode } from "@/lib/utils";
import { TierBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";

const TIERS = ["Tất cả", "Prospect", "Active", "VIP", "Inactive", "Blacklist"] as const;
const BRANCHES = ["HN", "HCM"] as const;
const PAGE_SIZE = 20;

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: 10 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </td>
      ))}
    </tr>
  );
}

function AddCustomerModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (c: Customer) => void;
}) {
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [form, setForm] = useState({
    CustomerCode: generateCode("KH"),
    CompanyName: "",
    ContactName: "",
    Phone: "",
    Email: "",
    Address: "",
    Branch: "HN" as string,
    Tier: "Prospect" as string,
    DepositRate: 50,
    Notes: "",
  });

  useEffect(() => {
    if (open) {
      setForm((f) => ({ ...f, CustomerCode: generateCode("KH") }));
    }
  }, [open]);

  const set = (field: string, value: string | number) =>
    setForm((f) => ({ ...f, [field]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Bug #1: synchronous guard against double-submit (state updates are async)
    if (savingRef.current) return;
    if (!form.CompanyName.trim()) {
      toast.error("Tên công ty là bắt buộc");
      return;
    }
    if (!form.ContactName.trim()) {
      toast.error("Tên liên hệ là bắt buộc");
      return;
    }
    savingRef.current = true;
    setSaving(true);
    try {
      const created = await createCustomer(form);
      toast.success("Thêm khách hàng thành công");
      onCreated(created);
      onClose();
    } catch {
      toast.error("Lỗi khi thêm khách hàng");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-[#2D3A8C]">Thêm khách hàng</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mã khách hàng</label>
            <input
              value={form.CustomerCode}
              readOnly
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên công ty *</label>
            <input
              value={form.CompanyName}
              onChange={(e) => set("CompanyName", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none"
              placeholder="Nhập tên công ty"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên liên hệ *</label>
              <input
                value={form.ContactName}
                onChange={(e) => set("ContactName", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none"
                placeholder="Nhập tên liên hệ"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
              <input
                value={form.Phone}
                onChange={(e) => set("Phone", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none"
                placeholder="Nhập SĐT"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              value={form.Email}
              onChange={(e) => set("Email", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none"
              placeholder="Nhập email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
            <input
              value={form.Address}
              onChange={(e) => set("Address", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none"
              placeholder="Nhập địa chỉ"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chi nhánh</label>
              <select
                value={form.Branch}
                onChange={(e) => set("Branch", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none"
              >
                <option value="HN">HN</option>
                <option value="HCM">HCM</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hạng</label>
              <select
                value={form.Tier}
                onChange={(e) => set("Tier", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none"
              >
                <option value="Prospect">Prospect</option>
                <option value="Active">Active</option>
                <option value="VIP">VIP</option>
                <option value="Inactive">Inactive</option>
                <option value="Blacklist">Blacklist</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tỷ lệ cọc (%)</label>
            <input
              type="number"
              value={form.DepositRate}
              onChange={(e) => set("DepositRate", Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea
              value={form.Notes}
              onChange={(e) => set("Notes", e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none resize-none"
              placeholder="Ghi chú thêm..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-medium text-white bg-[#4F5FD9] hover:bg-[#3B4CC0] rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? "Đang lưu..." : "Thêm khách hàng"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTier, setActiveTier] = useState<string>("Tất cả");
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState<string>("");
  const [saleOwnerFilter, setSaleOwnerFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getCustomers({
        take: 200,
        sortField: "createdAt",
        sortDirection: "desc",
      });
      setCustomers(data);
    } catch {
      toast.error("Lỗi khi tải danh sách khách hàng");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saleOwners = useMemo(() => {
    const owners = new Set<string>();
    customers.forEach((c) => {
      if (c.SaleOwner) owners.add(c.SaleOwner);
    });
    return Array.from(owners).sort();
  }, [customers]);

  const tierCounts = useMemo(() => {
    const counts: Record<string, number> = { "Tất cả": customers.length };
    TIERS.forEach((t) => {
      if (t !== "Tất cả") counts[t] = 0;
    });
    customers.forEach((c) => {
      if (c.Tier && counts[c.Tier] !== undefined) counts[c.Tier]++;
    });
    return counts;
  }, [customers]);

  const filtered = useMemo(() => {
    let list = customers;

    if (activeTier !== "Tất cả") {
      list = list.filter((c) => c.Tier === activeTier);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          (c.CustomerCode || "").toLowerCase().includes(q) ||
          (c.ContactName || "").toLowerCase().includes(q) ||
          (c.CompanyName || "").toLowerCase().includes(q) ||
          (c.Phone || "").toLowerCase().includes(q)
      );
    }

    if (branchFilter) {
      list = list.filter((c) => c.Branch === branchFilter);
    }

    if (saleOwnerFilter) {
      list = list.filter((c) => c.SaleOwner === saleOwnerFilter);
    }

    return list;
  }, [customers, activeTier, search, branchFilter, saleOwnerFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [activeTier, search, branchFilter, saleOwnerFilter]);

  function handleCreated(c: Customer) {
    setCustomers((prev) => [c, ...prev]);
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <PageHeader
        title="Khách hàng"
        description="Quản lý khách hàng"
        actionLabel="Thêm khách hàng"
        onAction={() => setModalOpen(true)}
      />

      {/* Tier tabs */}
      <div className="flex flex-wrap gap-2">
        {TIERS.map((tier) => (
          <button
            key={tier}
            onClick={() => setActiveTier(tier)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
              activeTier === tier
                ? "bg-[#4F5FD9] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {tier}
            <span className="ml-1.5 text-xs opacity-80">({tierCounts[tier] ?? 0})</span>
          </button>
        ))}
      </div>

      {/* Search & filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm mã KH, tên, công ty, SĐT..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none"
          >
            <option value="">Tất cả chi nhánh</option>
            {BRANCHES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <select
            value={saleOwnerFilter}
            onChange={(e) => setSaleOwnerFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none"
          >
            <option value="">Tất cả Sale</option>
            {saleOwners.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">Mã KH</th>
                <th className="px-4 py-3">Khách hàng</th>
                <th className="px-4 py-3">SĐT</th>
                <th className="px-4 py-3">Hạng</th>
                <th className="px-4 py-3 text-right">Số dư VND</th>
                <th className="px-4 py-3 text-right">Số dư CNY</th>
                <th className="px-4 py-3">Sale</th>
                <th className="px-4 py-3">Chi nhánh</th>
                <th className="px-4 py-3">Ngày tạo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="w-8 h-8 text-gray-300" />
                      <p className="text-sm">Không tìm thấy khách hàng nào</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/customers/${c.id}`}
                        className="text-[#4F5FD9] hover:text-[#3B4CC0] font-medium hover:underline"
                      >
                        {c.CustomerCode || "---"}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{c.ContactName || "---"}</div>
                      <div className="text-xs text-gray-500">{c.CompanyName || ""}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.Phone || "---"}</td>
                    <td className="px-4 py-3">
                      <TierBadge tier={c.Tier} />
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatCurrency(c.VNDBalance)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatCurrency(c.CNYBalance, "CNY")}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.SaleOwner || "---"}</td>
                    <td className="px-4 py-3 text-gray-600">{c.Branch || "---"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(c.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-sm text-gray-500">
              Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length} khách hàng
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)
                )
                .map((p, i, arr) => (
                  <span key={p} className="flex items-center">
                    {i > 0 && arr[i - 1] !== p - 1 && (
                      <span className="px-1 text-gray-400">...</span>
                    )}
                    <button
                      onClick={() => setPage(p)}
                      className={cn(
                        "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                        p === page
                          ? "bg-[#4F5FD9] text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      )}
                    >
                      {p}
                    </button>
                  </span>
                ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <AddCustomerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
