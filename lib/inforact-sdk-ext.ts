// Extension layer for the Inforact SDK — client-side wrappers for the 13 GAP-SDK
// features delivered by the Inforact platform team.
//
// This file is hand-maintained (the base `inforact-sdk.ts` is auto-generated).
// All HTTP plumbing mirrors the base SDK's auth/error conventions.

import type { ListRecordsOptions, Record } from "./inforact-sdk";
import { InforactError, getRecord } from "./inforact-sdk";

const API_BASE = process.env.INFORACT_API_URL || "";
const APP_TOKEN = process.env.INFORACT_APP_TOKEN || "";

/**
 * Resolve JWT for the current request. Priority:
 *   1. `localStorage.access_token` (set after user login)
 *   2. `NEXT_PUBLIC_DEV_JWT` (local dev fallback)
 * Returns `null` when neither is available (caller sends no Authorization).
 */
function getJWT(): string | null {
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem("access_token");
    if (stored) return stored;
  }
  return process.env.NEXT_PUBLIC_DEV_JWT || null;
}

function authHeader(): { [k: string]: string } {
  const jwt = getJWT();
  return jwt ? { Authorization: `Bearer ${jwt}` } : {};
}

async function extRequest<T = any>(
  path: string,
  init?: RequestInit,
  context?: string,
): Promise<T> {
  if (!API_BASE) {
    throw new InforactError(
      "Inforact SDK is not configured. INFORACT_API_URL missing.",
      0,
      "SDK_NOT_CONFIGURED",
    );
  }
  const url = `${API_BASE}/api/app-data/${APP_TOKEN}${path}`;
  return extFetch<T>(url, init, context);
}

async function extFetch<T>(
  url: string,
  init?: RequestInit,
  context?: string,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
        ...(init?.headers ?? {}),
      },
    });
  } catch (err: any) {
    throw new InforactError(
      `Network error${context ? ` while ${context}` : ""}: ${err.message}`,
      0,
      "NETWORK_ERROR",
    );
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new InforactError(
      body.error?.message || body.message || `Request failed (${res.status})`,
      res.status,
      body.error?.code ?? null,
    );
  }
  const text = await res.text();
  if (!text.trim()) return undefined as T;
  return JSON.parse(text).data;
}

// ============================================================================
// GAP-SDK-001 — Authentication / user context
// ============================================================================

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
  department?: string;
  title?: string;
  avatarUrl?: string;
}

/**
 * Resolve the current authenticated user from the Inforact Admin service.
 * Requires JWT (see `getJWT()`).
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  return extRequest<CurrentUser>("/session/me", undefined, "fetching current user");
}

export async function hasRole(role: string): Promise<boolean> {
  const u = await getCurrentUser();
  return u.roles.includes(role);
}

/** Throws InforactError(403) if the current user does not have any of the required roles. */
export async function requireRole(...roles: string[]): Promise<CurrentUser> {
  const u = await getCurrentUser();
  const ok = roles.length === 0 || roles.some((r) => u.roles.includes(r));
  if (!ok) {
    throw new InforactError(
      `Access denied: requires one of [${roles.join(", ")}], user has [${u.roles.join(", ")}]`,
      403,
      "FORBIDDEN",
    );
  }
  return u;
}

// ============================================================================
// GAP-SDK-002 — File upload / attachment runtime
// ============================================================================

export interface AttachmentRef {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  url: string;
  uploadedAt: string;
}

/**
 * Upload a file to the Inforact file service. Returns an AttachmentRef that
 * can be stored in an ATTACHMENT / IMAGE field via createRecord/updateRecord.
 *
 * Accepts a browser `File` / `Blob`, or a `{ data: ArrayBuffer; name; type }`
 * shape for server-side uploads.
 */
