// lib/inforact-sdk.ts — Inforact SDK for App Builder apps
// This file is auto-injected into every App Builder project.
// Import functions from '@/lib/inforact-sdk' to interact with your Base tables.

// ---------------------------------------------------------------------------
// Configuration (set at build time by the Inforact platform)
// ---------------------------------------------------------------------------
const API_BASE = process.env.INFORACT_API_URL || '';
const APP_TOKEN = process.env.INFORACT_APP_TOKEN || '';
const DEV_JWT = process.env.NEXT_PUBLIC_DEV_JWT || '';

/**
 * Resolve JWT for the current request. Priority:
 *   1. `localStorage.access_token` (set after user login)
 *   2. `NEXT_PUBLIC_DEV_JWT` (local dev fallback)
 */
function getJWT(): string | null {
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem('access_token');
    if (stored) return stored;
  }
  return DEV_JWT || null;
}

function authHeader(): { [k: string]: string } {
  const jwt = getJWT();
  return jwt ? { Authorization: `Bearer ${jwt}` } : {};
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Column data type as defined in Inforact */
export type FieldType =
  | 'TEXT'
  | 'NUMBER'
  | 'DATE'
  | 'BOOLEAN'
  | 'CHECKBOX'
  | 'SINGLE_OPTION'
  | 'MULTIPLE_OPTIONS'
  | 'ATTACHMENT'
  | 'IMAGE'
  | 'LINK'
  | 'PERSON'
  | 'MULTIPLE_PERSON'
  | 'USER_GROUP'
  | 'FORMULA'
  | 'LOOKUP'
  | 'CREATED_BY'
  | 'UPDATED_BY'
  | 'CREATED_AT'
  | 'UPDATED_AT'
  | 'AUTO_NUMBER'
  | 'ARRAY'
  | 'ARRAY_OBJECT'
  | 'OBJECT';

/** Option for SINGLE_OPTION / MULTIPLE_OPTIONS fields */
export interface FieldOption {
  id: string;
  name: string;
  color: string;
}

/**
 * Schema for a single table field (column).
 * Use `readOnly` to decide whether to show a field in create/edit forms.
 */
export interface Field {
  /** Unique field identifier */
  id: string;
  /** Human-readable field name — use this in record.fields keys */
  name: string;
  /** Field data type */
  type: FieldType;
  /** True for computed / system fields (FORMULA, LOOKUP, CREATED_AT, etc.) */
  readOnly: boolean;
  /** Available options — only present for SINGLE_OPTION / MULTIPLE_OPTIONS */
  options?: FieldOption[];
}

/**
 * Schema for a table accessible by this app.
 * Use `id` as the first argument to all record functions.
 */
export interface TableSchema {
  /** Table ID — pass this to getRecords, createRecord, etc. */
  id: string;
  /** Human-readable table name */
  name: string;
  /** All fields (columns) in this table */
  fields: Field[];
}

/**
 * A single record (row) returned by the API.
 * Field values are keyed by the field **name** (not the internal ID).
 */
export interface Record {
  /** Unique record identifier */
  id: string;
  /** Field values keyed by field NAME — e.g. `record.fields["Email"]` */
  fields: { [fieldName: string]: any };
  /** ISO 8601 creation timestamp */
  createdAt: string;
  /** ISO 8601 last-update timestamp */
  updatedAt: string;
}

/**
 * Options for listing records — pagination, filtering, and sorting.
 *
 * Example:
 * ```ts
 * const result = await getRecords(tableId, {
 *   skip: 0,
 *   take: 20,
 *   filters: { Status: 'Active' },
 *   sortField: 'Name',
 *   sortDirection: 'asc',
 * });
 * ```
 */
export interface ListRecordsOptions {
  /** Number of records to skip (default: 0) */
  skip?: number;
  /** Number of records to return (default: 50, max: 200) */
  take?: number;
  /** Equality filters — `{ fieldName: value }` */
  filters?: { [fieldName: string]: string };
  /** Field name to sort by */
  sortField?: string;
  /** Sort direction (default: 'asc') */
  sortDirection?: 'asc' | 'desc';
}

/**
 * Field definition for creating a new table via `createTable`.
 */
export interface CreateTableField {
  /** Field name */
  name: string;
  /** Field data type */
  type: FieldType;
  /** Options for SINGLE_OPTION / MULTIPLE_OPTIONS fields */
  options?: { name: string; color?: string }[];
}

/** Paginated list result returned by `getRecords` and `executeQuery` */
export interface RecordList {
  /** Records matching the query (current page) */
  records: Record[];
  /** Total number of records matching the query (before pagination) */
  total: number;
}

/**
 * Schema for a query data source accessible by this app.
 * Queries are read-only — they aggregate data from multiple tables.
 */
export interface QuerySchema {
  /** Query ID — pass this to executeQuery */
  id: string;
  /** Human-readable query name */
  name: string;
  /** Always "QUERY" */
  type: 'QUERY';
  /** Result fields (all read-only) */
  fields: Field[];
}

/**
 * Options for executing a query — pagination and parameter substitution.
 *
 * Example:
 * ```ts
 * const result = await executeQuery(queryId, {
 *   skip: 0,
 *   take: 20,
 *   paramValues: { Status: 'Active' },
 * });
 * ```
 */
export interface QueryRecordsOptions {
  /** Number of records to skip (default: 0) */
  skip?: number;
  /** Number of records to return (default: 50, max: 200) */
  take?: number;
  /** Parameter values for parameterized queries */
  paramValues?: { [paramName: string]: any };
}

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

/** Typed error thrown by all SDK functions on failure */
export class InforactError extends Error {
  /** HTTP status code (e.g. 404, 403, 500) */
  status: number;
  /** Error code string from the backend, if available */
  code: string | null;

  constructor(message: string, status: number, code: string | null = null) {
    super(message);
    this.name = 'InforactError';
    this.status = status;
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// Internal HTTP helper
// ---------------------------------------------------------------------------

async function request<T = any>(
  path: string,
  options?: RequestInit,
  context?: string,
): Promise<T> {
  if (!API_BASE) {
    throw new InforactError(
      'Inforact SDK is not configured. INFORACT_API_URL environment variable is missing.',
      0,
      'SDK_NOT_CONFIGURED',
    );
  }

  const url = `${API_BASE}/api/app-data/${APP_TOKEN}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader(),
        ...options?.headers,
      },
    });
  } catch (networkError: any) {
    throw new InforactError(
      `Network error${context ? ` while ${context}` : ''}: ${networkError.message || 'Failed to connect'}. Check that the Inforact API is reachable.`,
      0,
      'NETWORK_ERROR',
    );
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    const serverMsg = body.error?.message || body.message || `Request failed (${res.status})`;
    const hint =
      res.status === 404
        ? ' — the table or record may have been deleted'
        : res.status === 403
          ? ' — this table may not be connected to the app'
          : '';
    throw new InforactError(
      `${serverMsg}${hint}${context ? ` (${context})` : ''}`,
      res.status,
      body.error?.code ?? null,
    );
  }

  // Some operations (PATCH, DELETE) may return empty body or 204 No Content.
  // Safely handle responses without a JSON body.
  const text = await res.text();
  if (!text || !text.trim()) {
    return undefined as T;
  }
  const json = JSON.parse(text);
  return json.data;
}

// ---------------------------------------------------------------------------
// Schema cache + option-value validation
// ---------------------------------------------------------------------------

const _schemaCache = new Map<string, TableSchema>();

async function getCachedSchema(tableId: string): Promise<TableSchema> {
  const cached = _schemaCache.get(tableId);
  if (cached) return cached;
  const fresh = await request<TableSchema>(
    `/tables/${tableId}`,
    undefined,
    `fetching schema for table ${tableId}`,
  );
  _schemaCache.set(tableId, fresh);
  return fresh;
}

async function validateOptionFields(
  tableId: string,
  fields: { [fieldName: string]: any },
  context: string,
): Promise<void> {
  let schema: TableSchema;
  try {
    schema = await getCachedSchema(tableId);
  } catch {
    return;
  }
  const byName = new Map(schema.fields.map(f => [f.name, f]));
  for (const [key, value] of Object.entries(fields)) {
    if (value === null || value === undefined || value === '') continue;
    const field = byName.get(key);
    if (!field) continue;
    if (!field.options || field.options.length === 0) continue;
    const allowedNames = field.options.map(o => o.name);
    if (field.type === 'SINGLE_OPTION') {
      if (typeof value !== 'string') continue;
      if (allowedNames.indexOf(value) === -1) {
        throw new InforactError(
          `Invalid value "${value}" for SINGLE_OPTION field "${key}" (${context}). Allowed: ${allowedNames.join(', ')}`,
          422,
          'INVALID_OPTION_VALUE',
        );
      }
    } else if (field.type === 'MULTIPLE_OPTIONS') {
      if (!Array.isArray(value)) continue;
      const bad = value.filter(v => typeof v === 'string' && allowedNames.indexOf(v) === -1);
      if (bad.length > 0) {
        throw new InforactError(
          `Invalid value(s) [${bad.join(', ')}] for MULTIPLE_OPTIONS field "${key}" (${context}). Allowed: ${allowedNames.join(', ')}`,
          422,
          'INVALID_OPTION_VALUE',
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get all tables accessible by this app.
 * Returns table schemas including field names, types, options, and readOnly flags.
 *
 * @example
 * ```ts
 * const tables = await getTables();
 * tables.forEach(t => console.log(t.name, t.fields.length));
 * ```
 */
export async function getTables(): Promise<TableSchema[]> {
  return request<TableSchema[]>('/tables', undefined, 'fetching tables');
}

/**
 * Get the full schema for a single table, including all fields and their metadata.
 * Useful for building dynamic forms — check `field.readOnly` to skip computed fields.
 *
 * @param tableId - The table to inspect
 * @returns Table schema with all fields
 * @throws {InforactError} 404 if the table does not exist or is not accessible
 *
 * @example
 * ```ts
 * const schema = await getTableSchema('abc123');
 * const editableFields = schema.fields.filter(f => !f.readOnly);
 * ```
 */
export async function getTableSchema(tableId: string): Promise<TableSchema> {
  return getCachedSchema(tableId);
}

/**
 * Create a new table with the given name and field definitions.
 * The table is automatically connected to this app.
 *
 * @param name - Human-readable table name
 * @param fields - Array of field definitions (name, type, and optional options)
 * @returns The newly created table schema
 *
 * @example
 * ```ts
 * const table = await createTable('Contacts', [
 *   { name: 'Name', type: 'TEXT' },
 *   { name: 'Email', type: 'TEXT' },
 *   { name: 'Status', type: 'SINGLE_OPTION', options: [
 *     { name: 'Active', color: '#22c55e' },
 *     { name: 'Inactive', color: '#ef4444' },
 *   ]},
 * ]);
 * // Now use table.id with getRecords, createRecord, etc.
 * ```
 */
export async function createTable(
  name: string,
  fields: CreateTableField[],
): Promise<TableSchema> {
  return request<TableSchema>(
    '/tables',
    { method: 'POST', body: JSON.stringify({ name, fields }) },
    `creating table "${name}"`,
  );
}

/**
 * List records from a table with optional pagination, filtering, and sorting.
 * Returns at most 200 records per request. Use `skip` for pagination.
 *
 * @param tableId - The table to query
 * @param options - Pagination, filter, and sort parameters
 * @returns Paginated record list with total count
 * @throws {InforactError} 403 if the table is not accessible, 404 if not found
 *
 * @example
 * ```ts
 * const { records, total } = await getRecords('abc123', {
 *   skip: 0,
 *   take: 20,
 *   filters: { Status: 'Active' },
 *   sortField: 'Name',
 *   sortDirection: 'asc',
 * });
 * ```
 */
export async function getRecords(
  tableId: string,
  options?: ListRecordsOptions,
): Promise<RecordList> {
  const params = new URLSearchParams();
  if (options?.skip) params.set('skip', String(options.skip));
  if (options?.take) params.set('take', String(options.take));
  if (options?.sortField) params.set('sortField', options.sortField);
  if (options?.sortDirection) params.set('sortDirection', options.sortDirection);
  if (options?.filters) {
    Object.entries(options.filters).forEach(([key, value]) => {
      params.set(`filter.${key}`, value);
    });
  }
  const query = params.toString();
  const data = await request<{ rows: Record[]; total: number }>(
    `/tables/${tableId}/rows${query ? '?' + query : ''}`,
    undefined,
    `listing records from table ${tableId}`,
  );
  return { records: data.rows, total: data.total };
}

/**
 * Get a single record by its ID.
 *
 * @param tableId - The table containing the record
 * @param recordId - The record to fetch
 * @returns The record with field values keyed by field name
 * @throws {InforactError} 404 if the record or table is not found
 *
 * @example
 * ```ts
 * const record = await getRecord('abc123', 'row_xyz');
 * console.log(record.fields["Name"]);
 * ```
 */
export async function getRecord(tableId: string, recordId: string): Promise<Record> {
  return request<Record>(`/tables/${tableId}/rows/${recordId}`, undefined, `fetching record ${recordId} from table ${tableId}`);
}

/**
 * Create a new record in a table.
 * Read-only fields (FORMULA, LOOKUP, system fields) are automatically ignored.
 *
 * @param tableId - The table to insert into
 * @param fields - Field values keyed by field name
 * @returns The newly created record (with server-generated fields populated)
 * @throws {InforactError} 400 if fields is empty, 403 if table not accessible
 *
 * @example
 * ```ts
 * const record = await createRecord('abc123', {
 *   Name: 'Jane Doe',
 *   Email: 'jane@example.com',
 *   Status: 'Active',
 * });
 * ```
 */
export async function createRecord(
  tableId: string,
  fields: { [fieldName: string]: any },
): Promise<Record> {
  await validateOptionFields(tableId, fields, `creating record in table ${tableId}`);
  return request<Record>(
    `/tables/${tableId}/rows`,
    { method: 'POST', body: JSON.stringify({ fields }) },
    `creating record in table ${tableId}`,
  );
}

/**
 * Update an existing record. Only the specified fields are changed (partial update).
 * Read-only fields are automatically ignored.
 *
 * @param tableId - The table containing the record
 * @param recordId - The record to update
 * @param fields - Fields to update, keyed by field name
 * @throws {InforactError} 404 if record not found, 403 if table not accessible
 *
 * @example
 * ```ts
 * await updateRecord('abc123', 'row_xyz', { Status: 'Inactive' });
 * ```
 */
export async function updateRecord(
  tableId: string,
  recordId: string,
  fields: { [fieldName: string]: any },
): Promise<void> {
  await validateOptionFields(tableId, fields, `updating record ${recordId} in table ${tableId}`);
  await request(
    `/tables/${tableId}/rows/${recordId}`,
    { method: 'PATCH', body: JSON.stringify({ fields }) },
    `updating record ${recordId} in table ${tableId}`,
  );
}

/**
 * Delete a single record by its ID.
 *
 * @param tableId - The table containing the record
 * @param recordId - The record to delete
 * @throws {InforactError} 403 if table not accessible
 *
 * @example
 * ```ts
 * await deleteRecord('abc123', 'row_xyz');
 * ```
 */
export async function deleteRecord(tableId: string, recordId: string): Promise<void> {
  await request(
    `/tables/${tableId}/rows`,
    { method: 'DELETE', body: JSON.stringify({ rowIds: [recordId] }) },
    `deleting record ${recordId} from table ${tableId}`,
  );
}

/**
 * Delete multiple records at once.
 *
 * @param tableId - The table containing the records
 * @param recordIds - Array of record IDs to delete
 * @throws {InforactError} 400 if recordIds is empty, 403 if table not accessible
 *
 * @example
 * ```ts
 * await deleteRecords('abc123', ['row_1', 'row_2', 'row_3']);
 * ```
 */
export async function deleteRecords(tableId: string, recordIds: string[]): Promise<void> {
  await request(
    `/tables/${tableId}/rows`,
    { method: 'DELETE', body: JSON.stringify({ rowIds: recordIds }) },
    `deleting ${recordIds.length} record(s) from table ${tableId}`,
  );
}

// ---------------------------------------------------------------------------
// Query API (read-only data sources)
// ---------------------------------------------------------------------------

/**
 * Get all queries accessible by this app.
 * Queries are read-only data sources that aggregate data from multiple tables.
 *
 * @example
 * ```ts
 * const queries = await getQueries();
 * queries.forEach(q => console.log(q.name, q.fields.length));
 * ```
 */
export async function getQueries(): Promise<QuerySchema[]> {
  return request<QuerySchema[]>('/queries', undefined, 'fetching queries');
}

/**
 * Get the schema for a single query, including result field definitions.
 *
 * @param queryId - The query to inspect
 * @returns Query schema with all result fields (all marked read-only)
 * @throws {InforactError} 404 if query not found, 403 if not accessible
 */
export async function getQuerySchema(queryId: string): Promise<QuerySchema> {
  return request<QuerySchema>(`/queries/${queryId}`, undefined, `fetching schema for query ${queryId}`);
}

/**
 * Execute a query and return results with pagination and optional parameter values.
 * Queries are read-only — this function only retrieves data, never modifies it.
 *
 * @param queryId - The query to execute
 * @param options - Pagination and parameter options
 * @returns Paginated result with records and total count
 * @throws {InforactError} 403 if query not accessible
 *
 * @example
 * ```ts
 * // Simple execution
 * const { records, total } = await executeQuery('query123');
 *
 * // With pagination
 * const page2 = await executeQuery('query123', { skip: 20, take: 20 });
 *
 * // With parameters (for parameterized queries)
 * const filtered = await executeQuery('query123', {
 *   paramValues: { Status: 'Active', Region: 'US' },
 * });
 * ```
 */
export async function executeQuery(
  queryId: string,
  options?: QueryRecordsOptions,
): Promise<RecordList> {
  const hasParams = options?.paramValues && Object.keys(options.paramValues).length > 0;

  if (hasParams) {
    // POST with param values in body
    const data = await request<{ rows: Record[]; total: number }>(
      `/queries/${queryId}/rows`,
      {
        method: 'POST',
        body: JSON.stringify({
          paramValues: options!.paramValues,
          skip: options?.skip || 0,
          take: options?.take || 50,
        }),
      },
      `executing query ${queryId} with params`,
    );
    return { records: data.rows, total: data.total };
  }

  // GET without params
  const params = new URLSearchParams();
  if (options?.skip) params.set('skip', String(options.skip));
  if (options?.take) params.set('take', String(options.take));
  const query = params.toString();

  const data = await request<{ rows: Record[]; total: number }>(
    `/queries/${queryId}/rows${query ? '?' + query : ''}`,
    undefined,
    `executing query ${queryId}`,
  );
  return { records: data.rows, total: data.total };
}

// ===========================================================================
// Extension layer — hand-maintained wrappers for the 13 GAP-SDK features
// delivered by the Inforact platform team. Merged in from `inforact-sdk-ext`.
// ===========================================================================

async function extRequest<T = any>(
  path: string,
  init?: RequestInit,
  context?: string,
): Promise<T> {
  if (!API_BASE) {
    throw new InforactError(
      'Inforact SDK is not configured. INFORACT_API_URL missing.',
      0,
      'SDK_NOT_CONFIGURED',
    );
  }
  const url = `${API_BASE}/api/app-data/${APP_TOKEN}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader(),
        ...(init?.headers ?? {}),
      },
    });
  } catch (err: any) {
    throw new InforactError(
      `Network error${context ? ` while ${context}` : ''}: ${err.message}`,
      0,
      'NETWORK_ERROR',
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

// ---------------------------------------------------------------------------
// GAP-SDK-001 — Authentication / user context
// ---------------------------------------------------------------------------

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
  return extRequest<CurrentUser>('/session/me', undefined, 'fetching current user');
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
      `Access denied: requires one of [${roles.join(', ')}], user has [${u.roles.join(', ')}]`,
      403,
      'FORBIDDEN',
    );
  }
  return u;
}

