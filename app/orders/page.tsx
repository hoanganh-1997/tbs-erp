"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { listOrders, type Order } from "@/lib/orders";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import { Search, ChevronDown, Eye, Tag, Printer, Filter, AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const STATUS_TABS = [
  { label: "Tất cả", statuses: null },
  { label: "Nháp", statuses: ["Nháp"] },
  {
    label: "Đang xử lý",
    statuses: [
      "Chờ duyệt",
      "Đã xác nhận",
      "Đang tìm hàng",
      "Đã đặt hàng",
      "Tại kho TQ",
      "Trong container",
      "Đang vận chuyển",
      "Tại cửa khẩu",
      "Đang thông quan",
      "Tại kho VN",
      "Đang giao",
    ],
  },
  { label: "Hoàn thành", statuses: ["Đã giao", "Hoàn thành"] },
  { label: "Đã hủy", statuses: ["Đã hủy"] },
] as const;

const PAGE_SIZE = 20;

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3 animate-pulse">
          <div className="w-6 h-6 bg-gray-200 rounded" />
          <div className="w-28 h-4 bg-gray-200 rounded" />
          <div className="w-36 h-4 bg-gray-200 rounded" />
          <div className="w-16 h-4 bg-gray-200 rounded" />
          <div className="w-24 h-6 bg-gray-200 rounded-full" />
          <div className="w-12 h-4 bg-gray-200 rounded" />
          <div className="w-24 h-4 bg-gray-200 rounded" />
          <div className="w-32 h-4 bg-gray-200 rounded" />
          <div className="flex-1" />
          <div className="w-20 h-4 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}

