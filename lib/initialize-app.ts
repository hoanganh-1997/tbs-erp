"use server";

// ---------------------------------------------------------------------------
// SINGLE server action for the entire initialization flow.
//
// WHY: In Vercel serverless, each server action call gets its own module scope.
// If we make 3 separate calls (check → create tables → seed), each one starts
// with fresh module-level state — the table registry cache is lost, entity
// module caches are lost, and everything breaks.
//
// By combining everything into ONE function call, all operations share the
// same module scope, and the table registry cache/queue work correctly.
// ---------------------------------------------------------------------------

import { getTables, getRecords } from "@/lib/inforact-sdk";
import { resetTableCache } from "@/lib/table-registry";
import { initAllTables } from "@/lib/init-tables";
import type { InitResult } from "@/lib/init-tables";
import { seedAllData } from "@/lib/seed-data/index";
import type { SeedWaveResult } from "@/lib/seed-data/index";

export interface InitializeResult {
  status: "already-done" | "success" | "partial" | "error";
  tableResults?: InitResult[];
  seedResults?: SeedWaveResult[];
  error?: string;
}

export async function initializeApp(): Promise<InitializeResult> {
  // ── Step 0: Reset all module-level caches ──────────────────────────────
  // On a warm lambda, stale state from previous invocations may exist.
  // Reset to ensure we start clean and fetch fresh data from the API.
  resetTableCache();

  try {
    // ── Step 1: Check current state ────────────────────────────────────
    let tables: { id: string; name: string }[] = [];
    try {
      tables = await getTables();
    } catch {
      // No tables yet — that's expected on first run
    }

    const needsTables = tables.length < 25;

    // Check if seed data exists (use Employees as sentinel)
    let needsSeed = true;
    const employeesTable = tables.find((t) => t.name === "Employees");
    if (employeesTable) {
      try {
        const result = await getRecords(employeesTable.id, { take: 1 });
        if (result.total > 0) {
          needsSeed = false;
        }
      } catch {
        // Can't read Employees → need seed
      }
    }

    // Already fully initialized
    if (!needsTables && !needsSeed) {
      return { status: "already-done" };
    }

    // ── Step 2: Create tables (if needed) ──────────────────────────────
    // initAllTables() calls each entity's get function sequentially.
    // Each get function triggers ensureTable() which uses the registry queue.
    // Since we're in the SAME server action scope, the queue + cache work.
    let tableResults: InitResult[] | undefined;
    if (needsTables) {
      tableResults = await initAllTables();

      // Verify: how many tables exist now?
      const tablesAfter = await getTables().catch(() => []);
      const failedCount = tableResults.filter((r) => r.status === "error").length;

      if (tablesAfter.length < 20) {
        // Critical failure — too few tables created
        return {
          status: "error",
          tableResults,
          error:
            `Chỉ tạo được ${tablesAfter.length} bảng. ` +
            `${failedCount} lỗi. ` +
            `Lỗi đầu: ${tableResults.find((r) => r.status === "error")?.error || "Unknown"}`,
        };
      }
    }

    // ── Step 3: Seed data (if needed) ──────────────────────────────────
    // seedAllData() is called in the SAME scope → entity modules reuse
    // the table IDs cached in Step 2 → no duplicate createTable() calls.
    let seedResults: SeedWaveResult[] | undefined;
    if (needsSeed) {
      seedResults = await seedAllData();
    }

    return {
      status: "success",
      tableResults,
      seedResults,
    };
  } catch (err: any) {
    return {
      status: "error",
      error: err.message || String(err),
    };
  }
}
