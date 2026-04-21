"use client";
import { cn } from "@/lib/utils";
import { Plus, Upload } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionIcon?: "plus" | "upload";
  onAction?: () => void;
  actionHref?: string;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export function PageHeader({
  title,
  description,
  actionLabel,
  actionIcon = "plus",
  onAction,
  actionHref,
  secondaryActionLabel,
  onSecondaryAction,
}: PageHeaderProps) {
  const Icon = actionIcon === "upload" ? Upload : Plus;

  const ActionButton = actionLabel ? (
    actionHref ? (
      <a
        href={actionHref}
        className="inline-flex items-center gap-2 bg-[#4F5FD9] hover:bg-[#3B4CC0] text-white rounded-full px-5 py-2.5 text-sm font-medium transition-colors"
      >
        <Icon className="w-4 h-4" />
        {actionLabel}
      </a>
    ) : (
      <button
        onClick={onAction}
        className="inline-flex items-center gap-2 bg-[#4F5FD9] hover:bg-[#3B4CC0] text-white rounded-full px-5 py-2.5 text-sm font-medium transition-colors"
      >
        <Icon className="w-4 h-4" />
        {actionLabel}
      </button>
    )
  ) : null;

  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-3xl font-bold text-[#2D3A8C]">{title}</h1>
        {description && (
          <p className="text-gray-500 mt-1">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {secondaryActionLabel && (
          <button
            onClick={onSecondaryAction}
            className="inline-flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
          >
            {secondaryActionLabel}
          </button>
        )}
        {ActionButton}
      </div>
    </div>
  );
}
