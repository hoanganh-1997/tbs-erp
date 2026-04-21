"use client";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { KeyRound } from "lucide-react";

export default function DelegationPage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Ủy quyền" description="Quản lý ủy quyền phê duyệt" />
      <EmptyState
        title="Chưa có ủy quyền"
        description="Module ủy quyền đang được phát triển"
        icon={KeyRound}
      />
    </div>
  );
}
