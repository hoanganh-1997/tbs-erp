"use server";
import { getRecords, getRecord, createRecord, updateRecord, deleteRecord, deleteRecords } from "@/lib/inforact-sdk";
import type { ListRecordsOptions, CreateTableField } from "@/lib/inforact-sdk";
import { ensureTable } from "@/lib/table-registry";

const TABLE_NAME = 'Vehicles';
const TABLE_FIELDS: CreateTableField[] = [
  { name: 'VehicleCode', type: 'TEXT' },
  { name: 'LicensePlate', type: 'TEXT' },
  { name: 'VehicleType', type: 'SINGLE_OPTION', options: [
    { name: 'Xe tải 1T' }, { name: 'Xe tải 2.5T' }, { name: 'Xe tải 5T' }, { name: 'Xe con' }
  ]},
  { name: 'Brand', type: 'TEXT' },
  { name: 'MaxWeight', type: 'NUMBER' },
  { name: 'MaxCBM', type: 'NUMBER' },
  { name: 'Status', type: 'SINGLE_OPTION', options: [
    { name: 'Sẵn sàng' }, { name: 'Đang sử dụng' }, { name: 'Bảo trì' }, { name: 'Ngưng hoạt động' }
  ]},
  { name: 'CurrentDriver', type: 'TEXT' },
  { name: 'InsuranceExpiry', type: 'DATE' },
  { name: 'MaintenanceDate', type: 'DATE' },
  { name: 'Notes', type: 'TEXT' },
];

let _tableId: string | null = null;
async function getTableId() {
  if (!_tableId) _tableId = await ensureTable(TABLE_NAME, TABLE_FIELDS);
  return _tableId;
}

export interface Vehicle {
  id: string;
  VehicleCode?: string;
  LicensePlate?: string;
  VehicleType?: string;
  Brand?: string;
  MaxWeight?: number;
  MaxCBM?: number;
  Status?: string;
  CurrentDriver?: string;
  InsuranceExpiry?: string;
  MaintenanceDate?: string;
  Notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateVehicleInput = Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateVehicleInput = Partial<CreateVehicleInput>;

function mapRecord(record: any): Vehicle {
  return { id: record.id, ...record.fields, createdAt: record.createdAt, updatedAt: record.updatedAt };
}

export async function getVehicles(options?: ListRecordsOptions): Promise<{ data: Vehicle[]; total: number }> {
  const tableId = await getTableId();
  const result = await getRecords(tableId, options);
  return { data: result.records.map(mapRecord), total: result.total };
}

export async function getVehicle(id: string): Promise<Vehicle> {
  const tableId = await getTableId();
  return mapRecord(await getRecord(tableId, id));
}

export async function createVehicle(data: CreateVehicleInput): Promise<Vehicle> {
  const tableId = await getTableId();
  return mapRecord(await createRecord(tableId, data as Record<string, any>));
}

export async function updateVehicle(id: string, data: UpdateVehicleInput): Promise<void> {
  const tableId = await getTableId();
  await updateRecord(tableId, id, data as Record<string, any>);
}

export async function deleteVehicle(id: string): Promise<void> {
  const tableId = await getTableId();
  await deleteRecord(tableId, id);
}

export async function deleteVehicles(ids: string[]): Promise<void> {
  const tableId = await getTableId();
  await deleteRecords(tableId, ids);
}
