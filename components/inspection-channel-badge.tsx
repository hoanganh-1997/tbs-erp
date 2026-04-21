"use client";
import { cn } from "@/lib/utils";

const channelStyles: Record<string, { bg: string; text: string; dot: string }> = {
  "Luồng xanh": { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
  "Luồng vàng": { bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-500" },
  "Luồng đỏ": { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
};

export function InspectionChannelBadge({
  channel,
  className,
}: {
  channel: string | undefined;
  className?: string;
}) {
  if (!channel) return null;
  const style = channelStyles[channel] || { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap",
        style.bg,
        style.text,
        className
      )}
    >
      <span className={cn("w-2 h-2 rounded-full", style.dot)} />
      {channel}
    </span>
  );
}
