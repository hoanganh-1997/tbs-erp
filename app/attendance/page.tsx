"use client";

import { PageHeader } from "@/components/page-header";
import { ComingSoonState } from "@/components/coming-soon-state";
import { Clock } from "lucide-react";

export default function AttendancePage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Chấm công" description="Quản lý chấm công nhân viên" />
      <ComingSoonState moduleName="Chấm công" icon={Clock} />
    </div>
  );
}
