"use client";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Thông báo" description="Trung tâm thông báo hệ thống" />
      <EmptyState
        title="Chưa có thông báo"
        description="Bạn chưa có thông báo nào"
        icon={Bell}
      />
    </div>
  );
}
