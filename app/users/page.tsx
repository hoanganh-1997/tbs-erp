"use client";

import { PageHeader } from "@/components/page-header";
import { ComingSoonState } from "@/components/coming-soon-state";
import { Users } from "lucide-react";

export default function UsersPage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Quản lý user" description="Quản lý tài khoản & phân quyền người dùng" />
      <ComingSoonState moduleName="Quản lý user" icon={Users} />
    </div>
  );
}
