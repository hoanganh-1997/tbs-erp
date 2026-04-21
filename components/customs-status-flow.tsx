"use client";
import { CheckCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const CUSTOMS_STATUSES = [
  "Chuẩn bị hồ sơ",
  "Đã nộp tờ khai",
  "Chờ kiểm hóa",
  "Đang kiểm hóa",
  "Chờ nộp thuế",
  "Đã nộp thuế",
  "Đã thông quan",
];

export function CustomsStatusFlow({
  currentStatus,
  compact = false,
}: {
  currentStatus: string;
  compact?: boolean;
}) {
  const isHeld = currentStatus === "Bị giữ hàng";
  const currentIndex = CUSTOMS_STATUSES.indexOf(currentStatus);

  if (isHeld) {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 border border-red-200">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-sm font-semibold text-red-700">Bị giữ hàng</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {CUSTOMS_STATUSES.map((status, i) => {
          const isCompleted = i < currentIndex;
          const isCurrent = i === currentIndex;
          return (
            <div key={status} className="flex items-center gap-1">
              <div
                className={cn(
                  "w-2.5 h-2.5 rounded-full",
                  isCompleted && "bg-green-500",
                  isCurrent && "bg-[#4F5FD9] ring-2 ring-[#4F5FD9]/30",
                  !isCompleted && !isCurrent && "bg-gray-200"
                )}
                title={status}
              />
              {i < CUSTOMS_STATUSES.length - 1 && (
                <div className={cn(
                  "w-3 h-px",
                  i < currentIndex ? "bg-green-400" : "bg-gray-200"
                )} />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 overflow-x-auto py-2">
      {CUSTOMS_STATUSES.map((status, i) => {
        const isCompleted = i < currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <div key={status} className="flex items-center gap-1">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                isCompleted && "bg-green-100 text-green-700",
                isCurrent && "bg-[#4F5FD9] text-white",
                !isCompleted && !isCurrent && "bg-gray-100 text-gray-400"
              )}
            >
              {isCompleted && <CheckCircle className="w-3 h-3" />}
              {status}
            </span>
            {i < CUSTOMS_STATUSES.length - 1 && (
              <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}
