"use server";
import { getRecords, getRecord, createRecord, updateRecord, deleteRecord, deleteRecords } from "@/lib/inforact-sdk";
import type { ListRecordsOptions, CreateTableField } from "@/lib/inforact-sdk";
import { ensureTable } from "@/lib/table-registry";

const TABLE_NAME = 'Employees';
const TABLE_FIELDS: CreateTableField[] = [
  { name: 'EmployeeCode', type: 'TEXT' },
  { name: 'FullName', type: 'TEXT' },
  { name: 'Email', type: 'TEXT' },
  { name: 'Phone', type: 'TEXT' },
  { name: 'Department', type: 'SINGLE_OPTION', options: [
    { name: 'Ban Giám đốc' }, { name: 'Kinh doanh' }, { name: 'Tiếp thị' },
    { name: 'Kế toán' }, { name: 'Xuất Nhập Khẩu' },
    { name: 'Kho Trung Quốc' }, { name: 'Kho Việt Nam' }
  ]},
  { name: 'Position', type: 'TEXT' },
  { name: 'Role', type: 'SINGLE_OPTION', options: [
    { name: 'CEO' }, { name: 'COO' }, { name: 'CFO' },
    { name: 'GĐ KD' }, { name: 'Leader' }, { name: 'Sale' },
    { name: 'NV MKT' }, { name: 'CSKH' },
    { name: 'KT TH' }, { name: 'KT TT' }, { name: 'KT CP' },
    { name: 'TP XNK' }, { name: 'NV XNK' },
    { name: 'Trưởng kho' }, { name: 'NV kho' }, { name: 'Tài xế' },
    { name: 'Agent TQ' }
  ]},
  { name: 'Branch', type: 'SINGLE_OPTION', options: [{ name: 'HN' }, { name: 'HCM' }] },
  { name: 'ManagerId', type: 'TEXT' },
  { name: 'StartDate', type: 'DATE' },
  { name: 'Status', type: 'SINGLE_OPTION', options: [
    { name: 'Đang làm' }, { name: 'Thử việc' }, { name: 'Nghỉ phép' }, { name: 'Đã nghỉ' }
  ]},
  { name: 'BaseSalary', type: 'NUMBER' },
  { name: 'Notes', type: 'TEXT' },
];

let _tableId: string | null = null;
async function getTableId() {
  if (!_tableId) _tableId = await ensureTable(TABLE_NAME, TABLE_FIELDS);
  return _tableId;
}

export interface Employee {
  id: string;
  EmployeeCode?: string;
  FullName?: string;
  Email?: string;
  Phone?: string;
  Department?: string;
  Position?: string;
  Role?: string;
  Branch?: string;
  ManagerId?: string;
  StartDate?: string;
  Status?: string;
  BaseSalary?: number;
  Notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateEmployeeInput = Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateEmployeeInput = Partial<CreateEmployeeInput>;

function mapRecord(record: any): Employee {
  return { id: record.id, ...record.fields, createdAt: record.createdAt, updatedAt: record.updatedAt };
}

export async function getEmployees(options?: ListRecordsOptions): Promise<{ data: Employee[]; total: number }> {
  const tableId = await getTableId();
  const result = await getRecords(tableId, options);
  return { data: result.records.map(mapRecord), total: result.total };
}

export async function getEmployee(id: string): Promise<Employee> {
  const tableId = await getTableId();
  return mapRecord(await getRecord(tableId, id));
}

export async function createEmployee(data: CreateEmployeeInput): Promise<Employee> {
  const tableId = await getTableId();
  return mapRecord(await createRecord(tableId, data as Record<string, any>));
}

export async function updateEmployee(id: string, data: UpdateEmployeeInput): Promise<void> {
  const tableId = await getTableId();
  await updateRecord(tableId, id, data as Record<string, any>);
}

export async function deleteEmployee(id: string): Promise<void> {
  const tableId = await getTableId();
  await deleteRecord(tableId, id);
}

export async function deleteEmployees(ids: string[]): Promise<void> {
  const tableId = await getTableId();
  await deleteRecords(tableId, ids);
}
