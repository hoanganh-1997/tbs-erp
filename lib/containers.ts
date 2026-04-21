"use server";
import { getRecords, getRecord, createRecord, updateRecord, deleteRecord, deleteRecords } from "@/lib/inforact-sdk";
import type { ListRecordsOptions, CreateTableField } from "@/lib/inforact-sdk";
import { ensureTable } from "@/lib/table-registry";

const TABLE_NAME = 'Containers';
const TABLE_FIELDS: CreateTableField[] = [
  { name: 'ContainerCode', type: 'TEXT' },
  { name: 'ContainerType', type: 'SINGLE_OPTION', options: [
    { name: '20ft' }, { name: '40ft' }, { name: '40ft HC' }, { name: 'Xe tải' }
  ]},
  { name: 'Route', type: 'SINGLE_OPTION', options: [
    { name: 'Đường biển' }, { name: 'Đường bộ' }
  ]},
  { name: 'CarrierId', type: 'TEXT' },
  { name: 'CarrierName', type: 'TEXT' },
  { name: 'VesselCode', type: 'TEXT' },
  { name: 'SealNumber', type: 'TEXT' },
  { name: 'BookingDate', type: 'DATE' },
  { name: 'ETD', type: 'DATE' },
  { name: 'ETA', type: 'DATE' },
  { name: 'ActualDeparture', type: 'DATE' },
  { name: 'ActualArrival', type: 'DATE' },
  { name: 'DestinationWarehouse', type: 'SINGLE_OPTION', options: [
    { name: 'Đông Anh (HN)' }, { name: 'Hóc Môn (HCM)' }
  ]},
  { name: 'TotalCBM', type: 'NUMBER' },
  { name: 'MaxCBM', type: 'NUMBER' },
  { name: 'FillRate', type: 'NUMBER' },
  { name: 'TotalPackages', type: 'NUMBER' },
  { name: 'Status', type: 'SINGLE_OPTION', options: [
    { name: 'Lập kế hoạch' }, { name: 'Đặt chỗ' }, { name: 'Đang xếp' },
    { name: 'Đã đóng' }, { name: 'Đang vận chuyển' }, { name: 'Tại biên giới' },
    { name: 'Hải quan' }, { name: 'Đã thông quan' }, { name: 'Đã về kho' },
    { name: 'Đang dỡ' }, { name: 'Hoàn tất' }
  ]},
  { name: 'CreatedBy', type: 'TEXT' },
  { name: 'ApprovedBy', type: 'TEXT' },
];

let _tableId: string | null = null;
async function getTableId() {
  if (!_tableId) _tableId = await ensureTable(TABLE_NAME, TABLE_FIELDS);
  return _tableId;
}

export interface Container {
  id: string;
  ContainerCode?: string;
  ContainerType?: string;
  Route?: string;
  CarrierId?: string;
  CarrierName?: string;
  VesselCode?: string;
  SealNumber?: string;
  BookingDate?: string;
  ETD?: string;
  ETA?: string;
  ActualDeparture?: string;
  ActualArrival?: string;
  DestinationWarehouse?: string;
  TotalCBM?: number;
  MaxCBM?: number;
  FillRate?: number;
  TotalPackages?: number;
  Status?: string;
  CreatedBy?: string;
  ApprovedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateContainerInput = Omit<Container, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateContainerInput = Partial<CreateContainerInput>;

function mapRecord(record: any): Container {
  return { id: record.id, ...record.fields, createdAt: record.createdAt, updatedAt: record.updatedAt };
}

export async function getContainers(options?: ListRecordsOptions): Promise<{ data: Container[]; total: number }> {
  const tableId = await getTableId();
  const result = await getRecords(tableId, options);
  return { data: result.records.map(mapRecord), total: result.total };
}

export async function getContainer(id: string): Promise<Container> {
  const tableId = await getTableId();
  return mapRecord(await getRecord(tableId, id));
}

export async function createContainer(data: CreateContainerInput): Promise<Container> {
  const tableId = await getTableId();
  return mapRecord(await createRecord(tableId, data as Record<string, any>));
}

export async function updateContainer(id: string, data: UpdateContainerInput): Promise<void> {
  const tableId = await getTableId();
  await updateRecord(tableId, id, data as Record<string, any>);
}

export async function deleteContainer(id: string): Promise<void> {
  const tableId = await getTableId();
  await deleteRecord(tableId, id);
}

export async function deleteContainers(ids: string[]): Promise<void> {
  const tableId = await getTableId();
  await deleteRecords(tableId, ids);
}
