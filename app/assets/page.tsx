"use client";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Landmark } from "lucide-react";

export default function AssetsPage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Tài sản" description="Quản lý tài sản cố định" />
      <EmptyState
        title="Chưa có dữ liệu tài sản"
        description="Module quản lý tài sản đang được phát triển"
        icon={Landmark}
      />
    </div>
  );
}
