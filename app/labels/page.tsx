"use client";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Tag } from "lucide-react";

export default function LabelsPage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Dán tem khách hàng" description="Quản lý tem dán kiện hàng theo khách hàng" />
      <EmptyState
        title="Chưa có dữ liệu tem"
        description="Hệ thống dán tem khách hàng đang được phát triển"
        icon={Tag}
      />
    </div>
  );
}
