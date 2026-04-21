"use server";
import { getRecords, getRecord, createRecord, updateRecord, deleteRecord, deleteRecords } from "@/lib/inforact-sdk";
import type { ListRecordsOptions, CreateTableField } from "@/lib/inforact-sdk";
import { ensureTable } from "@/lib/table-registry";

const TABLE_NAME = 'CustomsDeclarations';
const TABLE_FIELDS: CreateTableField[] = [
  { name: 'DeclarationCode', type: 'TEXT' },
  { name: 'ContainerId', type: 'TEXT' },
  { name: 'ContainerCode', type: 'TEXT' },
  { name: 'DeclarationType', type: 'SINGLE_OPTION', options: [
    { name: 'Chính ngạch (UTXNK)' },
    { name: 'LCL chính ngạch' },
  ]},
  { name: 'CustomsOffice', type: 'SINGLE_OPTION', options: [
    { name: 'Lạng Sơn' }, { name: 'Lào Cai' }, { name: 'Móng Cái' },
    { name: 'Hải Phòng' }, { name: 'Cát Lái' }, { name: 'Khác' },
  ]},
  { name: 'DeclarationNumber', type: 'TEXT' },
  { name: 'RegisterDate', type: 'DATE' },
  { name: 'ClearanceDate', type: 'DATE' },
  { name: 'TotalOrdersCount', type: 'NUMBER' },
  { name: 'TotalCBM', type: 'NUMBER' },
  { name: 'TotalWeightKg', type: 'NUMBER' },
  { name: 'TotalValueCNY', type: 'NUMBER' },
  { name: 'ImportTaxVND', type: 'NUMBER' },
  { name: 'VATAmount', type: 'NUMBER' },
  { name: 'SpecialTaxVND', type: 'NUMBER' },
  { name: 'CustomsFeesVND', type: 'NUMBER' },
  { name: 'TotalTaxVND', type: 'NUMBER' },
  { name: 'HSCodes', type: 'TEXT' },
  { name: 'DocumentStatus', type: 'SINGLE_OPTION', options: [
    { name: 'Thiếu chứng từ' }, { name: 'Đủ chứng từ' }, { name: 'Đã nộp HQ' },
  ]},
  { name: 'HasCO', type: 'CHECKBOX' },
  { name: 'HasInvoice', type: 'CHECKBOX' },
  { name: 'HasPackingList', type: 'CHECKBOX' },
  { name: 'HasBillOfLading', type: 'CHECKBOX' },
  { name: 'HasInsurance', type: 'CHECKBOX' },
  { name: 'Status', type: 'SINGLE_OPTION', options: [
    { name: 'Chuẩn bị hồ sơ' },
    { name: 'Đã nộp tờ khai' },
    { name: 'Chờ kiểm hóa' },
    { name: 'Đang kiểm hóa' },
    { name: 'Chờ nộp thuế' },
    { name: 'Đã nộp thuế' },
    { name: 'Đã thông quan' },
    { name: 'Bị giữ hàng' },
  ]},
  { name: 'InspectionType', type: 'SINGLE_OPTION', options: [
    { name: 'Luồng xanh' },
    { name: 'Luồng vàng' },
    { name: 'Luồng đỏ' },
  ]},
  { name: 'InspectionNotes', type: 'TEXT' },
  { name: 'BrokerId', type: 'TEXT' },
  { name: 'BrokerName', type: 'TEXT' },
  { name: 'XNKStaff', type: 'TEXT' },
  { name: 'Notes', type: 'TEXT' },
];

let _tableId: string | null = null;
async function getTableId() {
  if (!_tableId) _tableId = await ensureTable(TABLE_NAME, TABLE_FIELDS);
  return _tableId;
}

export interface CustomsDeclaration {
  id: string;
  DeclarationCode?: string;
  ContainerId?: string;
  ContainerCode?: string;
  DeclarationType?: string;
  CustomsOffice?: string;
  DeclarationNumber?: string;
  RegisterDate?: string;
  ClearanceDate?: string;
  TotalOrdersCount?: number;
  TotalCBM?: number;
  TotalWeightKg?: number;
  TotalValueCNY?: number;
  ImportTaxVND?: number;
  VATAmount?: number;
  SpecialTaxVND?: number;
  CustomsFeesVND?: number;
  TotalTaxVND?: number;
  HSCodes?: string;
  DocumentStatus?: string;
  HasCO?: boolean;
  HasInvoice?: boolean;
  HasPackingList?: boolean;
  HasBillOfLading?: boolean;
  HasInsurance?: boolean;
  Status?: string;
  InspectionType?: string;
  InspectionNotes?: string;
  BrokerId?: string;
  BrokerName?: string;
  XNKStaff?: string;
  Notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateCustomsDeclarationInput = Omit<CustomsDeclaration, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateCustomsDeclarationInput = Partial<CreateCustomsDeclarationInput>;

function mapRecord(record: any): CustomsDeclaration {
  return { id: record.id, ...record.fields, createdAt: record.createdAt, updatedAt: record.updatedAt };
}

export async function getCustomsDeclarations(options?: ListRecordsOptions): Promise<{ data: CustomsDeclaration[]; total: number }> {
  const tableId = await getTableId();
  const result = await getRecords(tableId, options);
  return { data: result.records.map(mapRecord), total: result.total };
}

export async function getCustomsDeclaration(id: string): Promise<CustomsDeclaration> {
  const tableId = await getTableId();
  return mapRecord(await getRecord(tableId, id));
}

export async function createCustomsDeclaration(data: CreateCustomsDeclarationInput): Promise<CustomsDeclaration> {
  const tableId = await getTableId();
  return mapRecord(await createRecord(tableId, data as Record<string, any>));
}

export async function updateCustomsDeclaration(id: string, data: UpdateCustomsDeclarationInput): Promise<void> {
  const tableId = await getTableId();
  await updateRecord(tableId, id, data as Record<string, any>);
}

export async function deleteCustomsDeclaration(id: string): Promise<void> {
  const tableId = await getTableId();
  await deleteRecord(tableId, id);
}

export async function deleteCustomsDeclarations(ids: string[]): Promise<void> {
  const tableId = await getTableId();
  await deleteRecords(tableId, ids);
}
