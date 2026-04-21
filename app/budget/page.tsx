"use client";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { PiggyBank } from "lucide-react";

export default function BudgetPage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Ngân sách" description="Quản lý ngân sách và kế hoạch chi tiêu" />
      <EmptyState
        title="Chưa có dữ liệu ngân sách"
        description="Module ngân sách đang được phát triển"
        icon={PiggyBank}
      />
    </div>
  );
}
