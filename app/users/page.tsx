"use client";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Users } from "lucide-react";

export default function UsersPage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Quản lý user" description="Quản lý tài khoản & phân quyền người dùng" />
      <EmptyState
        title="Chưa có dữ liệu user"
        description="Module quản lý user đang được phát triển"
        icon={Users}
      />
    </div>
  );
}
