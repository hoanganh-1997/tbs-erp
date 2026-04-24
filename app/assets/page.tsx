"use client";

import { PageHeader } from "@/components/page-header";
import { ComingSoonState } from "@/components/coming-soon-state";
import { Landmark } from "lucide-react";

export default function AssetsPage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Tài sản" description="Quản lý tài sản cố định" />
      <ComingSoonState moduleName="Tài sản" icon={Landmark} />
    </div>
  );
}
