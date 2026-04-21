"use server";
import { getRecords, getRecord, createRecord, updateRecord, deleteRecord, deleteRecords } from "@/lib/inforact-sdk";
import type { ListRecordsOptions, CreateTableField } from "@/lib/inforact-sdk";
import { ensureTable } from "@/lib/table-registry";

const TABLE_NAME = 'Customers';
const TABLE_FIELDS: CreateTableField[] = [
  { name: 'CustomerCode', type: 'TEXT' },
  { name: 'CompanyName', type: 'TEXT' },
  { name: 'ContactName', type: 'TEXT' },
  { name: 'Phone', type: 'TEXT' },
  { name: 'Email', type: 'TEXT' },
  { name: 'Address', type: 'TEXT' },
  { name: 'DeliveryAddress', type: 'TEXT' },
  { name: 'ReceiverName', type: 'TEXT' },
  { name: 'ReceiverPhone', type: 'TEXT' },
  { name: 'TaxCode', type: 'TEXT' },
  { name: 'Tier', type: 'SINGLE_OPTION', options: [
    { name: 'Prospect' }, { name: 'Active' }, { name: 'VIP' },
    { name: 'Inactive' }, { name: 'Blacklist' }
  ]},
  { name: 'DepositRate', type: 'NUMBER' },
  { name: 'CreditLimit', type: 'NUMBER' },
  { name: 'VNDBalance', type: 'NUMBER' },
  { name: 'CNYBalance', type: 'NUMBER' },
  { name: 'SaleOwner', type: 'TEXT' },
  { name: 'LeaderName', type: 'TEXT' },
  { name: 'Branch', type: 'SINGLE_OPTION', options: [{ name: 'HN' }, { name: 'HCM' }] },
  { name: 'HasXNKLicense', type: 'CHECKBOX' },
  { name: 'SourceLeadId', type: 'TEXT' },
  { name: 'Notes', type: 'TEXT' },
];

let _tableId: string | null = null;
async function getTableId() {
  if (!_tableId) _tableId = await ensureTable(TABLE_NAME, TABLE_FIELDS);
  return _tableId;
}

export interface Customer {
  id: string;
  CustomerCode?: string;
  CompanyName?: string;
  ContactName?: string;
  Phone?: string;
  Email?: string;
  Address?: string;
  DeliveryAddress?: string;
  ReceiverName?: string;
  ReceiverPhone?: string;
  TaxCode?: string;
  Tier?: string;
  DepositRate?: number;
  CreditLimit?: number;
  VNDBalance?: number;
  CNYBalance?: number;
  SaleOwner?: string;
  LeaderName?: string;
  Branch?: string;
  HasXNKLicense?: boolean;
  SourceLeadId?: string;
  Notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateCustomerInput = Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateCustomerInput = Partial<CreateCustomerInput>;

function mapRecord(record: any): Customer {
  return { id: record.id, ...record.fields, createdAt: record.createdAt, updatedAt: record.updatedAt };
}

export async function getCustomers(options?: ListRecordsOptions): Promise<{ data: Customer[]; total: number }> {
  const tableId = await getTableId();
  const result = await getRecords(tableId, options);
  return { data: result.records.map(mapRecord), total: result.total };
}

export async function getCustomer(id: string): Promise<Customer> {
  const tableId = await getTableId();
  return mapRecord(await getRecord(tableId, id));
}

export async function createCustomer(data: CreateCustomerInput): Promise<Customer> {
  const tableId = await getTableId();
  return mapRecord(await createRecord(tableId, data as Record<string, any>));
}

export async function updateCustomer(id: string, data: UpdateCustomerInput): Promise<void> {
  const tableId = await getTableId();
  await updateRecord(tableId, id, data as Record<string, any>);
}

export async function deleteCustomer(id: string): Promise<void> {
  const tableId = await getTableId();
  await deleteRecord(tableId, id);
}

export async function deleteCustomers(ids: string[]): Promise<void> {
  const tableId = await getTableId();
  await deleteRecords(tableId, ids);
}
