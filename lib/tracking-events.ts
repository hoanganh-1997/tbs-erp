"use server";
import { getRecords, getRecord, createRecord, deleteRecord, deleteRecords } from "@/lib/inforact-sdk";
import type { ListRecordsOptions, CreateTableField } from "@/lib/inforact-sdk";
import { ensureTable } from "@/lib/table-registry";

const TABLE_NAME = 'TrackingEvents';
const TABLE_FIELDS: CreateTableField[] = [
  { name: 'OrderId', type: 'TEXT' },
  { name: 'OrderCode', type: 'TEXT' },
  { name: 'ContainerId', type: 'TEXT' },
  { name: 'ContainerCode', type: 'TEXT' },
  { name: 'EventType', type: 'SINGLE_OPTION', options: [
    { name: 'Tạo đơn' },
    { name: 'Đã báo giá' },
    { name: 'Đã cọc' },
    { name: 'Đã mua hàng' },
    { name: 'Nhập kho TQ' },
    { name: 'Đóng container' },
    { name: 'Xuất kho TQ' },
    { name: 'Đang vận chuyển' },
    { name: 'Tại biên giới' },
    { name: 'Đã nộp tờ khai' },
    { name: 'Đang kiểm hóa' },
    { name: 'Đã thông quan' },
    { name: 'Về kho VN' },
    { name: 'Đã kiểm hàng' },
    { name: 'Lên kệ' },
    { name: 'Đang giao' },
    { name: 'Đã giao' },
    { name: 'Hoàn thành' },
    { name: 'Sự cố' },
    { name: 'Ghi chú' },
  ]},
  { name: 'Description', type: 'TEXT' },
  { name: 'Location', type: 'TEXT' },
  { name: 'Actor', type: 'TEXT' },
  { name: 'Metadata', type: 'TEXT' },
];

let _tableId: string | null = null;
async function getTableId() {
  if (!_tableId) _tableId = await ensureTable(TABLE_NAME, TABLE_FIELDS);
  return _tableId;
}

export interface TrackingEvent {
  id: string;
  OrderId?: string;
  OrderCode?: string;
  ContainerId?: string;
  ContainerCode?: string;
  EventType?: string;
  Description?: string;
  Location?: string;
  Actor?: string;
  Metadata?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateTrackingEventInput = Omit<TrackingEvent, 'id' | 'createdAt' | 'updatedAt'>;

function mapRecord(record: any): TrackingEvent {
  return { id: record.id, ...record.fields, createdAt: record.createdAt, updatedAt: record.updatedAt };
}

export async function getTrackingEvents(options?: ListRecordsOptions): Promise<{ data: TrackingEvent[]; total: number }> {
  const tableId = await getTableId();
  const result = await getRecords(tableId, options);
  return { data: result.records.map(mapRecord), total: result.total };
}

export async function getTrackingEvent(id: string): Promise<TrackingEvent> {
  const tableId = await getTableId();
  return mapRecord(await getRecord(tableId, id));
}

export async function createTrackingEvent(data: CreateTrackingEventInput): Promise<TrackingEvent> {
  const tableId = await getTableId();
  return mapRecord(await createRecord(tableId, data as Record<string, any>));
}

export async function deleteTrackingEvent(id: string): Promise<void> {
  const tableId = await getTableId();
  await deleteRecord(tableId, id);
}

export async function deleteTrackingEvents(ids: string[]): Promise<void> {
  const tableId = await getTableId();
  await deleteRecords(tableId, ids);
}
