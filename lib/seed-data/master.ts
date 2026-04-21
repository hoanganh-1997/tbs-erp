"use server";

import { createEmployee, getEmployees } from "@/lib/employees";
import { createSupplier, getSuppliers } from "@/lib/suppliers";
import { createVehicle, getVehicles } from "@/lib/vehicles";
import { createDriver, getDrivers } from "@/lib/drivers";
import { createExchangeRate, getExchangeRates } from "@/lib/exchange-rates";

export interface MasterIds {
  employeeIds: string[];
  employeeNames: Record<string, string>; // role -> name mapping
  supplierIds: string[];
  supplierNames: Record<string, string>; // id -> name
  vehicleIds: string[];
  driverIds: string[];
}

export async function seedMasterData(): Promise<MasterIds> {
  // Guard: skip if data exists
  const { total } = await getEmployees({ take: 1 });
  if (total > 0) {
    const { data: emps } = await getEmployees({ take: 200 });
    const { data: sups } = await getSuppliers({ take: 200 });
    const { data: vehs } = await getVehicles({ take: 200 });
    const { data: drvs } = await getDrivers({ take: 200 });
    const employeeNames: Record<string, string> = {};
    emps.forEach(e => { if (e.Role && e.FullName) employeeNames[e.Role] = e.FullName; });
    const supplierNames: Record<string, string> = {};
    sups.forEach(s => { if (s.CompanyName) supplierNames[s.id] = s.CompanyName; });
    return {
      employeeIds: emps.map(e => e.id),
      employeeNames,
      supplierIds: sups.map(s => s.id),
      supplierNames,
      vehicleIds: vehs.map(v => v.id),
      driverIds: drvs.map(d => d.id),
    };
  }

  // --- Employees (15) ---
  const employees = [
    { EmployeeCode: "NV-001", FullName: "Trần Bình Sơn", Email: "son.tb@tbs.vn", Phone: "0901000001", Department: "Ban Giám đốc", Position: "Tổng Giám đốc", Role: "CEO", Branch: "HN" as const, StartDate: "2020-01-15", Status: "Đang làm", BaseSalary: 80000000 },
    { EmployeeCode: "NV-002", FullName: "Nguyễn Thị Hương", Email: "huong.nt@tbs.vn", Phone: "0901000002", Department: "Ban Giám đốc", Position: "Phó Tổng Giám đốc", Role: "COO", Branch: "HN" as const, StartDate: "2020-03-01", Status: "Đang làm", BaseSalary: 60000000 },
    { EmployeeCode: "NV-003", FullName: "Lê Văn Đức", Email: "duc.lv@tbs.vn", Phone: "0901000003", Department: "Kế toán", Position: "Kế toán trưởng", Role: "CFO", Branch: "HN" as const, StartDate: "2020-06-01", Status: "Đang làm", BaseSalary: 50000000 },
    { EmployeeCode: "NV-004", FullName: "Phạm Minh Tuấn", Email: "tuan.pm@tbs.vn", Phone: "0901000004", Department: "Kinh doanh", Position: "Giám đốc Kinh doanh", Role: "GĐ KD", Branch: "HN" as const, StartDate: "2021-01-10", Status: "Đang làm", BaseSalary: 45000000 },
    { EmployeeCode: "NV-005", FullName: "Hoàng Thị Lan", Email: "lan.ht@tbs.vn", Phone: "0901000005", Department: "Kinh doanh", Position: "Trưởng nhóm KD HN", Role: "Leader", Branch: "HN" as const, StartDate: "2021-06-15", Status: "Đang làm", BaseSalary: 25000000 },
    { EmployeeCode: "NV-006", FullName: "Vũ Đình Nam", Email: "nam.vd@tbs.vn", Phone: "0901000006", Department: "Kinh doanh", Position: "Trưởng nhóm KD HCM", Role: "Leader", Branch: "HCM" as const, StartDate: "2022-01-10", Status: "Đang làm", BaseSalary: 25000000 },
    { EmployeeCode: "NV-007", FullName: "Đỗ Thị Mai", Email: "mai.dt@tbs.vn", Phone: "0901000007", Department: "Kinh doanh", Position: "Nhân viên kinh doanh", Role: "Sale", Branch: "HN" as const, StartDate: "2022-06-01", Status: "Đang làm", BaseSalary: 12000000 },
    { EmployeeCode: "NV-008", FullName: "Ngô Quang Hải", Email: "hai.nq@tbs.vn", Phone: "0901000008", Department: "Kinh doanh", Position: "Nhân viên kinh doanh", Role: "Sale", Branch: "HCM" as const, StartDate: "2023-02-15", Status: "Đang làm", BaseSalary: 12000000 },
    { EmployeeCode: "NV-009", FullName: "Trịnh Thị Ngọc", Email: "ngoc.tt@tbs.vn", Phone: "0901000009", Department: "Tiếp thị", Position: "Nhân viên Marketing", Role: "NV MKT", Branch: "HN" as const, StartDate: "2023-03-01", Status: "Đang làm", BaseSalary: 11000000 },
    { EmployeeCode: "NV-010", FullName: "Bùi Văn Thắng", Email: "thang.bv@tbs.vn", Phone: "0901000010", Department: "Kế toán", Position: "Kế toán thanh toán", Role: "KT TT", Branch: "HN" as const, StartDate: "2021-09-01", Status: "Đang làm", BaseSalary: 15000000 },
    { EmployeeCode: "NV-011", FullName: "Lý Thị Hồng", Email: "hong.lt@tbs.vn", Phone: "0901000011", Department: "Kế toán", Position: "Kế toán tổng hợp", Role: "KT TH", Branch: "HN" as const, StartDate: "2021-09-15", Status: "Đang làm", BaseSalary: 16000000 },
    { EmployeeCode: "NV-012", FullName: "Đinh Công Vinh", Email: "vinh.dc@tbs.vn", Phone: "0901000012", Department: "Xuất Nhập Khẩu", Position: "Trưởng phòng XNK", Role: "TP XNK", Branch: "HN" as const, StartDate: "2021-04-01", Status: "Đang làm", BaseSalary: 22000000 },
    { EmployeeCode: "NV-013", FullName: "Cao Minh Phúc", Email: "phuc.cm@tbs.vn", Phone: "0901000013", Department: "Kho Trung Quốc", Position: "Trưởng kho TQ", Role: "Trưởng kho", Branch: "HN" as const, StartDate: "2022-02-01", Status: "Đang làm", BaseSalary: 18000000 },
    { EmployeeCode: "NV-014", FullName: "Đặng Thị Yến", Email: "yen.dt@tbs.vn", Phone: "0901000014", Department: "Kho Việt Nam", Position: "Trưởng kho VN - Đông Anh", Role: "Trưởng kho", Branch: "HN" as const, StartDate: "2022-05-01", Status: "Đang làm", BaseSalary: 18000000 },
    { EmployeeCode: "NV-015", FullName: "Phan Văn Long", Email: "long.pv@tbs.vn", Phone: "0901000015", Department: "Tiếp thị", Position: "Nhân viên CSKH", Role: "CSKH", Branch: "HN" as const, StartDate: "2023-07-01", Status: "Thử việc", BaseSalary: 9000000 },
  ];

  const employeeIds: string[] = [];
  const employeeNames: Record<string, string> = {};
  for (const emp of employees) {
    const created = await createEmployee(emp);
    employeeIds.push(created.id);
    if (emp.Role) employeeNames[emp.Role] = emp.FullName;
  }

  // --- Suppliers (8) ---
  const suppliers = [
    { SupplierCode: "NCC-001", CompanyName: "Guangzhou Yida Trading Co.", ContactName: "Wang Lei", Phone: "+86-20-88881111", Email: "wang@yida-trading.cn", Address: "Guangzhou, Quảng Đông, TQ", Country: "Trung Quốc", Category: "Hàng hóa", Rating: 4.5, IsApproved: true, PaymentTerms: "T/T 30 ngày", BankAccount: "6222021234567890", BankName: "ICBC", TaxCode: "91440101MA5CXXXX", Status: "Hoạt động" },
    { SupplierCode: "NCC-002", CompanyName: "Shenzhen Huawei Electronics", ContactName: "Li Ming", Phone: "+86-755-26881234", Email: "liming@huawei-elec.cn", Address: "Shenzhen, Quảng Đông, TQ", Country: "Trung Quốc", Category: "Hàng hóa", Rating: 4.8, IsApproved: true, PaymentTerms: "T/T trước 50%", BankAccount: "6222029876543210", BankName: "Bank of China", TaxCode: "91440300MA5DXXXX", Status: "Hoạt động" },
    { SupplierCode: "NCC-003", CompanyName: "Foshan Ceramic World", ContactName: "Zhang Wei", Phone: "+86-757-82345678", Email: "zhang@ceramicworld.cn", Address: "Foshan, Quảng Đông, TQ", Country: "Trung Quốc", Category: "Hàng hóa", Rating: 4.2, IsApproved: true, PaymentTerms: "L/C 60 ngày", BankAccount: "6222031111222233", BankName: "CCB", TaxCode: "91440604MA5EXXXX", Status: "Hoạt động" },
    { SupplierCode: "NCC-004", CompanyName: "Yiwu Small Goods Market", ContactName: "Chen Fang", Phone: "+86-579-85123456", Email: "chen@yiwugoods.cn", Address: "Yiwu, Chiết Giang, TQ", Country: "Trung Quốc", Category: "Hàng hóa", Rating: 3.8, IsApproved: true, PaymentTerms: "COD", BankAccount: "6222044444555566", BankName: "ABC", TaxCode: "91330782MA5FXXXX", Status: "Hoạt động" },
    { SupplierCode: "NCC-005", CompanyName: "Shanghai Global Logistics", ContactName: "Liu Yang", Phone: "+86-21-61234567", Email: "liu@globallogistics.cn", Address: "Shanghai, TQ", Country: "Trung Quốc", Category: "Vận tải", Rating: 4.6, IsApproved: true, PaymentTerms: "T/T 15 ngày", BankAccount: "6222057777888899", BankName: "CMB", TaxCode: "91310000MA5GXXXX", Status: "Hoạt động" },
    { SupplierCode: "NCC-006", CompanyName: "Công ty TNHH Vận tải Bắc Nam", ContactName: "Trần Văn Hùng", Phone: "0243-8765432", Email: "hung@bacnam.vn", Address: "Hà Nội, Việt Nam", Country: "Việt Nam", Category: "Vận tải", Rating: 4.3, IsApproved: true, PaymentTerms: "Cuối tháng", BankAccount: "19031234567890", BankName: "Techcombank", TaxCode: "0101234567", Status: "Hoạt động" },
    { SupplierCode: "NCC-007", CompanyName: "Công ty CP Kho bãi Đông Anh", ContactName: "Nguyễn Thị Hoa", Phone: "0243-9876543", Email: "hoa@donganhwarehouse.vn", Address: "Đông Anh, Hà Nội", Country: "Việt Nam", Category: "Kho bãi", Rating: 4.0, IsApproved: true, PaymentTerms: "Cuối tháng", BankAccount: "12341234567890", BankName: "Vietcombank", TaxCode: "0107654321", Status: "Hoạt động" },
    { SupplierCode: "NCC-008", CompanyName: "Công ty Dịch vụ HQ Lạng Sơn", ContactName: "Lê Công Minh", Phone: "0205-3456789", Email: "minh@hqlangson.vn", Address: "Lạng Sơn, Việt Nam", Country: "Việt Nam", Category: "Thông quan", Rating: 4.1, IsApproved: true, PaymentTerms: "T/T trước", BankAccount: "56781234567890", BankName: "BIDV", TaxCode: "0109876543", Status: "Hoạt động" },
  ];

  const supplierIds: string[] = [];
  const supplierNames: Record<string, string> = {};
  for (const sup of suppliers) {
    const created = await createSupplier(sup);
    supplierIds.push(created.id);
    supplierNames[created.id] = sup.CompanyName;
  }

  // --- Vehicles (5) ---
  const vehicles = [
    { VehicleCode: "XE-001", LicensePlate: "30H-12345", VehicleType: "Xe tải 5T", Brand: "Hyundai HD120", MaxWeight: 5000, MaxCBM: 25, Status: "Đang sử dụng", InsuranceExpiry: "2027-03-15", MaintenanceDate: "2026-03-01" },
    { VehicleCode: "XE-002", LicensePlate: "30H-67890", VehicleType: "Xe tải 2.5T", Brand: "Hyundai Porter", MaxWeight: 2500, MaxCBM: 12, Status: "Sẵn sàng", InsuranceExpiry: "2027-06-20", MaintenanceDate: "2026-02-15" },
    { VehicleCode: "XE-003", LicensePlate: "30H-11223", VehicleType: "Xe tải 1T", Brand: "Suzuki Carry", MaxWeight: 1000, MaxCBM: 6, Status: "Sẵn sàng", InsuranceExpiry: "2027-01-10", MaintenanceDate: "2026-01-20" },
    { VehicleCode: "XE-004", LicensePlate: "51H-44556", VehicleType: "Xe tải 5T", Brand: "Isuzu FRR", MaxWeight: 5000, MaxCBM: 28, Status: "Đang sử dụng", InsuranceExpiry: "2027-08-01", MaintenanceDate: "2026-04-01" },
    { VehicleCode: "XE-005", LicensePlate: "30H-77889", VehicleType: "Xe con", Brand: "Toyota Innova", MaxWeight: 500, MaxCBM: 2, Status: "Bảo trì", InsuranceExpiry: "2027-02-28", MaintenanceDate: "2026-04-05", Notes: "Đang thay lốp + bảo dưỡng định kỳ" },
  ];

  const vehicleIds: string[] = [];
  for (const veh of vehicles) {
    const created = await createVehicle(veh);
    vehicleIds.push(created.id);
  }

  // --- Drivers (5) ---
  const driverData = [
    { DriverCode: "TX-001", FullName: "Nguyễn Văn Tùng", Phone: "0977000001", LicenseNumber: "B2-001234", LicenseExpiry: "2028-05-20", AssignedVehicle: "30H-12345", AssignedVehicleId: vehicleIds[0], Status: "Đang hoạt động", TodayDeliveries: 2, TotalDeliveries: 345 },
    { DriverCode: "TX-002", FullName: "Trần Đức Mạnh", Phone: "0977000002", LicenseNumber: "C-005678", LicenseExpiry: "2027-11-15", AssignedVehicle: "30H-67890", AssignedVehicleId: vehicleIds[1], Status: "Đang hoạt động", TodayDeliveries: 0, TotalDeliveries: 210 },
    { DriverCode: "TX-003", FullName: "Lê Hữu Phước", Phone: "0977000003", LicenseNumber: "B2-009012", LicenseExpiry: "2028-02-28", AssignedVehicle: "30H-11223", AssignedVehicleId: vehicleIds[2], Status: "Đang hoạt động", TodayDeliveries: 1, TotalDeliveries: 178 },
    { DriverCode: "TX-004", FullName: "Phạm Hoàng Anh", Phone: "0977000004", LicenseNumber: "C-003456", LicenseExpiry: "2027-09-10", AssignedVehicle: "51H-44556", AssignedVehicleId: vehicleIds[3], Status: "Đang hoạt động", TodayDeliveries: 3, TotalDeliveries: 420 },
    { DriverCode: "TX-005", FullName: "Võ Minh Khoa", Phone: "0977000005", LicenseNumber: "B2-007890", LicenseExpiry: "2028-08-01", Status: "Nghỉ phép", TodayDeliveries: 0, TotalDeliveries: 95, Notes: "Nghỉ phép từ 07/04 - 14/04" },
  ];

  const driverIds: string[] = [];
  for (const drv of driverData) {
    const created = await createDriver(drv);
    driverIds.push(created.id);
  }

  // --- Exchange Rates (3) ---
  const rates = [
    { Date: "2026-04-09", FromCurrency: "CNY", ToCurrency: "VND", Rate: 3580, SetBy: "Lê Văn Đức" },
    { Date: "2026-04-09", FromCurrency: "USD", ToCurrency: "VND", Rate: 25450, SetBy: "Lê Văn Đức" },
    { Date: "2026-04-08", FromCurrency: "CNY", ToCurrency: "VND", Rate: 3575, SetBy: "Lê Văn Đức" },
  ];

  for (const rate of rates) {
    await createExchangeRate(rate);
  }

  return { employeeIds, employeeNames, supplierIds, supplierNames, vehicleIds, driverIds };
}
