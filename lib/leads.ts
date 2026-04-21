"use server";
import { getRecords, getRecord, createRecord, updateRecord, deleteRecord, deleteRecords } from "@/lib/inforact-sdk";
import type { ListRecordsOptions, CreateTableField } from "@/lib/inforact-sdk";
import { ensureTable } from "@/lib/table-registry";

const TABLE_NAME = 'Leads';
const TABLE_FIELDS: CreateTableField[] = [
  { name: 'LeadCode', type: 'TEXT' },
  { name: 'Phone', type: 'TEXT' },
  { name: 'FullName', type: 'TEXT' },
  { name: 'Source', type: 'SINGLE_OPTION', options: [
    { name: 'Facebook' }, { name: 'TikTok' }, { name: 'Website' },
    { name: 'Zalo' }, { name: 'Giới thiệu' }, { name: 'Khác' }
  ]},
  { name: 'Rating', type: 'SINGLE_OPTION', options: [
    { name: 'Nóng' }, { name: 'Ấm' }, { name: 'Lạnh' }, { name: 'Xấu' }
  ]},
  { name: 'Needs', type: 'TEXT' },
  { name: 'Status', type: 'SINGLE_OPTION', options: [
    { name: 'Mới' }, { name: 'Đang khai thác' }, { name: 'Đã giao Sale' },
    { name: 'Đang tư vấn' }, { name: 'Đã báo giá' },
    { name: 'Thành KH' }, { name: 'Thất bại' }
  ]},
  { name: 'MarketingOwner', type: 'TEXT' },
  { name: 'CSKHOwner', type: 'TEXT' },
  { name: 'SaleOwner', type: 'TEXT' },
  { name: 'LeaderName', type: 'TEXT' },
  { name: 'Branch', type: 'SINGLE_OPTION', options: [{ name: 'HN' }, { name: 'HCM' }] },
  { name: 'FailureReason', type: 'TEXT' },
  { name: 'ConvertedCustomerId', type: 'TEXT' },
];

let _tableId: string | null = null;
async function getTableId() {
  if (!_tableId) _tableId = await ensureTable(TABLE_NAME, TABLE_FIELDS);
  return _tableId;
}

export interface Lead {
  id: string;
  LeadCode?: string;
  Phone?: string;
  FullName?: string;
  Source?: string;
  Rating?: string;
  Needs?: string;
  Status?: string;
  MarketingOwner?: string;
  CSKHOwner?: string;
  SaleOwner?: string;
  LeaderName?: string;
  Branch?: string;
  FailureReason?: string;
  ConvertedCustomerId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateLeadInput = Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateLeadInput = Partial<CreateLeadInput>;

function mapRecord(record: any): Lead {
  return { id: record.id, ...record.fields, createdAt: record.createdAt, updatedAt: record.updatedAt };
}

export async function getLeads(options?: ListRecordsOptions): Promise<{ data: Lead[]; total: number }> {
  const tableId = await getTableId();
  const result = await getRecords(tableId, options);
  return { data: result.records.map(mapRecord), total: result.total };
}

export async function getLead(id: string): Promise<Lead> {
  const tableId = await getTableId();
  const record = await getRecord(tableId, id);
  return mapRecord(record);
}

export async function createLead(data: CreateLeadInput): Promise<Lead> {
  const tableId = await getTableId();
  const record = await createRecord(tableId, data as Record<string, any>);
  return mapRecord(record);
}

export async function updateLead(id: string, data: UpdateLeadInput): Promise<void> {
  const tableId = await getTableId();
  await updateRecord(tableId, id, data as Record<string, any>);
}

export async function deleteLead(id: string): Promise<void> {
  const tableId = await getTableId();
  await deleteRecord(tableId, id);
}

export async function deleteLeads(ids: string[]): Promise<void> {
  const tableId = await getTableId();
  await deleteRecords(tableId, ids);
}
