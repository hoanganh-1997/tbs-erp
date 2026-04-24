"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Loader2, Package, Search } from "lucide-react";
import { toast } from "sonner";
import { getOrders, type Order } from "@/lib/orders";
import {
  getContainerItems,
  createContainerItem,
} from "@/lib/container-items";
import { updateContainer, type Container } from "@/lib/containers";

interface AddItemsToContainerModalProps {
  open: boolean;
  container: Container | null;
  onClose: () => void;
  onSaved: () => void;
}

interface Row {
  order: Order;
  selected: boolean;
  packages: string;
  weightKg: string;
  cbm: string;
}

const ELIGIBLE_ORDER_STATUSES = new Set([
  "Đã xác nhận",
  "Đang tìm hàng",
  "Đã đặt hàng",
  "Tại kho TQ",
]);

export function AddItemsToContainerModal({
  open,
  container,
  onClose,
  onSaved,
}: AddItemsToContainerModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open || !container) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [ordersRes, itemsRes] = await Promise.all([
          getOrders({ take: 100, sortField: "createdAt", sortDirection: "desc" }),
          getContainerItems({ take: 200, filters: { ContainerId: container.id } }),
        ]);
        if (cancelled) return;
        const existingOrderIds = new Set(
          itemsRes.data.map((it) => it.OrderId).filter(Boolean) as string[],
        );
        const candidates = ordersRes.data.filter(
          (o) =>
            !existingOrderIds.has(o.id) &&
            (!o.Status || ELIGIBLE_ORDER_STATUSES.has(o.Status)),
        );
        setRows(
          candidates.map((o) => ({
            order: o,
            selected: false,
            packages: "1",
            weightKg: "",
            cbm: "",
          })),
        );
      } catch (e: any) {
        toast.error(`Lỗi tải đơn hàng: ${e?.message ?? "Không rõ"}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, container]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const o = r.order;
      return (
        o.OrderCode?.toLowerCase().includes(q) ||
        o.CustomerName?.toLowerCase().includes(q) ||
        o.CompanyName?.toLowerCase().includes(q)
      );
    });
  }, [rows, search]);

  const selectedCount = rows.filter((r) => r.selected).length;

  const updateRow = (orderId: string, patch: Partial<Row>) => {
    setRows((prev) =>
      prev.map((r) => (r.order.id === orderId ? { ...r, ...patch } : r)),
    );
  };

  const toggleAll = (checked: boolean) => {
    setRows((prev) => prev.map((r) => ({ ...r, selected: checked })));
  };

  const handleSave = async () => {
    if (!container) return;
    const selected = rows.filter((r) => r.selected);
    if (selected.length === 0) {
      toast.error("Chưa chọn đơn hàng nào");
      return;
    }

    for (const r of selected) {
      const pkg = Number(r.packages);
      if (!Number.isFinite(pkg) || pkg <= 0) {
        toast.error(`Đơn ${r.order.OrderCode}: số kiện phải > 0`);
        return;
      }
    }

    setSaving(true);
    try {
      let addedPackages = 0;
      let addedCbm = 0;
      for (const r of selected) {
        const pkg = Number(r.packages);
        const weight = r.weightKg ? Number(r.weightKg) : 0;
        const cbm = r.cbm ? Number(r.cbm) : 0;
        await createContainerItem({
          ContainerId: container.id,
          OrderId: r.order.id,
          OrderCode: r.order.OrderCode,
          Packages: pkg,
          WeightKg: weight > 0 ? weight : undefined,
          CBM: cbm > 0 ? cbm : undefined,
          LoadedAt: new Date().toISOString(),
          ScanVerified: false,
        });
        addedPackages += pkg;
        addedCbm += cbm;
      }

      const newTotalPackages = (container.TotalPackages ?? 0) + addedPackages;
      const newTotalCbm = (container.TotalCBM ?? 0) + addedCbm;
      const maxCbm = container.MaxCBM ?? 0;
      const newFillRate =
        maxCbm > 0 ? Math.round((newTotalCbm / maxCbm) * 100) : container.FillRate;

      await updateContainer(container.id, {
        TotalPackages: newTotalPackages,
        TotalCBM: newTotalCbm,
        FillRate: newFillRate,
      });

      toast.success(`Đã thêm ${selected.length} đơn vào container`);
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(`Lỗi lưu: ${e?.message ?? "Không rõ"}`);
    } finally {
      setSaving(false);
    }
  };

  if (!open || !container) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-[#2D3A8C]">
              Thêm kiện vào container
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {container.ContainerCode} — {container.ContainerType} —{" "}
              {container.TotalPackages ?? 0} kiện / {container.TotalCBM ?? 0} CBM
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã đơn hoặc khách hàng..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]/30"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-600 whitespace-nowrap">
            <input
              type="checkbox"
              checked={rows.length > 0 && rows.every((r) => r.selected)}
              onChange={(e) => toggleAll(e.target.checked)}
              className="rounded"
            />
            Chọn tất cả ({selectedCount}/{rows.length})
          </label>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-3">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Đang tải đơn hàng...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Package className="w-10 h-10 mb-2" />
              <p className="text-sm">
                {rows.length === 0
                  ? "Không còn đơn hàng nào đủ điều kiện ghép container"
                  : "Không có kết quả khớp"}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-500 uppercase border-b border-gray-200">
                  <th className="py-2 w-10" />
                  <th className="py-2">Mã đơn</th>
                  <th className="py-2">Khách hàng</th>
                  <th className="py-2">Trạng thái</th>
                  <th className="py-2 w-20 text-right">Kiện</th>
                  <th className="py-2 w-24 text-right">KL (kg)</th>
                  <th className="py-2 w-24 text-right">CBM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((r) => (
                  <tr key={r.order.id} className="hover:bg-gray-50/60">
                    <td className="py-2">
                      <input
                        type="checkbox"
                        checked={r.selected}
                        onChange={(e) =>
                          updateRow(r.order.id, { selected: e.target.checked })
                        }
                        className="rounded"
                      />
                    </td>
                    <td className="py-2 font-medium text-[#4F5FD9]">
                      {r.order.OrderCode}
                    </td>
                    <td className="py-2 text-gray-700">
                      {r.order.CustomerName || r.order.CompanyName || "---"}
                    </td>
                    <td className="py-2 text-xs text-gray-600">
                      {r.order.Status || "---"}
                    </td>
                    <td className="py-2">
                      <input
                        type="number"
                        min={1}
                        step="any"
                        value={r.packages}
                        onChange={(e) =>
                          updateRow(r.order.id, { packages: e.target.value })
                        }
                        disabled={!r.selected}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-right text-sm disabled:bg-gray-50"
                      />
                    </td>
                    <td className="py-2">
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={r.weightKg}
                        onChange={(e) =>
                          updateRow(r.order.id, { weightKg: e.target.value })
                        }
                        disabled={!r.selected}
                        placeholder="—"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-right text-sm disabled:bg-gray-50"
                      />
                    </td>
                    <td className="py-2">
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={r.cbm}
                        onChange={(e) =>
                          updateRow(r.order.id, { cbm: e.target.value })
                        }
                        disabled={!r.selected}
                        placeholder="—"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-right text-sm disabled:bg-gray-50"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="px-6 py-3 border-t border-gray-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || selectedCount === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#4F5FD9] text-white rounded-lg hover:bg-[#3B4CC0] disabled:opacity-50"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "Đang lưu..." : `Thêm ${selectedCount} đơn`}
          </button>
        </div>
      </div>
    </div>
  );
}