export async function uploadFile(
  file: File | Blob | { data: ArrayBuffer; name: string; type: string },
  options?: { tableId?: string; recordId?: string; fieldName?: string },
): Promise<AttachmentRef> {
  if (!API_BASE) {
    throw new InforactError("SDK not configured", 0, "SDK_NOT_CONFIGURED");
  }
  const form = new FormData();
  if (file instanceof Blob) {
    const name = (file as any).name ?? "upload.bin";
    form.append("file", file, name);
  } else {
    form.append("file", new Blob([file.data], { type: file.type }), file.name);
  }
  if (options?.tableId) form.append("tableId", options.tableId);
  if (options?.recordId) form.append("recordId", options.recordId);
  if (options?.fieldName) form.append("fieldName", options.fieldName);

  const res = await fetch(`${API_BASE}/api/app-data/${APP_TOKEN}/files`, {
    method: "POST",
    body: form,
    cache: "no-store",
    headers: authHeader(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new InforactError(
      body.error?.message || `Upload failed (${res.status})`,
      res.status,
      body.error?.code ?? null,
    );
  }
  return (await res.json()).data as AttachmentRef;
}

export async function deleteAttachment(attachmentId: string): Promise<void> {
  await extRequest(`/files/${attachmentId}`, { method: "DELETE" }, "deleting attachment");
}

export function getAttachmentUrl(ref: AttachmentRef): string {
  return ref.url;
}

// ============================================================================
// GAP-SDK-003 — Complex filters (range / IN / contains / OR)
// ============================================================================

export type FilterOp =
  | { $eq: any }
  | { $ne: any }
  | { $gt: number | string }
  | { $gte: number | string }
  | { $lt: number | string }
  | { $lte: number | string }
  | { $in: any[] }
  | { $nin: any[] }
  | { $contains: string }
  | { $startsWith: string }
  | { $between: [number | string, number | string] };

export interface ComplexFilter {
  [fieldName: string]: any | FilterOp;
  $or?: ComplexFilter[];
  $and?: ComplexFilter[];
  $not?: ComplexFilter;
}

export interface ListRecordsExtOptions extends Omit<ListRecordsOptions, "filters"> {
  filters?: ComplexFilter;
  /** GAP-SDK-008 — multi-field sort */
  sort?: { field: string; direction: "asc" | "desc" }[];
}

/**
 * List records with complex filters + multi-sort. Supersedes `getRecords` for
 * non-trivial queries. Same response shape as getRecords.
 */
export async function listRecords(
  tableId: string,
  options?: ListRecordsExtOptions,
): Promise<{ records: Record[]; total: number }> {
  return extRequest(
    `/tables/${tableId}/records:query`,
    {
      method: "POST",
      body: JSON.stringify(options ?? {}),
    },
    `listing records in ${tableId}`,
  );
}

// ============================================================================
// GAP-SDK-004 — Full-text search
// ============================================================================

export interface SearchRecordsOptions {
  /** Text to search for (case-insensitive substring) */
  query: string;
  /** Field names to search in — if omitted, all TEXT fields are searched */
  fields?: string[];
  /** Additional filter to narrow results */
  filters?: ComplexFilter;
  skip?: number;
  take?: number;
}

export async function searchRecords(
  tableId: string,
  options: SearchRecordsOptions,
): Promise<{ records: Record[]; total: number }> {
  return extRequest(
    `/tables/${tableId}/records:search`,
    {
      method: "POST",
      body: JSON.stringify(options),
    },
    `searching records in ${tableId}`,
  );
}

// ============================================================================
// GAP-SDK-005 — Pagination > 200 via async iterator
// ============================================================================

export interface IterateOptions extends ListRecordsExtOptions {
  /** Page size per fetch (default 500, max 1000) */
  pageSize?: number;
  /** Hard stop — never fetch more than this many records */
  maxRecords?: number;
}

/**
 * Async iterator over all records matching the filter. Fetches in batches and
 * yields records one at a time. Use `for await (const record of iterateRecords(...))`.
 */
export async function* iterateRecords(
  tableId: string,
  options?: IterateOptions,
): AsyncGenerator<Record, void, unknown> {
  const pageSize = Math.min(options?.pageSize ?? 500, 1000);
  const max = options?.maxRecords ?? Infinity;
  let skip = 0;
  let fetched = 0;
  while (fetched < max) {
    const remaining = max - fetched;
    const take = Math.min(pageSize, remaining);
    const { records } = await listRecords(tableId, {
      ...options,
      skip,
      take,
    });
    if (records.length === 0) return;
    for (const r of records) {
      yield r;
      fetched++;
      if (fetched >= max) return;
    }
    if (records.length < take) return; // no more pages
    skip += records.length;
  }
}

/**
 * Convenience — drain the iterator into an array. For list pages that need
 * all matching records (filter applied server-side so dataset stays small).
 */
export async function collectRecords(
  tableId: string,
  options?: IterateOptions,
): Promise<Record[]> {
  const out: Record[] = [];
  for await (const r of iterateRecords(tableId, options)) out.push(r);
  return out;
}

// ============================================================================
// GAP-SDK-006 — Workflow / approval chain
// ============================================================================

export type ApprovalTitle = "LEADER" | "VICE_LEADER" | "MEMBER";

export type ApprovalStep =
  | { type: "group"; groupId: string; title: ApprovalTitle }
  | { type: "user"; userId: string };

export interface ApprovalRequestInput {
  /** e.g. 'quotation', 'payment_voucher', 'order', 'container' */
  referenceType: string;
  referenceId: string;
  referenceCode?: string;
  /** e.g. 'Giảm giá', 'Phiếu chi', 'Hủy đơn', 'Container plan', 'Ân hạn', 'Miễn cọc' */
  type: string;
  /** Approver chain — per-step group target (groupId+title) or concrete user. */
  approvalChain: ApprovalStep[];
  /** SLA per step in hours */
  slaHours?: number;
  summary?: string;
  amount?: number;
  metadata?: { [key: string]: any };
}

export interface ApprovalRecord {
  id: string;
  status: string;
  currentStep: number;
  totalSteps: number;
  currentApprover: string;
  slaDeadline?: string;
}

/** Shape expected by the Inforact backend on the wire. */
type WireApprovalStep =
  | { type: "group_title"; approver: string; title: ApprovalTitle }
  | { type: "user"; approver: string };

function toWireStep(step: ApprovalStep): WireApprovalStep {
  if (step.type === "group") {
    return { type: "group_title", approver: step.groupId, title: step.title };
  }
  return { type: "user", approver: step.userId };
}

/**
 * Create a proper Approval workflow record. The platform manages
 * step transitions, SLA deadlines, escalation, and audit trail.
 */
export async function createApprovalRequest(
  input: ApprovalRequestInput,
): Promise<ApprovalRecord> {
  const body = {
    ...input,
    approvalChain: input.approvalChain.map(toWireStep),
  };
  return extRequest<ApprovalRecord>(
    "/workflows/approvals",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    "creating approval request",
  );
}

/**
 * A member entry inside a group — who belongs and what title they hold.
 * Used by the UI to decide whether the current user belongs to
 * `CurrentApprover` groupId and matches `CurrentApproverTitle`.
 */
export interface GroupMember {
  userId: string;
  title: ApprovalTitle;
}

/** A group with its nested member list (returned by `GET /api/app-data/groups`). */
export interface Group {
  id: string;
  name: string;
  members: GroupMember[];
}

/** An employee record (returned by `GET /api/app-data/members`). */
export interface Member {
  userId: string;
  fullName: string;
  avatar?: string;
  email?: string;
}

/**
 * Fetch all approval groups (with nested members). Hits
 * `/api/app-data/{APP_TOKEN}/groups` — token-scoped.
 */
export async function listGroups(): Promise<Group[]> {
  return extRequest<Group[]>("/groups", undefined, "fetching groups");
}

/**
 * Fetch all employees. Hits `/api/app-data/{APP_TOKEN}/members` — token-scoped.
 */
export async function listMembers(): Promise<Member[]> {
  return extRequest<Member[]>("/members", undefined, "fetching members");
}

export async function decideApproval(
  approvalId: string,
  decision: "approve" | "reject",
  note?: string,
): Promise<ApprovalRecord> {
  return extRequest<ApprovalRecord>(
    `/workflows/approvals/${approvalId}/decide`,
    {
      method: "POST",
      body: JSON.stringify({ decision, note }),
    },
    "deciding approval",
  );
}

// ============================================================================
// GAP-SDK-007 — Batch writes (single-table atomic)
// ============================================================================
// Note: cross-table transactions are NOT supported by the Inforact backend.
// Use `createRecords` per table; caller is responsible for cross-table
// consistency.

/** Atomic multi-record create within a single table. All or nothing. */
export async function createRecords(
  tableId: string,
  records: { [name: string]: any }[],
): Promise<Record[]> {
  return extRequest<Record[]>(
    `/tables/${tableId}/records:batchCreate`,
    { method: "POST", body: JSON.stringify({ records }) },
    `batch create on ${tableId}`,
  );
}

// ============================================================================
// GAP-SDK-009 — Aggregation / group-by
// ============================================================================

export interface AggregateOptions {
  groupBy?: string[];
  metrics?: {
    [alias: string]: { fn: "sum" | "count" | "avg" | "min" | "max"; field?: string };
  };
  filters?: ComplexFilter;
}

export interface AggregateRow {
  group: { [field: string]: any };
  metrics: { [alias: string]: number };
}

export async function aggregateRecords(
  tableId: string,
  options: AggregateOptions,
): Promise<AggregateRow[]> {
  return extRequest<AggregateRow[]>(
    `/tables/${tableId}/records:aggregate`,
    { method: "POST", body: JSON.stringify(options) },
    `aggregating ${tableId}`,
  );
}

// ============================================================================
// FieldType helpers (GAP-SDK-011 — Lookup resolution)
// ============================================================================

export const Attachment = {
  fromUpload(file: File | Blob): Promise<AttachmentRef> {
    return uploadFile(file);
  },
  url(ref: AttachmentRef): string {
    return ref.url;
  },
};

export const Person = {
  async getCurrent(): Promise<CurrentUser> {
    return getCurrentUser();
  },
  /** Produce a PERSON field value from a user record. */
  toFieldValue(user: Pick<CurrentUser, "id" | "name" | "email">) {
    return { id: user.id, name: user.name, email: user.email };
  },
};

export interface LookupRef {
  tableId: string;
  recordId: string;
}

export const Lookup = {
  /** Resolve a LOOKUP field ref into the target record. */
  async resolve(ref: LookupRef): Promise<Record> {
    return getRecord(ref.tableId, ref.recordId);
  },
  /**
   * Batch-resolve multiple lookup refs. Inforact has no standalone
   * `/lookups:resolve` endpoint — we group refs by tableId and issue one
   * `records:query` per table with `id $in [...]` filter, then flatten.
   */
  async resolveMany(refs: LookupRef[]): Promise<Record[]> {
    if (refs.length === 0) return [];
    const byTable = new Map<string, string[]>();
    for (const r of refs) {
      const ids = byTable.get(r.tableId) ?? [];
      ids.push(r.recordId);
      byTable.set(r.tableId, ids);
    }
    const pages = await Promise.all(
      Array.from(byTable.entries()).map(async ([tableId, ids]) => {
        const res = await listRecords(tableId, {
          filters: { id: { $in: ids } },
          take: ids.length,
        });
        return res.records;
      }),
    );
    return pages.flat();
  },
};
