"use client";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { BookOpen } from "lucide-react";

export default function GeneralLedgerPage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Sổ cái" description="Sổ cái tổng hợp kế toán" />
      <EmptyState
        title="Chưa có dữ liệu sổ cái"
        description="Module sổ cái đang được phát triển"
        icon={BookOpen}
      />
    </div>
  );
}
