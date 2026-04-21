"use client";

import { useState, useEffect, useCallback } from "react";
import { FileCheck, Shield, Receipt, AlertTriangle, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { InspectionChannelBadge } from "@/components/inspection-channel-badge";
import { CustomsStatusFlow } from "@/components/customs-status-flow";
import {
  getCustomsDeclarations,
  updateCustomsDeclaration,
  type CustomsDeclaration,
} from "@/lib/customs-declarations";

const STATUS_TABS = [
  "Tất cả",
  "Chuẩn bị hồ sơ",
  "Đã nộp tờ khai",
  "Chờ kiểm hóa",
  "Đang kiểm hóa",
  "Chờ nộp thuế",
  "Đã nộp thuế",
  "Đã thông quan",
  "Bị giữ hàng",
];

const STATUS_FLOW: Record<string, string> = {
  "Chuẩn bị hồ sơ": "Đã nộp tờ khai",
  "Đã nộp tờ khai": "Chờ kiểm hóa",
  "Chờ kiểm hóa": "Đang kiểm hóa",
  "Đang kiểm hóa": "Chờ nộp thuế",
  "Chờ nộp thuế": "Đã nộp thuế",
  "Đã nộp thuế": "Đã thông quan",
};

const PAGE_SIZE = 20;

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
      ))}
    </div>
  );
}

export default function CustomsPage() {
  const [declarations, setDeclarations] = useState<CustomsDeclaration[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Tất cả");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getCustomsDeclarations({
        take: 200,
        sortField: "createdAt",
        sortDirection: "desc",
      });
      setDeclarations(data);
    } catch {
      toast.error("Lỗi tải dữ liệu thông quan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // KPIs
  const processing = declarations.filter(
    (d) => d.Status && !["Đã thông quan", "Bị giữ hàng"].includes(d.Status)
  ).length;
  const pendingInspection = declarations.filter(
    (d) => d.Status === "Chờ kiểm hóa" || d.Status === "Đang kiểm hóa"
  ).length;
  const now = new Date();
  const thisMonth = declarations.filter((d) => {
    if (!d.ClearanceDate) return false;
    const cd = new Date(d.ClearanceDate);
    return cd.getMonth() === now.getMonth() && cd.getFullYear() === now.getFullYear();
  });
  const totalTaxMonth = thisMonth.reduce((s, d) => s + (d.TotalTaxVND || 0), 0);
  const greenChannel = declarations.filter((d) => d.InspectionType === "Luồng xanh").length;
  const greenRate = declarations.length > 0 ? Math.round((greenChannel / declarations.length) * 100) : 0;

  // Filter
  const filtered = declarations.filter((d) => {
    if (activeTab === "Tất cả") return true;
    return d.Status === activeTab;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleAdvanceStatus = async (decl: CustomsDeclaration) => {
    const nextStatus = STATUS_FLOW[decl.Status || ""];
    if (!nextStatus) return;

    // Block if docs incomplete and trying to submit
    if (decl.Status === "Chuẩn bị hồ sơ" && decl.DocumentStatus === "Thiếu chứng từ") {
      toast.error("Chưa đủ chứng từ, vui lòng bổ sung trước khi nộp tờ khai");
      return;
    }

    try {
      const updates: Record<string, any> = { Status: nextStatus };
      if (nextStatus === "Đã thông quan") {
        updates.ClearanceDate = new Date().toISOString();
      }
      await updateCustomsDeclaration(decl.id, updates);
      toast.success(`${decl.DeclarationCode} → ${nextStatus}`);
      fetchData();
    } catch {
      toast.error("Lỗi cập nhật trạng thái");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thông quan"
        description="Quản lý tờ khai hải quan & thông quan"
        actionLabel="Tạo tờ khai"
        actionHref="/customs/new"
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard
          title="Đang xử lý"
          value={processing}
          icon={Shield}
          borderColor="border-l-blue-500"
          subtitle="tờ khai chưa thông quan"
        />
        <KpiCard
          title="Chờ kiểm hóa"
          value={pendingInspection}
          icon={AlertTriangle}
          borderColor="border-l-orange-500"
          subtitle="đang chờ / đang kiểm"
        />
        <KpiCard
          title="Thuế tháng này"
          value={formatCurrency(totalTaxMonth)}
          icon={Receipt}
          borderColor="border-l-green-500"
          subtitle={`${thisMonth.length} TK đã thông quan`}
        />
        <KpiCard
          title="Tỷ lệ luồng xanh"
          value={`${greenRate}%`}
          icon={TrendingUp}
          borderColor="border-l-emerald-500"
          subtitle={`${greenChannel}/${declarations.length} tờ khai`}
        />
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {STATUS_TABS.map((tab) => {
          const count =
            tab === "Tất cả"
              ? declarations.length
              : declarations.filter((d) => d.Status === tab).length;
          return (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setPage(1);
              }}
              className={cn(
                "px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                activeTab === tab
                  ? "border-[#4F5FD9] text-[#4F5FD9]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              {tab}
              <span className="ml-1.5 text-xs text-gray-400">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton />
      ) : paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Shield className="w-12 h-12 mb-3" />
          <p className="text-sm">Không có tờ khai nào</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  {[
                    "Mã TK",
                    "Container",
                    "Loại",
                    "Cửa khẩu",
                    "Số đơn",
                    "Tổng thuế",
                    "Kênh KH",
                    "NV XNK",
                    "Trạng thái",
                    "Thao tác",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((d) => {
                  const nextStatus = STATUS_FLOW[d.Status || ""];
                  return (
                    <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm">
                        <a
                          href={`/customs/${d.id}`}
                          className="text-[#4F5FD9] hover:text-[#3B4CC0] hover:underline font-medium"
                        >
                          {d.DeclarationCode}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-700">
                        {d.ContainerCode || "---"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {d.DeclarationType || "---"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {d.CustomsOffice || "---"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 text-center">
                        {d.TotalOrdersCount ?? 0}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {formatCurrency(d.TotalTaxVND)}
                      </td>
                      <td className="px-4 py-3">
                        <InspectionChannelBadge channel={d.InspectionType} />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {d.XNKStaff || "---"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={d.Status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <a
                            href={`/customs/${d.id}`}
                            className="text-xs text-[#4F5FD9] hover:underline font-medium"
                          >
                            Chi tiết
                          </a>
                          {nextStatus && (
                            <button
                              onClick={() => handleAdvanceStatus(d)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#4F5FD9] hover:bg-[#3B4CC0] text-white rounded-md text-xs font-medium transition-colors"
                            >
                              <FileCheck className="w-3 h-3" />
                              {nextStatus === "Đã thông quan" ? "Thông quan" : "Tiếp"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Hiển thị {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length} tờ
              khai
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Trước
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
