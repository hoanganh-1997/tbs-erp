"use server";

import { createLead, getLeads } from "@/lib/leads";
import { createLeadActivity } from "@/lib/lead-activities";
import { createCustomer, getCustomers } from "@/lib/customers";
import type { MasterIds } from "./master";

export interface CrmIds {
  leadIds: string[];
  customerIds: string[];
  customerNames: Record<string, string>; // id -> name
  customerCompanies: Record<string, string>; // id -> company
}

export async function seedCrmData(master: MasterIds): Promise<CrmIds> {
  const { total } = await getLeads({ take: 1 });
  if (total > 0) {
    const { data: leads } = await getLeads({ take: 200 });
    const { data: custs } = await getCustomers({ take: 200 });
    const customerNames: Record<string, string> = {};
    const customerCompanies: Record<string, string> = {};
    custs.forEach(c => {
      customerNames[c.id] = c.ContactName || "";
      customerCompanies[c.id] = c.CompanyName || "";
    });
    return {
      leadIds: leads.map(l => l.id),
      customerIds: custs.map(c => c.id),
      customerNames,
      customerCompanies,
    };
  }

  const saleHN = master.employeeNames["Sale"] || "Đỗ Thị Mai";
  const saleHCM = master.employeeNames["Sale"] || "Ngô Quang Hải";
  const leaderHN = "Hoàng Thị Lan";
  const leaderHCM = "Vũ Đình Nam";
  const mkt = "Trịnh Thị Ngọc";
  const cskh = "Phan Văn Long";

  // --- Leads (12) ---
  const leadsData = [
    { LeadCode: "LD-260401-001", Phone: "0912111001", FullName: "Nguyễn Văn An", Source: "Facebook", Rating: "Nóng", Needs: "Vận chuyển 2 container hàng gia dụng từ Quảng Châu về HN", Status: "Đang tư vấn", MarketingOwner: mkt, CSKHOwner: cskh, SaleOwner: saleHN, LeaderName: leaderHN, Branch: "HN" },
    { LeadCode: "LD-260401-002", Phone: "0912111002", FullName: "Trần Thị Bích", Source: "TikTok", Rating: "Nóng", Needs: "Mua hộ linh kiện điện tử Shenzhen, khoảng 500kg", Status: "Đã báo giá", MarketingOwner: mkt, SaleOwner: saleHN, LeaderName: leaderHN, Branch: "HN" },
    { LeadCode: "LD-260402-003", Phone: "0912111003", FullName: "Lê Hoàng Cường", Source: "Website", Rating: "Nóng", Needs: "UTXNK hàng gốm sứ Foshan, 40ft container", Status: "Thành KH", MarketingOwner: mkt, SaleOwner: saleHN, LeaderName: leaderHN, Branch: "HN" },
    { LeadCode: "LD-260402-004", Phone: "0912111004", FullName: "Phạm Thị Dung", Source: "Zalo", Rating: "Ấm", Needs: "Ship hàng quần áo Quảng Châu về HCM", Status: "Đã giao Sale", MarketingOwner: mkt, SaleOwner: saleHCM, LeaderName: leaderHCM, Branch: "HCM" },
    { LeadCode: "LD-260403-005", Phone: "0912111005", FullName: "Hoàng Minh Đức", Source: "Giới thiệu", Rating: "Ấm", Needs: "Vận chuyển máy móc công nghiệp từ Thượng Hải", Status: "Đang khai thác", MarketingOwner: mkt, CSKHOwner: cskh, Branch: "HN" },
    { LeadCode: "LD-260403-006", Phone: "0912111006", FullName: "Vũ Thị Phương", Source: "Facebook", Rating: "Ấm", Needs: "Mua hàng tạp hóa Nghĩa Ô, số lượng nhỏ", Status: "Đang tư vấn", MarketingOwner: mkt, SaleOwner: saleHCM, LeaderName: leaderHCM, Branch: "HCM" },
    { LeadCode: "LD-260404-007", Phone: "0912111007", FullName: "Đặng Văn Giang", Source: "Website", Rating: "Ấm", Needs: "LCL chính ngạch hàng mỹ phẩm", Status: "Mới", MarketingOwner: mkt, Branch: "HN" },
    { LeadCode: "LD-260404-008", Phone: "0912111008", FullName: "Bùi Thị Hạnh", Source: "TikTok", Rating: "Lạnh", Needs: "Hỏi giá vận chuyển, chưa rõ nhu cầu", Status: "Mới", MarketingOwner: mkt, Branch: "HCM" },
    { LeadCode: "LD-260405-009", Phone: "0912111009", FullName: "Cao Minh Khang", Source: "Zalo", Rating: "Lạnh", Needs: "Tham khảo giá container 20ft đường biển", Status: "Đang khai thác", MarketingOwner: mkt, CSKHOwner: cskh, Branch: "HN" },
    { LeadCode: "LD-260405-010", Phone: "0912111010", FullName: "Lý Thị Loan", Source: "Facebook", Rating: "Lạnh", Needs: "Mua hàng online Taobao số lượng nhỏ", Status: "Thất bại", MarketingOwner: mkt, SaleOwner: saleHN, Branch: "HN", FailureReason: "Số lượng quá nhỏ, không phù hợp dịch vụ" },
    { LeadCode: "LD-260406-011", Phone: "0912111011", FullName: "Ngô Thanh Tùng", Source: "Giới thiệu", Rating: "Xấu", Needs: "Yêu cầu vận chuyển hàng cấm", Status: "Thất bại", MarketingOwner: mkt, Branch: "HN", FailureReason: "Hàng không hợp pháp, từ chối" },
    { LeadCode: "LD-260407-012", Phone: "0912111012", FullName: "Trịnh Văn Minh", Source: "Website", Rating: "Nóng", Needs: "MHH + UTXNK lô hàng nội thất Foshan 2 container", Status: "Thành KH", MarketingOwner: mkt, SaleOwner: saleHCM, LeaderName: leaderHCM, Branch: "HCM" },
  ];

  const leadIds: string[] = [];
  for (const lead of leadsData) {
    const created = await createLead(lead);
    leadIds.push(created.id);
  }

  // --- Lead Activities (20) ---
  const activities = [
    { LeadId: leadIds[0], ActivityType: "Gọi điện", Content: "Gọi lần 1, KH quan tâm dịch vụ VCT", Result: "KH hẹn gặp tuần sau", CreatedBy: cskh },
    { LeadId: leadIds[0], ActivityType: "Gặp mặt", Content: "Gặp KH tại VP, tư vấn chi tiết quy trình VCT", Result: "KH đồng ý, chờ báo giá", CreatedBy: saleHN },
    { LeadId: leadIds[1], ActivityType: "Zalo", Content: "KH gửi link sản phẩm cần mua hộ từ Shenzhen", Result: "Đã nhận, đang tính giá", CreatedBy: saleHN },
    { LeadId: leadIds[1], ActivityType: "Email", Content: "Gửi báo giá MHH linh kiện điện tử, 500kg", Result: "KH đang xem xét", CreatedBy: saleHN },
    { LeadId: leadIds[2], ActivityType: "Gọi điện", Content: "Tư vấn quy trình UTXNK gốm sứ", Result: "KH rất quan tâm", CreatedBy: saleHN },
    { LeadId: leadIds[2], ActivityType: "Gặp mặt", Content: "Gặp tại showroom KH, xem mẫu gốm cần NK", Result: "Đã chốt, chuyển KH", CreatedBy: saleHN },
    { LeadId: leadIds[3], ActivityType: "Zalo", Content: "KH hỏi giá ship quần áo từ Quảng Châu", Result: "Đã gửi bảng giá VCT", CreatedBy: cskh },
    { LeadId: leadIds[3], ActivityType: "Gọi điện", Content: "Giao lead cho Sale HCM follow up", Result: "Sale HCM đã nhận", CreatedBy: cskh },
    { LeadId: leadIds[4], ActivityType: "Email", Content: "KH gửi danh sách máy móc cần VC", Result: "Cần tư vấn thêm về thông quan", CreatedBy: mkt },
    { LeadId: leadIds[4], ActivityType: "Ghi chú", Content: "KH là chủ xưởng sản xuất, tiềm năng lớn", Result: "Cần ưu tiên follow up", CreatedBy: mkt },
    { LeadId: leadIds[5], ActivityType: "Zalo", Content: "Tư vấn giá VCT hàng tạp hóa Nghĩa Ô", Result: "KH đang so sánh giá", CreatedBy: saleHCM },
    { LeadId: leadIds[6], ActivityType: "Ghi chú", Content: "Lead mới từ website, cần liên hệ", Result: "Chưa liên hệ được", CreatedBy: mkt },
    { LeadId: leadIds[7], ActivityType: "Gọi điện", Content: "Gọi lần 1, KH chưa rõ nhu cầu cụ thể", Result: "Hẹn gọi lại sau 1 tuần", CreatedBy: cskh },
    { LeadId: leadIds[8], ActivityType: "Zalo", Content: "KH hỏi giá container 20ft đường biển GZ-HN", Result: "Đã gửi bảng giá tham khảo", CreatedBy: cskh },
    { LeadId: leadIds[9], ActivityType: "Gọi điện", Content: "KH muốn ship 5-10 món Taobao", Result: "Số lượng quá nhỏ, không đủ MOQ", CreatedBy: saleHN },
    { LeadId: leadIds[9], ActivityType: "Ghi chú", Content: "Đóng lead - không phù hợp dịch vụ B2B", Result: "Chuyển thất bại", CreatedBy: saleHN },
    { LeadId: leadIds[10], ActivityType: "Gọi điện", Content: "KH yêu cầu VC hàng không rõ nguồn gốc", Result: "Từ chối, hàng không hợp pháp", CreatedBy: mkt },
    { LeadId: leadIds[11], ActivityType: "Gặp mặt", Content: "Gặp KH tại HCM, khảo sát nhu cầu nội thất", Result: "Đơn lớn, 2 container 40ft", CreatedBy: saleHCM },
    { LeadId: leadIds[11], ActivityType: "Email", Content: "Gửi proposal MHH + UTXNK nội thất Foshan", Result: "KH đồng ý, chuyển KH", CreatedBy: saleHCM },
    { LeadId: leadIds[0], ActivityType: "Ghi chú", Content: "KH muốn gửi hàng gia dụng, khoảng 15 CBM", Result: "Tiếp tục tư vấn", CreatedBy: saleHN },
  ];

  for (const act of activities) {
    await createLeadActivity(act);
  }

  // --- Customers (10) ---
  const customersData = [
    { CustomerCode: "KH-100001", CompanyName: "Công ty TNHH Nội thất Hoàng Gia", ContactName: "Lê Hoàng Cường", Phone: "0912111003", Email: "cuong@hoanggia.vn", Address: "45 Lê Duẩn, Đống Đa, Hà Nội", DeliveryAddress: "KCN Nguyên Khê, Đông Anh, Hà Nội", ReceiverName: "Trần Văn Bình", ReceiverPhone: "0987654321", TaxCode: "0101234001", Tier: "VIP", DepositRate: 30, CreditLimit: 2000000000, VNDBalance: 150000000, CNYBalance: 25000, SaleOwner: saleHN, LeaderName: leaderHN, Branch: "HN", HasXNKLicense: true, SourceLeadId: leadIds[2] },
    { CustomerCode: "KH-100002", CompanyName: "Công ty CP XNK Minh Phát", ContactName: "Trịnh Văn Minh", Phone: "0912111012", Email: "minh@minhphat.vn", Address: "123 Nguyễn Huệ, Q1, TP.HCM", DeliveryAddress: "KCN Hóc Môn, TP.HCM", ReceiverName: "Lê Thị Thu", ReceiverPhone: "0987654322", TaxCode: "0301234002", Tier: "VIP", DepositRate: 30, CreditLimit: 3000000000, VNDBalance: 280000000, CNYBalance: 50000, SaleOwner: saleHCM, LeaderName: leaderHCM, Branch: "HCM", HasXNKLicense: true, SourceLeadId: leadIds[11] },
    { CustomerCode: "KH-100003", CompanyName: "Công ty TNHH TM Hải Đăng", ContactName: "Phạm Quốc Hải", Phone: "0912222001", Email: "hai@haidang.vn", Address: "78 Trần Hưng Đạo, Hoàn Kiếm, HN", DeliveryAddress: "78 Trần Hưng Đạo, Hoàn Kiếm, HN", ReceiverName: "Phạm Quốc Hải", ReceiverPhone: "0912222001", TaxCode: "0101234003", Tier: "Active", DepositRate: 30, CreditLimit: 500000000, VNDBalance: 45000000, CNYBalance: 8000, SaleOwner: saleHN, LeaderName: leaderHN, Branch: "HN", HasXNKLicense: false },
    { CustomerCode: "KH-100004", CompanyName: "Cửa hàng điện tử Tân Phát", ContactName: "Nguyễn Tân Phát", Phone: "0912222002", Email: "phat@tanphat.vn", Address: "Phố Huế, Hai Bà Trưng, HN", DeliveryAddress: "Phố Huế, Hai Bà Trưng, HN", ReceiverName: "Nguyễn Tân Phát", ReceiverPhone: "0912222002", TaxCode: "0101234004", Tier: "Active", DepositRate: 30, CreditLimit: 300000000, VNDBalance: 20000000, CNYBalance: 3000, SaleOwner: saleHN, LeaderName: leaderHN, Branch: "HN", HasXNKLicense: false },
    { CustomerCode: "KH-100005", CompanyName: "Công ty TNHH Dệt may Sài Gòn Star", ContactName: "Trần Ngọc Sơn", Phone: "0912222003", Email: "son@sgstar.vn", Address: "Quận Tân Bình, TP.HCM", DeliveryAddress: "KCN Tân Bình, TP.HCM", ReceiverName: "Vũ Thị Hằng", ReceiverPhone: "0912222033", TaxCode: "0301234005", Tier: "Active", DepositRate: 30, CreditLimit: 800000000, VNDBalance: 60000000, CNYBalance: 12000, SaleOwner: saleHCM, LeaderName: leaderHCM, Branch: "HCM", HasXNKLicense: false },
    { CustomerCode: "KH-100006", CompanyName: "Công ty TNHH Vật liệu XD Thành Công", ContactName: "Đặng Thành Công", Phone: "0912222004", Email: "cong@thanhcong.vn", Address: "Long Biên, Hà Nội", DeliveryAddress: "KCN Đông Anh, HN", ReceiverName: "Đặng Thành Công", ReceiverPhone: "0912222004", TaxCode: "0101234006", Tier: "Active", DepositRate: 30, CreditLimit: 600000000, VNDBalance: 35000000, CNYBalance: 5000, SaleOwner: saleHN, LeaderName: leaderHN, Branch: "HN", HasXNKLicense: true },
    { CustomerCode: "KH-100007", CompanyName: "Shop online Mèo Cute", ContactName: "Bùi Thị Mỹ", Phone: "0912222005", Email: "my@meocute.vn", Address: "Cầu Giấy, Hà Nội", DeliveryAddress: "Cầu Giấy, Hà Nội", ReceiverName: "Bùi Thị Mỹ", ReceiverPhone: "0912222005", TaxCode: "0101234007", Tier: "Prospect", DepositRate: 50, CreditLimit: 100000000, VNDBalance: 5000000, CNYBalance: 0, SaleOwner: saleHN, LeaderName: leaderHN, Branch: "HN", HasXNKLicense: false },
    { CustomerCode: "KH-100008", CompanyName: "Công ty TNHH Phụ tùng Ô tô Đại Việt", ContactName: "Lý Đại Việt", Phone: "0912222006", Email: "viet@daiviet.vn", Address: "Quận 7, TP.HCM", DeliveryAddress: "Quận 7, TP.HCM", ReceiverName: "Lý Đại Việt", ReceiverPhone: "0912222006", TaxCode: "0301234008", Tier: "Prospect", DepositRate: 50, CreditLimit: 200000000, VNDBalance: 0, CNYBalance: 0, SaleOwner: saleHCM, LeaderName: leaderHCM, Branch: "HCM", HasXNKLicense: false },
    { CustomerCode: "KH-100009", CompanyName: "Công ty TNHH Bao bì Đông Á", ContactName: "Hoàng Đông", Phone: "0912222007", Email: "dong@dongabaobi.vn", Address: "Thanh Xuân, Hà Nội", DeliveryAddress: "Thanh Xuân, Hà Nội", ReceiverName: "Hoàng Đông", ReceiverPhone: "0912222007", TaxCode: "0101234009", Tier: "Inactive", DepositRate: 50, CreditLimit: 200000000, VNDBalance: 0, CNYBalance: 0, SaleOwner: saleHN, LeaderName: leaderHN, Branch: "HN", HasXNKLicense: false, Notes: "Không có đơn hàng từ tháng 10/2025" },
    { CustomerCode: "KH-100010", CompanyName: "Công ty TNHH TM Phú Quý (BL)", ContactName: "Nguyễn Phú Quý", Phone: "0912222008", Email: "quy@phuquy.vn", Address: "Quận Bình Thạnh, TP.HCM", DeliveryAddress: "Quận Bình Thạnh, TP.HCM", ReceiverName: "Nguyễn Phú Quý", ReceiverPhone: "0912222008", TaxCode: "0301234010", Tier: "Blacklist", DepositRate: 50, CreditLimit: 0, VNDBalance: 0, CNYBalance: 0, SaleOwner: saleHCM, LeaderName: leaderHCM, Branch: "HCM", HasXNKLicense: false, Notes: "Nợ xấu, đã chuyển Blacklist từ 01/2026" },
  ];

  const customerIds: string[] = [];
  const customerNames: Record<string, string> = {};
  const customerCompanies: Record<string, string> = {};
  for (const cust of customersData) {
    const created = await createCustomer(cust);
    customerIds.push(created.id);
    customerNames[created.id] = cust.ContactName;
    customerCompanies[created.id] = cust.CompanyName;
  }

  // Update leads that converted to customers
  // Lead index 2 (Lê Hoàng Cường) -> Customer index 0
  // Lead index 11 (Trịnh Văn Minh) -> Customer index 1

  return { leadIds, customerIds, customerNames, customerCompanies };
}
