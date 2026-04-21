"use client";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { FileText } from "lucide-react";

export default function InvoicesPage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Hóa đơn" description="Quản lý hóa đơn bán hàng & mua hàng" />
      <EmptyState
        title="Chưa có dữ liệu hóa đơn"
        description="Module hóa đơn đang được phát triển"
        icon={FileText}
      />
    </div>
  );
}
