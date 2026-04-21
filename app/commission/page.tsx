"use client";

import { useEffect, useState, useCallback } from "react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { toast } from "sonner";
import { getOrders } from "@/lib/orders";
import { getPaymentVouchers } from "@/lib/payment-vouchers";
import type { Order } from "@/lib/orders";
import type { PaymentVoucher } from "@/lib/payment-vouchers";
import { Award } from "lucide-react";

const PAGE_SIZE = 20;
const COMMISSION_RATE = 0.15;

interface CommissionRow {
  id: string;
  OrderCode?: string;
  OrderId: string;
  SaleOwner?: string;
  ServiceTypes?: string[];
  TotalVND: number;
  TotalCosts: number;
  Profit: number;
  CommissionVND: number;
  Status: string;
  createdAt?: string;
}

function SummaryCard({ label, value, borderColor }: { label: string; value: string; borderColor: string }) {
  return (
    <div className={cn("bg-white rounded-lg border p-5", borderColor)}>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-12 bg-gray-100 rounded" />
      ))}
    </div>
  );
}

export default function CommissionPage() {
  const [rows, setRows] = useState<CommissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordRes, pvRes] = await Promise.all([
        getOrders({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
        getPaymentVouchers({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
      ]);

      // Filter completed orders only
      const completedOrders = ordRes.data.filter((o) => o.Status === "Hoàn thành");

      // Calculate commission for each completed order
      const commissionRows: CommissionRow[] = completedOrders.map((order) => {
        const orderVouchers = pvRes.data.filter((v) => v.OrderId === order.id && v.Type === "Phiếu chi");
        const totalCosts = orderVouchers.reduce((s, v) => s + (v.Amount ?? 0), 0);
        const revenue = order.TotalVND ?? 0;
        const profit = revenue - totalCosts;
        const commission = Math.max(0, profit * COMMISSION_RATE);

        // Determine commission status based on order's CommissionVND field
        let status = "Chờ duyệt";
        if (order.CommissionVND && order.CommissionVND > 0) {
          status = "Đã duyệt";
        }
        if (order.ProfitVND !== undefined && order.CommissionVND !== undefined && order.CommissionVND > 0 && order.ProfitMargin !== undefined) {
          status = "Đã trả";
        }

        return {
          id: order.id,
          OrderCode: order.OrderCode,
          OrderId: order.id,
          SaleOwner: order.SaleOwner,
          ServiceTypes: order.ServiceTypes,
          TotalVND: revenue,
          TotalCosts: totalCosts,
          Profit: profit,
          CommissionVND: commission,
          Status: status,
          createdAt: order.createdAt,
        };
      });

      setRows(commissionRows);
    } catch {
      toast.error("Lỗi tải dữ liệu hoa hồng");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Summary
  const pending = rows.filter((r) => r.Status === "Chờ duyệt");
  const approved = rows.filter((r) => r.Status === "Đã duyệt");
  const paid = rows.filter((r) => r.Status === "Đã trả");

  const sumPending = pending.reduce((s, r) => s + r.CommissionVND, 0);
  const sumApproved = approved.reduce((s, r) => s + r.CommissionVND, 0);
  const sumPaid = paid.reduce((s, r) => s + r.CommissionVND, 0);

  // Pagination
  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const paginated = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <PageHeader title="Hoa hồng" description="Quản lý hoa hồng nhân viên" />

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard label="Tổng chờ duyệt" value={formatCurrency(sumPending)} borderColor="border-l-4 border-l-orange-400" />
        <SummaryCard label="Tổng đã duyệt" value={formatCurrency(sumApproved)} borderColor="border-l-4 border-l-green-500" />
        <SummaryCard label="Tổng đã trả" value={formatCurrency(sumPaid)} borderColor="border-l-4 border-l-blue-500" />
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState title="Chưa có hoa hồng" description="Chưa có đơn hàng hoàn thành nào" icon={Award} />
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mã đơn</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sale</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Loại DV</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Doanh thu</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Hoa hồng</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ngày HT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <a href={`/orders/${r.OrderId}`} className="text-[#4F5FD9] hover:text-[#3B4CC0] font-medium">{r.OrderCode}</a>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{r.SaleOwner || "---"}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {(r.ServiceTypes || []).map((st) => (
                          <span key={st} className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">{st}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(r.TotalVND)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-[#2D3A8C]">{formatCurrency(r.CommissionVND)}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.Status} /></td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Hiện {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, rows.length)} / {rows.length}
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
  );
}
