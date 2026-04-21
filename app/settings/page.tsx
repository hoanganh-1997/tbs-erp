"use client";

import { useEffect, useState } from "react";
import { getExchangeRates, createExchangeRate } from "@/lib/exchange-rates";
import type { ExchangeRate } from "@/lib/exchange-rates";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Settings, DollarSign, ShieldCheck, Info, ExternalLink, Save } from "lucide-react";
import { toast } from "sonner";

const APPROVAL_MATRIX = [
  { type: "Giảm giá \u22643%", chain: "Leader + KT TT" },
  { type: "Giảm giá 3-5%", chain: "Leader + KT TT -> GĐ KD" },
  { type: "Giảm giá >5%", chain: "Leader + KT TT -> GĐ KD -> BGĐ" },
  { type: "Hủy đơn (chưa cọc)", chain: "Leader" },
  { type: "Hủy đơn (đã cọc)", chain: "Leader -> GĐ KD" },
  { type: "Phiếu chi \u226450M", chain: "KT TT -> BGĐ" },
  { type: "Phiếu chi >50M", chain: "KT TT -> KT TH -> BGĐ" },
];

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 bg-gray-200 rounded w-1/3" />
      <div className="h-6 bg-gray-100 rounded w-1/4" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-48 bg-gray-100 rounded-xl" />
      ))}
    </div>
  );
}

