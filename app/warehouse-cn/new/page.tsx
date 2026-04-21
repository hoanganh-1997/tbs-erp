"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Package,
  Ruler,
  ShieldCheck,
  Tag,
  Wrench,
  Save,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Languages,
} from "lucide-react";
import { toast } from "sonner";
import { cn, generateCode } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import {
  createWarehouseCnReceipt,
  type CreateWarehouseCnReceiptInput,
} from "@/lib/warehouse-cn-receipts";
import { getOrders, type Order } from "@/lib/orders";

// --- Bilingual labels ---
type Lang = "vi" | "zh";

const LABELS: Record<string, Record<Lang, string>> = {
  pageTitle: { vi: "Nhận hàng kho TQ", zh: "中国仓收货" },
  pageDesc: { vi: "Quét mã vận đơn & nhập thông tin kiện hàng", zh: "扫描运单号 & 录入包裹信息" },
  scanTitle: { vi: "Quét / nhập mã vận đơn", zh: "扫描 / 输入运单号" },
  scanPlaceholder: { vi: "Quét hoặc nhập tracking number...", zh: "扫描或输入跟踪号..." },
  lookup: { vi: "Tra cứu", zh: "查询" },
  matched: { vi: "Khớp đơn hàng", zh: "匹配订单" },
  unidentified: { vi: "Kiện không xác định", zh: "未识别包裹" },
  markUnidentified: { vi: "Đánh dấu không xác định", zh: "标记为未识别" },
  dimensionsTitle: { vi: "Cân nặng & kích thước", zh: "重量 & 尺寸" },
  weight: { vi: "Cân nặng (kg)", zh: "重量 (kg)" },
  length: { vi: "Dài (cm)", zh: "长 (cm)" },
  width: { vi: "Rộng (cm)", zh: "宽 (cm)" },
  height: { vi: "Cao (cm)", zh: "高 (cm)" },
  cbm: { vi: "CBM", zh: "CBM" },
  chargeableWeight: { vi: "Trọng lượng tính cước", zh: "计费重量" },
  packagesTitle: { vi: "Số kiện hàng", zh: "包裹数量" },
  packagesExpected: { vi: "Kiện dự kiến", zh: "预计件数" },
  packagesReceived: { vi: "Kiện đã nhận", zh: "已收件数" },
  qcTitle: { vi: "Kiểm tra chất lượng (QC)", zh: "质量检查 (QC)" },
  qcNotes: { vi: "Ghi chú QC", zh: "QC备注" },
  labelTitle: { vi: "Kiểm tra tem nhãn", zh: "标签检查" },
  servicesTitle: { vi: "Dịch vụ gia tăng", zh: "增值服务" },
  agent: { vi: "Đại lý / Nhân viên", zh: "代理 / 员工" },
  save: { vi: "Lưu phiếu nhận hàng", zh: "保存收货单" },
  saving: { vi: "Đang lưu...", zh: "保存中..." },
  back: { vi: "Quay lại", zh: "返回" },
  receivingProgress: { vi: "Tiến độ nhận hàng", zh: "收货进度" },
  noOrder: { vi: "Không tìm thấy đơn hàng khớp", zh: "未找到匹配订单" },
};

const QC_OPTIONS = ["Đạt", "Lỗi", "Chờ KH duyệt"];
const LABEL_OPTIONS = ["Tem HQ OK", "Cần in bù", "Chỉ mã nội bộ"];
const EXTRA_SERVICES = ["Kiểm đếm", "Đóng gói lại", "Kiện gỗ", "Ảnh chi tiết", "Video mở kiện"];

// --- Helper components ---

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

function ProgressBar({
  received,
  expected,
  lang,
}: {
  received: number;
  expected: number;
  lang: Lang;
}) {
  const pct = expected > 0 ? Math.min(100, Math.round((received / expected) * 100)) : 0;
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
        <span>
          {LABELS.receivingProgress[lang]}: {received}/{expected}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            pct >= 100 ? "bg-green-500" : pct > 0 ? "bg-[#4F5FD9]" : "bg-gray-200"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function RadioGroup({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
            value === opt
              ? "bg-[#4F5FD9] text-white border-[#4F5FD9]"
              : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function CheckboxGroup({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((s) => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <label
          key={opt}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm border cursor-pointer transition-colors",
            selected.includes(opt)
              ? "bg-[#4F5FD9]/10 text-[#4F5FD9] border-[#4F5FD9]"
              : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
          )}
        >
          <input
            type="checkbox"
            checked={selected.includes(opt)}
            onChange={() => toggle(opt)}
            className="rounded border-gray-300 text-[#4F5FD9]"
          />
          {opt}
        </label>
      ))}
    </div>
  );
}

function MatchedOrderCard({
  order,
  lang,
}: {
  order: Order;
  lang: Lang;
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg mt-3">
      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-green-800">
          {LABELS.matched[lang]}: {order.OrderCode}
        </p>
        <p className="text-xs text-green-600 truncate">
          {order.CustomerName} | {order.ServiceTypes?.join(", ")}
        </p>
      </div>
    </div>
  );
}

