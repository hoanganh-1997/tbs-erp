"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Package,
  Ship,
  Truck,
  AlertTriangle,
  ShieldAlert,
  ArrowRightLeft,
  Clock,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { EmptyState } from "@/components/empty-state";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  getWarehouseCnReceipts,
  type WarehouseCnReceipt,
} from "@/lib/warehouse-cn-receipts";
import {
  getWarehouseVnReceipts,
  type WarehouseVnReceipt,
} from "@/lib/warehouse-vn-receipts";
import { getContainers, type Container } from "@/lib/containers";
import {
  getDeliveryOrders,
  type DeliveryOrder,
} from "@/lib/delivery-orders";
import {
  getQualityIssues,
  type QualityIssue,
} from "@/lib/quality-issues";
import {
  getPackageIssues,
  type PackageIssue,
} from "@/lib/package-issues";

// ---------- constants ----------

const PIE_COLORS = [
  "#4F5FD9",
  "#6366F1",
  "#818CF8",
  "#A5B4FC",
  "#C7D2FE",
  "#E0E7FF",
  "#F59E0B",
  "#EF4444",
  "#10B981",
  "#06B6D4",
  "#8B5CF6",
];

const TRANSPORT_STATUSES = ["Đang vận chuyển", "Tại biên giới", "Hải quan"];

// ---------- skeletons ----------

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="h-72 bg-gray-100 rounded-xl animate-pulse" />
  );
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
      ))}
    </div>
  );
}

// ---------- sub-components ----------

