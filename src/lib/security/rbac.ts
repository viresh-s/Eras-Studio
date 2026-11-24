/**
 * Centralized Role-Based Access Control (RBAC) System
 * Compliant with OWASP ASVS Section V4 (Access Control Verification)
 *
 * Eras Studio 3-Tier Administration Access Control:
 * 1. Super Admin (super_admin, root: admin123):
 *    - Full privileges across all domains.
 *    - Can download files/exports, generate reports, delete accounts, suspend/unsuspend, and manage admin accounts.
 * 2. Mod Admin (moderator / mod_admin):
 *    - Can view all dashboard records, download files/exports, and generate reports.
 *    - Strictly forbidden from deleting accounts, removing artworks, or suspending users.
 * 3. Simple Admin (admin / simple_admin):
 *    - Read-only inspection across all dashboard sections.
 *    - Strictly forbidden from downloading files, generating reports, deleting accounts, or suspending users.
 */

export type AppRole =
  | "super_admin"
  | "admin"
  | "moderator"
  | "creator"
  | "collector"
  | "user"
  | "anonymous";

export type Permission =
  | "report:view"
  | "report:create"
  | "report:resolve"
  | "report:dismiss"
  | "artwork:view_all"
  | "artwork:hide"
  | "artwork:remove"
  | "user:view_all"
  | "user:suspend"
  | "user:manage"
  | "user:change_role"
  | "analytics:view"
  | "audit:view"
  | "audit:export"
  | "report:generate"
  | "settings:manage"
  | "admin:manage"
  | "cor:view"
  | "cor:manage"
  | "cor:approve_request"
  | "cor:decline_request"
  | "cor:apply"
  | "cor:update_application"
  | "cor:manage_opportunities"
  | "careers:view"
  | "careers:manage";

const ROLE_PERMISSIONS: Record<AppRole, readonly Permission[]> = {
  super_admin: [
    "report:view",
    "report:create",
    "report:resolve",
    "report:dismiss",
    "artwork:view_all",
    "artwork:hide",
    "artwork:remove",
    "user:view_all",
    "user:suspend",
    "user:manage",
    "user:change_role",
    "analytics:view",
    "audit:view",
    "audit:export",
    "report:generate",
    "settings:manage",
    "admin:manage",
    "cor:view",
    "cor:manage",
    "cor:approve_request",
    "cor:decline_request",
    "cor:apply",
    "cor:update_application",
    "cor:manage_opportunities",
    "careers:view",
    "careers:manage",
  ],
  moderator: [
    // Mod Admin: can view, download files/exports, and generate reports, but CANNOT delete or suspend
    "report:view",
    "report:create",
    "report:resolve",
    "report:dismiss",
    "artwork:view_all",
    "artwork:hide",
    "analytics:view",
    "audit:view",
    "audit:export",
    "report:generate",
    "cor:view",
    "careers:view",
  ],
  admin: [
    // Simple Admin: view-only across all sections (cannot download files, cannot delete, cannot suspend)
    "report:view",
    "artwork:view_all",
    "user:view_all",
    "analytics:view",
    "audit:view",
    "cor:view",
    "careers:view",
  ],
  creator: ["report:create"],
  collector: ["report:create"],
  user: ["report:create"],
  anonymous: [],
};

const ROLE_HIERARCHY: Record<AppRole, number> = {
  super_admin: 100,
  moderator: 60,
  admin: 40,
  creator: 20,
  collector: 20,
  user: 10,
  anonymous: 0,
};

/**
 * Normalizes input role strings safely to a recognized AppRole.
 */
export function normalizeRole(role: string | undefined | null): AppRole {
  if (!role) return "anonymous";
  const r = role.toLowerCase().trim().replace(/[\s_-]+/g, "");
  if (r === "superadmin" || r === "super_admin") return "super_admin";
  if (r === "moderator" || r === "mod" || r === "modadmin" || r === "mod_admin") return "moderator";
  if (r === "admin" || r === "simpleadmin" || r === "simple_admin" || r === "administrator") return "admin";
  if (r === "creator") return "creator";
  if (r === "collector") return "collector";
  if (r === "user") return "user";
  return "anonymous";
}

/**
 * Validates if a role has the specified permission.
 */
export function hasPermission(role: string | undefined | null, permission: Permission): boolean {
  const normalized = normalizeRole(role);
  const permissions = ROLE_PERMISSIONS[normalized] || [];
  return permissions.includes(permission);
}

/**
 * Checks if a role is authorized for administrative dashboard access.
 */
export function isAdminOrModerator(role: string | undefined | null): boolean {
  const normalized = normalizeRole(role);
  return normalized === "super_admin" || normalized === "admin" || normalized === "moderator";
}

/**
 * Role query helper functions
 */
export function isSuperAdmin(role: string | undefined | null): boolean {
  return normalizeRole(role) === "super_admin";
}

export function isModAdmin(role: string | undefined | null): boolean {
  return normalizeRole(role) === "moderator";
}

export function isSimpleAdmin(role: string | undefined | null): boolean {
  return normalizeRole(role) === "admin";
}

export function canDownloadFiles(role: string | undefined | null): boolean {
  return hasPermission(role, "audit:export");
}

export function canGenerateReports(role: string | undefined | null): boolean {
  return hasPermission(role, "report:generate");
}

export function canDeleteOrSuspend(role: string | undefined | null): boolean {
  return isSuperAdmin(role);
}

export function canManageAdminAccounts(role: string | undefined | null): boolean {
  return hasPermission(role, "admin:manage");
}

export function getRoleDisplayName(role: string | undefined | null): string {
  const norm = normalizeRole(role);
  switch (norm) {
    case "super_admin":
      return "Super Admin";
    case "moderator":
      return "Mod Admin";
    case "admin":
      return "Simple Admin";
    case "creator":
      return "Creator";
    case "collector":
      return "Collector";
    default:
      return "User";
  }
}

/**
 * Enforces role hierarchy for sensitive moderation actions.
 * Only Super Admin accounts can delete or suspend users and records.
 */
export function canModerateTarget(
  actorRole: string | undefined | null,
  targetRole: string | undefined | null,
  isSelf: boolean
): { allowed: boolean; reason?: string } {
  if (isSelf) {
    return { allowed: false, reason: "Self-moderation and self-suspension are strictly prohibited." };
  }

  const actor = normalizeRole(actorRole);
  const target = normalizeRole(targetRole);

  const actorScore = ROLE_HIERARCHY[actor] || 0;
  const targetScore = ROLE_HIERARCHY[target] || 0;

  if (actor !== "super_admin") {
    return {
      allowed: false,
      reason: "Account suspension and deletion are restricted strictly to Super Administrators.",
    };
  }

  if (actorScore <= targetScore && actor !== "super_admin") {
    return {
      allowed: false,
      reason: "Administrators cannot suspend or modify users of equal or higher administrative rank.",
    };
  }

  return { allowed: true };
}
