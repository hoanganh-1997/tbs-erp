"use client";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { AlertCircle } from "lucide-react";

export default function ComplaintsPage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Khiếu nại" description="Quản lý khiếu nại từ khách hàng" />
      <EmptyState
        title="Chưa có khiếu nại"
        description="Module khiếu nại đang được phát triển"
        icon={AlertCircle}
      />
    </div>
  );
}
