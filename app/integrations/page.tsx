"use client";

import { PageHeader } from "@/components/page-header";
import { ComingSoonState } from "@/components/coming-soon-state";
import { KeyRound } from "lucide-react";

export default function IntegrationsPage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Tích hợp" description="Quản lý tích hợp hệ thống bên ngoài" />
      <ComingSoonState moduleName="Tích hợp" icon={KeyRound} />
    </div>
  );
}
