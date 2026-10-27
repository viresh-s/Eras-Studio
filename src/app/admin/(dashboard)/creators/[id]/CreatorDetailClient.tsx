"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Creator, Artwork, CorMember, CreatorStatus } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui";
import { updateCreatorAction, deleteCreatorAction } from "@/app/admin/actions";
import {
  ArrowLeft,
  Sparkles,
  Link as LinkIcon,
  Image as ImageIcon,
  Award,
  AlertTriangle,
} from "lucide-react";

interface CreatorDetailClientProps {
  creator: Creator;
  artworks: Artwork[];
  corMember: CorMember | null;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function CreatorDetailClient({
  creator,
  artworks,
  corMember,
}: CreatorDetailClientProps) {
  const router = useRouter();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<"overview" | "artworks" | "cor">("overview");

  const [creatorState, setCreatorState] = useState<Creator>(creator);
  const [isArchived, setIsArchived] = useState(creator.status === "pending");
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const isSuspended = creatorState.status === "suspended";

  // Suspend / Revert Suspension
  const handleConfirmSuspendToggle = async () => {
    const nextStatus: CreatorStatus = isSuspended ? "active" : "suspended";
    setIsActionLoading(true);
    try {
      const res = await updateCreatorAction(creatorState.id, { status: nextStatus });
      if (!res.success) {
        toast.error(
          isSuspended ? "Failed to revert suspension" : "Failed to suspend creator",
          res.error || "Please try again."
        );
      } else {
        setCreatorState((prev) => ({ ...prev, status: nextStatus }));
        toast.success(
          nextStatus === "suspended" ? "Creator Suspended" : "Suspension Reverted",
          nextStatus === "suspended"
            ? `${creatorState.name} has been suspended.`
            : `Suspension reverted. ${creatorState.name}'s account is active.`
        );
        setIsSuspendModalOpen(false);
      }
    } catch {
      toast.error("Network Error", "Could not complete moderation action.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Delete Account
  const handleConfirmDelete = async () => {
    setIsActionLoading(true);
    try {
      const res = await deleteCreatorAction(creatorState.id);
      if (!res.success) {
        toast.error("Failed to delete account", res.error || "Please try again.");
        setIsActionLoading(false);
      } else {
        toast.success("Account Deleted", `${creatorState.name}'s profile was removed.`);
        setIsDeleteModalOpen(false);
        router.push("/admin/creators");
      }
    } catch {
      toast.error("Network Error", "Could not delete account.");
      setIsActionLoading(false);
    }
  };

  // Archive / Revert Archive
  const handleConfirmArchive = async () => {
    setIsActionLoading(true);
    const nextArchived = !isArchived;
    const nextStatus: CreatorStatus = nextArchived ? "pending" : "active";
    try {
      const res = await updateCreatorAction(creatorState.id, { status: nextStatus });
      if (!res.success) {
        toast.error(
          nextArchived ? "Failed to archive creator" : "Failed to revert archive",
          res.error || "Please try again."
        );
      } else {
        setIsArchived(nextArchived);
        setCreatorState((prev) => ({ ...prev, status: nextStatus }));
        toast.success(
          nextArchived ? "Creator Archived" : "Archive Reverted",
          nextArchived
            ? `${creatorState.name} moved to archive.`
            : `${creatorState.name} restored from archive to active status.`
        );
        setIsArchiveModalOpen(false);
      }
    } catch {
      toast.error("Network Error", "Could not update archive status.");
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-[#141413] animate-in fade-in duration-150">
      {/* Back button */}
      <div>
        <Link
          href="/admin/creators"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#E8E8E3] bg-white text-xs font-medium text-[#141413] hover:bg-[#F2F0ED] transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#1345EE]" />
          <span>Back to Creator Roster</span>
        </Link>
      </div>

      {/* Creator Banner Card */}
      <div className="p-6 sm:p-7 rounded-2xl border border-[#E8E8E3] bg-white shadow-soft-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            {creatorState.profilePicUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={creatorState.profilePicUrl}
                alt={creatorState.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-[#1345EE]/30"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#000000] border border-black flex items-center justify-center text-xl font-bold text-white">
                {creatorState.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-[#141413]">
                  {creatorState.name}
                </h1>
                <Badge
                  variant={
                    creatorState.status === "active"
                      ? "success"
                      : creatorState.status === "pending"
                      ? "warning"
                      : "danger"
                  }
                  size="sm"
                  dot
                  className="rounded-md capitalize font-medium"
                >
                  {isArchived ? "archived" : creatorState.status}
                </Badge>
              </div>
              <p className="text-xs md:text-sm text-[#6E6E69] mt-1">
                {creatorState.email || "No email"} · {creatorState.location || "Remote"} · Joined {formatDate(creatorState.createdAt)}
              </p>
              <div className="text-xs font-medium text-[#1345EE] mt-1 uppercase tracking-wider font-sans">
                {creatorState.discipline}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSuspendModalOpen(true)}
              className="rounded-xl px-4 text-xs uppercase tracking-[0.08em]"
            >
              {isSuspended ? "Revert Suspension" : "Suspend"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsArchiveModalOpen(true)}
              className="rounded-xl px-4 text-xs uppercase tracking-[0.08em]"
            >
              {isArchived ? "Revert Archive" : "Archive"}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsDeleteModalOpen(true)}
              className="rounded-xl px-4 text-xs uppercase tracking-[0.08em]"
            >
              Delete Account
            </Button>
          </div>
        </div>

        {/* Quick summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 border-t border-[#E8E8E3] text-xs">
          <div className="bg-[#F2F0ED]/70 p-3.5 rounded-xl border border-[#E8E8E3]">
            <span className="text-[#73736C] font-sans font-semibold uppercase tracking-wider text-[11px]">Total Artworks</span>
            <div className="text-2xl font-semibold text-[#141413] mt-1">
              {artworks.length}
            </div>
          </div>
          <div className="bg-[#F2F0ED]/70 p-3.5 rounded-xl border border-[#E8E8E3]">
            <span className="text-[#73736C] font-sans font-semibold uppercase tracking-wider text-[11px]">Subscription Plan</span>
            <div className="text-2xl font-semibold capitalize text-[#141413] mt-1">
              {creatorState.plan || "Free"}
            </div>
          </div>
          <div className="bg-[#F2F0ED]/70 p-3.5 rounded-xl border border-[#E8E8E3]">
            <span className="text-[#73736C] font-sans font-semibold uppercase tracking-wider text-[11px]">COR Representation</span>
            <div className="text-2xl font-semibold text-[#141413] mt-1">
              {corMember ? (
                <span className="text-[#28633B]">
                  Active Fellow
                </span>
              ) : (
                <span className="text-[#6E6E69]">Not Enrolled</span>
              )}
            </div>
          </div>
          <div className="bg-[#F2F0ED]/70 p-3.5 rounded-xl border border-[#E8E8E3]">
            <span className="text-[#73736C] font-sans font-semibold uppercase tracking-wider text-[11px]">Creator ID</span>
            <div className="font-mono text-xs font-medium text-[#141413] mt-2 truncate" title={creatorState.id}>
              {creatorState.id}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none select-none">
        {(
          [
            { id: "overview", label: "Profile Overview", icon: Sparkles },
            { id: "artworks", label: `Artworks (${artworks.length})`, icon: ImageIcon },
            { id: "cor", label: "COR Status", icon: Award },
          ] as const
        ).map((tab) => {
          const active = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                active
                  ? "bg-[#000000] text-white font-medium border border-black shadow-xs"
                  : "bg-white text-[#6E6E69] border border-[#E8E8E3] hover:text-[#141413] hover:bg-[#F2F0ED]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="py-2">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="p-6 rounded-2xl border border-[#E8E8E3] bg-white shadow-soft-sm">
              <h3 className="text-lg font-medium text-[#141413] mb-4 pb-3 border-b border-[#F0F0EB]">
                Personal Information
              </h3>
              <div className="space-y-4 text-xs md:text-sm">
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-[#6E6E69]">Full Name</div>
                  <div className="col-span-2 font-medium text-[#141413]">{creatorState.name}</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-[#6E6E69]">Creator ID</div>
                  <div className="col-span-2 font-mono text-xs font-medium text-[#141413] bg-[#F2F0ED] px-2 py-0.5 rounded-md border border-[#E8E8E3] inline-block w-fit">
                    {creatorState.id}
                  </div>
                </div>
                {creatorState.userId && creatorState.userId !== creatorState.id && (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-[#6E6E69]">User ID</div>
                    <div className="col-span-2 font-mono text-xs font-medium text-[#141413] bg-[#F2F0ED] px-2 py-0.5 rounded-md border border-[#E8E8E3] inline-block w-fit">
                      {creatorState.userId}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-[#6E6E69]">Email</div>
                  <div className="col-span-2 font-medium text-[#141413]">{creatorState.email || "Not provided"}</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-[#6E6E69]">Phone</div>
                  <div className="col-span-2 font-medium text-[#141413]">{creatorState.phoneNumber || "Not provided"}</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-[#6E6E69]">Location</div>
                  <div className="col-span-2 font-medium text-[#141413]">{creatorState.location || "Not provided"}</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-[#6E6E69]">Joined Platform</div>
                  <div className="col-span-2 font-medium text-[#141413]">{formatDate(creatorState.createdAt)}</div>
                </div>
              </div>
            </div>

            {/* Professional Profile */}
            <div className="p-6 rounded-2xl border border-[#E8E8E3] bg-white shadow-soft-sm">
              <h3 className="text-lg font-medium text-[#141413] mb-4 pb-3 border-b border-[#F0F0EB]">
                Professional Profile
              </h3>
              <div className="space-y-4 text-xs md:text-sm">
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-[#6E6E69]">Specialisation</div>
                  <div className="col-span-2 font-medium text-[#141413]">{creatorState.discipline}</div>
                </div>
                {creatorState.artForms && creatorState.artForms !== creatorState.discipline && (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-[#6E6E69]">Art Forms</div>
                    <div className="col-span-2 font-medium text-[#141413]">{creatorState.artForms}</div>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-[#6E6E69]">Portfolio URL</div>
                  <div className="col-span-2 font-medium text-[#141413]">
                    {creatorState.portfolioUrl ? (
                      <a href={creatorState.portfolioUrl.startsWith("http") ? creatorState.portfolioUrl : `https://${creatorState.portfolioUrl}`} target="_blank" rel="noreferrer" className="text-[#1345EE] hover:underline inline-flex items-center gap-1">
                        View Portfolio <LinkIcon className="w-3 h-3" />
                      </a>
                    ) : (
                      "Not provided"
                    )}
                  </div>
                </div>
                {creatorState.cvUrl && (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-[#6E6E69]">Curriculum Vitae</div>
                    <div className="col-span-2 font-medium text-[#141413]">
                      <a href={creatorState.cvUrl} target="_blank" rel="noreferrer" className="text-[#1345EE] hover:underline inline-flex items-center gap-1">
                        View CV Document <LinkIcon className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
                {creatorState.awards && (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-[#6E6E69]">Honors & Awards</div>
                    <div className="col-span-2 font-medium text-[#141413]">{creatorState.awards}</div>
                  </div>
                )}
                {creatorState.socialLinks && Object.entries(creatorState.socialLinks).some(([_, val]) => Boolean(val)) && (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-[#6E6E69]">Social Links</div>
                    <div className="col-span-2 flex flex-wrap gap-2">
                      {Object.entries(creatorState.socialLinks)
                        .filter(([_, val]) => Boolean(val))
                        .map(([platform, handle]) => {
                          const url = handle.startsWith("http")
                            ? handle
                            : platform === "instagram"
                            ? `https://instagram.com/${handle.replace(/^@/, "")}`
                            : platform === "twitter"
                            ? `https://twitter.com/${handle.replace(/^@/, "")}`
                            : `https://${handle}`;
                          return (
                            <a
                              key={platform}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#F2F0ED] hover:bg-[#E8E8E3] text-[#1345EE] text-xs font-medium transition-colors border border-[#E8E8E3]"
                            >
                              <LinkIcon className="w-3 h-3" />
                              <span className="capitalize">{platform}: {handle}</span>
                            </a>
                          );
                        })}
                    </div>
                  </div>
                )}
                <div className="space-y-1.5 mt-2 pt-2 border-t border-[#F0F0EB]">
                  <div className="text-[#6E6E69]">Biography & Statement</div>
                  <div className="font-medium text-[#141413] whitespace-pre-wrap leading-relaxed">
                    {creatorState.aboutMe || creatorState.artistStatement || "No bio or statement provided."}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "artworks" && (
          <div className="space-y-4">
            {artworks.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-[#E8E8E3]">
                <ImageIcon className="w-8 h-8 text-[#8A8A85] mx-auto mb-2" />
                <h4 className="text-base font-medium text-[#141413]">No artworks uploaded</h4>
                <p className="text-xs text-[#6E6E69] mt-1">This creator hasn&apos;t published any artwork yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {artworks.map((art) => (
                  <div key={art.id} className="bg-white border border-[#E8E8E3] rounded-2xl overflow-hidden shadow-soft-sm hover:shadow-soft-md transition-all group">
                    <div className="relative aspect-[4/3] bg-neutral-100 overflow-hidden">
                      {art.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={art.imageUrl} alt={art.title} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-[#8A8A85]">No image</div>
                      )}
                      <div className="absolute top-2.5 right-2.5">
                        <Badge variant={art.status === "published" ? "success" : art.status === "pending" ? "warning" : "default"} size="sm" className="rounded-md capitalize font-medium">
                          {art.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="text-sm font-medium text-[#141413] truncate">{art.title}</h4>
                      <p className="text-xs text-[#6E6E69] mt-0.5">{art.medium} · {art.year || "2024"}</p>
                      <div className="mt-2 text-xs font-medium text-[#141413]">
                        {art.price ? `$${art.price.toLocaleString()}` : "Price upon request"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "cor" && (
          <div className="p-6 rounded-2xl border border-[#E8E8E3] bg-white shadow-soft-sm max-w-2xl">
            <h3 className="text-lg font-medium text-[#141413] mb-4 pb-3 border-b border-[#F0F0EB]">
              COR Representation Status
            </h3>
            {corMember ? (
              <div className="space-y-4 text-xs sm:text-sm">
                <div className="flex items-center justify-between py-2 border-b border-[#F0F0EB]">
                  <span className="text-[#6E6E69]">Member Status</span>
                  <Badge variant="success" size="sm" dot className="rounded-md capitalize font-medium">
                    {corMember.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#F0F0EB]">
                  <span className="text-[#6E6E69]">Desired Role</span>
                  <span className="font-medium text-[#1345EE]">{corMember.desiredRole || "Curated Artist"}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#F0F0EB]">
                  <span className="text-[#6E6E69]">Preferred Work Type</span>
                  <span className="font-medium text-[#141413]">{corMember.preferredWorkType || "Exhibition & Commission"}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-[#6E6E69]">
                <p>This creator is not currently enrolled in the Career Operations & Representation program.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal: Suspend */}
      <Modal
        isOpen={isSuspendModalOpen}
        onClose={() => !isActionLoading && setIsSuspendModalOpen(false)}
        title={isSuspended ? "Revert Suspension" : "Suspend Creator Account"}
        description={
          isSuspended
            ? `Revert suspension for ${creatorState.name}? This will restore their active publishing and platform permissions.`
            : `Suspending this creator will restrict their ability to post artworks, apply for opportunities, or access creator tools.`
        }
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSuspendModalOpen(false)}
              disabled={isActionLoading}
              className="rounded-xl px-5"
            >
              Cancel
            </Button>
            <Button
              variant={isSuspended ? "primary" : "danger"}
              size="sm"
              onClick={handleConfirmSuspendToggle}
              isLoading={isActionLoading}
              className="rounded-xl px-5"
            >
              {isSuspended ? "Revert Suspension" : "Suspend Account"}
            </Button>
          </>
        }
      >
        <div className="p-4 bg-[#F2F0ED] border border-[#1345EE]/30 rounded-3xl text-xs text-[#1345EE] space-y-1">
          <p className="font-medium text-[#141413]">Account Impact:</p>
          <p>• Profile: {creatorState.name} ({creatorState.email || "No email"})</p>
          <p>• Target status: {isSuspended ? "active (reverted)" : "suspended"}</p>
        </div>
      </Modal>

      {/* Confirmation Modal: Delete */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => !isActionLoading && setIsDeleteModalOpen(false)}
        title="Delete Creator Account"
        description={`Permanently remove ${creatorState.name}'s profile from the platform? This action cannot be undone.`}
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isActionLoading}
              className="rounded-xl px-5"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmDelete}
              isLoading={isActionLoading}
              className="rounded-xl px-5"
            >
              Delete Account Permanently
            </Button>
          </>
        }
      >
        <div className="p-4 bg-[#FDF2F2] border border-[#F2C6C6] rounded-3xl text-xs text-[#9E3333] flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 text-[#B83838] mt-0.5" />
          <div>
            <p className="font-semibold text-[#9E3333]">Critical Warning</p>
            <p>Removing this profile will delete creator credentials and associated profile metadata.</p>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal: Archive */}
      <Modal
        isOpen={isArchiveModalOpen}
        onClose={() => !isActionLoading && setIsArchiveModalOpen(false)}
        title={isArchived ? "Revert Archive Status" : "Archive Creator"}
        description={
          isArchived
            ? `Revert archive status for ${creatorState.name}? This will restore the creator to active public listings.`
            : `Archive ${creatorState.name}'s profile to remove it from primary active creator listings while retaining data for administrators.`
        }
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsArchiveModalOpen(false)}
              disabled={isActionLoading}
              className="rounded-xl px-5"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmArchive}
              isLoading={isActionLoading}
              className="rounded-xl px-5"
            >
              {isArchived ? "Revert Archive" : "Archive Creator"}
            </Button>
          </>
        }
      >
        <div className="p-4 bg-[#F2F0ED] border border-[#1345EE]/30 rounded-3xl text-xs text-[#6E6E69]">
          <p>
            {isArchived
              ? "Restoring from archive makes the creator visible in main directory searches again."
              : "Archiving maintains all records, commission histories, and past inquiries in the system."}
          </p>
        </div>
      </Modal>
    </div>
  );
}
