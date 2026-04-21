"use client";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  subtitleClassName?: string;
  icon?: LucideIcon;
  borderColor?: string;
  className?: string;
}

export function KpiCard({
  title,
  value,
  subtitle,
  subtitleClassName,
  icon: Icon,
  borderColor,
  className,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-gray-200 p-6",
        borderColor && `border-l-4 ${borderColor}`,
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 uppercase tracking-wide">
          {title}
        </span>
        {Icon && <Icon className="w-5 h-5 text-gray-400" />}
      </div>
      <div className="mt-3">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
      </div>
      {subtitle && (
        <p className={cn("text-xs text-gray-500 mt-1", subtitleClassName)}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
