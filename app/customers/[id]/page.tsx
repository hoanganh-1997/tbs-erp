"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ShoppingCart,
  DollarSign,
  Wallet,
  ChevronLeft,
  ChevronRight,
  FileText,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { getCustomer, type Customer } from "@/lib/customers";
import { getOrders, type Order } from "@/lib/orders";
import { getAccountsReceivable, type AccountReceivable } from "@/lib/accounts-receivable";
import { getWalletTransactions, type WalletTransaction } from "@/lib/wallet-transactions";
import { getQuotations, type Quotation } from "@/lib/quotations";
import { getContracts, type Contract } from "@/lib/contracts";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge, TierBadge } from "@/components/status-badge";

const TABS = ["Tổng quan", "Đơn hàng", "Tài chính", "Báo giá", "Hợp đồng"] as const;
type Tab = (typeof TABS)[number];

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-gray-200 rounded", className)} />;
}

function KPICard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", color)}>
          <Icon className="w-4.5 h-4.5 text-white" />
        </div>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <Search className="w-8 h-8 text-gray-300 mb-2" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500 w-40 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-900 font-medium">{value || "---"}</span>
    </div>
  );
}

function TabOverview({ customer }: { customer: Customer }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-base font-semibold text-[#2D3A8C] mb-4">Thông tin khách hàng</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
        <div>
          <InfoRow label="Mã khách hàng" value={customer.CustomerCode} />
          <InfoRow label="Tên công ty" value={customer.CompanyName} />
          <InfoRow label="Liên hệ" value={customer.ContactName} />
          <InfoRow label="Số điện thoại" value={customer.Phone} />
          <InfoRow label="Email" value={customer.Email} />
          <InfoRow label="Địa chỉ" value={customer.Address} />
          <InfoRow label="Địa chỉ giao hàng" value={customer.DeliveryAddress} />
          <InfoRow label="Mã số thuế" value={customer.TaxCode} />
        </div>
        <div>
          <InfoRow label="Chi nhánh" value={customer.Branch} />
          <InfoRow label="Sale phụ trách" value={customer.SaleOwner} />
          <InfoRow label="Leader" value={customer.LeaderName} />
          <InfoRow label="Hạng" value={<TierBadge tier={customer.Tier} />} />
          <InfoRow label="Tỷ lệ cọc" value={customer.DepositRate != null ? `${customer.DepositRate}%` : "---"} />
          <InfoRow label="Hạn mức tín dụng" value={customer.CreditLimit != null ? formatCurrency(customer.CreditLimit) : "---"} />
          <InfoRow label="Giấy phép XNK" value={customer.HasXNKLicense ? "Có" : "Không"} />
          <InfoRow label="Ngày tạo" value={formatDate(customer.createdAt)} />
        </div>
      </div>
    </div>
  );
}

