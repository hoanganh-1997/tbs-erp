"use client";

import { PageHeader } from "@/components/page-header";
import { ComingSoonState } from "@/components/coming-soon-state";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Thông báo" description="Trung tâm thông báo hệ thống" />
      <ComingSoonState moduleName="Thông báo" icon={Bell} />
    </div>
  );
}
