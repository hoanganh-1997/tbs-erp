"use client";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Clock } from "lucide-react";

export default function AttendancePage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Chấm công" description="Quản lý chấm công nhân viên" />
      <EmptyState
        title="Chưa có dữ liệu chấm công"
        description="Module chấm công đang được phát triển"
        icon={Clock}
      />
    </div>
  );
}
