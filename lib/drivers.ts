"use server";
import { getRecords, getRecord, createRecord, updateRecord, deleteRecord, deleteRecords } from "@/lib/inforact-sdk";
import type { ListRecordsOptions, CreateTableField } from "@/lib/inforact-sdk";
import { ensureTable } from "@/lib/table-registry";

const TABLE_NAME = 'Drivers';
const TABLE_FIELDS: CreateTableField[] = [
  { name: 'DriverCode', type: 'TEXT' },
  { name: 'FullName', type: 'TEXT' },
  { name: 'Phone', type: 'TEXT' },
  { name: 'LicenseNumber', type: 'TEXT' },
  { name: 'LicenseExpiry', type: 'DATE' },
  { name: 'AssignedVehicle', type: 'TEXT' },
  { name: 'AssignedVehicleId', type: 'TEXT' },
  { name: 'Status', type: 'SINGLE_OPTION', options: [
    { name: 'Đang hoạt động' }, { name: 'Nghỉ phép' }, { name: 'Nghỉ việc' }
  ]},
  { name: 'TodayDeliveries', type: 'NUMBER' },
  { name: 'TotalDeliveries', type: 'NUMBER' },
  { name: 'Notes', type: 'TEXT' },
];

let _tableId: string | null = null;
async function getTableId() {
  if (!_tableId) _tableId = await ensureTable(TABLE_NAME, TABLE_FIELDS);
  return _tableId;
}

export interface Driver {
  id: string;
  DriverCode?: string;
  FullName?: string;
  Phone?: string;
  LicenseNumber?: string;
  LicenseExpiry?: string;
  AssignedVehicle?: string;
  AssignedVehicleId?: string;
  Status?: string;
  TodayDeliveries?: number;
  TotalDeliveries?: number;
  Notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateDriverInput = Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateDriverInput = Partial<CreateDriverInput>;

function mapRecord(record: any): Driver {
  return { id: record.id, ...record.fields, createdAt: record.createdAt, updatedAt: record.updatedAt };
}

export async function getDrivers(options?: ListRecordsOptions): Promise<{ data: Driver[]; total: number }> {
  const tableId = await getTableId();
  const result = await getRecords(tableId, options);
  return { data: result.records.map(mapRecord), total: result.total };
}

export async function getDriver(id: string): Promise<Driver> {
  const tableId = await getTableId();
  return mapRecord(await getRecord(tableId, id));
}

export async function createDriver(data: CreateDriverInput): Promise<Driver> {
  const tableId = await getTableId();
  return mapRecord(await createRecord(tableId, data as Record<string, any>));
}

export async function updateDriver(id: string, data: UpdateDriverInput): Promise<void> {
  const tableId = await getTableId();
  await updateRecord(tableId, id, data as Record<string, any>);
}

export async function deleteDriver(id: string): Promise<void> {
  const tableId = await getTableId();
  await deleteRecord(tableId, id);
}

export async function deleteDrivers(ids: string[]): Promise<void> {
  const tableId = await getTableId();
  await deleteRecords(tableId, ids);
}
