"use client";

import React, { useState, useMemo } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  Ban,
  CheckCircle,
  AlertTriangle,
  User as UserIcon,
} from "lucide-react";
import { User, UserStatus } from "@/lib/types";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Modal } from "@/components/ui/Modal";
import { ExportDropdown } from "@/components/admin/ExportDropdown";
import { FilterBar } from "@/components/ui/FilterBar";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui";
import { updateUserAction, deleteUserAction } from "@/app/admin/actions";

interface UsersClientProps {
  initialUsers: User[];
}

type TabType = "all" | "creators" | "collectors" | "free" | "elite" | "pro";
type SortField = "name" | "email" | "role" | "plan" | "status" | "createdAt";
type SortDirection = "asc" | "desc";

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

function getInitials(name: string): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UsersClient({ initialUsers }: UsersClientProps) {
  const toast = useToast();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Sorting state
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Drawer & selected user state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Delete confirmation modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Tab definitions
  const tabs: { id: TabType; label: string; count: number }[] = [
    { id: "all", label: "All Members", count: users.length },
    {
      id: "creators",
      label: "Creators",
      count: users.filter((u) => u.role === "creator").length,
    },
    {
      id: "collectors",
      label: "Collectors",
      count: users.filter((u) => u.role === "collector").length,
    },
    {
      id: "free",
      label: "Free Plan",
      count: users.filter((u) => u.plan === "free").length,
    },
    {
      id: "elite",
      label: "Elite Plan",
      count: users.filter((u) => u.plan === "elite").length,
    },
    {
      id: "pro",
      label: "Pro Plan",
      count: users.filter((u) => u.plan === "pro").length,
    },
  ];

  // Filtering
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Tab filter
      if (activeTab === "creators" && user.role !== "creator") return false;
      if (activeTab === "collectors" && user.role !== "collector") return false;
      if (activeTab === "free" && user.plan !== "free") return false;
      if (activeTab === "elite" && user.plan !== "elite") return false;
      if (activeTab === "pro" && user.plan !== "pro") return false;

      // Search query (name or email)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = user.name.toLowerCase().includes(q);
        const matchesEmail = user.email.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail) return false;
      }

      return true;
    });
  }, [users, activeTab, searchQuery]);

  // Sorting
  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      let aVal = a[sortField] || "";
      let bVal = b[sortField] || "";

      if (sortField === "createdAt") {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return sortDirection === "asc" ? timeA - timeB : timeB - timeA;
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return 0;
    });
  }, [filteredUsers, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / pageSize));
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedUsers.slice(start, start + pageSize);
  }, [sortedUsers, currentPage, pageSize]);

  // Handle Sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-[#A0A09B] opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="w-3 h-3 text-[#865E16]" />
    ) : (
      <ArrowDown className="w-3 h-3 text-[#865E16]" />
    );
  };

  // Open User Drawer
  const handleRowClick = (user: User) => {
    setSelectedUser(user);
    setIsDrawerOpen(true);
  };

  // Suspend / Reactivate action
  const handleToggleStatus = async () => {
    if (!selectedUser) return;
    const nextStatus: UserStatus =
      selectedUser.status === "active" ? "suspended" : "active";
    const previousUser = { ...selectedUser };

    const updatedUser = { ...selectedUser, status: nextStatus };
    setSelectedUser(updatedUser);
    setUsers((prev) =>
      prev.map((u) => (u.id === selectedUser.id ? updatedUser : u))
    );

    setIsUpdatingStatus(true);
    try {
      const res = await updateUserAction(selectedUser.id, { status: nextStatus });
      if (!res.success) {
        setSelectedUser(previousUser);
        setUsers((prev) =>
          prev.map((u) => (u.id === selectedUser.id ? previousUser : u))
        );
        toast.error("Failed to update status", res.error || "Please try again.");
      } else {
        toast.success(
          nextStatus === "suspended" ? "User suspended" : "Suspension reverted",
          nextStatus === "suspended"
            ? `${selectedUser.name} has been suspended.`
            : `Suspension reverted. ${selectedUser.name} is active.`
        );
      }
    } catch {
      setSelectedUser(previousUser);
      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? previousUser : u))
      );
      toast.error("Network error", "Could not complete status update.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Delete User action
  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    const targetId = selectedUser.id;
    const deletedName = selectedUser.name;
    const previousUsers = [...users];

    setUsers((prev) => prev.filter((u) => u.id !== targetId));
    setIsDeleteModalOpen(false);
    setIsDrawerOpen(false);
    setSelectedUser(null);

    setIsDeleting(true);
    try {
      const res = await deleteUserAction(targetId);
      if (!res.success) {
        setUsers(previousUsers);
        toast.error("Failed to delete user", res.error || "Could not delete user.");
      } else {
        toast.success("User deleted", `${deletedName} was permanently removed.`);
      }
    } catch {
      setUsers(previousUsers);
      toast.error("Network error", "Could not complete deletion.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Page Title & Stats Badge */}
      <div className="border-b border-[#E8E8E3] pb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/80 rounded-full text-[11px] font-semibold tracking-[0.2em] text-[#73736C] uppercase border border-[#E8E8E3] mb-3 shadow-2xs font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-[#865E16]" />
            COMMUNITY & ACCESS ROSTER
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-[#141413]">
            Users & <span className="italic font-normal">Patrons.</span>
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-[#6E6E69] max-w-2xl leading-relaxed">
            Manage creator profiles, collectors, plan tiers, and platform permissions.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
          <ExportDropdown exportType="users" filters={{ query: searchQuery, role: activeTab === "all" ? undefined : activeTab }} />
          <div className="text-xs px-3.5 py-1.5 rounded-full border border-[#E8E8E3] bg-white text-[#6E6E69] font-medium shadow-2xs">
            Total: <span className="text-[#141413] font-semibold">{users.length} members</span>
          </div>
        </div>
      </div>

      {/* Tabs Filter (Pill design matching Eras Studio) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none select-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setCurrentPage(1);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer select-none whitespace-nowrap shadow-2xs ${
                isActive
                  ? "bg-[#141413] text-white shadow-xs"
                  : "bg-white text-[#6E6E69] border border-[#E8E8E3] hover:text-[#141413] hover:bg-[#FAF5EC]"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isActive
                    ? "bg-white text-[#141413]"
                    : "bg-[#FAF5EC] text-[#865E16] border border-[#ECDDBB]"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Reusable FilterBar (Search input) */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search users by name or email..."
        hasActiveFilters={Boolean(searchQuery)}
        onResetFilters={() => setSearchQuery("")}
        className="rounded-2xl border border-[#E8E8E3] bg-white shadow-soft-sm p-4"
      >
        <span className="text-xs text-[#71716D]">
          {sortedUsers.length} {sortedUsers.length === 1 ? "member" : "members"} found
        </span>
      </FilterBar>

      {/* Table Container */}
      {sortedUsers.length === 0 ? (
        <EmptyState
          icon={<UserIcon className="w-5 h-5 text-[#8A8A85]" />}
          title="No users found"
          description={
            searchQuery
              ? `No user matched "${searchQuery}". Try adjusting your keywords or clearing the filter.`
              : "There are no users in this tab category yet."
          }
          action={
            searchQuery ? (
              <Button
                variant="outline"
                size="sm"
                className="rounded-full px-5"
                onClick={() => setSearchQuery("")}
              >
                Clear Search
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#E8E8E3] shadow-soft-sm overflow-hidden">
            <Table className="border-none">
              <TableHeader className="bg-[#FAF5EC]/70 border-b border-[#E8E8E3]">
                <tr>
                  <TableHead>
                    <button
                      onClick={() => handleSort("name")}
                      className="group inline-flex items-center gap-1.5 hover:text-[#141413] cursor-pointer"
                    >
                      <span>Member</span>
                      {renderSortIndicator("name")}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("email")}
                      className="group inline-flex items-center gap-1.5 hover:text-[#141413] cursor-pointer"
                    >
                      <span>Email</span>
                      {renderSortIndicator("email")}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("role")}
                      className="group inline-flex items-center gap-1.5 hover:text-[#141413] cursor-pointer"
                    >
                      <span>Role</span>
                      {renderSortIndicator("role")}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("plan")}
                      className="group inline-flex items-center gap-1.5 hover:text-[#141413] cursor-pointer"
                    >
                      <span>Plan</span>
                      {renderSortIndicator("plan")}
                    </button>
                  </TableHead>
                  <TableHead>COR</TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("status")}
                      className="group inline-flex items-center gap-1.5 hover:text-[#141413] cursor-pointer"
                    >
                      <span>Status</span>
                      {renderSortIndicator("status")}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("createdAt")}
                      className="group inline-flex items-center gap-1.5 hover:text-[#141413] cursor-pointer"
                    >
                      <span>Joined</span>
                      {renderSortIndicator("createdAt")}
                    </button>
                  </TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map((user) => (
                  <TableRow
                    key={user.id}
                    onClick={() => handleRowClick(user)}
                    className="cursor-pointer hover:bg-[#FAF5EC]/30 transition-colors"
                  >
                    {/* Name */}
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#FAF5EC] border border-[#ECDDBB] flex items-center justify-center text-xs font-semibold text-[#141413] shrink-0 overflow-hidden">
                          {user.profilePicUrl ? (
                            <img
                              src={user.profilePicUrl}
                              alt={user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            getInitials(user.name)
                          )}
                        </div>
                        <span className="font-medium text-[#141413]">
                          {user.name}
                        </span>
                      </div>
                    </TableCell>

                    {/* Email */}
                    <TableCell className="text-[#6E6E69]">{user.email}</TableCell>

                    {/* Role */}
                    <TableCell>
                      <Badge
                        variant={user.role === "creator" ? "accent" : "default"}
                        size="sm"
                        className="rounded-full capitalize font-medium"
                      >
                        {user.role}
                      </Badge>
                    </TableCell>

                    {/* Plan */}
                    <TableCell>
                      {user.plan ? (
                        <Badge
                          variant={
                            user.plan === "elite"
                              ? "warning"
                              : user.plan === "pro"
                              ? "accent"
                              : "default"
                          }
                          size="sm"
                          className="rounded-full capitalize font-medium"
                        >
                          {user.plan}
                        </Badge>
                      ) : (
                        <span className="text-xs text-[#8A8A85]">—</span>
                      )}
                    </TableCell>

                    {/* COR Badge */}
                    <TableCell>
                      {user.isCorMember ? (
                        <Badge variant="accent" size="sm" dot className="rounded-full font-medium">
                          Yes
                        </Badge>
                      ) : (
                        <span className="text-xs text-[#8A8A85]">No</span>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge
                        variant={user.status === "active" ? "success" : "danger"}
                        size="sm"
                        dot
                        className="rounded-full capitalize font-medium"
                      >
                        {user.status}
                      </Badge>
                    </TableCell>

                    {/* Joined Date */}
                    <TableCell className="text-xs text-[#6E6E69]">
                      {formatDate(user.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Reusable Pagination */}
          <Pagination
            currentPage={currentPage}
            totalItems={sortedUsers.length}
            pageSize={pageSize}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}

      {/* Side Drawer: User Details & Actions */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedUser?.name || "User Details"}
        description="Member profile and account administrative controls"
        footer={
          selectedUser && (
            <div className="flex items-center justify-between w-full">
              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsDeleteModalOpen(true)}
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                className="rounded-full px-4"
              >
                Delete User
              </Button>

              <Button
                variant={selectedUser.status === "active" ? "outline" : "primary"}
                size="sm"
                onClick={handleToggleStatus}
                isLoading={isUpdatingStatus}
                className="rounded-full px-5"
                leftIcon={
                  selectedUser.status === "active" ? (
                    <Ban className="w-3.5 h-3.5" />
                  ) : (
                    <CheckCircle className="w-3.5 h-3.5" />
                  )
                }
              >
                {selectedUser.status === "active"
                  ? "Suspend User"
                  : "Revert Suspension"}
              </Button>
            </div>
          )
        }
      >
        {selectedUser && (
          <div className="space-y-6">
            {/* User Hero Header in Drawer */}
            <div className="flex items-center gap-3.5 pb-5 border-b border-[#E8E8E3]">
              <div className="w-12 h-12 rounded-full bg-[#FAF5EC] border border-[#ECDDBB] flex items-center justify-center text-base font-semibold text-[#141413] shrink-0 overflow-hidden">
                {selectedUser.profilePicUrl ? (
                  <img
                    src={selectedUser.profilePicUrl}
                    alt={selectedUser.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials(selectedUser.name)
                )}
              </div>
              <div className="min-w-0">
                <h4 className="font-serif text-base font-semibold text-[#141413] truncate">
                  {selectedUser.name}
                </h4>
                <p className="text-xs text-[#6E6E69] truncate">
                  {selectedUser.email}
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <Badge
                    variant={selectedUser.status === "active" ? "success" : "danger"}
                    size="sm"
                    dot
                    className="rounded-full capitalize"
                  >
                    {selectedUser.status}
                  </Badge>
                  {selectedUser.isCorMember && (
                    <Badge variant="warning" size="sm" dot className="rounded-full">
                      COR Fellow
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Attributes List */}
            <div className="space-y-3.5 text-xs">
              <h5 className="font-semibold text-[#73736C] uppercase tracking-[0.2em] text-[11px] font-sans">
                Account Metadata
              </h5>

              <div className="flex items-center justify-between py-2.5 border-b border-[#F0F0EB]">
                <span className="text-[#6E6E69]">User ID</span>
                <span className="font-mono text-[11px] text-[#141413] bg-[#FAF5EC] border border-[#ECDDBB] px-2 py-0.5 rounded-full">
                  {selectedUser.id}
                </span>
              </div>

              <div className="flex items-center justify-between py-2.5 border-b border-[#F0F0EB]">
                <span className="text-[#6E6E69]">Platform Role</span>
                <span className="font-medium text-[#141413] capitalize">
                  {selectedUser.role}
                </span>
              </div>

              <div className="flex items-center justify-between py-2.5 border-b border-[#F0F0EB]">
                <span className="text-[#6E6E69]">Subscription Plan</span>
                <span className="font-medium text-[#141413] uppercase">
                  {selectedUser.plan || "Free / None"}
                </span>
              </div>

              <div className="flex items-center justify-between py-2.5 border-b border-[#F0F0EB]">
                <span className="text-[#6E6E69]">COR Circle</span>
                <span className="font-medium text-[#141413]">
                  {selectedUser.isCorMember ? "Enrolled Fellow" : "Not Enrolled"}
                </span>
              </div>

              <div className="flex items-center justify-between py-2.5 border-b border-[#F0F0EB]">
                <span className="text-[#6E6E69]">Registered Date</span>
                <span className="font-medium text-[#141413]">
                  {formatDate(selectedUser.createdAt)}
                </span>
              </div>
            </div>

            {/* Security / Notice */}
            <div className="p-4 rounded-2xl bg-[#FAF5EC] border border-[#ECDDBB] text-xs text-[#865E16] space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Account Controls Notice</span>
              </div>
              <p className="text-[11px] text-[#865E16]/90 leading-relaxed">
                Suspending this user will immediately revoke their ability to publish
                artworks, apply for studio residencies, and interact with the collective.
              </p>
            </div>
          </div>
        )}
      </Drawer>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm User Deletion"
        description="This action is permanent and cannot be reversed."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
              className="rounded-full px-5"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmDelete}
              isLoading={isDeleting}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              className="rounded-full px-5"
            >
              Delete Permanently
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs text-[#52524E]">
          <p>
            Are you sure you want to delete{" "}
            <span className="font-semibold text-[#141413]">
              {selectedUser?.name}
            </span>{" "}
            (<span className="font-mono">{selectedUser?.email}</span>)?
          </p>
          <p className="text-[11px] text-[#6E6E69]">
            All studio associations, draft submissions, and account credentials
            will be removed from the database immediately.
          </p>
        </div>
      </Modal>
    </div>
  );
}
