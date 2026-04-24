"use client";

import { PageHeader } from "@/components/page-header";
import { ComingSoonState } from "@/components/coming-soon-state";
import { KeyRound } from "lucide-react";

export default function DelegationPage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Ủy quyền" description="Quản lý ủy quyền phê duyệt" />
      <ComingSoonState moduleName="Ủy quyền" icon={KeyRound} />
    </div>
  );
}
