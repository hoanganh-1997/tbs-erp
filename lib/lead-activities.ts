"use server";
import { getRecords, getRecord, createRecord, updateRecord, deleteRecord, deleteRecords } from "@/lib/inforact-sdk";
import type { ListRecordsOptions, CreateTableField } from "@/lib/inforact-sdk";
import { ensureTable } from "@/lib/table-registry";

const TABLE_NAME = 'LeadActivities';
const TABLE_FIELDS: CreateTableField[] = [
  { name: 'LeadId', type: 'TEXT' },
  { name: 'ActivityType', type: 'SINGLE_OPTION', options: [
    { name: 'Gọi điện' }, { name: 'Zalo' }, { name: 'Email' },
    { name: 'Gặp mặt' }, { name: 'Ghi chú' }
  ]},
  { name: 'Content', type: 'TEXT' },
  { name: 'Result', type: 'TEXT' },
  { name: 'CreatedBy', type: 'TEXT' },
];

let _tableId: string | null = null;
async function getTableId() {
  if (!_tableId) _tableId = await ensureTable(TABLE_NAME, TABLE_FIELDS);
  return _tableId;
}

export interface LeadActivity {
  id: string;
  LeadId?: string;
  ActivityType?: string;
  Content?: string;
  Result?: string;
  CreatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateLeadActivityInput = Omit<LeadActivity, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateLeadActivityInput = Partial<CreateLeadActivityInput>;

function mapRecord(record: any): LeadActivity {
  return { id: record.id, ...record.fields, createdAt: record.createdAt, updatedAt: record.updatedAt };
}

export async function getLeadActivities(options?: ListRecordsOptions): Promise<{ data: LeadActivity[]; total: number }> {
  const tableId = await getTableId();
  const result = await getRecords(tableId, options);
  return { data: result.records.map(mapRecord), total: result.total };
}

export async function getLeadActivity(id: string): Promise<LeadActivity> {
  const tableId = await getTableId();
  return mapRecord(await getRecord(tableId, id));
}

export async function createLeadActivity(data: CreateLeadActivityInput): Promise<LeadActivity> {
  const tableId = await getTableId();
  return mapRecord(await createRecord(tableId, data as Record<string, any>));
}

export async function updateLeadActivity(id: string, data: UpdateLeadActivityInput): Promise<void> {
  const tableId = await getTableId();
  await updateRecord(tableId, id, data as Record<string, any>);
}

export async function deleteLeadActivity(id: string): Promise<void> {
  const tableId = await getTableId();
  await deleteRecord(tableId, id);
}
