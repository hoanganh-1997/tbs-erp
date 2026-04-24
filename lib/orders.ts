"use server";
import { getRecords, getRecord, createRecord, updateRecord, deleteRecord, deleteRecords } from "@/lib/inforact-sdk";
import type { ListRecordsOptions, CreateTableField } from "@/lib/inforact-sdk";
import { listRecords, searchRecords, type ComplexFilter } from "@/lib/inforact-sdk";
import { ensureTable } from "@/lib/table-registry";
import { COMMISSION_RATE } from "@/lib/constants";

const TABLE_NAME = 'Orders';
const TABLE_FIELDS: CreateTableField[] = [
  { name: 'OrderCode', type: 'TEXT' },
  { name: 'QuotationId', type: 'TEXT' },
  { name: 'CustomerId', type: 'TEXT' },
  { name: 'CustomerName', type: 'TEXT' },
  { name: 'CompanyName', type: 'TEXT' },
  { name: 'ServiceTypes', type: 'MULTIPLE_OPTIONS', options: [
    { name: 'VCT' }, { name: 'MHH' }, { name: 'UTXNK' }, { name: 'LCLCN' }
  ]},
  { name: 'Status', type: 'SINGLE_OPTION', options: [
    { name: 'Nháp' }, { name: 'Chờ duyệt' }, { name: 'Đã xác nhận' },
    { name: 'Đang tìm hàng' }, { name: 'Đã đặt hàng' },
    { name: 'Tại kho TQ' }, { name: 'Trong container' },
    { name: 'Đang vận chuyển' }, { name: 'Tại cửa khẩu' },
    { name: 'Đang thông quan' }, { name: 'Tại kho VN' },
    { name: 'Đang giao' }, { name: 'Đã giao' }, { name: 'Hoàn thành' },
    { name: 'Đã hủy' }, { name: 'Tạm giữ' }
  ]},
  { name: 'StageNumber', type: 'NUMBER' },
  { name: 'Branch', type: 'SINGLE_OPTION', options: [{ name: 'HN' }, { name: 'HCM' }] },
  { name: 'SaleOwner', type: 'TEXT' },
  { name: 'LeaderName', type: 'TEXT' },
  { name: 'ItemsTotalCNY', type: 'NUMBER' },
  { name: 'ServiceFeeVND', type: 'NUMBER' },
  { name: 'ShippingFeeVND', type: 'NUMBER' },
  { name: 'TaxVND', type: 'NUMBER' },
  { name: 'TotalVND', type: 'NUMBER' },
  { name: 'ExchangeRate', type: 'NUMBER' },
  { name: 'DepositRequired', type: 'NUMBER' },
  { name: 'DepositPaid', type: 'NUMBER' },
  { name: 'DepositStatus', type: 'SINGLE_OPTION', options: [
    { name: 'Chưa cọc' }, { name: 'Đang chờ' }, { name: 'Đủ cọc' }, { name: 'Miễn cọc' }
  ]},
  { name: 'TotalPaid', type: 'NUMBER' },
  { name: 'PaymentStatus', type: 'SINGLE_OPTION', options: [
    { name: 'Chưa TT' }, { name: 'Cọc' }, { name: 'TT một phần' }, { name: 'TT đủ' }, { name: 'Quá hạn' }
  ]},
  { name: 'DeliveryAddress', type: 'TEXT' },
  { name: 'ReceiverName', type: 'TEXT' },
  { name: 'ReceiverPhone', type: 'TEXT' },
  { name: 'EstimatedDelivery', type: 'DATE' },
  { name: 'ActualDelivery', type: 'DATE' },
  { name: 'ProfitVND', type: 'NUMBER' },
  { name: 'ProfitMargin', type: 'NUMBER' },
  { name: 'CommissionVND', type: 'NUMBER' },
  { name: 'Priority', type: 'SINGLE_OPTION', options: [
    { name: 'Thường' }, { name: 'Gấp' }, { name: 'VIP' }
  ]},
  { name: 'Notes', type: 'TEXT' },
  { name: 'CancelReason', type: 'TEXT' },
  { name: 'SubOrderCount', type: 'NUMBER' },
];

let _tableId: string | null = null;
async function getTableId() {
  if (!_tableId) _tableId = await ensureTable(TABLE_NAME, TABLE_FIELDS);
  return _tableId;
}

