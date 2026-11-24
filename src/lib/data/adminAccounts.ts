import { getSupabaseAdmin } from "@/lib/supabase/server";
import { AppRole, normalizeRole } from "@/lib/security/rbac";

function generateSecureUUID(): string {
  if (typeof globalThis.crypto !== "undefined" && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface AdminAccount {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: "super_admin" | "moderator" | "admin";
  isActive: boolean;
  isRoot?: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  sessionIsActive?: boolean;
}

// Initial predefined administrators (always preserved and guaranteed)
const INITIAL_ADMINS: AdminAccount[] = [
  {
    id: "d39b6c46-017a-4f75-a1d1-d1d626a00cdd",
    username: "admin123",
    email: "admin123@internal.eras.studio",
    displayName: "System Admin (01)",
    role: "super_admin",
    isActive: true,
    isRoot: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "301aa580-9e64-4db8-af01-149685998077",
    username: "admin@eras.com",
    email: "admin@eras.com",
    displayName: "Executive Admin (02)",
    role: "super_admin",
    isActive: true,
    isRoot: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

// Server-side synchronized in-memory registry
let memoryAdminAccounts: AdminAccount[] = [...INITIAL_ADMINS];

export const adminAccountsRepo = {
  /**
   * List all admin accounts, ordered by creation date.
   * Merges database records with in-memory store and ensures admin123 is super_admin.
   */
  async list(): Promise<AdminAccount[]> {
    try {
      const adminSupabase = getSupabaseAdmin();
      if (adminSupabase) {
        const { data: dbRecords, error } = await (adminSupabase.from("admin_accounts" as any) as any)
          .select("*")
          .order("created_at", { ascending: true });

        if (!error && Array.isArray(dbRecords) && dbRecords.length > 0) {
          const mapped: AdminAccount[] = dbRecords.map((row: any) => {
            const isRoot = row.username?.toLowerCase() === "admin123";
            return {
              id: row.id,
              username: row.username,
              email: row.email,
              displayName: row.display_name || row.username,
              role: isRoot ? "super_admin" : (normalizeRole(row.role) as "super_admin" | "moderator" | "admin"),
              isActive: row.is_active ?? true,
              isRoot,
              createdAt: row.created_at || new Date().toISOString(),
              updatedAt: row.updated_at || new Date().toISOString(),
              lastLoginAt: row.session_last_activity_at || undefined,
              sessionIsActive: Boolean(row.session_is_active),
            };
          });

          // Ensure memory-created accounts that haven't hit DB are also included
          for (const mem of memoryAdminAccounts) {
            if (!mapped.some((m) => m.id === mem.id || m.username.toLowerCase() === mem.username.toLowerCase())) {
              mapped.push(mem);
            }
          }

          // Always ensure admin123 is present
          if (!mapped.some((m) => m.username.toLowerCase() === "admin123")) {
            mapped.unshift(INITIAL_ADMINS[0]);
          }

          memoryAdminAccounts = mapped;
          return mapped;
        }
      }
    } catch (err) {
      console.warn("adminAccountsRepo.list fallback to in-memory store:", err);
    }

    return [...memoryAdminAccounts];
  },

  /**
   * Find admin account by ID
   */
  async getById(id: string): Promise<AdminAccount | null> {
    const list = await this.list();
    return list.find((a) => a.id === id) || null;
  },

  /**
   * Find admin account by username (case-insensitive)
   */
  async getByUsername(username: string): Promise<AdminAccount | null> {
    const clean = (username || "").trim().toLowerCase();
    const list = await this.list();
    return list.find((a) => a.username.toLowerCase() === clean) || null;
  },

  /**
   * Find admin account by email (case-insensitive)
   */
  async getByEmail(email: string): Promise<AdminAccount | null> {
    const clean = (email || "").trim().toLowerCase();
    const list = await this.list();
    return list.find((a) => a.email.toLowerCase() === clean) || null;
  },

  /**
   * Check if identifier (username or email) matches any active admin account
   */
  async hasAccount(identifier: string): Promise<boolean> {
    const clean = (identifier || "").trim().toLowerCase();
    const list = await this.list();
    return list.some(
      (a) => a.isActive && (a.username.toLowerCase() === clean || a.email.toLowerCase() === clean)
    );
  },

  /**
   * Create a new administrative account
   */
  async create(data: {
    username: string;
    email: string;
    password?: string;
    displayName?: string;
    role: "super_admin" | "moderator" | "admin";
  }): Promise<{ success: boolean; account?: AdminAccount; error?: string }> {
    const username = data.username.trim().toLowerCase();
    const email = data.email.trim().toLowerCase();
    const displayName = (data.displayName || data.username).trim();
    const role = normalizeRole(data.role) as "super_admin" | "moderator" | "admin";

    // Validate username
    if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(username)) {
      return {
        success: false,
        error: "Username must be 3-30 characters long and contain only letters, numbers, underscores, dashes, or dots.",
      };
    }

    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: "Invalid email address format." };
    }

    // Check duplicate
    const existing = await this.list();
    if (existing.some((a) => a.username.toLowerCase() === username)) {
      return { success: false, error: `An admin account with username '${username}' already exists.` };
    }
    if (existing.some((a) => a.email.toLowerCase() === email)) {
      return { success: false, error: `An admin account with email '${email}' already exists.` };
    }

    let assignedId: string = generateSecureUUID();

    // Supabase Auth and Table Sync
    try {
      const adminSupabase = getSupabaseAdmin();
      if (adminSupabase) {
        if (data.password && data.password.length >= 6) {
          const { data: authUser, error: authErr } = await adminSupabase.auth.admin.createUser({
            email,
            password: data.password,
            email_confirm: true,
            user_metadata: {
              username,
              role: "Admin",
              admin_role: role,
              full_name: displayName,
            },
          });

          if (authUser?.user) {
            assignedId = authUser.user.id;
          } else if (authErr) {
            console.warn("Notice: Supabase admin auth createUser notice:", authErr.message);
          }
        }

        // Insert into public.profiles
        await (adminSupabase.from("profiles" as any) as any).upsert({
          id: assignedId,
          full_name: displayName,
          email,
          role: "Admin",
          status: "active",
          updated_at: new Date().toISOString(),
        });

        // Insert into public.admin_accounts
        await (adminSupabase.from("admin_accounts" as any) as any).upsert({
          id: assignedId,
          username,
          email,
          display_name: displayName,
          role,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      console.warn("adminAccountsRepo.create database persistence warning:", err.message);
    }

    const newAccount: AdminAccount = {
      id: assignedId,
      username,
      email,
      displayName,
      role,
      isActive: true,
      isRoot: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    memoryAdminAccounts.push(newAccount);
    return { success: true, account: newAccount };
  },

  /**
   * Delete an administrative account
   * Root Super Admin (admin123) is permanently immutable and cannot be deleted.
   */
  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    const list = await this.list();
    const target = list.find((a) => a.id === id);

    if (!target) {
      return { success: false, error: "Admin account not found." };
    }

    if (target.username.toLowerCase() === "admin123" || target.isRoot) {
      return { success: false, error: "The primary Super Admin account (admin123) cannot be deleted." };
    }

    try {
      const adminSupabase = getSupabaseAdmin();
      if (adminSupabase) {
        await (adminSupabase.from("admin_accounts" as any) as any).delete().eq("id", id);
        await adminSupabase.from("profiles" as any).delete().eq("id", id);
        await adminSupabase.auth.admin.deleteUser(id).catch(() => {});
      }
    } catch (err: any) {
      console.warn("adminAccountsRepo.delete database notice:", err.message);
    }

    memoryAdminAccounts = memoryAdminAccounts.filter((a) => a.id !== id);
    return { success: true };
  },

  /**
   * Update the role of an administrative account
   * Root Super Admin (admin123) is permanently immutable and cannot have its role modified.
   */
  async updateRole(
    id: string,
    newRole: "super_admin" | "moderator" | "admin"
  ): Promise<{ success: boolean; account?: AdminAccount; error?: string }> {
    const list = await this.list();
    const target = list.find((a) => a.id === id);

    if (!target) {
      return { success: false, error: "Admin account not found." };
    }

    if (target.username.toLowerCase() === "admin123" || target.isRoot) {
      return { success: false, error: "The role of the primary Super Admin (admin123) cannot be modified." };
    }

    const role = normalizeRole(newRole) as "super_admin" | "moderator" | "admin";

    try {
      const adminSupabase = getSupabaseAdmin();
      if (adminSupabase) {
        await (adminSupabase.from("admin_accounts" as any) as any)
          .update({ role, updated_at: new Date().toISOString() })
          .eq("id", id);

        await adminSupabase.auth.admin
          .updateUserById(id, {
            user_metadata: { admin_role: role },
          })
          .catch(() => {});
      }
    } catch (err: any) {
      console.warn("adminAccountsRepo.updateRole database notice:", err.message);
    }

    target.role = role;
    target.updatedAt = new Date().toISOString();

    memoryAdminAccounts = memoryAdminAccounts.map((a) => (a.id === id ? { ...a, role, updatedAt: target.updatedAt } : a));

    return { success: true, account: target };
  },
};
