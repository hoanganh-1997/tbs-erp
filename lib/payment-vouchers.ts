"use server";
import { getRecords, getRecord, createRecord, updateRecord, deleteRecord, deleteRecords } from "@/lib/inforact-sdk";
import type { ListRecordsOptions, CreateTableField } from "@/lib/inforact-sdk";
import { listRecords, searchRecords, type AttachmentRef, type ComplexFilter } from "@/lib/inforact-sdk-ext";
import { ensureTable } from "@/lib/table-registry";

const TABLE_NAME = 'PaymentVouchers';
const TABLE_FIELDS: CreateTableField[] = [
  { name: 'VoucherCode', type: 'TEXT' },
  { name: 'Type', type: 'SINGLE_OPTION', options: [{ name: 'Phiếu thu' }, { name: 'Phiếu chi' }] },
  { name: 'OrderId', type: 'TEXT' },
  { name: 'OrderCode', type: 'TEXT' },
  { name: 'CustomerId', type: 'TEXT' },
  { name: 'CustomerName', type: 'TEXT' },
  { name: 'SupplierId', type: 'TEXT' },
  { name: 'SupplierName', type: 'TEXT' },
  { name: 'ExpenseType', type: 'SINGLE_OPTION', options: [
    { name: 'Cọc' }, { name: 'Thanh toán NCC' }, { name: 'Thuế NK' },
    { name: 'VAT' }, { name: 'Cước VC' }, { name: 'Phí cảng' },
    { name: 'Phí giao hàng' }, { name: 'Phát sinh' }, { name: 'Hoàn tiền' }, { name: 'COD' }
  ]},
  { name: 'Amount', type: 'NUMBER' },
  { name: 'Currency', type: 'SINGLE_OPTION', options: [{ name: 'VND' }, { name: 'CNY' }, { name: 'USD' }] },
  { name: 'ExchangeRate', type: 'NUMBER' },
  { name: 'Beneficiary', type: 'TEXT' },
  { name: 'Reason', type: 'TEXT' },
  { name: 'Status', type: 'SINGLE_OPTION', options: [
    { name: 'Nháp' }, { name: 'Chờ KT duyệt' }, { name: 'KT đã duyệt' },
    { name: 'Chờ BGĐ chi' }, { name: 'Đã chi' }, { name: 'Từ chối' }
  ]},
  { name: 'IsFlagged', type: 'CHECKBOX' },
  { name: 'FlagReason', type: 'TEXT' },
  { name: 'CreatedBy', type: 'TEXT' },
  { name: 'ApprovedByKT', type: 'TEXT' },
  { name: 'ApprovedByMgmt', type: 'TEXT' },
  { name: 'Attachments', type: 'ATTACHMENT' },
];

let _tableId: string | null = null;
async function getTableId() {
  if (!_tableId) _tableId = await ensureTable(TABLE_NAME, TABLE_FIELDS);
  return _tableId;
}

export interface PaymentVoucher {
  id: string;
  VoucherCode?: string;
  Type?: string;
  OrderId?: string;
  OrderCode?: string;
  CustomerId?: string;
  CustomerName?: string;
  SupplierId?: string;
  SupplierName?: string;
  ExpenseType?: string;
  Amount?: number;
  Currency?: string;
  ExchangeRate?: number;
  Beneficiary?: string;
  Reason?: string;
  Status?: string;
  IsFlagged?: boolean;
  FlagReason?: string;
  CreatedBy?: string;
  ApprovedByKT?: string;
  ApprovedByMgmt?: string;
  Attachments?: AttachmentRef[];
  createdAt?: string;
  updatedAt?: string;
}

export type CreatePaymentVoucherInput = Omit<PaymentVoucher, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdatePaymentVoucherInput = Partial<CreatePaymentVoucherInput>;

function mapRecord(record: any): PaymentVoucher {
  return { id: record.id, ...record.fields, createdAt: record.createdAt, updatedAt: record.updatedAt };
}

export async function getPaymentVouchers(options?: ListRecordsOptions): Promise<{ data: PaymentVoucher[]; total: number }> {
  const tableId = await getTableId();
  const result = await getRecords(tableId, options);
  return { data: result.records.map(mapRecord), total: result.total };
}

export interface ListPaymentVouchersOptions {
  filters?: ComplexFilter;
  sort?: { field: string; direction: 'asc' | 'desc' }[];
  skip?: number;
  take?: number;
}

export async function listPaymentVouchers(options: ListPaymentVouchersOptions = {}): Promise<{ data: PaymentVoucher[]; total: number }> {
  const tableId = await getTableId();
  const result = await listRecords(tableId, options);
  return { data: result.records.map(mapRecord), total: result.total };
}

export async function searchPaymentVouchers(query: string, filters?: ComplexFilter, extra?: { skip?: number; take?: number }): Promise<{ data: PaymentVoucher[]; total: number }> {
  const tableId = await getTableId();
  const result = await searchRecords(tableId, {
    query,
    fields: ['VoucherCode', 'Beneficiary', 'Description', 'Notes'],
    filters,
    skip: extra?.skip,
    take: extra?.take,
  });
  return { data: result.records.map(mapRecord), total: result.total };
}

export async function getPaymentVoucher(id: string): Promise<PaymentVoucher> {
  const tableId = await getTableId();
  return mapRecord(await getRecord(tableId, id));
}

export async function createPaymentVoucher(data: CreatePaymentVoucherInput): Promise<PaymentVoucher> {
  const tableId = await getTableId();
  return mapRecord(await createRecord(tableId, data as Record<string, any>));
}

export async function updatePaymentVoucher(id: string, data: UpdatePaymentVoucherInput): Promise<void> {
  const tableId = await getTableId();
  await updateRecord(tableId, id, data as Record<string, any>);
}

export async function deletePaymentVoucher(id: string): Promise<void> {
  const tableId = await getTableId();
  await deleteRecord(tableId, id);
}

export async function deletePaymentVouchers(ids: string[]): Promise<void> {
  const tableId = await getTableId();
  await deleteRecords(tableId, ids);
}
