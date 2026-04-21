"use client";
import { formatCurrency } from "@/lib/utils";

interface TaxBreakdownProps {
  importTaxVND: number;
  vatAmount: number;
  specialTaxVND: number;
  customsFeesVND: number;
  totalTaxVND: number;
  totalValueCNY?: number;
  exchangeRate?: number;
}

export function TaxBreakdown({
  importTaxVND,
  vatAmount,
  specialTaxVND,
  customsFeesVND,
  totalTaxVND,
  totalValueCNY,
  exchangeRate,
}: TaxBreakdownProps) {
  return (
    <div className="space-y-3">
      {totalValueCNY != null && exchangeRate != null && (
        <div className="p-3 bg-blue-50 rounded-lg text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Giá trị hàng hóa</span>
            <span className="font-medium text-gray-900">
              {formatCurrency(totalValueCNY, "CNY")}
            </span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-gray-600">Tỷ giá</span>
            <span className="font-medium text-gray-900">
              1 CNY = {formatCurrency(exchangeRate)}
            </span>
          </div>
        </div>
      )}

      <table className="w-full text-sm">
        <tbody className="divide-y divide-gray-100">
          <tr>
            <td className="py-2.5 text-gray-600">Thuế nhập khẩu</td>
            <td className="py-2.5 text-right font-medium text-gray-900">
              {formatCurrency(importTaxVND)}
            </td>
          </tr>
          <tr>
            <td className="py-2.5 text-gray-600">Thuế GTGT (VAT)</td>
            <td className="py-2.5 text-right font-medium text-gray-900">
              {formatCurrency(vatAmount)}
            </td>
          </tr>
          {specialTaxVND > 0 && (
            <tr>
              <td className="py-2.5 text-gray-600">Thuế TTĐB</td>
              <td className="py-2.5 text-right font-medium text-gray-900">
                {formatCurrency(specialTaxVND)}
              </td>
            </tr>
          )}
          <tr>
            <td className="py-2.5 text-gray-600">Phí hải quan</td>
            <td className="py-2.5 text-right font-medium text-gray-900">
              {formatCurrency(customsFeesVND)}
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-gray-300">
            <td className="py-3 font-semibold text-[#2D3A8C]">Tổng thuế & phí</td>
            <td className="py-3 text-right font-bold text-lg text-[#2D3A8C]">
              {formatCurrency(totalTaxVND)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
