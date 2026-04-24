"use client";

import { PageHeader } from "@/components/page-header";
import { ComingSoonState } from "@/components/coming-soon-state";
import { ArrowLeftRight } from "lucide-react";

export default function DebtOffsetPage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Bù trừ công nợ" description="Quản lý bù trừ công nợ phải thu / phải trả" />
      <ComingSoonState moduleName="Bù trừ công nợ" icon={ArrowLeftRight} />
    </div>
  );
}
