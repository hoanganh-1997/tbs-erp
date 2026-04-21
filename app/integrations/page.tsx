"use client";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { KeyRound } from "lucide-react";

export default function IntegrationsPage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Tích hợp" description="Quản lý tích hợp hệ thống bên ngoài" />
      <EmptyState
        title="Chưa có tích hợp"
        description="Module tích hợp đang được phát triển"
        icon={KeyRound}
      />
    </div>
  );
}
