"use client";
import { cn } from "@/lib/utils";
import { Construction, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface ComingSoonStateProps {
  moduleName: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
}

export function ComingSoonState({
  moduleName,
  description,
  icon: Icon = Construction,
  className,
}: ComingSoonStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center rounded-xl border border-amber-200 bg-amber-50/60",
        className,
      )}
    >
      <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-amber-600" />
      </div>
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 mb-3">
        Đang phát triển
      </span>
      <h3 className="text-xl font-semibold text-gray-900">{moduleName}</h3>
      <p className="text-sm text-gray-600 mt-2 max-w-md">
        {description ?? "Chức năng này đang được đội kỹ thuật xây dựng và sẽ có mặt trong bản phát hành sắp tới."}
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-700 hover:text-amber-900 hover:bg-amber-100 rounded-lg transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Về Tổng quan
      </Link>
    </div>
  );
}
