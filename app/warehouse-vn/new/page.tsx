"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Package,
  Warehouse,
  MapPin,
  User,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { cn, generateCode } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import {
  getContainers,
  type Container,
} from "@/lib/containers";
import {
  getContainerItems,
  type ContainerItem,
} from "@/lib/container-items";
import {
  createWarehouseVnReceipt,
  type CreateWarehouseVnReceiptInput,
} from "@/lib/warehouse-vn-receipts";

const WAREHOUSES = ["Đông Anh (HN)", "Hóc Môn (HCM)"] as const;

interface ReceiptRow {
  OrderId: string;
  OrderCode: string;
  PackagesExpected: number;
  PackagesReceived: number;
  WeightKg: number;
  Location: string;
  Discrepancy: number;
}

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-[#4F5FD9]" />
        <h2 className="text-base font-semibold text-[#2D3A8C]">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function ContainerInfoCard({ container }: { container: Container }) {
  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-xs text-gray-500 uppercase tracking-wide">Mã container</span>
          <p className="font-semibold text-gray-900 mt-0.5">{container.ContainerCode}</p>
        </div>
        <div>
          <span className="text-xs text-gray-500 uppercase tracking-wide">Loại</span>
          <p className="font-medium text-gray-700 mt-0.5">{container.ContainerType || "---"}</p>
        </div>
        <div>
          <span className="text-xs text-gray-500 uppercase tracking-wide">Tổng kiện</span>
          <p className="font-semibold text-gray-900 mt-0.5">{container.TotalPackages ?? 0}</p>
        </div>
        <div>
          <span className="text-xs text-gray-500 uppercase tracking-wide">Trạng thái</span>
          <div className="mt-0.5">
            <StatusBadge status={container.Status} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ReceiptRowEditor({
  row,
  index,
  onUpdate,
}: {
  row: ReceiptRow;
  index: number;
  onUpdate: (index: number, field: keyof ReceiptRow, value: number | string) => void;
}) {
  const discrepancy = row.PackagesReceived - row.PackagesExpected;
  const hasDiscrepancy = discrepancy !== 0;

  return (
    <tr className={cn("transition-colors", hasDiscrepancy ? "bg-red-50/50" : "hover:bg-gray-50")}>
      <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.OrderCode}</td>
      <td className="px-4 py-3 text-sm text-gray-700 text-center">{row.PackagesExpected}</td>
      <td className="px-4 py-3">
        <input
          type="number"
          min={0}
          value={row.PackagesReceived}
          onChange={(e) => onUpdate(index, "PackagesReceived", parseInt(e.target.value) || 0)}
          className="w-20 h-9 px-2 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent"
        />
      </td>
      <td className="px-4 py-3 text-sm text-center">
        {hasDiscrepancy ? (
          <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            {discrepancy > 0 ? `+${discrepancy}` : discrepancy}
          </span>
        ) : (
          <span className="text-gray-400">0</span>
        )}
      </td>
      <td className="px-4 py-3">
        <input
          type="number"
          min={0}
          step="0.1"
          value={row.WeightKg || ""}
          onChange={(e) => onUpdate(index, "WeightKg", parseFloat(e.target.value) || 0)}
          placeholder="kg"
          className="w-24 h-9 px-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent"
        />
      </td>
      <td className="px-4 py-3">
        <input
          type="text"
          value={row.Location}
          onChange={(e) => onUpdate(index, "Location", e.target.value)}
          placeholder="A-03-02"
          className="w-28 h-9 px-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent"
        />
      </td>
    </tr>
  );
}

export default function WarehouseVnNewPage() {
  const router = useRouter();

  const [containers, setContainers] = useState<Container[]>([]);
  const [selectedContainerId, setSelectedContainerId] = useState("");
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  const [containerItems, setContainerItems] = useState<ContainerItem[]>([]);
  const [rows, setRows] = useState<ReceiptRow[]>([]);
  const [warehouse, setWarehouse] = useState<string>(WAREHOUSES[0]);
  const [receivedBy, setReceivedBy] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load containers with applicable status
  useEffect(() => {
    async function load() {
      try {
        const { data } = await getContainers({
          take: 200,
          sortField: "createdAt",
          sortDirection: "desc",
        });
        const eligible = data.filter(
          (c) => c.Status === "Đã về kho" || c.Status === "Đang dỡ"
        );
        setContainers(eligible);
      } catch {
        toast.error("Lỗi tải danh sách container");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // When container is selected, load its items
  const handleContainerSelect = useCallback(
    async (containerId: string) => {
      setSelectedContainerId(containerId);
      if (!containerId) {
        setSelectedContainer(null);
        setContainerItems([]);
        setRows([]);
        return;
      }

      const container = containers.find((c) => c.id === containerId) || null;
      setSelectedContainer(container);

      // Auto-fill warehouse from container destination
      if (container?.DestinationWarehouse) {
        setWarehouse(container.DestinationWarehouse);
      }

      setLoadingItems(true);
      try {
        const { data } = await getContainerItems({
          take: 200,
          sortField: "createdAt",
          sortDirection: "desc",
        });
        const items = data.filter((item) => item.ContainerId === containerId);
        setContainerItems(items);

        // Build receipt rows from items
        const newRows: ReceiptRow[] = items.map((item) => ({
          OrderId: item.OrderId || "",
          OrderCode: item.OrderCode || "",
          PackagesExpected: item.Packages || 0,
          PackagesReceived: item.Packages || 0,
          WeightKg: item.WeightKg || 0,
          Location: "",
          Discrepancy: 0,
        }));
        setRows(newRows);
      } catch {
        toast.error("Lỗi tải hàng trong container");
      } finally {
        setLoadingItems(false);
      }
    },
    [containers]
  );

  const handleRowUpdate = (index: number, field: keyof ReceiptRow, value: number | string) => {
    setRows((prev) => {
      const updated = [...prev];
      const row = { ...updated[index], [field]: value };
      row.Discrepancy = row.PackagesReceived - row.PackagesExpected;
      updated[index] = row;
      return updated;
    });
  };

  const totalExpected = rows.reduce((s, r) => s + r.PackagesExpected, 0);
  const totalReceived = rows.reduce((s, r) => s + r.PackagesReceived, 0);
  const totalDiscrepancy = totalReceived - totalExpected;
  const hasAnyDiscrepancy = rows.some((r) => r.PackagesReceived - r.PackagesExpected !== 0);

  const handleSave = async () => {
    if (!selectedContainerId) {
      toast.error("Vui lòng chọn container");
      return;
    }
    if (rows.length === 0) {
      toast.error("Không có hàng để tạo phiếu");
      return;
    }
    if (!receivedBy.trim()) {
      toast.error("Vui lòng nhập tên người nhận hàng");
      return;
    }

    setSaving(true);
    try {
      const receiptCode = generateCode("NK-VN");

      for (const row of rows) {
        const input: CreateWarehouseVnReceiptInput = {
          ReceiptCode: receiptCode,
          ContainerId: selectedContainerId,
          OrderId: row.OrderId,
          OrderCode: row.OrderCode,
          Warehouse: warehouse,
          PackagesExpected: row.PackagesExpected,
          PackagesReceived: row.PackagesReceived,
          Discrepancy: row.PackagesReceived - row.PackagesExpected,
          WeightKg: row.WeightKg || undefined,
          Status: "Đã dỡ",
          Location: row.Location || undefined,
          ReceivedBy: receivedBy.trim(),
        };
        await createWarehouseVnReceipt(input);
      }

      toast.success(`Đã tạo ${rows.length} phiếu nhận hàng VN`);
      router.push("/warehouse-vn");
    } catch {
      toast.error("Lỗi khi tạo phiếu nhận hàng");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="flex items-center">
        <button
          onClick={() => router.push("/warehouse-vn")}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </button>
      </div>

      <PageHeader
        title="Nhận hàng kho VN"
        description="Tạo phiếu nhận hàng từ container về kho Việt Nam"
      />

      {/* Step 1: Select Container */}
      <SectionCard title="Chọn container" icon={Package}>
        {loading ? (
          <div className="h-12 bg-gray-100 rounded animate-pulse" />
        ) : containers.length === 0 ? (
          <p className="text-sm text-gray-500">
            Không có container nào ở trạng thái &quot;Đã về kho&quot; hoặc &quot;Đang dỡ&quot;
          </p>
        ) : (
          <select
            value={selectedContainerId}
            onChange={(e) => handleContainerSelect(e.target.value)}
            className="w-full h-12 px-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent"
          >
            <option value="">-- Chọn container --</option>
            {containers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.ContainerCode} - {c.ContainerType} - {c.TotalPackages ?? 0} kiện - {c.Status}
              </option>
            ))}
          </select>
        )}

        {selectedContainer && (
          <div className="mt-4">
            <ContainerInfoCard container={selectedContainer} />
          </div>
        )}
      </SectionCard>

      {/* Step 2: Warehouse selection */}
      {selectedContainerId && (
        <SectionCard title="Kho nhận" icon={Warehouse}>
          <div className="flex gap-3">
            {WAREHOUSES.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setWarehouse(w)}
                className={cn(
                  "px-5 py-2.5 rounded-lg text-sm font-medium border transition-colors",
                  warehouse === w
                    ? "bg-[#4F5FD9] text-white border-[#4F5FD9]"
                    : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                )}
              >
                {w}
              </button>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Step 3: Container items table */}
      {selectedContainerId && (
        <SectionCard title="Danh sách hàng trong container" icon={Package}>
          {loadingItems ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">
              Không có hàng trong container này
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Mã đơn
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Kiện dự kiến
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Kiện thực nhận
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Chênh lệch
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Cân nặng (kg)
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Vị trí kệ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map((row, i) => (
                      <ReceiptRowEditor
                        key={`${row.OrderId}-${i}`}
                        row={row}
                        index={i}
                        onUpdate={handleRowUpdate}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Tổng kiện dự kiến</span>
                    <p className="text-lg font-semibold text-gray-900 mt-0.5">{totalExpected}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Tổng kiện thực nhận</span>
                    <p className="text-lg font-semibold text-gray-900 mt-0.5">{totalReceived}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Tổng chênh lệch</span>
                    <p
                      className={cn(
                        "text-lg font-semibold mt-0.5",
                        totalDiscrepancy !== 0 ? "text-red-600" : "text-gray-400"
                      )}
                    >
                      {totalDiscrepancy > 0 ? `+${totalDiscrepancy}` : totalDiscrepancy}
                    </p>
                  </div>
                </div>
                {hasAnyDiscrepancy && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Có chênh lệch kiện hàng, vui lòng kiểm tra lại</span>
                  </div>
                )}
              </div>
            </>
          )}
        </SectionCard>
      )}

      {/* Step 4: Received By */}
      {selectedContainerId && rows.length > 0 && (
        <SectionCard title="Thông tin người nhận" icon={User}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Người nhận hàng <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={receivedBy}
                onChange={(e) => setReceivedBy(e.target.value)}
                placeholder="Nhập tên nhân viên kho"
                className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent"
              />
            </div>
          </div>
        </SectionCard>
      )}

      {/* Save / Cancel buttons */}
      {selectedContainerId && rows.length > 0 && (
        <div className="flex items-center gap-3 pb-8">
          <button
            onClick={() => router.push("/warehouse-vn")}
            className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-8 py-3 bg-[#4F5FD9] hover:bg-[#3B4CC0] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Đang lưu..." : `Tạo ${rows.length} phiếu nhận hàng`}
          </button>
        </div>
      )}
    </div>
  );
}