function ExpandedRow({ order }: { order: Order }) {
  return (
    <tr>
      <td colSpan={9} className="bg-gray-50/70 px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Dịch vụ:</span>{" "}
            <span className="font-medium">{order.ServiceTypes?.join(", ") || "---"}</span>
          </div>
          <div>
            <span className="text-gray-500">Tổng tiền:</span>{" "}
            <span className="font-medium">{formatCurrency(order.TotalVND)}</span>
          </div>
          <div>
            <span className="text-gray-500">Thanh toán:</span>{" "}
            <StatusBadge status={order.PaymentStatus} />
          </div>
          <div>
            <span className="text-gray-500">Cọc:</span>{" "}
            <StatusBadge status={order.DepositStatus} />
          </div>
          <div>
            <span className="text-gray-500">Người nhận:</span>{" "}
            <span className="font-medium">{order.ReceiverName || "---"}</span>
          </div>
          <div>
            <span className="text-gray-500">SĐT:</span>{" "}
            <span className="font-medium">{order.ReceiverPhone || "---"}</span>
          </div>
          <div>
            <span className="text-gray-500">Dự kiến giao:</span>{" "}
            <span className="font-medium">{formatDate(order.EstimatedDelivery)}</span>
          </div>
          <div>
            <span className="text-gray-500">Ưu tiên:</span>{" "}
            <span className="font-medium">{order.Priority || "Thường"}</span>
          </div>
        </div>
        {order.Notes && (
          <div className="mt-3 text-sm">
            <span className="text-gray-500">Ghi chú:</span>{" "}
            <span>{order.Notes}</span>
          </div>
        )}
      </td>
    </tr>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [saleFilter, setSaleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const { data } = await listOrders({
        take: 200,
        sort: [{ field: "createdAt", direction: "desc" }],
      });
      setOrders(data);
    } catch (err: any) {
      const msg = err?.message || "Không rõ nguyên nhân";
      console.error("Failed to load orders:", err);
      toast.error(`Lỗi tải đơn hàng: ${msg}`);
      setLoadError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saleOwners = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => {
      if (o.SaleOwner) set.add(o.SaleOwner);
    });
    return Array.from(set).sort();
  }, [orders]);

  const filteredOrders = useMemo(() => {
    let result = orders;

    // Status tab filter
    const tab = STATUS_TABS[activeTab];
    if (tab.statuses) {
      result = result.filter((o) => tab.statuses!.includes(o.Status || ""));
    }

    // Search filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (o) =>
          (o.OrderCode || "").toLowerCase().includes(q) ||
          (o.CustomerName || "").toLowerCase().includes(q)
      );
    }

    // Branch filter
    if (branchFilter) {
      result = result.filter((o) => o.Branch === branchFilter);
    }

    // Sale owner filter
    if (saleFilter) {
      result = result.filter((o) => o.SaleOwner === saleFilter);
    }

    return result;
  }, [orders, activeTab, search, branchFilter, saleFilter]);

  const tabCounts = useMemo(() => {
    return STATUS_TABS.map((tab) => {
      if (!tab.statuses) return orders.length;
      return orders.filter((o) => tab.statuses!.includes(o.Status || "")).length;
    });
  }, [orders]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const paginatedOrders = filteredOrders.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [activeTab, search, branchFilter, saleFilter]);

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Đơn hàng"
        description="Quản lý đơn hàng"
        actionLabel="Tạo đơn hàng"
        actionHref="/orders/new"
      />

      {/* Status Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_TABS.map((tab, idx) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(idx)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === idx
                ? "bg-[#4F5FD9] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label} ({tabCounts[idx]})
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã đơn, tên khách hàng..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]/30 focus:border-[#4F5FD9]"
          />
        </div>
        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]/30 focus:border-[#4F5FD9]"
        >
          <option value="">Tất cả</option>
          <option value="HN">HN</option>
          <option value="HCM">HCM</option>
        </select>
        <select
          value={saleFilter}
          onChange={(e) => setSaleFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]/30 focus:border-[#4F5FD9]"
        >
          <option value="">Tất cả NV Sale</option>
          {saleOwners.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Load error fallback */}
      {loadError && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex flex-col items-center text-center">
          <AlertTriangle className="w-10 h-10 text-red-500 mb-3" />
          <h3 className="text-base font-medium text-red-900">Không tải được danh sách đơn hàng</h3>
          <p className="text-sm text-red-700 mt-1 max-w-md">{loadError}</p>
          <button
            onClick={load}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Thử lại
          </button>
        </div>
      )}

      {/* Record Count */}
      <div className="text-sm text-[#4F5FD9] font-medium">
        {filteredOrders.length} đơn hàng
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="w-10 px-3 py-3" />
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Mã đơn
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Khách hàng
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Chi nhánh
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Đơn con
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                NV Sale
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Ngày tạo
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={9}>
                  <LoadingSkeleton />
                </td>
              </tr>
            ) : paginatedOrders.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-16 text-gray-400">
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              paginatedOrders.map((order) => (
                <>
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-3 py-3">
                      <button
                        onClick={() => toggleExpand(order.id)}
                        className="p-1 rounded hover:bg-gray-100 transition-colors"
                      >
                        <ChevronDown
                          className={`w-4 h-4 text-gray-400 transition-transform ${
                            expandedIds.has(order.id) ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/orders/${order.id}`}
                        className="text-[#4F5FD9] font-medium hover:underline"
                      >
                        {order.OrderCode || "---"}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {order.CustomerName || "---"}
                      </div>
                      {order.CompanyName && (
                        <div className="text-xs text-muted-foreground">
                          {order.CompanyName}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {order.Branch || "---"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.Status} />
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {order.SubOrderCount ?? 0}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {order.SaleOwner || "---"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/orders/${order.id}`}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          disabled
                          title="Chức năng gắn nhãn chưa hỗ trợ"
                          aria-label="Gắn nhãn (chưa hỗ trợ)"
                          className="p-1.5 rounded-lg text-gray-300 cursor-not-allowed"
                        >
                          <Tag className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled
                          title="Chức năng in đơn chưa hỗ trợ"
                          aria-label="In đơn (chưa hỗ trợ)"
                          className="p-1.5 rounded-lg text-gray-300 cursor-not-allowed"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedIds.has(order.id) && (
                    <ExpandedRow key={`${order.id}-expanded`} order={order} />
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && filteredOrders.length > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Hiển thị {(page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, filteredOrders.length)} / {filteredOrders.length}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Trước
            </button>
            <span className="text-sm text-gray-600">
              Trang {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
