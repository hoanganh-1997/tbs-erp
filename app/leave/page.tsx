"use client";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { CalendarOff } from "lucide-react";

export default function LeavePage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Nghỉ phép" description="Quản lý nghỉ phép & ngày phép nhân viên" />
      <EmptyState
        title="Chưa có dữ liệu nghỉ phép"
        description="Module nghỉ phép đang được phát triển"
        icon={CalendarOff}
      />
    </div>
  );
}