function TabOrders({ orders, loading }: { orders: Order[]; loading: boolean }) {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));
  const paginated = orders.slice((page - 1) * pageSize, page * pageSize);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              {["Mã đơn", "Trạng thái", "Tổng VND", "Sale", "Ngày tạo"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                {Array.from({ length: 5 }).map((__, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-3/4" /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (orders.length === 0) return <EmptyState message="Chưa có đơn hàng nào" />;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th className="px-4 py-3">Mã đơn</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3 text-right">Tổng VND</th>
              <th className="px-4 py-3">Sale</th>
              <th className="px-4 py-3">Ngày tạo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginated.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/orders/${o.id}`} className="text-[#4F5FD9] hover:text-[#3B4CC0] font-medium hover:underline">
                    {o.OrderCode || "---"}
                  </Link>
                </td>
                <td className="px-4 py-3"><StatusBadge status={o.Status} /></td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrency(o.TotalVND)}</td>
                <td className="px-4 py-3 text-gray-600">{o.SaleOwner || "---"}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(o.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {orders.length > pageSize && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <span className="text-sm text-gray-500">
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, orders.length)} / {orders.length}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600 px-2">{page} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TabFinance({
  customer,
  arRecords,
  walletTxs,
  loading,
}: {
  customer: Customer;
  arRecords: AccountReceivable[];
  walletTxs: WalletTransaction[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet balances */}
      <div>
        <h3 className="text-base font-semibold text-[#2D3A8C] mb-3">Ví khách hàng</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-1">Số dư VND</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(customer.VNDBalance)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-1">Số dư CNY</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(customer.CNYBalance, "CNY")}</p>
          </div>
        </div>
      </div>

      {/* Accounts Receivable */}
      <div>
        <h3 className="text-base font-semibold text-[#2D3A8C] mb-3">Công nợ phải thu</h3>
        {arRecords.length === 0 ? (
          <EmptyState message="Chưa có công nợ nào" />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Mã CN</th>
                    <th className="px-4 py-3">Mã đơn</th>
                    <th className="px-4 py-3 text-right">Số tiền</th>
                    <th className="px-4 py-3 text-right">Đã thu</th>
                    <th className="px-4 py-3 text-right">Còn lại</th>
                    <th className="px-4 py-3">Hạn thu</th>
                    <th className="px-4 py-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {arRecords.map((ar) => (
                    <tr key={ar.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{ar.ARCode || "---"}</td>
                      <td className="px-4 py-3 text-[#4F5FD9]">{ar.OrderCode || "---"}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(ar.InvoiceAmount)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(ar.PaidAmount)}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(ar.Remaining)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(ar.DueDate)}</td>
                      <td className="px-4 py-3"><StatusBadge status={ar.Status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Wallet transactions */}
      <div>
        <h3 className="text-base font-semibold text-[#2D3A8C] mb-3">Giao dịch ví</h3>
        {walletTxs.length === 0 ? (
          <EmptyState message="Chưa có giao dịch ví nào" />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Mã GD</th>
                    <th className="px-4 py-3">Loại</th>
                    <th className="px-4 py-3 text-right">Số tiền</th>
                    <th className="px-4 py-3">Tiền tệ</th>
                    <th className="px-4 py-3">Mã đơn</th>
                    <th className="px-4 py-3 text-right">Số dư sau</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Ngày tạo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {walletTxs.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{tx.TxCode || "---"}</td>
                      <td className="px-4 py-3 text-gray-600">{tx.Type || "---"}</td>
                      <td className="px-4 py-3 text-right font-medium">
                        {tx.Currency === "CNY"
                          ? formatCurrency(tx.Amount, "CNY")
                          : formatCurrency(tx.Amount)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{tx.Currency || "---"}</td>
                      <td className="px-4 py-3 text-[#4F5FD9]">{tx.OrderCode || "---"}</td>
                      <td className="px-4 py-3 text-right">
                        {tx.Currency === "CNY"
                          ? formatCurrency(tx.BalanceAfter, "CNY")
                          : formatCurrency(tx.BalanceAfter)}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={tx.Status} /></td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(tx.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TabContracts({ contracts, loading }: { contracts: Contract[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              {["Mã HĐ", "Tiêu đề", "Giá trị", "Thời hạn", "Trạng thái"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 3 }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                {Array.from({ length: 5 }).map((__, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-3/4" /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (contracts.length === 0) return <EmptyState message="Chưa có hợp đồng nào" />;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th className="px-4 py-3">Mã HĐ</th>
              <th className="px-4 py-3">Tiêu đề</th>
              <th className="px-4 py-3 text-right">Giá trị</th>
              <th className="px-4 py-3">Thời hạn</th>
              <th className="px-4 py-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {contracts.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/contracts/${c.id}`} className="text-[#4F5FD9] hover:text-[#3B4CC0] font-medium hover:underline">
                    {c.ContractCode || "---"}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-900">{c.Title || "---"}</td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrency(c.ContractValue, c.Currency)}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">
                  {c.StartDate ? formatDate(c.StartDate) : "---"}{" → "}
                  {c.EndDate ? formatDate(c.EndDate) : "---"}
                </td>
                <td className="px-4 py-3"><StatusBadge status={c.Status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TabQuotations({ quotations, loading }: { quotations: Quotation[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              {["Mã báo giá", "Tổng VND", "Trạng thái", "Ngày tạo"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                {Array.from({ length: 4 }).map((__, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-3/4" /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (quotations.length === 0) return <EmptyState message="Chưa có báo giá nào" />;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th className="px-4 py-3">Mã báo giá</th>
              <th className="px-4 py-3 text-right">Tổng VND</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Ngày tạo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {quotations.map((q) => (
              <tr key={q.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/quotations/${q.id}`} className="text-[#4F5FD9] hover:text-[#3B4CC0] font-medium hover:underline">
                    {q.QuotationCode || "---"}
                  </Link>
                </td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrency(q.TotalVND)}</td>
                <td className="px-4 py-3"><StatusBadge status={q.Status} /></td>
                <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(q.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [arRecords, setArRecords] = useState<AccountReceivable[]>([]);
  const [walletTxs, setWalletTxs] = useState<WalletTransaction[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);

  const [loadingCustomer, setLoadingCustomer] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingFinance, setLoadingFinance] = useState(false);
  const [loadingQuotations, setLoadingQuotations] = useState(false);
  const [loadingContracts, setLoadingContracts] = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>("Tổng quan");
  const [tabsLoaded, setTabsLoaded] = useState<Record<Tab, boolean>>({
    "Tổng quan": true,
    "Đơn hàng": false,
    "Tài chính": false,
    "Báo giá": false,
    "Hợp đồng": false,
  });

  // Load customer on mount
  useEffect(() => {
    async function load() {
      setLoadingCustomer(true);
      try {
        const data = await getCustomer(id);
        setCustomer(data);
      } catch {
        toast.error("Lỗi khi tải thông tin khách hàng");
      } finally {
        setLoadingCustomer(false);
      }
    }
    load();
  }, [id]);

  // Bug #13: Eager-load orders for KPI aggregations (top cards)
  useEffect(() => {
    if (!id || tabsLoaded["Đơn hàng"]) return;
    setLoadingOrders(true);
    getOrders({ take: 200, sortField: "createdAt", sortDirection: "desc" })
      .then(({ data }) => {
        setOrders(data.filter((o) => o.CustomerId === id));
        setTabsLoaded((prev) => ({ ...prev, "Đơn hàng": true }));
      })
      .catch(() => toast.error("Lỗi khi tải đơn hàng"))
      .finally(() => setLoadingOrders(false));
  }, [id]);  // eslint-disable-line react-hooks/exhaustive-deps

  // Lazy load tab data
  const loadTabData = useCallback(
    async (tab: Tab) => {
      if (tabsLoaded[tab]) return;

      if (tab === "Đơn hàng") {
        setLoadingOrders(true);
        try {
          const { data } = await getOrders({ take: 200, sortField: "createdAt", sortDirection: "desc" });
          setOrders(data.filter((o) => o.CustomerId === id));
        } catch {
          toast.error("Lỗi khi tải đơn hàng");
        } finally {
          setLoadingOrders(false);
        }
      }

      if (tab === "Tài chính") {
        setLoadingFinance(true);
        try {
          const [arResult, txResult] = await Promise.all([
            getAccountsReceivable({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
            getWalletTransactions({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
          ]);
          setArRecords(arResult.data.filter((ar) => ar.CustomerId === id));
          setWalletTxs(txResult.data.filter((tx) => tx.CustomerId === id));
        } catch {
          toast.error("Lỗi khi tải dữ liệu tài chính");
        } finally {
          setLoadingFinance(false);
        }
      }

      if (tab === "Báo giá") {
        setLoadingQuotations(true);
        try {
          const { data } = await getQuotations({ take: 200, sortField: "createdAt", sortDirection: "desc" });
          setQuotations(data.filter((q) => q.CustomerId === id));
        } catch {
          toast.error("Lỗi khi tải báo giá");
        } finally {
          setLoadingQuotations(false);
        }
      }

      if (tab === "Hợp đồng") {
        setLoadingContracts(true);
        try {
          const { data } = await getContracts({ take: 200, sortField: "createdAt", sortDirection: "desc" });
          setContracts(data.filter((c) => c.CustomerId === id));
        } catch {
          toast.error("Lỗi khi tải hợp đồng");
        } finally {
          setLoadingContracts(false);
        }
      }

      setTabsLoaded((prev) => ({ ...prev, [tab]: true }));
    },
    [id, tabsLoaded]
  );

  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab, loadTabData]);

  // Compute KPIs
  const orderCount = tabsLoaded["Đơn hàng"] ? orders.length : 0;
  const totalRevenue = tabsLoaded["Đơn hàng"]
    ? orders.reduce((sum, o) => sum + (o.TotalVND || 0), 0)
    : 0;

  if (loadingCustomer) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto space-y-6">
        <SkeletonBlock className="h-8 w-32" />
        <SkeletonBlock className="h-12 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-24 w-full" />
          ))}
        </div>
        <SkeletonBlock className="h-64 w-full" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto">
        <button onClick={() => router.push("/customers")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
        <EmptyState message="Không tìm thấy khách hàng" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push("/customers")}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#4F5FD9] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại danh sách
      </button>

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-[#2D3A8C]">{customer.ContactName || "---"}</h1>
          <span className="text-sm text-gray-400 font-mono">{customer.CustomerCode}</span>
          <TierBadge tier={customer.Tier} />
        </div>
        {customer.CompanyName && (
          <p className="text-gray-500">{customer.CompanyName}</p>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Tổng đơn hàng"
          value={tabsLoaded["Đơn hàng"] ? String(orderCount) : "---"}
          icon={ShoppingCart}
          color="bg-blue-500"
        />
        <KPICard
          label="Doanh thu"
          value={tabsLoaded["Đơn hàng"] ? formatCurrency(totalRevenue) : "---"}
          icon={DollarSign}
          color="bg-green-500"
        />
        <KPICard
          label="Số dư VND"
          value={formatCurrency(customer.VNDBalance)}
          icon={Wallet}
          color="bg-purple-500"
        />
        <KPICard
          label="Số dư CNY"
          value={formatCurrency(customer.CNYBalance, "CNY")}
          icon={FileText}
          color="bg-orange-500"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-0">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
              activeTab === tab
                ? "border-[#4F5FD9] text-[#4F5FD9]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "Tổng quan" && <TabOverview customer={customer} />}
        {activeTab === "Đơn hàng" && <TabOrders orders={orders} loading={loadingOrders} />}
        {activeTab === "Tài chính" && (
          <TabFinance
            customer={customer}
            arRecords={arRecords}
            walletTxs={walletTxs}
            loading={loadingFinance}
          />
        )}
        {activeTab === "Báo giá" && <TabQuotations quotations={quotations} loading={loadingQuotations} />}
        {activeTab === "Hợp đồng" && <TabContracts contracts={contracts} loading={loadingContracts} />}
      </div>
    </div>
  );
}
