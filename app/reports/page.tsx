"use client";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { BarChart3 } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Báo cáo" description="Báo cáo tổng hợp kinh doanh & vận hành" />
      <EmptyState
        title="Chưa có báo cáo"
        description="Module báo cáo đang được phát triển"
        icon={BarChart3}
      />
    </div>
  );
}
