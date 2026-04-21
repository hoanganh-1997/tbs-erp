"use client";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Banknote } from "lucide-react";

export default function PayrollPage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Bảng lương" description="Quản lý bảng lương hàng tháng" />
      <EmptyState
        title="Chưa có dữ liệu bảng lương"
        description="Module bảng lương đang được phát triển"
        icon={Banknote}
      />
    </div>
  );
}
