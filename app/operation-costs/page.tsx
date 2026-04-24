"use client";

import { PageHeader } from "@/components/page-header";
import { ComingSoonState } from "@/components/coming-soon-state";
import { DollarSign } from "lucide-react";

export default function OperationCostsPage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Chi phí vận hành" description="Quản lý chi phí vận hành logistics" />
      <ComingSoonState moduleName="Chi phí vận hành" icon={DollarSign} />
    </div>
  );
}
