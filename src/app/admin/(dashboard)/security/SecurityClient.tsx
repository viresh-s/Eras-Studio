"use client";

import React, { useState } from "react";
import {
  RefreshCw,
  Users,
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  Trash2,
  Crown,
  Eye,
  Download,
  Ban,
  CheckCircle2,
  XCircle,
  X,
  AlertTriangle,
  Lock,
} from "lucide-react";
import {
  SecurityIcon,
  VerifiedCheckIcon,
  UsersIcon,
} from "@/components/admin/icons";
import {
  SecurityCentreData,
  AdminAccountItem,
  getAdminSecurityOverviewAction,
  createAdminAccountAction,
  deleteAdminAccountAction,
  updateAdminAccountRoleAction,
} from "@/app/admin/security-actions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui";

interface SecurityClientProps {
  initialData: SecurityCentreData;
}

type TabType = "admins" | "audit";

function formatTimestamp(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch {
    return isoStr;
  }
}

export function SecurityClient({ initialData }: SecurityClientProps) {
  const toast = useToast();
  const [data, setData] = useState<SecurityCentreData>(initialData);
  const [activeTab, setActiveTab] = useState<TabType>("admins");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Create Admin Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
    role: "admin" as "super_admin" | "moderator" | "admin",
  });
  const [isCreating, setIsCreating] = useState(false);

  // Delete Admin Modal State
  const [deleteTarget, setDeleteTarget] = useState<AdminAccountItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Role updating state
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);

  const isCurrentSuperAdmin = Boolean(
    data.currentAdmin?.isSuperAdmin ||
      data.currentAdmin?.role === "super_admin" ||
      data.currentAdmin?.username?.toLowerCase() === "admin123"
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await getAdminSecurityOverviewAction();
      if (res.success && res.data) {
        setData(res.data);
        toast.success("Security Centre updated with live telemetry.");
      } else {
        toast.error(res.error || "Failed to refresh telemetry.");
      }
    } catch {
      toast.error("Failed to refresh security metrics.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.username.trim() || !createForm.email.trim() || !createForm.password.trim()) {
      toast.error("Validation error", "Username, email, and password are required.");
      return;
    }

    if (createForm.password.length < 6) {
      toast.error("Password error", "Password must be at least 6 characters.");
      return;
    }

    setIsCreating(true);
    try {
      const res = await createAdminAccountAction({
        username: createForm.username.trim(),
        displayName: createForm.name.trim() || createForm.username.trim(),
        email: createForm.email.trim(),
        password: createForm.password.trim(),
        role: createForm.role,
      });

      if (res.success && res.account) {
        toast.success("Admin created", `Account @${res.account.username} created successfully.`);
        setData((prev) => ({
          ...prev,
          adminAccounts: [...prev.adminAccounts, res.account!],
        }));
        setIsCreateModalOpen(false);
        setCreateForm({
          username: "",
          name: "",
          email: "",
          password: "",
          role: "admin",
        });
      } else {
        toast.error("Creation failed", res.error || "Could not create administrator account.");
      }
    } catch {
      toast.error("Network error", "Failed to communicate with server.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const res = await deleteAdminAccountAction(deleteTarget.id);
      if (res.success) {
        toast.success("Admin deleted", `Account @${deleteTarget.username} has been removed.`);
        setData((prev) => ({
          ...prev,
          adminAccounts: prev.adminAccounts.filter((a) => a.id !== deleteTarget.id),
        }));
        setDeleteTarget(null);
      } else {
        toast.error("Deletion failed", res.error || "Could not delete administrator account.");
      }
    } catch {
      toast.error("Network error", "Failed to delete account.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRoleChange = async (adminId: string, newRole: "super_admin" | "moderator" | "admin") => {
    setUpdatingRoleId(adminId);
    try {
      const res = await updateAdminAccountRoleAction(adminId, newRole);
      if (res.success) {
        toast.success("Role updated", "Administrator privileges updated successfully.");
        setData((prev) => ({
          ...prev,
          adminAccounts: prev.adminAccounts.map((a) =>
            a.id === adminId
              ? {
                  ...a,
                  role: newRole,
                  roleDisplay:
                    newRole === "super_admin"
                      ? "Super Admin"
                      : newRole === "moderator"
                      ? "Mod Admin"
                      : "Simple Admin",
                }
              : a
          ),
        }));
      } else {
        toast.error("Update failed", res.error || "Could not update administrator role.");
      }
    } catch {
      toast.error("Network error", "Failed to update role.");
    } finally {
      setUpdatingRoleId(null);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-normal text-[#141413] tracking-tight"
            style={{
              fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif",
              fontStyle: "italic",
            }}
          >
            Security Centre.
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            isLoading={isRefreshing}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            className="rounded-full bg-white border-[#E8E8E3] text-[#141413] hover:bg-[#F7F7F5] text-xs"
          >
            Refresh Telemetry
          </Button>
        </div>
      </div>

      {/* Navigation Tabs (Authorised Admins & Audit Log) */}
      <div className="flex items-center gap-2 border-b border-[#E8E8E3] pb-2 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab("admins")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors cursor-pointer ${
            activeTab === "admins"
              ? "bg-[#141413] text-white"
              : "text-[#71716D] hover:text-[#141413] hover:bg-[#F3F3EF]"
          }`}
        >
          <UsersIcon size={14} className="stroke-[1.75]" />
          <span>Admin Access ({data.adminAccounts.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors cursor-pointer ${
            activeTab === "audit"
              ? "bg-[#141413] text-white"
              : "text-[#71716D] hover:text-[#141413] hover:bg-[#F3F3EF]"
          }`}
        >
          <SecurityIcon size={14} className="stroke-[1.75]" />
          <span>Audit Log Stream ({data.recentEvents.length})</span>
        </button>
      </div>

      {/* SECTION 1: AUTHORISED ADMINISTRATORS & ACCESS CONTROL */}
      {activeTab === "admins" && (
        <div className="space-y-6">
          {/* 3-Tier Role Capabilities Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Super Admin Card */}
            <div className="bg-white rounded-2xl border border-[#141413]/10 p-5 shadow-2xs relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-black text-white">
                      <Crown className="w-4 h-4" />
                    </span>
                    <h4 className="text-sm font-semibold text-[#141413]">Super Admin</h4>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-black text-white">
                    Full Control
                  </span>
                </div>
                <p className="text-xs text-[#71716D]">
                  Root administrator privileges (<span className="font-mono font-medium text-[#141413]">admin123</span>). Complete administrative authority.
                </p>
                <div className="pt-2 border-t border-[#E8E8E3] space-y-1.5 text-xs text-[#141413]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Download files & CSV data exports</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Generate studio performance reports</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Delete accounts, artworks & records</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Suspend & unsuspend user accounts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Create, assign & delete admin accounts</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mod Admin Card */}
            <div className="bg-white rounded-2xl border border-blue-200/80 p-5 shadow-2xs relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                      <ShieldCheck className="w-4 h-4" />
                    </span>
                    <h4 className="text-sm font-semibold text-[#141413]">Mod Admin</h4>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    Moderator
                  </span>
                </div>
                <p className="text-xs text-[#71716D]">
                  Operational moderation and analytical reporting. Can view & download data, but cannot delete or suspend.
                </p>
                <div className="pt-2 border-t border-[#E8E8E3] space-y-1.5 text-xs text-[#141413]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Download files & CSV data exports</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Generate studio performance reports</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>View all catalog & creator data</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#71716D]">
                    <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>Cannot delete accounts or artworks</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#71716D]">
                    <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>Cannot suspend users</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Simple Admin Card */}
            <div className="bg-white rounded-2xl border border-[#E8E8E3] p-5 shadow-2xs relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-gray-100 text-gray-700 border border-gray-200">
                      <Eye className="w-4 h-4" />
                    </span>
                    <h4 className="text-sm font-semibold text-[#141413]">Simple Admin</h4>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                    View Only
                  </span>
                </div>
                <p className="text-xs text-[#71716D]">
                  Read-only view access across all studio dashboard pages. Cannot download or mutate records.
                </p>
                <div className="pt-2 border-t border-[#E8E8E3] space-y-1.5 text-xs text-[#141413]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>View all studio dashboard pages</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#71716D]">
                    <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>Cannot download files or export data</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#71716D]">
                    <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>Cannot generate performance reports</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#71716D]">
                    <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>Cannot delete accounts or artworks</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#71716D]">
                    <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>Cannot suspend users</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Accounts Table Container */}
          <div className="bg-white rounded-2xl border border-[#E8E8E3] overflow-hidden shadow-2xs">
            <div className="p-5 border-b border-[#E8E8E3] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-[#141413]">Admin Accounts & Roles</h3>
                <p className="text-xs text-[#71716D] mt-0.5">
                  Manage administrator identities, role assignments, and dashboard capabilities.
                </p>
              </div>

              {isCurrentSuperAdmin && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(true)}
                  leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                  className="rounded-full bg-[#141413] text-white hover:bg-black text-xs shrink-0 cursor-pointer"
                >
                  Create Admin Account
                </Button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF9F5] text-[#71716D] font-medium border-b border-[#E8E8E3]">
                  <tr>
                    <th className="py-3 px-4">Administrator</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Permissions Summary</th>
                    <th className="py-3 px-4">Status & Security</th>
                    {isCurrentSuperAdmin && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E8E3]">
                  {data.adminAccounts.map((admin) => {
                    const isRoot = admin.isRoot || admin.username.toLowerCase() === "admin123";
                    const isSelf = data.currentAdmin?.id === admin.id;

                    return (
                      <tr key={admin.id} className="hover:bg-[#FAF9F5]/60 transition-colors">
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#F3F3EF] border border-[#E8E8E3] flex items-center justify-center font-semibold text-xs text-[#141413]">
                              {admin.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-[#141413]">{admin.name}</span>
                                {isRoot && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                    Root Super Admin
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] font-mono text-[#71716D]">@{admin.username}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-[#71716D] font-mono text-[11px]">
                          {admin.email}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isCurrentSuperAdmin && !isRoot ? (
                            <select
                              value={admin.role}
                              disabled={updatingRoleId === admin.id}
                              onChange={(e) => handleRoleChange(admin.id, e.target.value as any)}
                              className="text-xs px-2.5 py-1 rounded-lg border border-[#E8E8E3] bg-white text-[#141413] font-medium hover:border-[#141413] focus:outline-none cursor-pointer"
                            >
                              <option value="super_admin">Super Admin</option>
                              <option value="moderator">Mod Admin</option>
                              <option value="admin">Simple Admin</option>
                            </select>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                                admin.role === "super_admin"
                                  ? "bg-[#141413] text-white border-black"
                                  : admin.role === "moderator"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-gray-100 text-gray-700 border-gray-200"
                              }`}
                            >
                              {admin.role === "super_admin" && <Crown className="w-3 h-3 text-amber-400" />}
                              {admin.role === "moderator" && <ShieldCheck className="w-3 h-3 text-blue-600" />}
                              {admin.role === "admin" && <Eye className="w-3 h-3 text-gray-500" />}
                              <span>{admin.roleDisplay}</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-[#71716D] text-[11px] max-w-xs">
                          {admin.role === "super_admin" && (
                            <span className="text-[#141413] font-medium">
                              Full access (Download files, reports, delete accounts, suspend users, manage admins)
                            </span>
                          )}
                          {admin.role === "moderator" && (
                            <span>
                              Download files & reports (Cannot delete accounts or suspend users)
                            </span>
                          )}
                          {admin.role === "admin" && (
                            <span>
                              View-only access (No file downloads, no delete, no suspend)
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200 flex items-center gap-1">
                              <VerifiedCheckIcon size={11} className="text-emerald-600" />
                              MFA Active
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-700 font-medium border border-gray-200 capitalize">
                              {admin.status}
                            </span>
                          </div>
                        </td>

                        {isCurrentSuperAdmin && (
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            {isRoot ? (
                              <span className="text-[11px] text-[#A1A19D] italic px-2">Permanent</span>
                            ) : (
                              <button
                                onClick={() => setDeleteTarget(admin)}
                                disabled={isSelf}
                                title={isSelf ? "Cannot delete self" : "Delete admin account"}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  isSelf
                                    ? "text-[#D1D1CB] cursor-not-allowed"
                                    : "text-[#71716D] hover:text-red-600 hover:bg-red-50"
                                }`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: AUDIT LOG STREAM */}
      {activeTab === "audit" && (
        <div className="bg-white rounded-2xl border border-[#E8E8E3] overflow-hidden shadow-2xs">
          <div className="p-5 border-b border-[#E8E8E3] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#141413]">Recent Security Audit Events</h3>
              <p className="text-xs text-[#71716D] mt-0.5">
                Redacted, immutable audit trail of system operations and security actions.
              </p>
            </div>
            <span className="text-xs text-[#71716D]">{data.recentEvents.length} events logged</span>
          </div>

          {data.recentEvents.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#71716D]">
              No security anomalies or warning events recorded in the current session.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF9F5] text-[#71716D] font-medium border-b border-[#E8E8E3]">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Level</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Actor ID</th>
                    <th className="py-3 px-4">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E8E3]">
                  {data.recentEvents.map((evt) => (
                    <tr key={evt.id} className="hover:bg-[#FAF9F5]/60 transition-colors">
                      <td className="py-3 px-4 text-[#71716D] whitespace-nowrap">
                        {formatTimestamp(evt.timestamp)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            evt.level === "SECURITY_ALERT" || evt.level === "ERROR"
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : evt.level === "SECURITY_AUDIT" || evt.level === "WARN"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {evt.level}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-[#141413]">{evt.action}</td>
                      <td className="py-3 px-4 text-[#71716D] font-mono text-[11px] truncate max-w-[140px]">
                        {evt.userId}
                      </td>
                      <td className="py-3 px-4 text-[#71716D] font-mono text-[11px]">{evt.ip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CREATE ADMIN ACCOUNT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-[#E8E8E3] shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-[#E8E8E3] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#141413]">Create Admin Account</h3>
                <p className="text-xs text-[#71716D] mt-0.5">
                  Grant administrative access to Eras Studio dashboard.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-[#71716D] hover:text-[#141413] hover:bg-[#F3F3EF] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Username <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. curator_mod"
                  value={createForm.username}
                  onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-[#E8E8E3] bg-[#FAF9F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">Display Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Curator"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-[#E8E8E3] bg-[#FAF9F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. sarah@erasstudio.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-[#E8E8E3] bg-[#FAF9F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#141413] mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-[#E8E8E3] bg-[#FAF9F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#141413] mb-2">
                  Assigned Administrative Role <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-2">
                  <label
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                      createForm.role === "super_admin"
                        ? "border-[#141413] bg-[#FAF9F5]"
                        : "border-[#E8E8E3] hover:bg-[#FAF9F5]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="super_admin"
                      checked={createForm.role === "super_admin"}
                      onChange={() => setCreateForm({ ...createForm, role: "super_admin" })}
                      className="mt-0.5 accent-black"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-[#141413]">Super Admin</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-black text-white font-medium">Full Access</span>
                      </div>
                      <p className="text-[11px] text-[#71716D] mt-0.5">
                        Can download files, delete accounts, suspend users, generate reports, and manage admins.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                      createForm.role === "moderator"
                        ? "border-blue-500 bg-blue-50/30"
                        : "border-[#E8E8E3] hover:bg-[#FAF9F5]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="moderator"
                      checked={createForm.role === "moderator"}
                      onChange={() => setCreateForm({ ...createForm, role: "moderator" })}
                      className="mt-0.5 accent-blue-600"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-[#141413]">Mod Admin</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-medium border border-blue-200">
                          Moderator
                        </span>
                      </div>
                      <p className="text-[11px] text-[#71716D] mt-0.5">
                        Can view and download files & reports, but cannot delete or suspend accounts.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                      createForm.role === "admin"
                        ? "border-[#141413] bg-[#FAF9F5]"
                        : "border-[#E8E8E3] hover:bg-[#FAF9F5]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={createForm.role === "admin"}
                      onChange={() => setCreateForm({ ...createForm, role: "admin" })}
                      className="mt-0.5 accent-black"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-[#141413]">Simple Admin</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-100 text-gray-700 font-medium border border-gray-200">
                          View Only
                        </span>
                      </div>
                      <p className="text-[11px] text-[#71716D] mt-0.5">
                        Read-only access across all dashboard pages. Cannot download files or modify records.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E8E8E3] flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isCreating}
                  className="rounded-xl bg-[#141413] text-white hover:bg-black text-xs cursor-pointer"
                >
                  Create Admin
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE ADMIN CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-[#E8E8E3] shadow-xl w-full max-w-sm overflow-hidden p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-full bg-red-50 text-red-600 border border-red-200">
                <AlertTriangle className="w-5 h-5" />
              </span>
              <div>
                <h4 className="text-sm font-semibold text-[#141413]">Delete Administrator</h4>
                <p className="text-xs text-[#71716D]">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-[#141413] leading-relaxed">
              Are you sure you want to permanently delete administrative access for{" "}
              <span className="font-semibold">{deleteTarget.name}</span> (
              <span className="font-mono text-[11px]">@{deleteTarget.username}</span>)?
            </p>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteAdmin}
                isLoading={isDeleting}
                className="rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs cursor-pointer"
              >
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
