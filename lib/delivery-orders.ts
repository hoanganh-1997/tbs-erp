"use server";
import { getRecords, getRecord, createRecord, updateRecord, deleteRecord, deleteRecords } from "@/lib/inforact-sdk";
import type { ListRecordsOptions, CreateTableField } from "@/lib/inforact-sdk";
import { ensureTable } from "@/lib/table-registry";

const TABLE_NAME = 'DeliveryOrders';
const TABLE_FIELDS: CreateTableField[] = [
  { name: 'DeliveryCode', type: 'TEXT' },
  { name: 'OrderId', type: 'TEXT' },
  { name: 'OrderCode', type: 'TEXT' },
  { name: 'CustomerId', type: 'TEXT' },
  { name: 'CustomerName', type: 'TEXT' },
  { name: 'DeliveryAddress', type: 'TEXT' },
  { name: 'ReceiverName', type: 'TEXT' },
  { name: 'ReceiverPhone', type: 'TEXT' },
  { name: 'ScheduledDate', type: 'DATE' },
  { name: 'TimeSlot', type: 'SINGLE_OPTION', options: [
    { name: 'Sáng (8-12h)' }, { name: 'Chiều (13-17h)' }, { name: 'Cả ngày' }
  ]},
  { name: 'Driver', type: 'TEXT' },
  { name: 'Vehicle', type: 'TEXT' },
  { name: 'Packages', type: 'NUMBER' },
  { name: 'Status', type: 'SINGLE_OPTION', options: [
    { name: 'Chờ xếp lịch' }, { name: 'Đã xếp lịch' }, { name: 'Đang giao' },
    { name: 'Đã giao' }, { name: 'Giao lỗi' }, { name: 'Trả lại' }
  ]},
  { name: 'CODAmount', type: 'NUMBER' },
  { name: 'CODCollected', type: 'NUMBER' },
  { name: 'CODSubmitted', type: 'CHECKBOX' },
  { name: 'FailureReason', type: 'TEXT' },
  { name: 'AssignedBy', type: 'TEXT' },
  { name: 'HasDocuments', type: 'CHECKBOX' },
];

let _tableId: string | null = null;
async function getTableId() {
  if (!_tableId) _tableId = await ensureTable(TABLE_NAME, TABLE_FIELDS);
  return _tableId;
}

export interface DeliveryOrder {
  id: string;
  DeliveryCode?: string;
  OrderId?: string;
  OrderCode?: string;
  CustomerId?: string;
  CustomerName?: string;
  DeliveryAddress?: string;
  ReceiverName?: string;
  ReceiverPhone?: string;
  ScheduledDate?: string;
  TimeSlot?: string;
  Driver?: string;
  Vehicle?: string;
  Packages?: number;
  Status?: string;
  CODAmount?: number;
  CODCollected?: number;
  CODSubmitted?: boolean;
  FailureReason?: string;
  AssignedBy?: string;
  HasDocuments?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateDeliveryOrderInput = Omit<DeliveryOrder, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateDeliveryOrderInput = Partial<CreateDeliveryOrderInput>;

function mapRecord(record: any): DeliveryOrder {
  return { id: record.id, ...record.fields, createdAt: record.createdAt, updatedAt: record.updatedAt };
}

export async function getDeliveryOrders(options?: ListRecordsOptions): Promise<{ data: DeliveryOrder[]; total: number }> {
  const tableId = await getTableId();
  const result = await getRecords(tableId, options);
  return { data: result.records.map(mapRecord), total: result.total };
}

export async function getDeliveryOrder(id: string): Promise<DeliveryOrder> {
  const tableId = await getTableId();
  return mapRecord(await getRecord(tableId, id));
}

export async function createDeliveryOrder(data: CreateDeliveryOrderInput): Promise<DeliveryOrder> {
  const tableId = await getTableId();
  return mapRecord(await createRecord(tableId, data as Record<string, any>));
}

export async function updateDeliveryOrder(id: string, data: UpdateDeliveryOrderInput): Promise<void> {
  const tableId = await getTableId();
  await updateRecord(tableId, id, data as Record<string, any>);
}

export async function deleteDeliveryOrder(id: string): Promise<void> {
  const tableId = await getTableId();
  await deleteRecord(tableId, id);
}

export async function deleteDeliveryOrders(ids: string[]): Promise<void> {
  const tableId = await getTableId();
  await deleteRecords(tableId, ids);
}
