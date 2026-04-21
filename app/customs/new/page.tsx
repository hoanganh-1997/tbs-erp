"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Package,
  Shield,
  FileText,
  Calculator,
  CheckCircle,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn, generateCode, formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { DocumentChecklist } from "@/components/document-checklist";
import { InspectionChannelBadge } from "@/components/inspection-channel-badge";
import { getContainers, type Container } from "@/lib/containers";
import { getContainerItems, type ContainerItem } from "@/lib/container-items";
import { getOrders, type Order } from "@/lib/orders";
import { getSuppliers, type Supplier } from "@/lib/suppliers";
import { getExchangeRates, type ExchangeRate } from "@/lib/exchange-rates";
import {
  createCustomsDeclaration,
  getCustomsDeclarations,
} from "@/lib/customs-declarations";
import { createCustomsDeclarationItem } from "@/lib/customs-declaration-items";

const CUSTOMS_OFFICES = ["Lạng Sơn", "Lào Cai", "Móng Cái", "Hải Phòng", "Cát Lái", "Khác"] as const;
const INSPECTION_TYPES = ["Luồng xanh", "Luồng vàng", "Luồng đỏ"] as const;
const DECLARATION_TYPES = ["Chính ngạch (UTXNK)", "LCL chính ngạch"] as const;

interface ItemRow {
  OrderId: string;
  OrderCode: string;
  CustomerName: string;
  ProductDescription: string;
  HSCode: string;
  Quantity: number;
  WeightKg: number;
  CBM: number;
  ValueCNY: number;
  ImportTaxRate: number;
  VATRate: number;
}

