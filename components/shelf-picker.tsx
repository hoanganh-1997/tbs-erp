"use client";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const ZONES = ["A", "B", "C", "D", "VIP", "Tạm giữ"] as const;

const ZONE_COLORS: Record<string, string> = {
  A: "border-blue-300 bg-blue-50",
  B: "border-green-300 bg-green-50",
  C: "border-yellow-300 bg-yellow-50",
  D: "border-purple-300 bg-purple-50",
  VIP: "border-orange-300 bg-orange-50",
  "Tạm giữ": "border-red-300 bg-red-50",
};

interface ShelfPickerProps {
  zone: string;
  row: string;
  onZoneChange: (zone: string) => void;
  onRowChange: (row: string) => void;
  disabled?: boolean;
}

export function ShelfPicker({
  zone,
  row,
  onZoneChange,
  onRowChange,
  disabled = false,
}: ShelfPickerProps) {
  const locationCode = zone && row ? `${zone}-${row}` : zone || "";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {ZONES.map((z) => (
          <button
            key={z}
            type="button"
            disabled={disabled}
            onClick={() => onZoneChange(z)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
              zone === z
                ? "border-[#4F5FD9] bg-[#4F5FD9] text-white"
                : ZONE_COLORS[z] || "border-gray-200 bg-gray-50",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {z}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <input
          type="text"
          value={row}
          onChange={(e) => onRowChange(e.target.value)}
          disabled={disabled}
          placeholder="03-2 (dãy-tầng)"
          className="w-32 h-9 px-3 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#4F5FD9] focus:border-transparent disabled:opacity-50 disabled:bg-gray-50"
        />
        {locationCode && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-sm font-mono font-semibold text-blue-900">
              {locationCode}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
