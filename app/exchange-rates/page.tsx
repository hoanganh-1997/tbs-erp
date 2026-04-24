"use client";

import { useEffect, useState, useCallback } from "react";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { toast } from "sonner";
import { getExchangeRates, createExchangeRate } from "@/lib/exchange-rates";
import type { ExchangeRate } from "@/lib/exchange-rates";
import { ArrowLeftRight, Save, Info } from "lucide-react";

function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-12 bg-gray-100 rounded" />
      ))}
    </div>
  );
}

export default function ExchangeRatesPage() {
  const [data, setData] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [cnyRate, setCnyRate] = useState("");
  const [usdRate, setUsdRate] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getExchangeRates({ take: 200, sortField: "createdAt", sortDirection: "desc" });
      setData(res.data);
    } catch {
      toast.error("Lỗi tải dữ liệu tỷ giá");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const todayStr = new Date().toISOString().split("T")[0];
  const latestCny = data.find((r) => r.FromCurrency === "CNY");
  const latestUsd = data.find((r) => r.FromCurrency === "USD");

  const handleSave = async () => {
    if (!cnyRate && !usdRate) { toast.error("Vui lòng nhập tỷ giá"); return; }
    const cnyNum = cnyRate ? Number(cnyRate) : null;
    const usdNum = usdRate ? Number(usdRate) : null;
    if (cnyNum !== null && (!Number.isFinite(cnyNum) || cnyNum <= 0)) {
      toast.error("Tỷ giá CNY phải là số dương");
      return;
    }
    if (usdNum !== null && (!Number.isFinite(usdNum) || usdNum <= 0)) {
      toast.error("Tỷ giá USD phải là số dương");
      return;
    }
    setSaving(true);
    try {
      const today = new Date().toISOString();
      if (cnyNum !== null) await createExchangeRate({ Date: today, FromCurrency: "CNY", ToCurrency: "VND", Rate: cnyNum, SetBy: "Admin" });
      if (usdNum !== null) await createExchangeRate({ Date: today, FromCurrency: "USD", ToCurrency: "VND", Rate: usdNum, SetBy: "Admin" });
      toast.success("Cập nhật tỷ giá thành công");
      setCnyRate("");
      setUsdRate("");
      fetchData();
    } catch {
      toast.error("Lỗi cập nhật tỷ giá");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Tỷ giá" description="Quản lý tỷ giá ngoại tệ" />

      {/* Current rates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
          <p className="text-xs text-blue-600 font-medium">CNY → VND</p>
          <p className="text-3xl font-bold text-[#2D3A8C] mt-1">
            {latestCny?.Rate && latestCny.Rate > 0 ? new Intl.NumberFormat("vi-VN").format(latestCny.Rate) : "---"}
          </p>
          {latestCny?.Date && <p className="text-xs text-gray-500 mt-2">Cập nhật: {formatDate(latestCny.Date)}</p>}
        </div>
        <div className="bg-green-50 rounded-xl p-5 border border-green-100">
          <p className="text-xs text-green-600 font-medium">USD → VND</p>
          <p className="text-3xl font-bold text-[#2D3A8C] mt-1">
            {latestUsd?.Rate && latestUsd.Rate > 0 ? new Intl.NumberFormat("vi-VN").format(latestUsd.Rate) : "---"}
          </p>
          {latestUsd?.Date && <p className="text-xs text-gray-500 mt-2">Cập nhật: {formatDate(latestUsd.Date)}</p>}
        </div>
      </div>

      {/* Update rates */}
      <div className="bg-white border rounded-xl p-6">
        <h2 className="text-base font-semibold text-[#2D3A8C] mb-4">Cập nhật tỷ giá</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">CNY → VND</label>
            <input
              type="number"
              min="0.0001"
              step="any"
              value={cnyRate}
              onChange={(e) => setCnyRate(e.target.value)}
              placeholder="VD: 3500"
              className="w-40 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">USD → VND</label>
            <input
              type="number"
              min="0.0001"
              step="any"
              value={usdRate}
              onChange={(e) => setUsdRate(e.target.value)}
              placeholder="VD: 24500"
              className="w-40 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent outline-none"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#4F5FD9] text-white rounded-lg text-sm font-medium hover:bg-[#3B4CC0] disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? "Đang lưu..." : "Lưu tỷ giá"}
          </button>
        </div>
        <div className="flex items-start gap-2 mt-3 p-3 bg-yellow-50 rounded-lg">
          <Info className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-700">Chỉ KT TH mới có quyền cập nhật tỷ giá. Tỷ giá được áp dụng cho tất cả giao dịch trong ngày.</p>
        </div>
      </div>

      {/* History table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="text-base font-semibold text-[#2D3A8C]">Lịch sử tỷ giá</h2>
        </div>
        {loading ? (
          <div className="p-6"><TableSkeleton /></div>
        ) : data.length === 0 ? (
          <EmptyState title="Chưa có dữ liệu tỷ giá" icon={ArrowLeftRight} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ngày</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Từ</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sang</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tỷ giá</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Người cập nhật</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-gray-700">{formatDate(r.Date)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-medium">{r.FromCurrency}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-50 text-green-700 text-xs font-medium">{r.ToCurrency}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      {r.Rate && r.Rate > 0 ? new Intl.NumberFormat("vi-VN").format(r.Rate) : "---"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r.SetBy || "---"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
