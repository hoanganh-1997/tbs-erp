"use client";
import { FileCheck, FileWarning } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentChecklistProps {
  hasCO: boolean;
  hasInvoice: boolean;
  hasPackingList: boolean;
  hasBillOfLading: boolean;
  hasInsurance: boolean;
  editable?: boolean;
  onChange?: (field: string, value: boolean) => void;
}

const DOCUMENTS = [
  { key: "hasCO", label: "C/O (Certificate of Origin)", required: true },
  { key: "hasInvoice", label: "Commercial Invoice", required: true },
  { key: "hasPackingList", label: "Packing List", required: true },
  { key: "hasBillOfLading", label: "Bill of Lading (B/L)", required: true },
  { key: "hasInsurance", label: "Bảo hiểm hàng hóa", required: false },
];

export function DocumentChecklist({
  hasCO,
  hasInvoice,
  hasPackingList,
  hasBillOfLading,
  hasInsurance,
  editable = false,
  onChange,
}: DocumentChecklistProps) {
  const values: Record<string, boolean> = {
    hasCO,
    hasInvoice,
    hasPackingList,
    hasBillOfLading,
    hasInsurance,
  };

  const checkedCount = Object.values(values).filter(Boolean).length;
  const requiredMissing = DOCUMENTS.filter(
    (d) => d.required && !values[d.key]
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {requiredMissing > 0 ? (
            <FileWarning className="w-5 h-5 text-orange-500" />
          ) : (
            <FileCheck className="w-5 h-5 text-green-500" />
          )}
          <span className="text-sm font-semibold text-gray-900">
            Chứng từ: {checkedCount}/{DOCUMENTS.length}
          </span>
        </div>
        {requiredMissing > 0 && (
          <span className="text-xs text-orange-600 font-medium">
            Thiếu {requiredMissing} chứng từ bắt buộc
          </span>
        )}
      </div>

      <div className="space-y-2">
        {DOCUMENTS.map((doc) => {
          const checked = values[doc.key];
          return (
            <label
              key={doc.key}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                checked
                  ? "border-green-200 bg-green-50"
                  : doc.required
                    ? "border-orange-200 bg-orange-50/50"
                    : "border-gray-200 bg-gray-50",
                editable && "cursor-pointer hover:shadow-sm"
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={!editable}
                onChange={(e) => onChange?.(doc.key, e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#4F5FD9] focus:ring-[#4F5FD9] disabled:opacity-60"
              />
              <span
                className={cn(
                  "text-sm",
                  checked ? "text-green-800" : "text-gray-700"
                )}
              >
                {doc.label}
              </span>
              {doc.required && !checked && (
                <span className="ml-auto text-[10px] font-medium text-orange-600 uppercase">
                  Bắt buộc
                </span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}