function SectionCard({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden",
        className
      )}
    >
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
        {Icon && <Icon className="w-4 h-4 text-[#4F5FD9]" />}
        <h2 className="text-sm font-semibold text-[#2D3A8C] uppercase tracking-wide">
          {title}
        </h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function MiniTable({
  headers,
  rows,
  emptyText,
}: {
  headers: string[];
  rows: React.ReactNode[][];
  emptyText?: string;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title={emptyText || "Không có dữ liệu"}
        className="py-8"
      />
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50">
            {headers.map((h) => (
              <th
                key={h}
                className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((cells, ri) => (
            <tr key={ri} className="hover:bg-gray-50 transition-colors">
              {cells.map((cell, ci) => (
                <td key={ci} className="px-3 py-2.5 text-sm text-gray-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-medium text-gray-700">{label}</p>
      <p className="text-[#4F5FD9] font-semibold">{payload[0].value} kiện</p>
    </div>
  );
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-medium text-gray-700">{payload[0].name}</p>
      <p className="text-[#4F5FD9] font-semibold">{payload[0].value} container</p>
    </div>
  );
}

// ---------- helpers ----------

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dateKey(dateStr: string | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}

function getLast7DayKeys(): string[] {
  const keys: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    keys.push(`${dd}/${mm}`);
  }
  return keys;
}

function isToday(dateStr: string | undefined): boolean {
  if (!dateStr) return false;
  const today = getToday();
  return dateStr.startsWith(today);
}

function severityOrder(severity: string | undefined): number {
  switch (severity) {
    case "Nghiêm trọng":
    case "Nặng":
      return 0;
    case "Cao":
      return 1;
    case "Trung bình":
      return 2;
    default:
      return 3;
  }
}

// ---------- main page ----------

export default function WarehouseDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [cnReceipts, setCnReceipts] = useState<WarehouseCnReceipt[]>([]);
  const [vnReceipts, setVnReceipts] = useState<WarehouseVnReceipt[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
  const [qualityIssues, setQualityIssues] = useState<QualityIssue[]>([]);
  const [packageIssues, setPackageIssues] = useState<PackageIssue[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [cnRes, vnRes, ctRes, dlRes, qiRes, piRes] = await Promise.all([
        getWarehouseCnReceipts({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
        getWarehouseVnReceipts({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
        getContainers({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
        getDeliveryOrders({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
        getQualityIssues({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
        getPackageIssues({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
      ]);
      setCnReceipts(cnRes.data);
      setVnReceipts(vnRes.data);
      setContainers(ctRes.data);
      setDeliveries(dlRes.data);
      setQualityIssues(qiRes.data);
      setPackageIssues(piRes.data);
    } catch {
      toast.error("Lỗi tải dữ liệu dashboard kho");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- KPI computations ---
  const kpi = useMemo(() => {
    const transportContainers = containers.filter((c) =>
      TRANSPORT_STATUSES.includes(c.Status || "")
    );
    const todayDeliveries = deliveries.filter((d) => isToday(d.ScheduledDate));
    return {
      cnTotal: cnReceipts.length,
      vnTotal: vnReceipts.length,
      transportCount: transportContainers.length,
      todayDeliveryCount: todayDeliveries.length,
    };
  }, [cnReceipts, vnReceipts, containers, deliveries]);

  // --- Bar chart: receipts by day (last 7 days) ---
  const barData = useMemo(() => {
    const dayKeys = getLast7DayKeys();
    const countMap: Record<string, number> = {};
    dayKeys.forEach((k) => (countMap[k] = 0));
    cnReceipts.forEach((r) => {
      const key = dateKey(r.createdAt);
      if (key in countMap) countMap[key]++;
    });
    return dayKeys.map((k) => ({ name: k, value: countMap[k] }));
  }, [cnReceipts]);

  // --- Pie chart: container status distribution ---
  const pieData = useMemo(() => {
    const statusMap: Record<string, number> = {};
    containers.forEach((c) => {
      const s = c.Status || "Không rõ";
      statusMap[s] = (statusMap[s] || 0) + 1;
    });
    return Object.entries(statusMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [containers]);

  // --- Tables ---
  const unidentifiedCn = useMemo(
    () => cnReceipts.filter((r) => r.IsUnidentified).slice(0, 10),
    [cnReceipts]
  );

  const discrepancyVn = useMemo(
    () =>
      vnReceipts
        .filter((r) => r.Discrepancy != null && r.Discrepancy !== 0)
        .slice(0, 10),
    [vnReceipts]
  );

  const todayDeliveries = useMemo(
    () => deliveries.filter((d) => isToday(d.ScheduledDate)).slice(0, 10),
    [deliveries]
  );

  const recentPackageIssues = useMemo(
    () =>
      [...packageIssues]
        .sort((a, b) => severityOrder(a.Severity) - severityOrder(b.Severity))
        .slice(0, 5),
    [packageIssues]
  );

  const recentQualityIssues = useMemo(
    () =>
      [...qualityIssues]
        .sort((a, b) => severityOrder(a.Severity) - severityOrder(b.Severity))
        .slice(0, 5),
    [qualityIssues]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Kho"
        description="Tổng quan hoạt động kho hàng"
      />

      {/* KPI Row */}
      {loading ? (
        <KpiSkeleton />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            title="Tổng kiện TQ"
            value={kpi.cnTotal}
            icon={Package}
            borderColor="border-l-blue-400"
            subtitle="Kiện trong hệ thống kho TQ"
            subtitleClassName="text-blue-600"
          />
          <KpiCard
            title="Tổng kiện VN"
            value={kpi.vnTotal}
            icon={Package}
            borderColor="border-l-green-400"
            subtitle="Kiện trong hệ thống kho VN"
            subtitleClassName="text-green-600"
          />
          <KpiCard
            title="Container đang VC"
            value={kpi.transportCount}
            icon={Ship}
            borderColor="border-l-orange-400"
            subtitle="Đang vận chuyển / biên giới / hải quan"
            subtitleClassName="text-orange-600"
          />
          <KpiCard
            title="Đơn giao hôm nay"
            value={kpi.todayDeliveryCount}
            icon={Truck}
            borderColor="border-l-purple-400"
            subtitle={`Ngày ${getToday().split("-").reverse().join("/")}`}
            subtitleClassName="text-purple-600"
          />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Kiện nhận theo ngày (7 ngày)" icon={Package}>
          {loading ? (
            <ChartSkeleton />
          ) : barData.every((d) => d.value === 0) ? (
            <EmptyState
              title="Chưa có kiện nhận trong 7 ngày qua"
              className="py-10"
            />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="value"
                  fill="#4F5FD9"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard title="Phân bổ trạng thái Container" icon={Ship}>
          {loading ? (
            <ChartSkeleton />
          ) : pieData.length === 0 ? (
            <EmptyState title="Chưa có container" className="py-10" />
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((_, idx) => (
                      <Cell
                        key={idx}
                        fill={PIE_COLORS[idx % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5">
                {pieData.map((entry, idx) => (
                  <div key={entry.name} className="flex items-center gap-2 text-xs">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor:
                          PIE_COLORS[idx % PIE_COLORS.length],
                      }}
                    />
                    <span className="text-gray-600 truncate flex-1">
                      {entry.name}
                    </span>
                    <span className="font-semibold text-gray-800">
                      {entry.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SectionCard title="Kiện chưa xác định" icon={ShieldAlert}>
          {loading ? (
            <TableSkeleton />
          ) : (
            <MiniTable
              headers={["Mã phiếu", "Tracking CN", "Cân nặng", "Ngày tạo"]}
              emptyText="Không có kiện chưa xác định"
              rows={unidentifiedCn.map((r) => [
                <span key="code" className="font-medium text-gray-900">
                  {r.ReceiptCode || "---"}
                </span>,
                <span key="tracking" className="font-mono text-xs">
                  {r.TrackingCN || "---"}
                </span>,
                r.WeightKg ? `${r.WeightKg} kg` : "---",
                formatDate(r.createdAt),
              ])}
            />
          )}
        </SectionCard>

        <SectionCard title="Chênh lệch kiện VN" icon={ArrowRightLeft}>
          {loading ? (
            <TableSkeleton />
          ) : (
            <MiniTable
              headers={["Mã phiếu", "Kho", "Chênh lệch", "Trạng thái"]}
              emptyText="Không có chênh lệch kiện"
              rows={discrepancyVn.map((r) => [
                <span key="code" className="font-medium text-gray-900">
                  {r.ReceiptCode || "---"}
                </span>,
                r.Warehouse || "---",
                <span
                  key="disc"
                  className={cn(
                    "font-semibold",
                    (r.Discrepancy ?? 0) < 0
                      ? "text-red-600"
                      : "text-orange-600"
                  )}
                >
                  {(r.Discrepancy ?? 0) > 0 ? "+" : ""}
                  {r.Discrepancy}
                </span>,
                <StatusBadge key="status" status={r.Status} />,
              ])}
            />
          )}
        </SectionCard>

        <SectionCard title="Giao hàng hôm nay" icon={Truck}>
          {loading ? (
            <TableSkeleton />
          ) : (
            <MiniTable
              headers={["Mã đơn", "Người nhận", "Kiện", "Trạng thái"]}
              emptyText="Không có đơn giao hôm nay"
              rows={todayDeliveries.map((d) => [
                <span key="code" className="font-medium text-gray-900">
                  {d.DeliveryCode || d.OrderCode || "---"}
                </span>,
                d.ReceiverName || "---",
                d.Packages ?? "---",
                <StatusBadge key="status" status={d.Status} />,
              ])}
            />
          )}
        </SectionCard>
      </div>

      {/* Activity / Issues Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Sự cố kiện hàng gần đây" icon={AlertTriangle}>
          {loading ? (
            <TableSkeleton />
          ) : (
            <MiniTable
              headers={["Mã", "Loại", "Mức độ", "Trạng thái", "Ngày"]}
              emptyText="Không có sự cố kiện hàng"
              rows={recentPackageIssues.map((p) => [
                <span key="code" className="font-medium text-gray-900">
                  {p.IssueCode || "---"}
                </span>,
                p.IssueType || "---",
                <StatusBadge key="sev" status={p.Severity} />,
                <StatusBadge key="status" status={p.Status} />,
                formatDate(p.createdAt),
              ])}
            />
          )}
        </SectionCard>

        <SectionCard title="Sự cố chất lượng gần đây" icon={AlertCircle}>
          {loading ? (
            <TableSkeleton />
          ) : (
            <MiniTable
              headers={["Mã", "Loại", "Mức độ", "Trạng thái", "Ngày"]}
              emptyText="Không có sự cố chất lượng"
              rows={recentQualityIssues.map((q) => [
                <span key="code" className="font-medium text-gray-900">
                  {q.IssueCode || "---"}
                </span>,
                q.IssueType || "---",
                <StatusBadge key="sev" status={q.Severity} />,
                <StatusBadge key="status" status={q.Status} />,
                formatDate(q.createdAt),
              ])}
            />
          )}
        </SectionCard>
      </div>
    </div>
  );
}
