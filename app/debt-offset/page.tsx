"use client";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ArrowLeftRight } from "lucide-react";

export default function DebtOffsetPage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Bù trừ công nợ" description="Quản lý bù trừ công nợ phải thu / phải trả" />
      <EmptyState
        title="Chưa có dữ liệu bù trừ"
        description="Module bù trừ công nợ đang được phát triển"
        icon={ArrowLeftRight}
      />
    </div>
  );
}