// ---------------------------------------------------------------------------
// GAP-SDK-002 — File upload / attachment runtime
// ---------------------------------------------------------------------------

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
    throw new InforactError('SDK not configured', 0, 'SDK_NOT_CONFIGURED');
  }
  const form = new FormData();
  if (file instanceof Blob) {
    const name = (file as any).name ?? 'upload.bin';
    form.append('file', file, name);
  } else {
    form.append('file', new Blob([file.data], { type: file.type }), file.name);
  }
  if (options?.tableId) form.append('tableId', options.tableId);
  if (options?.recordId) form.append('recordId', options.recordId);
  if (options?.fieldName) form.append('fieldName', options.fieldName);

  const res = await fetch(`${API_BASE}/api/app-data/${APP_TOKEN}/files`, {
    method: 'POST',
    body: form,
    cache: 'no-store',
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
  await extRequest(`/files/${attachmentId}`, { method: 'DELETE' }, 'deleting attachment');
}

export function getAttachmentUrl(ref: AttachmentRef): string {
  return ref.url;
}

// ---------------------------------------------------------------------------
// GAP-SDK-003 — Complex filters (range / IN / contains / OR)
// ---------------------------------------------------------------------------

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

export interface ListRecordsExtOptions extends Omit<ListRecordsOptions, 'filters'> {
  filters?: ComplexFilter;
  /** GAP-SDK-008 — multi-field sort */
  sort?: { field: string; direction: 'asc' | 'desc' }[];
}

/**
 * List records with complex filters + multi-sort. Supersedes `getRecords` for
 * non-trivial queries. Same response shape as getRecords.
 */
export async function listRecords(
  tableId: string,
  options?: ListRecordsExtOptions,
): Promise<{ records: Record[]; total: number }> {
  const data = await extRequest<{ rows?: Record[]; records?: Record[]; total: number }>(
    `/tables/${tableId}/records:query`,
    {
      method: 'POST',
      body: JSON.stringify(options ?? {}),
    },
    `listing records in ${tableId}`,
  );
  return { records: data?.rows ?? data?.records ?? [], total: data?.total ?? 0 };
}

// ---------------------------------------------------------------------------
// GAP-SDK-004 — Full-text search
// ---------------------------------------------------------------------------

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
  const data = await extRequest<{ rows?: Record[]; records?: Record[]; total: number }>(
    `/tables/${tableId}/records:search`,
    {
      method: 'POST',
      body: JSON.stringify(options),
    },
    `searching records in ${tableId}`,
  );
  return { records: data?.rows ?? data?.records ?? [], total: data?.total ?? 0 };
}

