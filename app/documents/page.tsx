"use client";

import { PageHeader } from "@/components/page-header";
import { ComingSoonState } from "@/components/coming-soon-state";
import { FolderOpen } from "lucide-react";

export default function DocumentsPage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Tài liệu" description="Quản lý tài liệu & hồ sơ" />
      <ComingSoonState moduleName="Tài liệu" icon={FolderOpen} />
    </div>
  );
}
