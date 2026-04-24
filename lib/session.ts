"use server";

import { cache } from "react";
import { getCurrentUser as sdkGetCurrentUser, type CurrentUser } from "./inforact-sdk-ext";

export type { CurrentUser };

/**
 * Per-request cached current user. React `cache` dedupes within a single
 * render pass so multiple callers in the same request share one HTTP call.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  return sdkGetCurrentUser();
});

export async function getCurrentUserSafe(): Promise<CurrentUser | null> {
  try {
    return await getCurrentUser();
  } catch {
    return null;
  }
}

export async function hasRole(role: string): Promise<boolean> {
  const u = await getCurrentUserSafe();
  return u ? u.roles.includes(role) : false;
}

export async function hasAnyRole(roles: string[]): Promise<boolean> {
  if (roles.length === 0) return true;
  const u = await getCurrentUserSafe();
  if (!u) return false;
  return roles.some((r) => u.roles.includes(r));
}