export interface Order {
  id: string;
  OrderCode?: string;
  QuotationId?: string;
  CustomerId?: string;
  CustomerName?: string;
  CompanyName?: string;
  ServiceTypes?: string[];
  Status?: string;
  StageNumber?: number;
  Branch?: string;
  SaleOwner?: string;
  LeaderName?: string;
  ItemsTotalCNY?: number;
  ServiceFeeVND?: number;
  ShippingFeeVND?: number;
  TaxVND?: number;
  TotalVND?: number;
  ExchangeRate?: number;
  DepositRequired?: number;
  DepositPaid?: number;
  DepositStatus?: string;
  TotalPaid?: number;
  PaymentStatus?: string;
  DeliveryAddress?: string;
  ReceiverName?: string;
  ReceiverPhone?: string;
  EstimatedDelivery?: string;
  ActualDelivery?: string;
  ProfitVND?: number;
  ProfitMargin?: number;
  CommissionVND?: number;
  Priority?: string;
  Notes?: string;
  CancelReason?: string;
  SubOrderCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateOrderInput = Omit<Order, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateOrderInput = Partial<CreateOrderInput>;

function mapRecord(record: any): Order {
  return { id: record.id, ...record.fields, createdAt: record.createdAt, updatedAt: record.updatedAt };
}

export async function getOrders(options?: ListRecordsOptions): Promise<{ data: Order[]; total: number }> {
  const tableId = await getTableId();
  const result = await getRecords(tableId, options);
  return { data: result.records.map(mapRecord), total: result.total };
}

export interface ListOrdersOptions {
  filters?: ComplexFilter;
  sort?: { field: string; direction: 'asc' | 'desc' }[];
  skip?: number;
  take?: number;
}

export async function listOrders(options: ListOrdersOptions = {}): Promise<{ data: Order[]; total: number }> {
  const tableId = await getTableId();
  const result = await listRecords(tableId, options);
  return { data: result.records.map(mapRecord), total: result.total };
}

export async function searchOrders(query: string, filters?: ComplexFilter, extra?: { skip?: number; take?: number }): Promise<{ data: Order[]; total: number }> {
  const tableId = await getTableId();
  const result = await searchRecords(tableId, {
    query,
    fields: ['OrderCode', 'CustomerName', 'CompanyName', 'SaleOwner', 'Notes'],
    filters,
    skip: extra?.skip,
    take: extra?.take,
  });
  return { data: result.records.map(mapRecord), total: result.total };
}

export async function getOrder(id: string): Promise<Order> {
  const tableId = await getTableId();
  return mapRecord(await getRecord(tableId, id));
}

const PROFIT_INPUT_FIELDS = [
  'TotalVND',
  'ItemsTotalCNY',
  'ExchangeRate',
  'ServiceFeeVND',
  'ShippingFeeVND',
  'TaxVND',
] as const;

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function computeDerivedFields(fields: Record<string, any>): {
  ProfitVND: number;
  ProfitMargin: number;
  CommissionVND: number;
} {
  const totalVND = num(fields.TotalVND);
  const cogs = num(fields.ItemsTotalCNY) * num(fields.ExchangeRate);
  const costs = cogs + num(fields.ServiceFeeVND) + num(fields.ShippingFeeVND) + num(fields.TaxVND);
  const profitVND = totalVND - costs;
  const commissionVND = Math.max(0, profitVND * COMMISSION_RATE);
  const profitMargin = totalVND > 0 ? (profitVND / totalVND) * 100 : 0;
  return {
    ProfitVND: profitVND,
    ProfitMargin: profitMargin,
    CommissionVND: commissionVND,
  };
}

export async function createOrder(data: CreateOrderInput): Promise<Order> {
  const tableId = await getTableId();
  const payload: Record<string, any> = { ...(data as Record<string, any>) };
  Object.assign(payload, computeDerivedFields(payload));
  return mapRecord(await createRecord(tableId, payload));
}

export async function updateOrder(id: string, data: UpdateOrderInput): Promise<void> {
  const tableId = await getTableId();
  const payload: Record<string, any> = { ...(data as Record<string, any>) };
  const touchesProfitInputs = PROFIT_INPUT_FIELDS.some(f => f in payload);
  if (touchesProfitInputs) {
    const current = await getRecord(tableId, id);
    const merged = { ...current.fields, ...payload };
    Object.assign(payload, computeDerivedFields(merged));
  }
  await updateRecord(tableId, id, payload);
}

export async function deleteOrder(id: string): Promise<void> {
  const tableId = await getTableId();
  await deleteRecord(tableId, id);
}

export async function deleteOrders(ids: string[]): Promise<void> {
  const tableId = await getTableId();
  await deleteRecords(tableId, ids);
}
