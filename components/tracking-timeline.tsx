"use client";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TimelineStep {
  label: string;
  date: string | null;
  reached: boolean;
}

function formatTimelineDate(dateStr: string | null): string {
  if (!dateStr) return "---";
  try {
    const d = new Date(dateStr);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  } catch {
    return "---";
  }
}

export function TrackingTimeline({
  steps,
  orientation = "vertical",
}: {
  steps: TimelineStep[];
  orientation?: "vertical" | "horizontal";
}) {
  if (orientation === "horizontal") {
    const reachedCount = steps.filter((s) => s.reached).length;
    const progress = steps.length > 1 ? ((reachedCount - 1) / (steps.length - 1)) * 100 : 0;

    return (
      <div className="w-full">
        <div className="relative flex items-start justify-between">
          {/* Background line */}
          <div className="absolute top-3 left-3 right-3 h-0.5 bg-gray-200" />
          <div
            className="absolute top-3 left-3 h-0.5 bg-[#4F5FD9] transition-all duration-500"
            style={{ width: `calc(${Math.max(0, progress)}% - 24px)` }}
          />
          {steps.map((step, i) => {
            const isCurrent = step.reached && (i === steps.length - 1 || !steps[i + 1]?.reached);
            return (
              <div key={step.label} className="relative flex flex-col items-center flex-1 min-w-0">
                <div className="relative z-10">
                  {step.reached ? (
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center",
                      isCurrent ? "bg-[#4F5FD9] ring-4 ring-[#4F5FD9]/20" : "bg-[#4F5FD9]"
                    )}>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <Circle className="w-6 h-6 text-gray-300 bg-white rounded-full" />
                  )}
                </div>
                <p className={cn(
                  "text-[10px] mt-2 text-center leading-tight max-w-[80px]",
                  step.reached ? "text-gray-900 font-medium" : "text-gray-400"
                )}>
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="relative pl-8 py-2">
      <div className="absolute left-[15px] top-6 bottom-6 w-0.5 bg-gray-200" />
      {steps.map((step) => {
        const isCurrent = step.reached && steps.indexOf(step) === steps.length - 1 ||
          (step.reached && steps[steps.indexOf(step) + 1] && !steps[steps.indexOf(step) + 1].reached);
        return (
          <div key={step.label} className="relative flex items-start gap-4 mb-6 last:mb-0">
            <div className="absolute left-[-32px] flex items-center justify-center">
              {step.reached ? (
                <div className={cn(
                  "rounded-full bg-white",
                  isCurrent && "ring-4 ring-[#4F5FD9]/20"
                )}>
                  <CheckCircle2 className="w-6 h-6 text-[#4F5FD9]" />
                </div>
              ) : (
                <Circle className="w-6 h-6 text-gray-300 bg-white rounded-full" />
              )}
            </div>
            <div>
              <p className={cn(
                "text-sm font-medium",
                step.reached ? "text-gray-900" : "text-gray-400"
              )}>
                {step.label}
              </p>
              <p className={cn(
                "text-xs mt-0.5",
                step.date ? "text-gray-500" : "text-gray-300"
              )}>
                {formatTimelineDate(step.date)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