function NoMatchBanner({
  lang,
  isUnidentified,
  onToggle,
}: {
  lang: Lang;
  isUnidentified: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg mt-3">
      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-yellow-800">
          {LABELS.noOrder[lang]}
        </p>
      </div>
      <label className="inline-flex items-center gap-2 text-xs text-yellow-700 cursor-pointer whitespace-nowrap">
        <input
          type="checkbox"
          checked={isUnidentified}
          onChange={onToggle}
          className="rounded border-yellow-400"
        />
        {LABELS.markUnidentified[lang]}
      </label>
    </div>
  );
}

// --- Main page ---

export default function WarehouseCnNewPage() {
  const router = useRouter();
  const scanRef = useRef<HTMLInputElement>(null);

  const [lang, setLang] = useState<Lang>("vi");
  const [orders, setOrders] = useState<Order[]>([]);
  const [saving, setSaving] = useState(false);

  // Form state
  const [trackingCN, setTrackingCN] = useState("");
  const [matchedOrder, setMatchedOrder] = useState<Order | null>(null);
  const [lookupDone, setLookupDone] = useState(false);
  const [isUnidentified, setIsUnidentified] = useState(false);

  const [weightKg, setWeightKg] = useState<number | "">("");
  const [lengthCm, setLengthCm] = useState<number | "">("");
  const [widthCm, setWidthCm] = useState<number | "">("");
  const [heightCm, setHeightCm] = useState<number | "">("");

  const [packagesExpected, setPackagesExpected] = useState<number | "">(1);
  const [packagesReceived, setPackagesReceived] = useState<number | "">(1);

  const [qcStatus, setQcStatus] = useState("Đạt");
  const [qcNotes, setQcNotes] = useState("");
  const [labelStatus, setLabelStatus] = useState("Tem HQ OK");

  const [extraServices, setExtraServices] = useState<string[]>([]);
  const [agent, setAgent] = useState("");

  // Computed dimensions
  const cbm =
    lengthCm && widthCm && heightCm
      ? parseFloat(((Number(lengthCm) * Number(widthCm) * Number(heightCm)) / 1000000).toFixed(6))
      : 0;

  const chargeableWeight =
    weightKg || cbm ? Math.max(Number(weightKg) || 0, cbm * 167) : 0;

  // Load orders for matching
  useEffect(() => {
    async function load() {
      try {
        const { data } = await getOrders({ take: 200, sortField: "createdAt", sortDirection: "desc" });
        setOrders(data);
      } catch {
        // silent — non-critical
      }
    }
    load();
  }, []);

  // Auto-focus scan input
  useEffect(() => {
    scanRef.current?.focus();
  }, []);

  const handleLookup = useCallback(() => {
    const q = trackingCN.trim();
    if (!q) return;
    setLookupDone(true);
    // Client-side match by TrackingCN or OrderCode
    const found = orders.find(
      (o) =>
        o.OrderCode?.toLowerCase() === q.toLowerCase() ||
        o.OrderCode?.toLowerCase().includes(q.toLowerCase())
    );
    if (found) {
      setMatchedOrder(found);
      setIsUnidentified(false);
    } else {
      setMatchedOrder(null);
    }
  }, [trackingCN, orders]);

  const handleSave = async () => {
    if (!trackingCN.trim()) {
      toast.error(lang === "vi" ? "Vui lòng nhập mã vận đơn" : "请输入运单号");
      return;
    }

    setSaving(true);
    try {
      const input: CreateWarehouseCnReceiptInput = {
        ReceiptCode: generateCode("NK-TQ"),
        TrackingCN: trackingCN.trim(),
        OrderId: matchedOrder?.id,
        OrderCode: matchedOrder?.OrderCode,
        PackagesExpected: Number(packagesExpected) || 1,
        PackagesReceived: Number(packagesReceived) || 1,
        TotalReceived: Number(packagesReceived) || 1,
        WeightKg: Number(weightKg) || 0,
        LengthCm: Number(lengthCm) || 0,
        WidthCm: Number(widthCm) || 0,
        HeightCm: Number(heightCm) || 0,
        CBM: cbm,
        ChargeableWeight: parseFloat(chargeableWeight.toFixed(2)),
        QCStatus: qcStatus,
        QCNotes: qcNotes || undefined,
        LabelStatus: labelStatus,
        Status: "Đã nhận",
        ExtraServices: extraServices.length > 0 ? extraServices : undefined,
        IsUnidentified: isUnidentified,
        Agent: agent || undefined,
      };

      await createWarehouseCnReceipt(input);
      toast.success(lang === "vi" ? "Đã tạo phiếu nhận hàng" : "收货单已创建");
      router.push("/warehouse-cn");
    } catch {
      toast.error(lang === "vi" ? "Lỗi khi lưu phiếu" : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const t = (key: string) => LABELS[key]?.[lang] ?? key;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/warehouse-cn")}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("back")}
          </button>
        </div>
        <button
          onClick={() => setLang(lang === "vi" ? "zh" : "vi")}
          className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Languages className="w-4 h-4" />
          {lang === "vi" ? "中文" : "Tiếng Việt"}
        </button>
      </div>

      <PageHeader title={t("pageTitle")} description={t("pageDesc")} />

      {/* Step 1: Scan / Enter tracking */}
      <SectionCard title={t("scanTitle")} icon={Search}>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={scanRef}
              type="text"
              value={trackingCN}
              onChange={(e) => {
                setTrackingCN(e.target.value);
                setLookupDone(false);
                setMatchedOrder(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleLookup()}
              placeholder={t("scanPlaceholder")}
              className="w-full h-14 text-lg pl-12 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent font-mono"
            />
          </div>
          <button
            onClick={handleLookup}
            className="h-14 px-6 bg-[#4F5FD9] hover:bg-[#3B4CC0] text-white rounded-lg text-sm font-medium transition-colors"
          >
            {t("lookup")}
          </button>
        </div>

        {lookupDone && matchedOrder && (
          <MatchedOrderCard order={matchedOrder} lang={lang} />
        )}
        {lookupDone && !matchedOrder && trackingCN.trim() && (
          <NoMatchBanner
            lang={lang}
            isUnidentified={isUnidentified}
            onToggle={() => setIsUnidentified(!isUnidentified)}
          />
        )}
      </SectionCard>

      {/* Step 2: Weight & Dimensions */}
      <SectionCard title={t("dimensionsTitle")} icon={Ruler}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t("weight")}</label>
            <input
              type="number"
              step="0.01"
              min={0}
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value === "" ? "" : parseFloat(e.target.value))}
              className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t("length")}</label>
            <input
              type="number"
              step="0.1"
              min={0}
              value={lengthCm}
              onChange={(e) => setLengthCm(e.target.value === "" ? "" : parseFloat(e.target.value))}
              className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t("width")}</label>
            <input
              type="number"
              step="0.1"
              min={0}
              value={widthCm}
              onChange={(e) => setWidthCm(e.target.value === "" ? "" : parseFloat(e.target.value))}
              className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t("height")}</label>
            <input
              type="number"
              step="0.1"
              min={0}
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value === "" ? "" : parseFloat(e.target.value))}
              className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Auto-calc display */}
        <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <span className="text-xs text-gray-500 uppercase tracking-wide">{t("cbm")}</span>
            <p className="text-lg font-semibold text-gray-900 mt-0.5">{cbm.toFixed(6)}</p>
          </div>
          <div>
            <span className="text-xs text-gray-500 uppercase tracking-wide">{t("chargeableWeight")}</span>
            <p className="text-lg font-semibold text-gray-900 mt-0.5">{chargeableWeight.toFixed(2)} kg</p>
          </div>
        </div>
      </SectionCard>

      {/* Step 3: Package count */}
      <SectionCard title={t("packagesTitle")} icon={Package}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t("packagesExpected")}</label>
            <input
              type="number"
              min={1}
              value={packagesExpected}
              onChange={(e) => setPackagesExpected(e.target.value === "" ? "" : parseInt(e.target.value))}
              className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t("packagesReceived")}</label>
            <input
              type="number"
              min={0}
              value={packagesReceived}
              onChange={(e) => setPackagesReceived(e.target.value === "" ? "" : parseInt(e.target.value))}
              className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent text-sm"
            />
          </div>
        </div>

        <ProgressBar
          received={Number(packagesReceived) || 0}
          expected={Number(packagesExpected) || 0}
          lang={lang}
        />
      </SectionCard>

      {/* Step 4: QC Check */}
      <SectionCard title={t("qcTitle")} icon={ShieldCheck}>
        <RadioGroup options={QC_OPTIONS} value={qcStatus} onChange={setQcStatus} />
        <div className="mt-3">
          <label className="block text-xs font-medium text-gray-500 mb-1">{t("qcNotes")}</label>
          <textarea
            value={qcNotes}
            onChange={(e) => setQcNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent text-sm resize-none"
          />
        </div>
      </SectionCard>

      {/* Step 5: Label Check */}
      <SectionCard title={t("labelTitle")} icon={Tag}>
        <RadioGroup options={LABEL_OPTIONS} value={labelStatus} onChange={setLabelStatus} />
      </SectionCard>

      {/* Step 6: Extra Services */}
      <SectionCard title={t("servicesTitle")} icon={Wrench}>
        <CheckboxGroup
          options={EXTRA_SERVICES}
          selected={extraServices}
          onChange={setExtraServices}
        />
      </SectionCard>

      {/* Agent */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <label className="block text-xs font-medium text-gray-500 mb-1">{t("agent")}</label>
        <input
          type="text"
          value={agent}
          onChange={(e) => setAgent(e.target.value)}
          className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent text-sm"
        />
      </div>

      {/* Save button */}
      <div className="flex items-center gap-3 pb-8">
        <button
          onClick={() => router.push("/warehouse-cn")}
          className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {t("back")}
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-8 py-3 bg-[#4F5FD9] hover:bg-[#3B4CC0] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? t("saving") : t("save")}
        </button>
      </div>
    </div>
  );
}