// ---------------------------------------------------------------------------
// GAP-SDK-005 — Pagination > 200 via async iterator
// ---------------------------------------------------------------------------

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
    if (records.length < take) return;
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

// ---------------------------------------------------------------------------
// GAP-SDK-006 — Workflow / approval chain
// ---------------------------------------------------------------------------

export type ApprovalTitle = 'LEADER' | 'VICE_LEADER' | 'MEMBER';

export type ApprovalStep =
  | { type: 'group'; groupId: string; title: ApprovalTitle }
  | { type: 'user'; userId: string };

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

type WireApprovalStep =
  | { type: 'group_title'; approver: string; title: ApprovalTitle }
  | { type: 'user'; approver: string };

function toWireStep(step: ApprovalStep): WireApprovalStep {
  if (step.type === 'group') {
    return { type: 'group_title', approver: step.groupId, title: step.title };
  }
  return { type: 'user', approver: step.userId };
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
    '/workflows/approvals',
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
    'creating approval request',
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
  return extRequest<Group[]>('/groups', undefined, 'fetching groups');
}

/**
 * Fetch all employees. Hits `/api/app-data/{APP_TOKEN}/members` — token-scoped.
 */
export async function listMembers(): Promise<Member[]> {
  return extRequest<Member[]>('/members', undefined, 'fetching members');
}

