"use client";

import { useEffect, useState, useCallback } from "react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { toast } from "sonner";
import { getCustomers } from "@/lib/customers";
import { getWalletTransactions } from "@/lib/wallet-transactions";
import type { Customer } from "@/lib/customers";
import type { WalletTransaction } from "@/lib/wallet-transactions";
import { Wallet, Search, X, ArrowRight } from "lucide-react";

const PAGE_SIZE = 20;

function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-12 bg-gray-100 rounded" />
      ))}
    </div>
  );
}

function WalletCard({ label, amount, currency }: { label: string; amount: number; currency: string }) {
  return (
    <div className="bg-white rounded-xl border p-5">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(amount, currency)}</p>
    </div>
  );
}

function TransactionTable({ transactions }: { transactions: WalletTransaction[] }) {
  if (transactions.length === 0) {
    return <EmptyState title="Chưa có giao dịch" description="Khách hàng này chưa có giao dịch ví" />;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mã GD</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Loại</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Số tiền</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tiền tệ</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mã đơn</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Số dư sau</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ngày tạo</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {transactions.map((tx) => (
            <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-4 py-3 font-medium text-gray-900">{tx.TxCode}</td>
              <td className="px-4 py-3 text-gray-700">{tx.Type}</td>
              <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(tx.Amount, tx.Currency || "VND")}</td>
              <td className="px-4 py-3 text-gray-600">{tx.Currency}</td>
              <td className="px-4 py-3">
                {tx.OrderCode ? (
                  <a href={`/orders/${tx.OrderId}`} className="text-[#4F5FD9] hover:text-[#3B4CC0] font-medium">{tx.OrderCode}</a>
                ) : "---"}
              </td>
              <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(tx.BalanceAfter, tx.Currency || "VND")}</td>
              <td className="px-4 py-3"><StatusBadge status={tx.Status} /></td>
              <td className="px-4 py-3 text-gray-600">{formatDate(tx.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function WalletPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [custRes, txRes] = await Promise.all([
        getCustomers({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
        getWalletTransactions({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
      ]);
      setCustomers(custRes.data);
      setTransactions(txRes.data);
    } catch {
      toast.error("Lỗi tải dữ liệu ví");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Search filter
  const filteredCustomers = search
    ? customers.filter((c) => {
        const q = search.toLowerCase();
        return c.ContactName?.toLowerCase().includes(q) || c.CustomerCode?.toLowerCase().includes(q) || c.CompanyName?.toLowerCase().includes(q);
      })
    : customers;

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / PAGE_SIZE);
  const paginated = filteredCustomers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Customer transactions
  const customerTx = selectedCustomer
    ? transactions.filter((tx) => tx.CustomerId === selectedCustomer.id)
    : [];

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <PageHeader title="Ví khách hàng" description="Quản lý ví và giao dịch" />

      <div className={cn("grid gap-6", selectedCustomer ? "grid-cols-1 lg:grid-cols-5" : "grid-cols-1")}>
        {/* Customer list */}
        <div className={cn(selectedCustomer ? "lg:col-span-2" : "")}>
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Tìm khách hàng..."
              className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none"
            />
          </div>

          {loading ? (
            <TableSkeleton />
          ) : filteredCustomers.length === 0 ? (
            <EmptyState title="Không tìm thấy" description="Không có khách hàng nào khớp" icon={Wallet} />
          ) : (
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mã KH</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tên KH</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ví VND</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ví CNY</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginated.map((c) => (
                      <tr
                        key={c.id}
                        className={cn(
                          "hover:bg-gray-50/50 transition-colors cursor-pointer",
                          selectedCustomer?.id === c.id && "bg-[#4F5FD9]/5"
                        )}
                        onClick={() => setSelectedCustomer(c)}
                      >
                        <td className="px-4 py-3 font-medium text-gray-900">{c.CustomerCode}</td>
                        <td className="px-4 py-3 text-gray-700">{c.ContactName}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(c.VNDBalance)}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(c.CNYBalance, "CNY")}</td>
                        <td className="px-4 py-3">
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filteredCustomers.length)} / {filteredCustomers.length}
                  </p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50"
                    >
                      Trước
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selectedCustomer && (
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#2D3A8C]">
                {selectedCustomer.ContactName} <span className="text-sm font-normal text-gray-500">({selectedCustomer.CustomerCode})</span>
              </h2>
              <button onClick={() => setSelectedCustomer(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Wallet cards */}
            <div className="grid grid-cols-2 gap-4">
              <WalletCard label="Số dư VND" amount={selectedCustomer.VNDBalance ?? 0} currency="VND" />
              <WalletCard label="Số dư CNY" amount={selectedCustomer.CNYBalance ?? 0} currency="CNY" />
            </div>

            {/* Recent transactions */}
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700">Lịch sử giao dịch gần đây</h3>
              </div>
              <TransactionTable transactions={customerTx} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
