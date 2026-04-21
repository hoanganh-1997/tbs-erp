"use server";
import { getRecords, getRecord, createRecord, updateRecord, deleteRecord, deleteRecords } from "@/lib/inforact-sdk";
import type { ListRecordsOptions, CreateTableField } from "@/lib/inforact-sdk";
import { ensureTable } from "@/lib/table-registry";

const TABLE_NAME = 'OrderItems';
const TABLE_FIELDS: CreateTableField[] = [
  { name: 'OrderId', type: 'TEXT' },
  { name: 'ProductName', type: 'TEXT' },
  { name: 'ProductLink', type: 'TEXT' },
  { name: 'SKU', type: 'TEXT' },
  { name: 'Attributes', type: 'TEXT' },
  { name: 'Quantity', type: 'NUMBER' },
  { name: 'QuantityReceivedCN', type: 'NUMBER' },
  { name: 'QuantityReceivedVN', type: 'NUMBER' },
  { name: 'QuantityDelivered', type: 'NUMBER' },
  { name: 'UnitPriceCNY', type: 'NUMBER' },
  { name: 'TotalCNY', type: 'NUMBER' },
  { name: 'HSCode', type: 'TEXT' },
  { name: 'SupplierId', type: 'TEXT' },
  { name: 'TrackingCN', type: 'TEXT' },
  { name: 'Status', type: 'SINGLE_OPTION', options: [
    { name: 'Chờ mua' }, { name: 'Đã đặt' }, { name: 'Đang SX' },
    { name: 'Đã về kho TQ' }, { name: 'Đã giao' }
  ]},
];

let _tableId: string | null = null;
async function getTableId() {
  if (!_tableId) _tableId = await ensureTable(TABLE_NAME, TABLE_FIELDS);
  return _tableId;
}

export interface OrderItem {
  id: string;
  OrderId?: string;
  ProductName?: string;
  ProductLink?: string;
  SKU?: string;
  Attributes?: string;
  Quantity?: number;
  QuantityReceivedCN?: number;
  QuantityReceivedVN?: number;
  QuantityDelivered?: number;
  UnitPriceCNY?: number;
  TotalCNY?: number;
  HSCode?: string;
  SupplierId?: string;
  TrackingCN?: string;
  Status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateOrderItemInput = Omit<OrderItem, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateOrderItemInput = Partial<CreateOrderItemInput>;

function mapRecord(record: any): OrderItem {
  return { id: record.id, ...record.fields, createdAt: record.createdAt, updatedAt: record.updatedAt };
}

export async function getOrderItems(options?: ListRecordsOptions): Promise<{ data: OrderItem[]; total: number }> {
  const tableId = await getTableId();
  const result = await getRecords(tableId, options);
  return { data: result.records.map(mapRecord), total: result.total };
}

export async function getOrderItem(id: string): Promise<OrderItem> {
  const tableId = await getTableId();
  return mapRecord(await getRecord(tableId, id));
}

export async function createOrderItem(data: CreateOrderItemInput): Promise<OrderItem> {
  const tableId = await getTableId();
  return mapRecord(await createRecord(tableId, data as Record<string, any>));
}

export async function updateOrderItem(id: string, data: UpdateOrderItemInput): Promise<void> {
  const tableId = await getTableId();
  await updateRecord(tableId, id, data as Record<string, any>);
}

export async function deleteOrderItem(id: string): Promise<void> {
  const tableId = await getTableId();
  await deleteRecord(tableId, id);
}

export async function deleteOrderItems(ids: string[]): Promise<void> {
  const tableId = await getTableId();
  await deleteRecords(tableId, ids);
}
