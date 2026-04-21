"use server";

import { getTables, getRecords } from "@/lib/inforact-sdk";

/**
 * Check whether the app needs initialization (table creation + seed data).
 *
 * Strategy:
 * - If fewer than 25 tables exist → need to create remaining tables
 * - If tables exist but Employees table has 0 records → need to seed data
 *
 * Returns: { needsTables: boolean, needsSeed: boolean }
 */
export async function checkInitStatus(): Promise<{
  needsTables: boolean;
  needsSeed: boolean;
}> {
  try {
    const tables = await getTables();
    const tableCount = tables.length;

    // Not enough tables → need table creation (and seed)
    if (tableCount < 25) {
      return { needsTables: true, needsSeed: true };
    }

    // Tables exist — check if Employees has data (sentinel for seed completion)
    const employeesTable = tables.find(t => t.name === "Employees");
    if (!employeesTable) {
      return { needsTables: true, needsSeed: true };
    }

    // Try to fetch 1 record from Employees to check if seed data exists
    try {
      const { records, total } = await getRecords(employeesTable.id, { take: 1 });
      if (total === 0) {
        return { needsTables: false, needsSeed: true };
      }
    } catch {
      // If we can't read Employees, assume we need seed
      return { needsTables: false, needsSeed: true };
    }

    // All good — tables exist and have data
    return { needsTables: false, needsSeed: false };
  } catch {
    // getTables failed entirely → need full init
    return { needsTables: true, needsSeed: true };
  }
}

/**
 * Legacy API — kept for backwards compatibility with init/page.tsx
 */
export async function checkNeedsSeed(): Promise<boolean> {
  const { needsTables, needsSeed } = await checkInitStatus();
  return needsTables || needsSeed;
}