export async function decideApproval(
  approvalId: string,
  decision: 'approve' | 'reject',
  note?: string,
): Promise<ApprovalRecord> {
  return extRequest<ApprovalRecord>(
    `/workflows/approvals/${approvalId}/decide`,
    {
      method: 'POST',
      body: JSON.stringify({ decision, note }),
    },
    'deciding approval',
  );
}

// ---------------------------------------------------------------------------
// GAP-SDK-007 — Batch writes (single-table atomic)
// ---------------------------------------------------------------------------
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
    { method: 'POST', body: JSON.stringify({ records }) },
    `batch create on ${tableId}`,
  );
}

// ---------------------------------------------------------------------------
// GAP-SDK-009 — Aggregation / group-by
// ---------------------------------------------------------------------------

export interface AggregateOptions {
  groupBy?: string[];
  metrics?: {
    [alias: string]: { fn: 'sum' | 'count' | 'avg' | 'min' | 'max'; field?: string };
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
    { method: 'POST', body: JSON.stringify(options) },
    `aggregating ${tableId}`,
  );
}

// ---------------------------------------------------------------------------
// FieldType helpers (GAP-SDK-011 — Lookup resolution)
// ---------------------------------------------------------------------------

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
  toFieldValue(user: Pick<CurrentUser, 'id' | 'name' | 'email'>) {
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

