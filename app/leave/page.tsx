"use client";

import { PageHeader } from "@/components/page-header";
import { ComingSoonState } from "@/components/coming-soon-state";
import { CalendarOff } from "lucide-react";

export default function LeavePage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Nghỉ phép" description="Quản lý nghỉ phép & ngày phép nhân viên" />
      <ComingSoonState moduleName="Nghỉ phép" icon={CalendarOff} />
    </div>
  );
}
