"use client";
import { Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ETADisplayProps {
  eta: string | null | undefined;
  processingDays?: number;
  isDelivered?: boolean;
  className?: string;
}

export function ETADisplay({
  eta,
  processingDays = 3,
  isDelivered = false,
  className,
}: ETADisplayProps) {
  if (isDelivered) {
    return (
      <div className={cn("inline-flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg", className)}>
        <CheckCircle className="w-4 h-4 text-green-600" />
        <span className="text-sm font-medium text-green-700">Đã giao hàng</span>
      </div>
    );
  }

  if (!eta) {
    return (
      <div className={cn("inline-flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg", className)}>
        <Clock className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-500">Chưa có ETA</span>
      </div>
    );
  }

  const etaDate = new Date(eta);
  const deliveryEta = new Date(etaDate);
  deliveryEta.setDate(deliveryEta.getDate() + processingDays);

  const now = new Date();
  const diffMs = deliveryEta.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const isOverdue = diffDays < 0;

  const dd = String(deliveryEta.getDate()).padStart(2, "0");
  const mm = String(deliveryEta.getMonth() + 1).padStart(2, "0");
  const yyyy = deliveryEta.getFullYear();
  const formatted = `${dd}/${mm}/${yyyy}`;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-2 rounded-lg border",
        isOverdue
          ? "bg-red-50 border-red-200"
          : diffDays <= 2
            ? "bg-orange-50 border-orange-200"
            : "bg-blue-50 border-blue-200",
        className
      )}
    >
      {isOverdue ? (
        <AlertTriangle className="w-4 h-4 text-red-500" />
      ) : (
        <Clock className="w-4 h-4 text-blue-500" />
      )}
      <div className="text-sm">
        <span className={cn(
          "font-medium",
          isOverdue ? "text-red-700" : "text-gray-900"
        )}>
          Dự kiến giao: {formatted}
        </span>
        <span className={cn(
          "ml-2 text-xs",
          isOverdue ? "text-red-600 font-semibold" : "text-gray-500"
        )}>
          {isOverdue
            ? `(trễ ${Math.abs(diffDays)} ngày)`
            : diffDays === 0
              ? "(hôm nay)"
              : `(còn ${diffDays} ngày)`}
        </span>
      </div>
    </div>
  );
}
