"use client";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  'Hoàn thành': 'bg-green-100 text-green-700',
  'Đã duyệt': 'bg-green-100 text-green-700',
  'Đã thu': 'bg-green-100 text-green-700',
  'Đã trả': 'bg-green-100 text-green-700',
  'Đã giao': 'bg-green-100 text-green-700',
  'Đã ký': 'bg-green-100 text-green-700',
  'Hoạt động': 'bg-green-100 text-green-700',
  'Đã chi': 'bg-green-100 text-green-700',
  'KT đã duyệt': 'bg-green-100 text-green-700',
  'Đủ cọc': 'bg-green-100 text-green-700',
  'TT đủ': 'bg-green-100 text-green-700',
  'Đạt': 'bg-green-100 text-green-700',
  'Đã giải quyết': 'bg-green-100 text-green-700',
  'Đã đóng': 'bg-green-100 text-green-700',
  'Sẵn sàng': 'bg-green-100 text-green-700',
  'Đang hoạt động': 'bg-green-100 text-green-700',
  'Đã tính phí': 'bg-green-100 text-green-700',
  'Đã nhận': 'bg-green-100 text-green-700',
  'Hoàn tất': 'bg-green-100 text-green-700',
  'Đã thông quan': 'bg-green-100 text-green-700',
  'Đã về kho': 'bg-green-100 text-green-700',
  'Tem HQ OK': 'bg-green-100 text-green-700',
  'Đã nộp thuế': 'bg-green-100 text-green-700',
  'Đủ chứng từ': 'bg-green-100 text-green-700',
  'Đã nộp HQ': 'bg-green-100 text-green-700',

  'Đang xử lý': 'bg-blue-100 text-blue-700',
  'Đang giao': 'bg-blue-100 text-blue-700',
  'Đang vận chuyển': 'bg-blue-100 text-blue-700',
  'Đang xếp': 'bg-blue-100 text-blue-700',
  'Đang tìm hàng': 'bg-blue-100 text-blue-700',
  'Đang thông quan': 'bg-blue-100 text-blue-700',
  'Đang kiểm hóa': 'bg-blue-100 text-blue-700',
  'Đã nộp tờ khai': 'bg-blue-100 text-blue-700',
  'Đã xác nhận': 'bg-blue-100 text-blue-700',
  'Đã đặt hàng': 'bg-blue-100 text-blue-700',
  'Trong container': 'bg-blue-100 text-blue-700',
  'Đang khai thác': 'bg-blue-100 text-blue-700',
  'Đang tư vấn': 'bg-blue-100 text-blue-700',
  'Đang sử dụng': 'bg-blue-100 text-blue-700',
  'Đang pick': 'bg-blue-100 text-blue-700',
  'Đã kiểm': 'bg-blue-100 text-blue-700',
  'Đã dỡ': 'bg-blue-100 text-blue-700',
  'Đang dỡ': 'bg-blue-100 text-blue-700',
  'Đã đóng gói': 'bg-indigo-100 text-indigo-700',
  'Đã load': 'bg-indigo-100 text-indigo-700',
  'Đã xuất': 'bg-indigo-100 text-indigo-700',

  'Chờ duyệt': 'bg-yellow-100 text-yellow-700',
  'Chưa thu': 'bg-yellow-100 text-yellow-700',
  'Chưa trả': 'bg-yellow-100 text-yellow-700',
  'Kế hoạch': 'bg-yellow-100 text-yellow-700',
  'Chờ KT duyệt': 'bg-yellow-100 text-yellow-700',
  'Chờ BGĐ chi': 'bg-yellow-100 text-yellow-700',
  'Chưa cọc': 'bg-yellow-100 text-yellow-700',
  'Đang chờ': 'bg-yellow-100 text-yellow-700',
  'Chưa TT': 'bg-yellow-100 text-yellow-700',
  'Chờ nhận': 'bg-yellow-100 text-yellow-700',
  'Chờ dỡ': 'bg-yellow-100 text-yellow-700',
  'Chờ giao': 'bg-yellow-100 text-yellow-700',
  'Chờ xếp lịch': 'bg-yellow-100 text-yellow-700',
  'Chờ xử lý': 'bg-yellow-100 text-yellow-700',
  'Chuẩn bị hồ sơ': 'bg-yellow-100 text-yellow-700',
  'Chờ kiểm hóa': 'bg-yellow-100 text-yellow-700',
  'Chờ nộp thuế': 'bg-yellow-100 text-yellow-700',
  'Thiếu chứng từ': 'bg-orange-100 text-orange-700',
  'Chưa kiểm': 'bg-gray-100 text-gray-600',
  'Chờ KH': 'bg-yellow-100 text-yellow-700',
  'Chờ KH duyệt': 'bg-yellow-100 text-yellow-700',
  'Trên kệ': 'bg-cyan-100 text-cyan-700',
  'Đã xếp lịch': 'bg-cyan-100 text-cyan-700',
  'Lập kế hoạch': 'bg-yellow-100 text-yellow-700',
  'Đặt chỗ': 'bg-yellow-100 text-yellow-700',
  'Tại biên giới': 'bg-orange-100 text-orange-700',
  'Hải quan': 'bg-orange-100 text-orange-700',
  'Cần in bù': 'bg-orange-100 text-orange-700',

  'Thu một phần': 'bg-orange-100 text-orange-700',
  'Trả một phần': 'bg-orange-100 text-orange-700',
  'TT một phần': 'bg-orange-100 text-orange-700',
  'Cọc': 'bg-orange-100 text-orange-700',

  'Đã hủy': 'bg-red-100 text-red-700',
  'Quá hạn': 'bg-red-100 text-red-700',
  'Từ chối': 'bg-red-100 text-red-700',
  'Tạm giữ': 'bg-red-50 text-red-600',
  'Bị giữ hàng': 'bg-red-100 text-red-700',
  'Thất bại': 'bg-red-100 text-red-700',
  'Lỗi': 'bg-red-100 text-red-700',
  'Giao lỗi': 'bg-red-100 text-red-700',
  'Trả lại': 'bg-red-100 text-red-700',
  'Nghiêm trọng': 'bg-red-100 text-red-700',
  'Nặng': 'bg-red-100 text-red-700',
  'Bảo trì': 'bg-orange-100 text-orange-700',
  'Ngưng hoạt động': 'bg-red-100 text-red-700',
  'Nghỉ phép': 'bg-orange-100 text-orange-700',
  'Nghỉ việc': 'bg-red-100 text-red-700',

  'Nháp': 'bg-gray-100 text-gray-600',
  'Mới': 'bg-gray-100 text-gray-600',
  'Miễn cọc': 'bg-gray-100 text-gray-600',
  'Mở': 'bg-gray-100 text-gray-600',
  'Nhẹ': 'bg-gray-100 text-gray-600',
  'Trung bình': 'bg-yellow-100 text-yellow-700',
  'Chỉ mã nội bộ': 'bg-gray-100 text-gray-600',
};

const tierStyles: Record<string, string> = {
  'VIP': 'bg-orange-100 text-orange-700',
  'Active': 'bg-green-100 text-green-700',
  'Prospect': 'bg-blue-100 text-blue-700',
  'Inactive': 'bg-gray-100 text-gray-500',
  'Blacklist': 'bg-red-100 text-red-700',
  'Khách mới': 'bg-gray-100 text-gray-600',
  'Khách thường': 'bg-blue-100 text-blue-700',
};

export function StatusBadge({ status, className }: { status: string | undefined; className?: string }) {
  if (!status) return null;
  const style = statusStyles[status] || 'bg-gray-100 text-gray-600';
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap", style, className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
      {status}
    </span>
  );
}

export function TierBadge({ tier, className }: { tier: string | undefined; className?: string }) {
  if (!tier) return null;
  const style = tierStyles[tier] || 'bg-gray-100 text-gray-600';
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap", style, className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
      {tier}
    </span>
  );
}
