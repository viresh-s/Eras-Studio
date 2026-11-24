/**
 * Authoritative Admin Whitelist & Identity Resolution
 *
 * Eras Studio Admin Identities:
 * - Root Super Admin: admin123 (admin123@internal.eras.studio)
 * - Executive Admin: admin@eras.com
 * - Custom Admin accounts created by the Super Admin in the Security Centre.
 */

import { adminAccountsRepo } from "@/lib/data/adminAccounts";

export interface PredefinedAdmin {
  readonly username: string;
  readonly authEmail: string;
  readonly userId?: string;
  readonly displayName: string;
  readonly role?: string;
}

export const PREDEFINED_ADMINS: readonly PredefinedAdmin[] = Object.freeze([
  {
    username: "admin123",
    authEmail: "admin123@internal.eras.studio",
    userId: "d39b6c46-017a-4f75-a1d1-d1d626a00cdd",
    displayName: "System Admin (Super Admin)",
    role: "super_admin",
  },
  {
    username: "admin@eras.com",
    authEmail: "admin@eras.com",
    userId: "301aa580-9e64-4db8-af01-149685998077",
    displayName: "Executive Admin",
    role: "super_admin",
  },
]);

/**
 * Resolves user-entered login identifier (username or email) to the internal Supabase Auth email.
 * e.g., 'admin123' -> 'admin123@internal.eras.studio'
 */
export function resolveLoginIdentifier(input: string): string {
  const normalized = (input || "").trim().toLowerCase();

  const matched = PREDEFINED_ADMINS.find(
    (admin) => admin.username.toLowerCase() === normalized || admin.authEmail.toLowerCase() === normalized
  );

  if (matched) {
    return matched.authEmail;
  }

  return normalized;
}

/**
 * Asynchronously resolves login identifier checking predefined admins and custom created admins.
 */
export async function resolveAdminLoginIdentifierAsync(input: string): Promise<string> {
  const staticResolved = resolveLoginIdentifier(input);
  if (staticResolved !== (input || "").trim().toLowerCase()) {
    return staticResolved;
  }

  const account = await adminAccountsRepo.getByUsername(input);
  if (account) {
    return account.email;
  }

  return (input || "").trim().toLowerCase();
}

/**
 * Checks if the given email corresponds to an authorized admin account.
 */
export function isAuthorizedAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return PREDEFINED_ADMINS.some((admin) => admin.authEmail.toLowerCase() === normalized);
}

/**
 * Checks if the given email is authorized, querying both static whitelist and custom admin accounts.
 */
export async function isAuthorizedAdminEmailAsync(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  if (isAuthorizedAdminEmail(email)) return true;
  return adminAccountsRepo.hasAccount(email);
}

/**
 * Checks if the given user ID matches an authorized admin account.
 */
export function isAuthorizedAdminUserId(userId: string | null | undefined): boolean {
  if (!userId) return false;
  return PREDEFINED_ADMINS.some((admin) => admin.userId === userId);
}

/**
 * Checks if the user ID matches any authorized admin account in database/memory.
 */
export async function isAuthorizedAdminUserIdAsync(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false;
  if (isAuthorizedAdminUserId(userId)) return true;
  const acc = await adminAccountsRepo.getById(userId);
  return Boolean(acc && acc.isActive);
}
