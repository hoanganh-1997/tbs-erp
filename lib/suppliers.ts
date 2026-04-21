"use server";
import { getRecords, getRecord, createRecord, updateRecord, deleteRecord, deleteRecords } from "@/lib/inforact-sdk";
import type { ListRecordsOptions, CreateTableField } from "@/lib/inforact-sdk";
import { ensureTable } from "@/lib/table-registry";

const TABLE_NAME = 'Suppliers';
const TABLE_FIELDS: CreateTableField[] = [
  { name: 'SupplierCode', type: 'TEXT' },
  { name: 'CompanyName', type: 'TEXT' },
  { name: 'ContactName', type: 'TEXT' },
  { name: 'Phone', type: 'TEXT' },
  { name: 'Email', type: 'TEXT' },
  { name: 'Address', type: 'TEXT' },
  { name: 'Country', type: 'SINGLE_OPTION', options: [
    { name: 'Trung Quốc' }, { name: 'Việt Nam' }, { name: 'Khác' }
  ]},
  { name: 'Category', type: 'SINGLE_OPTION', options: [
    { name: 'Hàng hóa' }, { name: 'Vận tải' }, { name: 'Kho bãi' },
    { name: 'Thông quan' }, { name: 'Khác' }
  ]},
  { name: 'Rating', type: 'NUMBER' },
  { name: 'IsApproved', type: 'CHECKBOX' },
  { name: 'PaymentTerms', type: 'TEXT' },
  { name: 'BankAccount', type: 'TEXT' },
  { name: 'BankName', type: 'TEXT' },
  { name: 'TaxCode', type: 'TEXT' },
  { name: 'Status', type: 'SINGLE_OPTION', options: [
    { name: 'Hoạt động' }, { name: 'Tạm ngưng' }, { name: 'Đã khóa' }
  ]},
  { name: 'Notes', type: 'TEXT' },
];

let _tableId: string | null = null;
async function getTableId() {
  if (!_tableId) _tableId = await ensureTable(TABLE_NAME, TABLE_FIELDS);
  return _tableId;
}

export interface Supplier {
  id: string;
  SupplierCode?: string;
  CompanyName?: string;
  ContactName?: string;
  Phone?: string;
  Email?: string;
  Address?: string;
  Country?: string;
  Category?: string;
  Rating?: number;
  IsApproved?: boolean;
  PaymentTerms?: string;
  BankAccount?: string;
  BankName?: string;
  TaxCode?: string;
  Status?: string;
  Notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateSupplierInput = Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateSupplierInput = Partial<CreateSupplierInput>;

function mapRecord(record: any): Supplier {
  return { id: record.id, ...record.fields, createdAt: record.createdAt, updatedAt: record.updatedAt };
}

export async function getSuppliers(options?: ListRecordsOptions): Promise<{ data: Supplier[]; total: number }> {
  const tableId = await getTableId();
  const result = await getRecords(tableId, options);
  return { data: result.records.map(mapRecord), total: result.total };
}

export async function getSupplier(id: string): Promise<Supplier> {
  const tableId = await getTableId();
  return mapRecord(await getRecord(tableId, id));
}

export async function createSupplier(data: CreateSupplierInput): Promise<Supplier> {
  const tableId = await getTableId();
  return mapRecord(await createRecord(tableId, data as Record<string, any>));
}

export async function updateSupplier(id: string, data: UpdateSupplierInput): Promise<void> {
  const tableId = await getTableId();
  await updateRecord(tableId, id, data as Record<string, any>);
}

export async function deleteSupplier(id: string): Promise<void> {
  const tableId = await getTableId();
  await deleteRecord(tableId, id);
}

export async function deleteSuppliers(ids: string[]): Promise<void> {
  const tableId = await getTableId();
  await deleteRecords(tableId, ids);
}
