"use server";

import { createTable, getTables } from "@/lib/inforact-sdk";
import type { CreateTableField } from "@/lib/inforact-sdk";

// ---------------------------------------------------------------------------
// Table Registry — serializes createTable() calls to avoid 403 rate-limiting
// ---------------------------------------------------------------------------
//
// WHY THIS EXISTS:
// In Vercel serverless, module-level state does NOT persist between separate
// server action calls. Each HTTP request may get a fresh module scope.
//
// SOLUTION:
// 1. Always load fresh cache from API via getTables() at the start
// 2. Serialize createTable() calls with delay to avoid rate-limiting
// 3. Handle "table already exists" errors gracefully
//
// IMPORTANT: The caller must ensure all table operations happen within
// a SINGLE server action invocation (see lib/initialize-app.ts).
// ---------------------------------------------------------------------------

const tableCache = new Map<string, string>(); // tableName -> tableId
let cacheLoaded = false;
let queueTail: Promise<void> = Promise.resolve();

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Load existing tables from API into cache. Called once per server action scope. */
async function loadCache(): Promise<void> {
  if (cacheLoaded) return;
  try {
    const tables = await getTables();
    for (const t of tables) {
      tableCache.set(t.name, t.id);
    }
  } catch {
    // getTables may fail if no tables exist yet — that's OK
  }
  cacheLoaded = true;
}

/** Force reload cache from API (used after createTable errors) */
async function reloadCache(): Promise<void> {
  cacheLoaded = false;
  tableCache.clear();
  await loadCache();
}

/**
 * Get or create a table by name. Serialized through a queue with delay
 * to avoid API rate-limiting (403). Results are cached within the current scope.
 */
export async function ensureTable(
  name: string,
  fields: CreateTableField[],
): Promise<string> {
  // Load cache from API (once per scope)
  await loadCache();
  const cached = tableCache.get(name);
  if (cached) return cached;

  // Enqueue creation — only one createTable() runs at a time
  return new Promise<string>((resolve, reject) => {
    queueTail = queueTail.then(async () => {
      // Double-check: another queued call may have created it
      const existing = tableCache.get(name);
      if (existing) {
        resolve(existing);
        return;
      }

      // Retry up to 3 times with increasing delay
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await sleep(500 + attempt * 500); // 500ms, 1000ms, 1500ms
          const table = await createTable(name, fields);
          tableCache.set(name, table.id);
          resolve(table.id);
          return;
        } catch (err: any) {
          // Table might already exist (409) or rate-limited (403)
          // Reload cache from API and check
          try {
            await reloadCache();
            const retryId = tableCache.get(name);
            if (retryId) {
              resolve(retryId);
              return;
            }
          } catch {
            // reloadCache failed — continue retry loop
          }

          // Last attempt — give up
          if (attempt === 2) {
            reject(err);
            return;
          }
          // Otherwise retry after a longer delay
        }
      }
    });
  });
}

/**
 * Reset ALL state — call at the START of each initialization flow
 * to ensure clean state regardless of warm/cold lambda.
 */
export async function resetTableCache(): Promise<void> {
  tableCache.clear();
  cacheLoaded = false;
  queueTail = Promise.resolve();
}