function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="border rounded-xl bg-white overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b bg-gray-50">
        <Icon className="w-5 h-5 text-[#4F5FD9]" />
        <h2 className="text-base font-semibold text-[#2D3A8C]">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-2 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [cnyRate, setCnyRate] = useState("");
  const [usdRate, setUsdRate] = useState("");
  const [savingRates, setSavingRates] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await getExchangeRates({ take: 200, sortField: "createdAt", sortDirection: "desc" });
        setRates(data);

        // Find today's rates
        const today = new Date().toISOString().split("T")[0];
        const todayCny = data.find(r => r.FromCurrency === "CNY" && r.Date && r.Date.startsWith(today));
        const todayUsd = data.find(r => r.FromCurrency === "USD" && r.Date && r.Date.startsWith(today));
        if (todayCny?.Rate) setCnyRate(String(todayCny.Rate));
        if (todayUsd?.Rate) setUsdRate(String(todayUsd.Rate));
      } catch {
        toast.error("Lỗi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const todayStr = new Date().toISOString().split("T")[0];
  const currentCny = rates.find(r => r.FromCurrency === "CNY" && r.Date && r.Date.startsWith(todayStr));
  const currentUsd = rates.find(r => r.FromCurrency === "USD" && r.Date && r.Date.startsWith(todayStr));
  // Fallback to most recent
  const latestCny = currentCny || rates.find(r => r.FromCurrency === "CNY");
  const latestUsd = currentUsd || rates.find(r => r.FromCurrency === "USD");

  const handleSaveRates = async () => {
    if (!cnyRate && !usdRate) { toast.error("Vui lòng nhập tỷ giá"); return; }
    setSavingRates(true);
    try {
      const today = new Date().toISOString();
      if (cnyRate) {
        await createExchangeRate({ Date: today, FromCurrency: "CNY", ToCurrency: "VND", Rate: Number(cnyRate), SetBy: "Admin" });
      }
      if (usdRate) {
        await createExchangeRate({ Date: today, FromCurrency: "USD", ToCurrency: "VND", Rate: Number(usdRate), SetBy: "Admin" });
      }
      toast.success("Cập nhật tỷ giá thành công");
      // Reload
      const { data } = await getExchangeRates({ take: 200, sortField: "createdAt", sortDirection: "desc" });
      setRates(data);
    } catch {
      toast.error("Lỗi cập nhật tỷ giá");
    } finally {
      setSavingRates(false);
    }
  };

  if (loading) return <div className="p-6"><LoadingSkeleton /></div>;

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Cài đặt" description="Cài đặt hệ thống" />

      {/* 1. Profile */}
      <SectionCard title="Thông tin cá nhân" icon={Settings}>
        <div className="divide-y divide-gray-100">
          <InfoRow label="Họ tên" value="Admin" />
          <InfoRow label="Email" value="admin@tbs-group.vn" />
          <InfoRow label="Chức vụ" value="Quản trị viên" />
          <InfoRow label="Phòng ban" value="Ban Giám đốc" />
          <InfoRow label="Chi nhánh" value="HN" />
        </div>
        <div className="pt-4 mt-4 border-t">
          <button
            onClick={() => toast.info("Thông tin cá nhân được đồng bộ từ hệ thống Inforact Base. Vui lòng liên hệ quản trị viên để thay đổi.")}
            className="px-4 py-2 text-sm font-medium text-[#4F5FD9] border border-[#4F5FD9] rounded-lg hover:bg-blue-50 transition-colors"
          >
            Chỉnh sửa
          </button>
        </div>
      </SectionCard>

      {/* 2. Exchange rates */}
      <SectionCard title="Tỷ giá hôm nay" icon={DollarSign}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-xs text-blue-600 font-medium">CNY &rarr; VND</p>
            <p className="text-2xl font-bold text-[#2D3A8C] mt-1">
              {latestCny?.Rate ? new Intl.NumberFormat("vi-VN").format(latestCny.Rate) : "---"}
            </p>
            {latestCny?.Date && <p className="text-xs text-gray-500 mt-1">Cập nhật: {formatDate(latestCny.Date)}</p>}
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-xs text-green-600 font-medium">USD &rarr; VND</p>
            <p className="text-2xl font-bold text-[#2D3A8C] mt-1">
              {latestUsd?.Rate ? new Intl.NumberFormat("vi-VN").format(latestUsd.Rate) : "---"}
            </p>
            {latestUsd?.Date && <p className="text-xs text-gray-500 mt-1">Cập nhật: {formatDate(latestUsd.Date)}</p>}
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Cập nhật tỷ giá</h3>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">CNY &rarr; VND</label>
              <input
                type="number"
                value={cnyRate}
                onChange={e => setCnyRate(e.target.value)}
                placeholder="VD: 3500"
                className="w-40 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">USD &rarr; VND</label>
              <input
                type="number"
                value={usdRate}
                onChange={e => setUsdRate(e.target.value)}
                placeholder="VD: 24500"
                className="w-40 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none"
              />
            </div>
            <button
              onClick={handleSaveRates}
              disabled={savingRates}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#4F5FD9] text-white rounded-lg text-sm font-medium hover:bg-[#3B4CC0] disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              {savingRates ? "Đang lưu..." : "Lưu tỷ giá"}
            </button>
          </div>
          <div className="flex items-start gap-2 mt-3 p-3 bg-yellow-50 rounded-lg">
            <Info className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-700">Chỉ KT TH mới có quyền cập nhật tỷ giá. Tỷ giá được áp dụng cho tất cả giao dịch trong ngày.</p>
          </div>
        </div>
      </SectionCard>

      {/* 3. Approval matrix */}
      <SectionCard title="Cấu hình phê duyệt" icon={ShieldCheck}>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Loại phê duyệt</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Chuỗi phê duyệt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {APPROVAL_MATRIX.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{row.type}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {row.chain.split(" -> ").map((step, j, arr) => (
                        <span key={j} className="inline-flex items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-blue-50 text-[#4F5FD9] rounded text-xs font-medium">{step}</span>
                          {j < arr.length - 1 && <span className="text-gray-400 text-xs">&rarr;</span>}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-3">Ma trận phê duyệt được cấu hình theo quy định nội bộ. Liên hệ BGĐ để thay đổi.</p>
      </SectionCard>

      {/* 4. System info */}
      <SectionCard title="Hệ thống" icon={Settings}>
        <div className="divide-y divide-gray-100">
          <InfoRow label="Phiên bản" value="v1.0.0" />
          <InfoRow label="Môi trường" value="Production" />
          <InfoRow label="Cập nhật" value={formatDate(new Date().toISOString())} />
        </div>
        <div className="pt-4 mt-4 border-t">
          <a
            href="#"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#4F5FD9] hover:text-[#3B4CC0] transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Tài liệu hướng dẫn
          </a>
        </div>
      </SectionCard>
    </div>
  );
}
