"use client";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { FolderOpen } from "lucide-react";

export default function DocumentsPage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Tài liệu" description="Quản lý tài liệu & hồ sơ" />
      <EmptyState
        title="Chưa có tài liệu"
        description="Module tài liệu đang được phát triển"
        icon={FolderOpen}
      />
    </div>
  );
}
