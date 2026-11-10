/**
 * Authoritative Predefined Admin Whitelist (Phase 25)
 * 
 * Strict enforcement: Eras Studio supports exactly TWO predefined Admin identities.
 * No third account, public registration, or role escalation can ever obtain Admin privileges.
 */

export interface PredefinedAdmin {
  readonly username: string;
  readonly authEmail: string;
  readonly userId?: string;
  readonly displayName: string;
}

export const PREDEFINED_ADMINS: readonly PredefinedAdmin[] = Object.freeze([
  {
    username: 'admin123',
    authEmail: 'admin123@internal.eras.studio',
    userId: 'd39b6c46-017a-4f75-a1d1-d1d626a00cdd',
    displayName: 'System Admin (01)',
  },
  {
    username: 'admin@eras.com',
    authEmail: 'admin@eras.com',
    userId: '301aa580-9e64-4db8-af01-149685998077',
    displayName: 'Executive Admin (02)',
  },
]);

/**
 * Resolves user-entered login identifier (username or email) to the internal Supabase Auth email.
 * e.g., 'admin123' -> 'admin123@internal.eras.studio'
 */
export function resolveLoginIdentifier(input: string): string {
  const normalized = (input || '').trim().toLowerCase();
  
  const matched = PREDEFINED_ADMINS.find(
    (admin) => admin.username.toLowerCase() === normalized || admin.authEmail.toLowerCase() === normalized
  );

  if (matched) {
    return matched.authEmail;
  }

  return normalized;
}

/**
 * Checks if the given email corresponds to one of the two predefined admin accounts.
 */
export function isAuthorizedAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return PREDEFINED_ADMINS.some((admin) => admin.authEmail.toLowerCase() === normalized);
}

/**
 * Checks if the given user ID matches an authorized admin account.
 */
export function isAuthorizedAdminUserId(userId: string | null | undefined): boolean {
  if (!userId) return false;
  return PREDEFINED_ADMINS.some((admin) => admin.userId === userId);
}

