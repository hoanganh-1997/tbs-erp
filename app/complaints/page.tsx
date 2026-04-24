"use client";

import { PageHeader } from "@/components/page-header";
import { ComingSoonState } from "@/components/coming-soon-state";
import { AlertCircle } from "lucide-react";

export default function ComplaintsPage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Khiếu nại" description="Quản lý khiếu nại từ khách hàng" />
      <ComingSoonState moduleName="Khiếu nại" icon={AlertCircle} />
    </div>
  );
}
