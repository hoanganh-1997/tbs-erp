"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LayoutDashboard, Users, ShoppingCart, FileText, FileSignature,
  UserCircle, Warehouse, Tag, Wrench, AlertTriangle, Container,
  Shield, MapPin, Building, ClipboardList, Truck, Car, User,
  CheckCircle, DollarSign, CreditCard, Receipt, Wallet, FileSpreadsheet,
  BookOpen, Landmark, PiggyBank, ArrowLeftRight, UserCog, Clock,
  CalendarOff, Banknote, Award, BarChart3, ListTodo, AlertCircle,
  FolderOpen, Bell, ClipboardCheck, KeyRound, Settings, ChevronDown, ChevronLeft,
  ChevronsRight
} from "lucide-react";

interface NavItem {
  label: string;
  href?: string;
  icon: any;
  children?: { label: string; href: string; icon: any }[];
}

const navigation: NavItem[] = [
  {
    label: "TỔNG QUAN",
    icon: LayoutDashboard,
    children: [
      { label: "Tổng quan", href: "/", icon: LayoutDashboard },
    ],
  },
  {
    label: "KINH DOANH",
    icon: ShoppingCart,
    children: [
      { label: "Lead (KH tiềm năng)", href: "/leads", icon: Users },
      { label: "Đơn hàng", href: "/orders", icon: ShoppingCart },
      { label: "Báo giá", href: "/quotations", icon: FileText },
      { label: "Hợp đồng", href: "/contracts", icon: FileSignature },
      { label: "Khách hàng", href: "/customers", icon: UserCircle },
    ],
  },
  {
    label: "KHO VẬN & VẬN TẢI",
    icon: Warehouse,
    children: [
      { label: "Kho Trung Quốc", href: "/warehouse-cn", icon: Warehouse },
      { label: "Dán tem KH", href: "/labels", icon: Tag },
      { label: "Dịch vụ kho TQ", href: "/warehouse-services", icon: Wrench },
      { label: "Vấn đề kiện hàng", href: "/package-issues", icon: AlertTriangle },
      { label: "Container & Ghép cont", href: "/containers", icon: Container },
      { label: "Thông quan", href: "/customs", icon: Shield },
      { label: "Theo dõi", href: "/tracking", icon: MapPin },
      { label: "Lịch sử sự kiện", href: "/tracking/events", icon: ClipboardCheck },
      { label: "Kho Việt Nam", href: "/warehouse-vn", icon: Building },
      { label: "Tồn kho VN", href: "/warehouse-vn/inventory", icon: Warehouse },
      { label: "Xuất kho VN", href: "/warehouse-vn/outbound", icon: Truck },
      { label: "Lệnh giao hàng", href: "/delivery-orders", icon: ClipboardList },
      { label: "Giao hàng", href: "/delivery", icon: Truck },
      { label: "Phương tiện", href: "/vehicles", icon: Car },
      { label: "Tài xế", href: "/drivers", icon: User },
      { label: "Kiểm tra CL", href: "/quality", icon: CheckCircle },
      { label: "Chi phí vận hành", href: "/operation-costs", icon: DollarSign },
    ],
  },
  {
    label: "TÀI CHÍNH",
    icon: CreditCard,
    children: [
      { label: "Công nợ phải thu", href: "/accounts-receivable", icon: Receipt },
      { label: "Công nợ phải trả", href: "/accounts-payable", icon: CreditCard },
      { label: "Bù trừ công nợ", href: "/debt-offset", icon: ArrowLeftRight },
      { label: "Phiếu thu chi", href: "/payment-vouchers", icon: FileSpreadsheet },
      { label: "Ví khách hàng", href: "/wallet", icon: Wallet },
      { label: "Hóa đơn", href: "/invoices", icon: FileText },
      { label: "Sổ cái", href: "/general-ledger", icon: BookOpen },
      { label: "Tài sản", href: "/assets", icon: Landmark },
      { label: "Ngân sách", href: "/budget", icon: PiggyBank },
      { label: "Tỷ giá", href: "/exchange-rates", icon: ArrowLeftRight },
    ],
  },
  {
    label: "MUA HÀNG & KHO",
    icon: ShoppingCart,
    children: [
      { label: "Mua hàng", href: "/purchasing", icon: ShoppingCart },
      { label: "Nhà cung cấp", href: "/suppliers", icon: Building },
      { label: "Kho vật tư", href: "/inventory", icon: Warehouse },
    ],
  },
  {
    label: "NHÂN SỰ",
    icon: UserCog,
    children: [
      { label: "Nhân sự", href: "/employees", icon: UserCog },
      { label: "Chấm công", href: "/attendance", icon: Clock },
      { label: "Nghỉ phép", href: "/leave", icon: CalendarOff },
      { label: "Bảng lương", href: "/payroll", icon: Banknote },
      { label: "Hoa hồng", href: "/commission", icon: Award },
    ],
  },
  {
    label: "BÁO CÁO",
    icon: BarChart3,
    children: [
      { label: "Báo cáo", href: "/reports", icon: BarChart3 },
    ],
  },
  {
    label: "TIỆN ÍCH",
    icon: ListTodo,
    children: [
      { label: "Công việc", href: "/tasks", icon: ListTodo },
      { label: "Khiếu nại", href: "/complaints", icon: AlertCircle },
      { label: "Tài liệu", href: "/documents", icon: FolderOpen },
      { label: "Thông báo", href: "/notifications", icon: Bell },
      { label: "Phê duyệt", href: "/approvals", icon: ClipboardCheck },
      { label: "Ủy quyền", href: "/delegation", icon: KeyRound },
    ],
  },
  {
    label: "QUẢN TRỊ",
    icon: Settings,
    children: [
      { label: "Quản lý user", href: "/users", icon: Users },
      { label: "Tích hợp", href: "/integrations", icon: KeyRound },
      { label: "Cài đặt", href: "/settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "TỔNG QUAN": true,
    "KINH DOANH": true,
    "KHO VẬN & VẬN TẢI": true,
    "TÀI CHÍNH": true,
  });

  const toggleSection = (label: string) => {
    setOpenSections(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const allHrefs = navigation.flatMap(s => s.children?.map(c => c.href) || []);

  const isItemActive = (href: string) => {
    if (pathname === href) return true;
    if (href === '/') return false;
    if (!pathname.startsWith(href + '/')) return false;
    // Only active if no other menu item has a more specific match
    return !allHrefs.some(h => h.length > href.length && (pathname === h || pathname.startsWith(h + '/')));
  };

  if (collapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <div className="w-[68px] bg-white border-r border-gray-200 flex flex-col h-full">
          {/* Logo */}
          <div className="flex justify-center py-4 border-b border-gray-100">
            <button
              onClick={() => setCollapsed(false)}
              className="w-9 h-9 bg-[#4F5FD9] rounded-lg flex items-center justify-center text-white font-bold text-sm hover:bg-[#3D4FC7] transition-colors"
            >
              T
            </button>
          </div>

          {/* Section icons */}
          <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-1">
            {navigation.map((section, idx) => {
              const sectionHasActive = section.children?.some(
                (item) => isItemActive(item.href)
              );
              const SectionIcon = section.icon;

              return (
                <div key={section.label}>
                  {idx > 0 && (
                    <div className="my-2 mx-2 border-t border-gray-100" />
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={section.children?.[0]?.href || '/'}
                        className={cn(
                          "w-full h-10 flex items-center justify-center rounded-md transition-all",
                          sectionHasActive
                            ? "bg-[#4F5FD9] text-white shadow-sm"
                            : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                        )}
                      >
                        <SectionIcon className="w-[18px] h-[18px]" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                      {section.label}
                    </TooltipContent>
                  </Tooltip>
                </div>
              );
            })}
          </nav>

          {/* Expand button */}
          <div className="border-t border-gray-100 p-2.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setCollapsed(false)}
                  className="w-full h-10 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                >
                  <ChevronsRight className="w-[18px] h-[18px]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Mở rộng</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <div className="w-[260px] bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#4F5FD9] rounded-lg flex items-center justify-center text-white font-bold text-sm">
            T
          </div>
          <span className="font-bold text-[#2D3A8C] text-lg">TBS ERP</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {navigation.map((section) => (
          <div key={section.label} className="mb-1">
            <button
              onClick={() => toggleSection(section.label)}
              className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600"
            >
              {section.label}
              <ChevronDown className={cn(
                "w-3.5 h-3.5 transition-transform",
                !openSections[section.label] && "-rotate-90"
              )} />
            </button>

            {openSections[section.label] && section.children?.map((item) => {
              const isActive = isItemActive(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 mx-1 rounded-lg text-sm transition-colors",
                    isActive
                      ? "bg-[#4F5FD9] text-white font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Collapse button */}
      <div className="border-t border-gray-100 px-4 py-3 flex justify-end">
        <button onClick={() => setCollapsed(true)} className="text-gray-400 hover:text-gray-600" title="Thu gọn sidebar">
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
