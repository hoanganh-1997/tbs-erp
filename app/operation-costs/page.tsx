"use client";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { DollarSign } from "lucide-react";

export default function OperationCostsPage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Chi phí vận hành" description="Quản lý chi phí vận hành logistics" />
      <EmptyState
        title="Chưa có dữ liệu chi phí"
        description="Module chi phí vận hành đang được phát triển"
        icon={DollarSign}
      />
    </div>
  );
}
