"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, X, Package, Ship, TrendingUp, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { cn, formatDate, generateCode } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import {
  getContainers,
  createContainer,
  updateContainer,
  type Container,
  type CreateContainerInput,
} from "@/lib/containers";

const STATUS_TABS = [
  "Tất cả",
  "Lập kế hoạch",
  "Đặt chỗ",
  "Đang xếp",
  "Đã đóng",
  "Đang vận chuyển",
  "Đã thông quan",
  "Đã về kho",
  "Hoàn tất",
];

const CONTAINER_TYPES = ["20ft", "40ft", "40ft HC", "Xe tải"];
const ROUTES = ["Đường biển", "Đường bộ"];
const WAREHOUSES = ["Đông Anh (HN)", "Hóc Môn (HCM)"];

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

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <Package className="w-12 h-12 mb-3" />
      <p className="text-sm">Không có dữ liệu</p>
    </div>
  );
}

function FillRateBar({ rate }: { rate: number | undefined }) {
  const value = rate ?? 0;
  const color = value >= 85 ? "bg-green-500" : value >= 70 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <span className="text-xs text-gray-600 font-medium">{value}%</span>
    </div>
  );
}

const TRANSPORT_STATUSES = [
  "Đang vận chuyển",
  "Tại biên giới",
  "Hải quan",
  "Đã thông quan",
];

function ContainerKpiCards({ containers }: { containers: Container[] }) {
  const stats = useMemo(() => {
    const total = containers.length;

    const inTransit = containers.filter(
      (c) => c.Status && TRANSPORT_STATUSES.includes(c.Status)
    ).length;

    const activeContainers = containers.filter(
      (c) =>
        c.Status &&
        c.Status !== "Hoàn tất" &&
        c.Status !== "Lập kế hoạch"
    );
    const avgFillRate =
      activeContainers.length > 0
        ? Math.round(
            activeContainers.reduce((sum, c) => sum + (c.FillRate ?? 0), 0) /
              activeContainers.length
          )
        : 0;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const completedThisMonth = containers.filter(
      (c) =>
        c.Status === "Hoàn tất" &&
        c.updatedAt &&
        new Date(c.updatedAt) >= startOfMonth
    ).length;

    return { total, inTransit, avgFillRate, completedThisMonth };
  }, [containers]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        title="Tổng container"
        value={stats.total}
        icon={Package}
        borderColor="border-l-gray-400"
      />
      <KpiCard
        title="Đang vận chuyển"
        value={stats.inTransit}
        icon={Ship}
        borderColor="border-l-blue-500"
        subtitle="Đang trên đường"
        subtitleClassName="text-blue-600"
      />
      <KpiCard
        title="Fill rate TB"
        value={`${stats.avgFillRate}%`}
        icon={TrendingUp}
        borderColor="border-l-yellow-500"
        subtitle="Container đang hoạt động"
      />
      <KpiCard
        title="Hoàn tất tháng này"
        value={stats.completedThisMonth}
        icon={CheckCircle2}
        borderColor="border-l-green-500"
        subtitle="Tháng hiện tại"
        subtitleClassName="text-green-600"
      />
    </div>
  );
}

function CreateContainerModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState<Partial<CreateContainerInput>>({
    ContainerCode: generateCode("CNT"),
    ContainerType: "40ft",
    Route: "Đường biển",
    DestinationWarehouse: "Đông Anh (HN)",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.ContainerCode) {
      toast.error("Mã container không được để trống");
      return;
    }
    setSaving(true);
    try {
      await createContainer({
        ...form,
        Status: "Lập kế hoạch",
        FillRate: 0,
        TotalPackages: 0,
        TotalCBM: 0,
      } as CreateContainerInput);
      toast.success("Tạo container thành công");
      onCreated();
      onClose();
    } catch {
      toast.error("Lỗi tạo container");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#2D3A8C]">Tạo container</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Mã container</label>
            <input
              value={form.ContainerCode || ""}
              onChange={(e) => setForm({ ...form, ContainerCode: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loại container</label>
            <select
              value={form.ContainerType || ""}
              onChange={(e) => setForm({ ...form, ContainerType: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]"
            >
              {CONTAINER_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tuyến đường</label>
            <select
              value={form.Route || ""}
              onChange={(e) => setForm({ ...form, Route: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]"
            >
              {ROUTES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nhà vận chuyển</label>
            <input
              value={form.CarrierName || ""}
              onChange={(e) => setForm({ ...form, CarrierName: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max CBM</label>
            <input
              type="number"
              value={form.MaxCBM ?? ""}
              onChange={(e) => setForm({ ...form, MaxCBM: Number(e.target.value) })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ETD</label>
            <input
              type="date"
              value={form.ETD || ""}
              onChange={(e) => setForm({ ...form, ETD: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ETA</label>
            <input
              type="date"
              value={form.ETA || ""}
              onChange={(e) => setForm({ ...form, ETA: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Kho đích</label>
            <select
              value={form.DestinationWarehouse || ""}
              onChange={(e) => setForm({ ...form, DestinationWarehouse: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]"
            >
              {WAREHOUSES.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 text-sm bg-[#4F5FD9] hover:bg-[#3B4CC0] text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
          >
            {saving ? "Đang tạo..." : "Tạo container"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ContainersPage() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Tất cả");
  const [showCreate, setShowCreate] = useState(false);
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getContainers({
        take: 200,
        sortField: "createdAt",
        sortDirection: "desc",
      });
      setContainers(data);
    } catch {
      toast.error("Lỗi tải dữ liệu container");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = containers.filter((c) => {
    if (activeTab !== "Tất cả" && c.Status !== activeTab) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleStatusChange = async (container: Container, newStatus: string) => {
    try {
      await updateContainer(container.id, { Status: newStatus });
      toast.success(`${container.ContainerCode} -> ${newStatus}`);
      fetchData();
    } catch {
      toast.error("Lỗi cập nhật trạng thái");
    }
  };

  const getActions = (c: Container) => {
    const actions: { label: string; status: string; primary: boolean }[] = [];
    if (c.Status === "Lập kế hoạch") actions.push({ label: "Đặt chỗ", status: "Đặt chỗ", primary: true });
    if (c.Status === "Đang xếp") actions.push({ label: "Đóng cont", status: "Đã đóng", primary: true });
    if (c.Status === "Đã đóng") actions.push({ label: "Vận chuyển", status: "Đang vận chuyển", primary: true });
    actions.push({ label: "Thêm kiện", status: "", primary: false });
    return actions;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Container & Ghép cont"
        description="Quản lý container vận chuyển"
        actionLabel="Tạo container"
        onAction={() => setShowCreate(true)}
      />

      <CreateContainerModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={fetchData}
      />

      {/* KPI Cards */}
      <ContainerKpiCards containers={containers} />

      {/* Status tabs */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setPage(1); }}
            className={cn(
              "px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
              activeTab === tab
                ? "border-[#4F5FD9] text-[#4F5FD9]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            {tab}
            <span className="ml-1.5 text-xs text-gray-400">
              ({containers.filter((c) => tab === "Tất cả" || c.Status === tab).length})
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton />
      ) : paginated.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  {["Mã cont", "Loại", "Tuyến", "Nhà VC", "ETD", "ETA", "Kho đích", "Tỷ lệ lấp", "Kiện", "Trạng thái", "Thao tác"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium">
                      <Link
                        href={`/containers/${c.id}`}
                        className="text-[#4F5FD9] hover:underline"
                      >
                        {c.ContainerCode}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded bg-gray-100 text-xs font-medium text-gray-700">
                        {c.ContainerType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{c.Route || "---"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{c.CarrierName || "---"}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(c.ETD)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(c.ETA)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{c.DestinationWarehouse || "---"}</td>
                    <td className="px-4 py-3">
                      <FillRateBar rate={c.FillRate} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{c.TotalPackages ?? 0}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.Status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 flex-wrap">
                        {getActions(c).map((action) =>
                          action.status ? (
                            <button
                              key={action.label}
                              onClick={() => handleStatusChange(c, action.status)}
                              className={cn(
                                "px-2.5 py-1 rounded text-xs font-medium transition-colors",
                                action.primary
                                  ? "bg-[#4F5FD9] hover:bg-[#3B4CC0] text-white"
                                  : "border border-gray-300 text-gray-600 hover:bg-gray-50"
                              )}
                            >
                              {action.label}
                            </button>
                          ) : (
                            <button
                              key={action.label}
                              className="px-2.5 py-1 rounded text-xs font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                              {action.label}
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length} container
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
