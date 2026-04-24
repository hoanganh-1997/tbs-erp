"use client";

import { PageHeader } from "@/components/page-header";
import { ComingSoonState } from "@/components/coming-soon-state";
import { ShoppingCart } from "lucide-react";

export default function PurchasingPage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Mua hàng" description="Quản lý đơn mua hàng từ nhà cung cấp" />
      <ComingSoonState moduleName="Mua hàng" icon={ShoppingCart} />
    </div>
  );
}