const STEPS = [
  { label: "Container", icon: Package },
  { label: "Thông tin", icon: Shield },
  { label: "Hàng hóa", icon: FileText },
  { label: "Chứng từ", icon: FileText },
  { label: "Thuế & phí", icon: Calculator },
  { label: "Xác nhận", icon: CheckCircle },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto py-3">
      {STEPS.map((step, i) => (
        <div key={step.label} className="flex items-center gap-1">
          <div
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap",
              i < current && "bg-green-100 text-green-700",
              i === current && "bg-[#4F5FD9] text-white",
              i > current && "bg-gray-100 text-gray-400"
            )}
          >
            {i < current && <CheckCircle className="w-3 h-3" />}
            <step.icon className="w-3 h-3" />
            {step.label}
          </div>
          {i < STEPS.length - 1 && (
            <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}

export default function CustomsNewPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // Data
  const [containers, setContainers] = useState<Container[]>([]);
  const [containerItems, setContainerItems] = useState<ContainerItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [brokers, setBrokers] = useState<Supplier[]>([]);
  const [exchangeRate, setExchangeRate] = useState(3500);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedContainerId, setSelectedContainerId] = useState("");
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  const [declarationType, setDeclarationType] = useState<string>(DECLARATION_TYPES[0]);
  const [customsOffice, setCustomsOffice] = useState<string>(CUSTOMS_OFFICES[0]);
  const [inspectionType, setInspectionType] = useState<string>(INSPECTION_TYPES[0]);
  const [brokerId, setBrokerId] = useState("");
  const [brokerName, setBrokerName] = useState("");
  const [xnkStaff, setXnkStaff] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ItemRow[]>([]);

  // Docs
  const [hasCO, setHasCO] = useState(false);
  const [hasInvoice, setHasInvoice] = useState(false);
  const [hasPackingList, setHasPackingList] = useState(false);
  const [hasBillOfLading, setHasBillOfLading] = useState(false);
  const [hasInsurance, setHasInsurance] = useState(false);

  // Tax overrides
  const [customsFees, setCustomsFees] = useState(0);
  const [specialTax, setSpecialTax] = useState(0);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [contRes, itemsRes, ordersRes, suppRes, ratesRes, existingDecl] =
          await Promise.all([
            getContainers({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
            getContainerItems({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
            getOrders({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
            getSuppliers({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
            getExchangeRates({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
            getCustomsDeclarations({ take: 200, sortField: "createdAt", sortDirection: "desc" }),
          ]);

        // Eligible containers: at border or in customs, and no existing declaration
        const existingContainerIds = new Set(
          existingDecl.data.map((d) => d.ContainerId)
        );
        const eligible = contRes.data.filter(
          (c) =>
            ["Tại biên giới", "Hải quan"].includes(c.Status || "") &&
            !existingContainerIds.has(c.id)
        );
        setContainers(eligible);
        setContainerItems(itemsRes.data);
        setOrders(ordersRes.data);

        // Brokers = suppliers with category "Thông quan"
        const customs = suppRes.data.filter((s) => s.Category === "Thông quan");
        setBrokers(customs);

        // Latest CNY exchange rate
        const cnyRate = ratesRes.data.find(
          (r) => r.FromCurrency === "CNY" && r.ToCurrency === "VND"
        );
        if (cnyRate?.Rate) setExchangeRate(cnyRate.Rate);
      } catch {
        toast.error("Lỗi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleContainerSelect = useCallback(
    (containerId: string) => {
      setSelectedContainerId(containerId);
      const container = containers.find((c) => c.id === containerId) || null;
      setSelectedContainer(container);

      if (container) {
        // Auto-populate items from container
        const cItems = containerItems.filter(
          (ci) => ci.ContainerId === containerId
        );
        const rows: ItemRow[] = cItems.map((ci) => {
          const order = orders.find((o) => o.id === ci.OrderId);
          return {
            OrderId: ci.OrderId || "",
            OrderCode: ci.OrderCode || order?.OrderCode || "",
            CustomerName: order?.CustomerName || "",
            ProductDescription: "",
            HSCode: "",
            Quantity: ci.Packages || 0,
            WeightKg: ci.WeightKg || 0,
            CBM: ci.CBM || 0,
            ValueCNY: order?.ItemsTotalCNY || 0,
            ImportTaxRate: 10,
            VATRate: 10,
          };
        });
        setItems(rows);
      }
    },
    [containers, containerItems, orders]
  );

  const handleBrokerSelect = (id: string) => {
    setBrokerId(id);
    const broker = brokers.find((b) => b.id === id);
    setBrokerName(broker?.CompanyName || broker?.ContactName || "");
  };

  const updateItem = (index: number, field: keyof ItemRow, value: string | number) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Calculations
  const totalCBM = items.reduce((s, i) => s + i.CBM, 0);
  const totalWeight = items.reduce((s, i) => s + i.WeightKg, 0);
  const totalValueCNY = items.reduce((s, i) => s + i.ValueCNY, 0);

  const calcImportTax = (item: ItemRow) =>
    Math.round(item.ValueCNY * exchangeRate * (item.ImportTaxRate / 100));
  const calcVAT = (item: ItemRow) => {
    const importTax = calcImportTax(item);
    return Math.round((item.ValueCNY * exchangeRate + importTax) * (item.VATRate / 100));
  };

  const totalImportTax = items.reduce((s, i) => s + calcImportTax(i), 0);
  const totalVAT = items.reduce((s, i) => s + calcVAT(i), 0);
  const totalTax = totalImportTax + totalVAT + specialTax + customsFees;

  const docComplete = hasCO && hasInvoice && hasPackingList && hasBillOfLading;
  const docStatus = docComplete ? "Đủ chứng từ" : "Thiếu chứng từ";

  const handleDocChange = (field: string, value: boolean) => {
    if (field === "hasCO") setHasCO(value);
    if (field === "hasInvoice") setHasInvoice(value);
    if (field === "hasPackingList") setHasPackingList(value);
    if (field === "hasBillOfLading") setHasBillOfLading(value);
    if (field === "hasInsurance") setHasInsurance(value);
  };

  const canNext = () => {
    if (step === 0) return !!selectedContainerId;
    if (step === 1) return !!customsOffice && !!xnkStaff;
    if (step === 2) return items.length > 0;
    return true;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const code = generateCode("TK");
      const hsCodes = Array.from(new Set(items.map((i) => i.HSCode).filter(Boolean))).join(", ");

      const decl = await createCustomsDeclaration({
        DeclarationCode: code,
        ContainerId: selectedContainerId,
        ContainerCode: selectedContainer?.ContainerCode,
        DeclarationType: declarationType,
        CustomsOffice: customsOffice,
        TotalOrdersCount: items.length,
        TotalCBM: Math.round(totalCBM * 100) / 100,
        TotalWeightKg: Math.round(totalWeight * 100) / 100,
        TotalValueCNY: totalValueCNY,
        ImportTaxVND: totalImportTax,
        VATAmount: totalVAT,
        SpecialTaxVND: specialTax,
        CustomsFeesVND: customsFees,
        TotalTaxVND: totalTax,
        HSCodes: hsCodes,
        DocumentStatus: docStatus,
        HasCO: hasCO,
        HasInvoice: hasInvoice,
        HasPackingList: hasPackingList,
        HasBillOfLading: hasBillOfLading,
        HasInsurance: hasInsurance,
        Status: "Chuẩn bị hồ sơ",
        InspectionType: inspectionType,
        BrokerId: brokerId,
        BrokerName: brokerName,
        XNKStaff: xnkStaff,
        Notes: notes,
      });

      // Create declaration items
      for (const item of items) {
        await createCustomsDeclarationItem({
          DeclarationId: decl.id,
          OrderId: item.OrderId,
          OrderCode: item.OrderCode,
          CustomerName: item.CustomerName,
          ProductDescription: item.ProductDescription,
          HSCode: item.HSCode,
          Quantity: item.Quantity,
          WeightKg: item.WeightKg,
          CBM: item.CBM,
          ValueCNY: item.ValueCNY,
          ImportTaxRate: item.ImportTaxRate,
          ImportTaxVND: calcImportTax(item),
          VATRate: item.VATRate,
          VATAmount: calcVAT(item),
        });
      }

      toast.success(`Tạo tờ khai ${code} thành công`);
      router.push("/customs");
    } catch {
      toast.error("Lỗi tạo tờ khai");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push("/customs")}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại
      </button>

      <PageHeader title="Tạo tờ khai hải quan" description="Khai báo thông quan cho container chính ngạch" />

      <StepIndicator current={step} />

      {/* Step 0: Select container */}
      {step === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-[#2D3A8C] flex items-center gap-2">
            <Package className="w-5 h-5 text-[#4F5FD9]" />
            Chọn container
          </h2>
          {loading ? (
            <div className="h-12 bg-gray-100 rounded animate-pulse" />
          ) : containers.length === 0 ? (
            <p className="text-sm text-gray-500">
              Không có container nào tại biên giới / hải quan chưa có tờ khai
            </p>
          ) : (
            <>
              <select
                value={selectedContainerId}
                onChange={(e) => handleContainerSelect(e.target.value)}
                className="w-full h-12 px-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]"
              >
                <option value="">-- Chọn container --</option>
                {containers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.ContainerCode} — {c.ContainerType} — {c.TotalPackages ?? 0} kiện — {c.Status}
                  </option>
                ))}
              </select>
              {selectedContainer && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-gray-500 uppercase">Mã</span>
                    <p className="font-semibold mt-0.5">{selectedContainer.ContainerCode}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 uppercase">Tuyến</span>
                    <p className="font-medium mt-0.5">{selectedContainer.Route}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 uppercase">Kiện</span>
                    <p className="font-semibold mt-0.5">{selectedContainer.TotalPackages ?? 0}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 uppercase">Trạng thái</span>
                    <div className="mt-0.5"><StatusBadge status={selectedContainer.Status} /></div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Step 1: Info */}
      {step === 1 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-5">
          <h2 className="text-base font-semibold text-[#2D3A8C] flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#4F5FD9]" />
            Thông tin tờ khai
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Loại tờ khai *</label>
              <select value={declarationType} onChange={(e) => setDeclarationType(e.target.value)} className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]">
                {DECLARATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Cửa khẩu *</label>
              <select value={customsOffice} onChange={(e) => setCustomsOffice(e.target.value)} className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]">
                {CUSTOMS_OFFICES.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Kênh kiểm hóa</label>
              <div className="flex gap-2">
                {INSPECTION_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setInspectionType(t)}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-xs font-medium border transition-colors",
                      inspectionType === t
                        ? t === "Luồng xanh" ? "bg-green-100 text-green-700 border-green-300"
                          : t === "Luồng vàng" ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                            : "bg-red-100 text-red-700 border-red-300"
                        : "bg-gray-50 text-gray-500 border-gray-200"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Đại lý thông quan</label>
              <select value={brokerId} onChange={(e) => handleBrokerSelect(e.target.value)} className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]">
                <option value="">-- Không chọn --</option>
                {brokers.map((b) => <option key={b.id} value={b.id}>{b.CompanyName || b.ContactName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nhân viên XNK *</label>
              <input type="text" value={xnkStaff} onChange={(e) => setXnkStaff(e.target.value)} placeholder="Tên NV phòng XNK" className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Ghi chú</label>
              <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ghi chú thêm" className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4F5FD9]" />
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Items */}
      {step === 2 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-[#2D3A8C] flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#4F5FD9]" />
            Danh sách hàng hóa ({items.length} đơn)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  {["Mã đơn", "Khách hàng", "Mô tả", "HS Code", "SL", "Kg", "CBM", "Giá CNY", "Thuế NK %", "VAT %"].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item, i) => (
                  <tr key={`${item.OrderId}-${i}`} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-sm font-medium text-[#4F5FD9]">{item.OrderCode}</td>
                    <td className="px-3 py-2 text-sm text-gray-700">{item.CustomerName || "---"}</td>
                    <td className="px-3 py-2">
                      <input type="text" value={item.ProductDescription} onChange={(e) => updateItem(i, "ProductDescription", e.target.value)} placeholder="Mô tả hàng" className="w-32 h-8 px-2 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#4F5FD9]" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="text" value={item.HSCode} onChange={(e) => updateItem(i, "HSCode", e.target.value)} placeholder="8471.30" className="w-24 h-8 px-2 border border-gray-300 rounded text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#4F5FD9]" />
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-700 text-center">{item.Quantity}</td>
                    <td className="px-3 py-2 text-sm text-gray-700">{item.WeightKg}</td>
                    <td className="px-3 py-2 text-sm text-gray-700">{item.CBM}</td>
                    <td className="px-3 py-2">
                      <input type="number" value={item.ValueCNY || ""} onChange={(e) => updateItem(i, "ValueCNY", parseFloat(e.target.value) || 0)} className="w-24 h-8 px-2 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#4F5FD9]" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" value={item.ImportTaxRate} onChange={(e) => updateItem(i, "ImportTaxRate", parseFloat(e.target.value) || 0)} className="w-16 h-8 px-2 border border-gray-300 rounded text-xs text-center focus:outline-none focus:ring-1 focus:ring-[#4F5FD9]" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" value={item.VATRate} onChange={(e) => updateItem(i, "VATRate", parseFloat(e.target.value) || 0)} className="w-16 h-8 px-2 border border-gray-300 rounded text-xs text-center focus:outline-none focus:ring-1 focus:ring-[#4F5FD9]" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg grid grid-cols-3 gap-4 text-sm">
            <div><span className="text-xs text-gray-500 uppercase">Tổng CBM</span><p className="font-semibold mt-0.5">{totalCBM.toFixed(2)}</p></div>
            <div><span className="text-xs text-gray-500 uppercase">Tổng Kg</span><p className="font-semibold mt-0.5">{totalWeight.toFixed(1)}</p></div>
            <div><span className="text-xs text-gray-500 uppercase">Tổng giá trị</span><p className="font-semibold mt-0.5">{formatCurrency(totalValueCNY, "CNY")}</p></div>
          </div>
        </div>
      )}

      {/* Step 3: Documents */}
      {step === 3 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-[#2D3A8C] mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#4F5FD9]" />
            Chứng từ hải quan
          </h2>
          <DocumentChecklist
            hasCO={hasCO}
            hasInvoice={hasInvoice}
            hasPackingList={hasPackingList}
            hasBillOfLading={hasBillOfLading}
            hasInsurance={hasInsurance}
            editable
            onChange={handleDocChange}
          />
        </div>
      )}

      {/* Step 4: Tax */}
      {step === 4 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-[#2D3A8C] flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[#4F5FD9]" />
            Ước tính thuế & phí
          </h2>
          <div className="p-3 bg-blue-50 rounded-lg text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Tỷ giá CNY/VND</span>
              <span className="font-medium">1 CNY = {formatCurrency(exchangeRate)}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-gray-600">Giá trị hàng hóa</span>
              <span className="font-medium">{formatCurrency(totalValueCNY, "CNY")} = {formatCurrency(totalValueCNY * exchangeRate)}</span>
            </div>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              <tr><td className="py-2.5 text-gray-600">Thuế nhập khẩu</td><td className="py-2.5 text-right font-medium">{formatCurrency(totalImportTax)}</td></tr>
              <tr><td className="py-2.5 text-gray-600">Thuế GTGT (VAT)</td><td className="py-2.5 text-right font-medium">{formatCurrency(totalVAT)}</td></tr>
              <tr>
                <td className="py-2.5 text-gray-600">Thuế TTĐB</td>
                <td className="py-2.5 text-right">
                  <input type="number" value={specialTax || ""} onChange={(e) => setSpecialTax(parseFloat(e.target.value) || 0)} placeholder="0" className="w-32 h-8 px-2 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-[#4F5FD9]" />
                </td>
              </tr>
              <tr>
                <td className="py-2.5 text-gray-600">Phí hải quan</td>
                <td className="py-2.5 text-right">
                  <input type="number" value={customsFees || ""} onChange={(e) => setCustomsFees(parseFloat(e.target.value) || 0)} placeholder="0" className="w-32 h-8 px-2 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-[#4F5FD9]" />
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300">
                <td className="py-3 font-semibold text-[#2D3A8C]">Tổng thuế & phí</td>
                <td className="py-3 text-right font-bold text-lg text-[#2D3A8C]">{formatCurrency(totalTax)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Step 5: Confirm */}
      {step === 5 && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-[#2D3A8C] mb-4">Xác nhận tờ khai</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Container</span><p className="font-medium mt-0.5">{selectedContainer?.ContainerCode}</p></div>
              <div><span className="text-gray-500">Loại</span><p className="font-medium mt-0.5">{declarationType}</p></div>
              <div><span className="text-gray-500">Cửa khẩu</span><p className="font-medium mt-0.5">{customsOffice}</p></div>
              <div><span className="text-gray-500">Kênh</span><div className="mt-0.5"><InspectionChannelBadge channel={inspectionType} /></div></div>
              <div><span className="text-gray-500">NV XNK</span><p className="font-medium mt-0.5">{xnkStaff}</p></div>
              <div><span className="text-gray-500">Đại lý TQ</span><p className="font-medium mt-0.5">{brokerName || "---"}</p></div>
              <div><span className="text-gray-500">Số đơn hàng</span><p className="font-medium mt-0.5">{items.length}</p></div>
              <div><span className="text-gray-500">Chứng từ</span><p className={cn("font-medium mt-0.5", docComplete ? "text-green-600" : "text-orange-600")}>{docStatus}</p></div>
              <div><span className="text-gray-500">Tổng CBM</span><p className="font-medium mt-0.5">{totalCBM.toFixed(2)}</p></div>
              <div><span className="text-gray-500">Tổng Kg</span><p className="font-medium mt-0.5">{totalWeight.toFixed(1)}</p></div>
              <div className="col-span-2"><span className="text-gray-500">Tổng thuế & phí</span><p className="font-bold text-lg text-[#2D3A8C] mt-0.5">{formatCurrency(totalTax)}</p></div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pb-8">
        <button
          onClick={() => (step > 0 ? setStep(step - 1) : router.push("/customs"))}
          className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {step > 0 ? "Quay lại" : "Hủy"}
        </button>
        {step < 5 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canNext()}
            className="inline-flex items-center gap-2 px-8 py-3 bg-[#4F5FD9] hover:bg-[#3B4CC0] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            Tiếp theo
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-8 py-3 bg-[#4F5FD9] hover:bg-[#3B4CC0] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Đang tạo..." : "Tạo tờ khai"}
          </button>
        )}
      </div>
    </div>
  );
}
