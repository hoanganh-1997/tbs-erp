// Shared helpers for list pages that previously paginated with `take: 200`
// and filtered client-side. These wrap the new SDK iterator + complex filters
// so each module's lib/<table>.ts can expose a single high-level list fn.

import type { ListRecordsOptions } from "./inforact-sdk";
import {
  listRecords,
  collectRecords,
  iterateRecords,
  searchRecords,
  type ComplexFilter,
  type ListRecordsExtOptions,
} from "./inforact-sdk";

export interface ListAllOptions extends Omit<ListRecordsExtOptions, "skip" | "take"> {
  maxRecords?: number;
  pageSize?: number;
}

/**
 * Drain all records matching the filter via async iteration. Prefer this over
 * `getRecords({ take: 200 })` when:
 *   - dataset may grow past 200
 *   - filtering/sorting is already expressible server-side (no client fallback needed)
 *
 * Default cap 5000 to prevent runaway fetches on misfiltered queries.
 */
export async function listAllRecords<T>(
  tableId: string,
  mapRecord: (r: any) => T,
  options?: ListAllOptions,
): Promise<T[]> {
  const records = await collectRecords(tableId, {
    ...options,
    pageSize: options?.pageSize ?? 500,
    maxRecords: options?.maxRecords ?? 5000,
  });
  return records.map(mapRecord);
}

export async function pageRecords<T>(
  tableId: string,
  mapRecord: (r: any) => T,
  options?: ListRecordsExtOptions,
): Promise<{ data: T[]; total: number }> {
  const result = await listRecords(tableId, options);
  return { data: result.records.map(mapRecord), total: result.total };
}

export async function searchAndMap<T>(
  tableId: string,
  query: string,
  fields: string[],
  mapRecord: (r: any) => T,
  extra?: { filters?: ComplexFilter; take?: number; skip?: number },
): Promise<{ data: T[]; total: number }> {
  const result = await searchRecords(tableId, {
    query,
    fields,
    filters: extra?.filters,
    take: extra?.take,
    skip: extra?.skip,
  });
  return { data: result.records.map(mapRecord), total: result.total };
}

/** Back-compat shim: accepts a legacy ListRecordsOptions (equality filter only) and widens into ComplexFilter. */
export function toComplexFilter(
  legacy?: ListRecordsOptions["filters"],
): ComplexFilter | undefined {
  if (!legacy) return undefined;
  const out: ComplexFilter = {};
  for (const [k, v] of Object.entries(legacy)) out[k] = v;
  return out;
}

export { iterateRecords };
