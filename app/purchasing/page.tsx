"use client";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ShoppingCart } from "lucide-react";

export default function PurchasingPage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Mua hàng" description="Quản lý đơn mua hàng từ nhà cung cấp" />
      <EmptyState
        title="Chưa có dữ liệu mua hàng"
        description="Module mua hàng đang được phát triển"
        icon={ShoppingCart}
      />
    </div>
  );
}
