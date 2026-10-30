"use client";

import React, { useState, useMemo } from "react";
import {
  CareerOpportunity,
  CareerOpportunityStatus,
  CareerApplication,
  CareerApplicationStatus,
} from "@/lib/types";
import {
  Modal,
  Button,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Input,
  Pagination,
  EmptyState,
  useToast,
} from "@/components/ui";
import TextArea from "@/components/ui/TextArea";
import {
  createCareerOpportunityAction,
  updateCareerOpportunityAction,
  deleteCareerOpportunityAction,
  updateApplicationStatusAction,
  updateApplicationNotesAction,
  deleteCareerApplicationAction,
} from "@/actions/careerActions";
import {
  Briefcase,
  Users,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  Edit3,
  ExternalLink,
  FileText,
  Calendar,
  MapPin,
  Building,
  ArrowUpDown,
  FileDown,
  Layers,
  Archive,
  Eye,
  X,
  MessageSquare,
} from "lucide-react";

interface CareersClientProps {
  initialStats: {
    total: number;
    published: number;
    draft: number;
    closed: number;
    totalApplications: number;
  };
  initialOpportunities: CareerOpportunity[];
  initialApplications: CareerApplication[];
}

const DEPARTMENTS = [
  "Curation & Exhibitions",
  "Engineering",
  "Creator Partnerships",
  "Brand & Marketing",
  "Design & Typography",
  "Operations & Logistics",
  "Legal & Provenance",
  "Collector Advisory",
];

const EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
  "Freelance",
];

const WORK_MODES = ["Remote", "Hybrid", "On-site"];

const APPLICATION_STATUSES: CareerApplicationStatus[] = [
  "Applied",
  "Under Review",
  "Shortlisted",
  "Interview",
  "Selected",
  "Rejected",
];

export function CareersClient({
  initialStats,
  initialOpportunities,
  initialApplications,
}: CareersClientProps) {
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<"opportunities" | "applications">("opportunities");
  const [opportunities, setOpportunities] = useState<CareerOpportunity[]>(initialOpportunities);
  const [applications, setApplications] = useState<CareerApplication[]>(initialApplications);
  const [stats, setStats] = useState(initialStats);

  // Filters for Opportunities
  const [oppSearch, setOppSearch] = useState("");
  const [oppStatusFilter, setOppStatusFilter] = useState<CareerOpportunityStatus | "all">("all");
  const [oppSortBy, setOppSortBy] = useState<"created" | "title" | "openings" | "applications">("created");
  const [oppSortAsc, setOppSortAsc] = useState(false);
  const [oppCurrentPage, setOppCurrentPage] = useState(1);
  const oppPageSize = 8;

  // Filters for Applications
  const [appSearch, setAppSearch] = useState("");
  const [appOppFilter, setAppOppFilter] = useState<string>("all");
  const [appStatusFilter, setAppStatusFilter] = useState<CareerApplicationStatus | "all">("all");
  const [appCurrentPage, setAppCurrentPage] = useState(1);
  const appPageSize = 8;

  // Opportunity Modal (Add / Edit)
  const [isOppModalOpen, setIsOppModalOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<CareerOpportunity | null>(null);
  const [isSubmittingOpp, setIsSubmittingOpp] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formDepartment, setFormDepartment] = useState(DEPARTMENTS[0]);
  const [formEmploymentType, setFormEmploymentType] = useState(EMPLOYMENT_TYPES[0]);
  const [formLocation, setFormLocation] = useState("");
  const [formWorkMode, setFormWorkMode] = useState("Remote");
  const [formOpenings, setFormOpenings] = useState(1);
  const [formExperience, setFormExperience] = useState("");
  const [formDeadline, setFormDeadline] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formResponsibilities, setFormResponsibilities] = useState("");
  const [formRequirements, setFormRequirements] = useState("");
  const [formStatus, setFormStatus] = useState<CareerOpportunityStatus>("draft");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Delete Confirmation Modal
  const [deleteConfirmOpp, setDeleteConfirmOpp] = useState<CareerOpportunity | null>(null);
  const [isDeletingOpp, setIsDeletingOpp] = useState(false);

  // Application Detail Modal / Drawer
  const [selectedApplication, setSelectedApplication] = useState<CareerApplication | null>(null);
  const [adminNoteText, setAdminNoteText] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [deleteConfirmApp, setDeleteConfirmApp] = useState<CareerApplication | null>(null);
  const [isDeletingApp, setIsDeletingApp] = useState(false);

  // Recalculate stats dynamically
  const recomputeStats = (currentOpps: CareerOpportunity[], currentApps: CareerApplication[]) => {
    setStats({
      total: currentOpps.length,
      published: currentOpps.filter((o) => o.status === "published").length,
      draft: currentOpps.filter((o) => o.status === "draft").length,
      closed: currentOpps.filter((o) => o.status === "closed").length,
      totalApplications: currentApps.length,
    });
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingOpportunity(null);
    setFormTitle("");
    setFormDepartment(DEPARTMENTS[0]);
    setFormEmploymentType(EMPLOYMENT_TYPES[0]);
    setFormLocation("");
    setFormWorkMode("Remote");
    setFormOpenings(1);
    setFormExperience("");
    setFormDeadline("");
    setFormDescription("");
    setFormResponsibilities("");
    setFormRequirements("");
    setFormStatus("draft");
    setFormErrors({});
    setIsOppModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (opp: CareerOpportunity) => {
    setEditingOpportunity(opp);
    setFormTitle(opp.title);
    setFormDepartment(opp.department);
    setFormEmploymentType(opp.employmentType);
    setFormLocation(opp.location);
    setFormWorkMode(opp.workMode);
    setFormOpenings(opp.openings);
    setFormExperience(opp.experience || "");
    setFormDeadline(
      opp.applicationDeadline ? opp.applicationDeadline.split("T")[0] : ""
    );
    setFormDescription(opp.description);
    setFormResponsibilities(opp.responsibilities || "");
    setFormRequirements(opp.requirements || "");
    setFormStatus(opp.status);
    setFormErrors({});
    setIsOppModalOpen(true);
  };

  // Save / Update Opportunity
  const handleSubmitOpportunity = async (forcedStatus?: CareerOpportunityStatus) => {
    const statusToSave = forcedStatus || formStatus;
    const errors: Record<string, string> = {};

    if (!formTitle.trim()) errors.title = "Opportunity title is required.";
    if (!formDepartment.trim()) errors.department = "Department is required.";
    if (!formLocation.trim()) errors.location = "Location is required.";
    if (!formDescription.trim()) errors.description = "Job description is required.";
    if (formOpenings < 1) errors.openings = "Openings must be at least 1.";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmittingOpp(true);
    try {
      const payload = {
        title: formTitle.trim(),
        department: formDepartment.trim(),
        employmentType: formEmploymentType,
        location: formLocation.trim(),
        workMode: formWorkMode,
        description: formDescription.trim(),
        responsibilities: formResponsibilities.trim(),
        requirements: formRequirements.trim(),
        experience: formExperience.trim(),
        applicationDeadline: formDeadline ? new Date(formDeadline).toISOString() : null,
        openings: Number(formOpenings),
        status: statusToSave,
      };

      if (editingOpportunity) {
        const res = await updateCareerOpportunityAction(editingOpportunity.id, payload);
        if (res.success && res.opportunity) {
          const updatedList = opportunities.map((o) =>
            o.id === editingOpportunity.id ? res.opportunity! : o
          );
          setOpportunities(updatedList);
          recomputeStats(updatedList, applications);
          toast.success("Career opportunity updated successfully.");
          setIsOppModalOpen(false);
        } else {
          toast.error(res.error || "Failed to update opportunity.");
        }
      } else {
        const res = await createCareerOpportunityAction(payload);
        if (res.success && res.opportunity) {
          const updatedList = [res.opportunity, ...opportunities];
          setOpportunities(updatedList);
          recomputeStats(updatedList, applications);
          toast.success(
            statusToSave === "published"
              ? "Opportunity published to public website!"
              : "Opportunity saved as draft."
          );
          setIsOppModalOpen(false);
        } else {
          toast.error(res.error || "Failed to create opportunity.");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred.");
    } finally {
      setIsSubmittingOpp(false);
    }
  };

  // Toggle quick status (e.g. Publish / Close / Draft)
  const handleQuickStatusChange = async (
    opp: CareerOpportunity,
    newStatus: CareerOpportunityStatus
  ) => {
    try {
      const res = await updateCareerOpportunityAction(opp.id, { status: newStatus });
      if (res.success && res.opportunity) {
        const updatedList = opportunities.map((o) =>
          o.id === opp.id ? { ...o, status: newStatus } : o
        );
        setOpportunities(updatedList);
        recomputeStats(updatedList, applications);
        toast.success(`Opportunity marked as ${newStatus}.`);
      } else {
        toast.error(res.error || "Failed to update status.");
      }
    } catch {
      toast.error("Failed to change status.");
    }
  };

  // Delete Opportunity
  const handleConfirmDeleteOpp = async () => {
    if (!deleteConfirmOpp) return;
    setIsDeletingOpp(true);
    try {
      const res = await deleteCareerOpportunityAction(deleteConfirmOpp.id);
      if (res.success) {
        const updatedOpps = opportunities.filter((o) => o.id !== deleteConfirmOpp.id);
        const updatedApps = applications.filter((a) => a.opportunityId !== deleteConfirmOpp.id);
        setOpportunities(updatedOpps);
        setApplications(updatedApps);
        recomputeStats(updatedOpps, updatedApps);
        toast.success("Opportunity and associated applications deleted.");
        setDeleteConfirmOpp(null);
      } else {
        toast.error(res.error || "Failed to delete opportunity.");
      }
    } catch {
      toast.error("Failed to delete opportunity.");
    } finally {
      setIsDeletingOpp(false);
    }
  };

  // Open Application Details
  const handleOpenApplication = (app: CareerApplication) => {
    setSelectedApplication(app);
    setAdminNoteText(app.adminNotes || "");
  };

  // Save Application Status
  const handleUpdateAppStatus = async (
    appId: string,
    newStatus: CareerApplicationStatus
  ) => {
    setIsUpdatingStatus(true);
    try {
      const res = await updateApplicationStatusAction(appId, newStatus);
      if (res.success && res.application) {
        const updatedApps = applications.map((a) =>
          a.id === appId ? { ...a, status: newStatus } : a
        );
        setApplications(updatedApps);
        if (selectedApplication?.id === appId) {
          setSelectedApplication({ ...selectedApplication, status: newStatus });
        }
        toast.success(`Application status updated to ${newStatus}.`);
      } else {
        toast.error(res.error || "Failed to update status.");
      }
    } catch {
      toast.error("Failed to update application status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Save Admin Note
  const handleSaveAdminNote = async () => {
    if (!selectedApplication) return;
    setIsSavingNote(true);
    try {
      const res = await updateApplicationNotesAction(
        selectedApplication.id,
        adminNoteText.trim()
      );
      if (res.success) {
        const updatedApps = applications.map((a) =>
          a.id === selectedApplication.id
            ? { ...a, adminNotes: adminNoteText.trim() || null }
            : a
        );
        setApplications(updatedApps);
        setSelectedApplication({
          ...selectedApplication,
          adminNotes: adminNoteText.trim() || null,
        });
        toast.success("Internal admin note saved.");
      } else {
        toast.error(res.error || "Failed to save note.");
      }
    } catch {
      toast.error("Failed to save note.");
    } finally {
      setIsSavingNote(false);
    }
  };

  // Delete Application
  const handleConfirmDeleteApp = async () => {
    if (!deleteConfirmApp) return;
    setIsDeletingApp(true);
    try {
      const res = await deleteCareerApplicationAction(deleteConfirmApp.id);
      if (res.success) {
        const updatedApps = applications.filter((a) => a.id !== deleteConfirmApp.id);
        setApplications(updatedApps);
        recomputeStats(opportunities, updatedApps);
        if (selectedApplication?.id === deleteConfirmApp.id) {
          setSelectedApplication(null);
        }
        toast.success("Application deleted.");
        setDeleteConfirmApp(null);
      } else {
        toast.error(res.error || "Failed to delete application.");
      }
    } catch {
      toast.error("Failed to delete application.");
    } finally {
      setIsDeletingApp(false);
    }
  };

  // Filtered Opportunities
  const filteredOpportunities = useMemo(() => {
    let result = opportunities.filter((o) => {
      if (oppStatusFilter !== "all" && o.status !== oppStatusFilter) return false;
      if (oppSearch.trim()) {
        const q = oppSearch.toLowerCase().trim();
        const inTitle = o.title.toLowerCase().includes(q);
        const inDept = o.department.toLowerCase().includes(q);
        const inLoc = o.location.toLowerCase().includes(q);
        if (!inTitle && !inDept && !inLoc) return false;
      }
      return true;
    });

    result.sort((a, b) => {
      if (oppSortBy === "title") {
        return oppSortAsc ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
      }
      if (oppSortBy === "openings") {
        return oppSortAsc ? a.openings - b.openings : b.openings - a.openings;
      }
      if (oppSortBy === "applications") {
        const countA = a.applicationCount || 0;
        const countB = b.applicationCount || 0;
        return oppSortAsc ? countA - countB : countB - countA;
      }
      // default: created
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return oppSortAsc ? dateA - dateB : dateB - dateA;
    });

    return result;
  }, [opportunities, oppStatusFilter, oppSearch, oppSortBy, oppSortAsc]);

  const paginatedOpportunities = useMemo(() => {
    const start = (oppCurrentPage - 1) * oppPageSize;
    return filteredOpportunities.slice(start, start + oppPageSize);
  }, [filteredOpportunities, oppCurrentPage, oppPageSize]);

  // Filtered Applications
  const filteredApplications = useMemo(() => {
    return applications.filter((a) => {
      if (appOppFilter !== "all" && a.opportunityId !== appOppFilter) return false;
      if (appStatusFilter !== "all" && a.status !== appStatusFilter) return false;
      if (appSearch.trim()) {
        const q = appSearch.toLowerCase().trim();
        const inName = a.candidateName.toLowerCase().includes(q);
        const inEmail = a.email.toLowerCase().includes(q);
        const inPhone = a.phone.toLowerCase().includes(q);
        const inTitle = a.opportunityTitle?.toLowerCase().includes(q);
        if (!inName && !inEmail && !inPhone && !inTitle) return false;
      }
      return true;
    });
  }, [applications, appOppFilter, appStatusFilter, appSearch]);

  const paginatedApplications = useMemo(() => {
    const start = (appCurrentPage - 1) * appPageSize;
    return filteredApplications.slice(start, start + appPageSize);
  }, [filteredApplications, appCurrentPage, appPageSize]);

  // Status Badge Helper
  const renderStatusBadge = (status: CareerOpportunityStatus) => {
    switch (status) {
      case "published":
        return <Badge variant="success" dot>Published</Badge>;
      case "draft":
        return <Badge variant="warning" dot>Draft</Badge>;
      case "closed":
        return <Badge variant="danger" dot>Closed</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const renderAppStatusBadge = (status: CareerApplicationStatus) => {
    switch (status) {
      case "Applied":
        return <Badge variant="blue" dot>Applied</Badge>;
      case "Under Review":
        return <Badge variant="warning" dot>Under Review</Badge>;
      case "Shortlisted":
        return <Badge variant="accent" dot>Shortlisted</Badge>;
      case "Interview":
        return <Badge variant="violet" dot>Interview</Badge>;
      case "Selected":
        return <Badge variant="success" dot>Selected</Badge>;
      case "Rejected":
        return <Badge variant="danger" dot>Rejected</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* ========================================================================= */}
      {/* 1. CAREERS OVERVIEW METRICS CARDS */}
      {/* ========================================================================= */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="admin-century-title text-2xl tracking-tight text-[#141413]">
              Careers Overview
            </h2>
            <p className="text-xs text-[#6E6E69] mt-1 font-sans">
              Manage open positions, review applicants, and publish institutional career paths.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="premium-gradient"
              onClick={handleOpenAddModal}
              leftIcon={<Plus className="w-4 h-4 stroke-[2]" />}
            >
              Add Opportunity
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {/* Card: Total */}
          <div className="bg-white p-5 rounded-2xl border border-[#E8E8E3] shadow-soft-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#6E6E69]">Total Opportunities</span>
              <div className="w-8 h-8 rounded-xl bg-[#F2F0ED] flex items-center justify-center text-[#141413]">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-semibold text-[#141413] mt-3 font-sans" data-numeric>
              {stats.total}
            </p>
            <span className="text-[11px] text-[#8A8A85] mt-1 block">All positions in studio</span>
          </div>

          {/* Card: Published */}
          <div className="bg-white p-5 rounded-2xl border border-[#E8E8E3] shadow-soft-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#28633B]">Published</span>
              <div className="w-8 h-8 rounded-xl bg-[#F0F5F1] flex items-center justify-center text-[#28633B]">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-semibold text-[#28633B] mt-3 font-sans" data-numeric>
              {stats.published}
            </p>
            <span className="text-[11px] text-[#8A8A85] mt-1 block">Live on main website</span>
          </div>

          {/* Card: Draft */}
          <div className="bg-white p-5 rounded-2xl border border-[#E8E8E3] shadow-soft-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#865E16]">Draft</span>
              <div className="w-8 h-8 rounded-xl bg-[#FAF5EC] flex items-center justify-center text-[#865E16]">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-semibold text-[#865E16] mt-3 font-sans" data-numeric>
              {stats.draft}
            </p>
            <span className="text-[11px] text-[#8A8A85] mt-1 block">Not visible to public</span>
          </div>

          {/* Card: Closed */}
          <div className="bg-white p-5 rounded-2xl border border-[#E8E8E3] shadow-soft-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#9E3333]">Closed</span>
              <div className="w-8 h-8 rounded-xl bg-[#FDF2F2] flex items-center justify-center text-[#9E3333]">
                <Archive className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-semibold text-[#9E3333] mt-3 font-sans" data-numeric>
              {stats.closed}
            </p>
            <span className="text-[11px] text-[#8A8A85] mt-1 block">Applications paused</span>
          </div>

          {/* Card: Total Applications */}
          <div className="bg-white p-5 rounded-2xl border border-[#1345EE]/20 shadow-soft-sm bg-gradient-to-br from-white to-[#EEF2FE]/30 col-span-2 md:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#1345EE]">Applications</span>
              <div className="w-8 h-8 rounded-xl bg-[#EEF2FE] flex items-center justify-center text-[#1345EE]">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-semibold text-[#1345EE] mt-3 font-sans" data-numeric>
              {stats.totalApplications}
            </p>
            <span className="text-[11px] text-[#8A8A85] mt-1 block">Total submitted CVs</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TAB CONTROLS (OPPORTUNITIES vs APPLICATION TRACKING) */}
      {/* ========================================================================= */}
      <div className="border-b border-[#E8E8E3] flex items-center gap-6">
        <button
          type="button"
          onClick={() => setActiveTab("opportunities")}
          className={`pb-3 text-sm font-medium transition-all cursor-pointer relative ${
            activeTab === "opportunities"
              ? "text-[#1345EE] border-b-2 border-[#1345EE]"
              : "text-[#6E6E69] hover:text-[#141413]"
          }`}
        >
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            <span>Opportunities ({opportunities.length})</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("applications")}
          className={`pb-3 text-sm font-medium transition-all cursor-pointer relative ${
            activeTab === "applications"
              ? "text-[#1345EE] border-b-2 border-[#1345EE]"
              : "text-[#6E6E69] hover:text-[#141413]"
          }`}
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>Application Tracking ({applications.length})</span>
          </div>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 3. OPPORTUNITIES TABLE VIEW */}
      {/* ========================================================================= */}
      {activeTab === "opportunities" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-[#E8E8E3] shadow-soft-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="w-full md:w-80">
              <Input
                placeholder="Search opportunities by title, dept, location..."
                value={oppSearch}
                onChange={(e) => {
                  setOppSearch(e.target.value);
                  setOppCurrentPage(1);
                }}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Status Filter */}
              <div className="flex items-center gap-1.5 text-xs text-[#6E6E69]">
                <span>Status:</span>
                <select
                  value={oppStatusFilter}
                  onChange={(e) => {
                    setOppStatusFilter(e.target.value as any);
                    setOppCurrentPage(1);
                  }}
                  className="bg-white border border-[#E8E8E3] rounded-xl px-3 py-2 text-xs text-[#141413] focus:outline-none focus:border-[#1345EE]"
                >
                  <option value="all">All Statuses</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {/* Sorting */}
              <div className="flex items-center gap-1.5 text-xs text-[#6E6E69]">
                <span>Sort by:</span>
                <select
                  value={oppSortBy}
                  onChange={(e) => setOppSortBy(e.target.value as any)}
                  className="bg-white border border-[#E8E8E3] rounded-xl px-3 py-2 text-xs text-[#141413] focus:outline-none focus:border-[#1345EE]"
                >
                  <option value="created">Created Date</option>
                  <option value="title">Title</option>
                  <option value="openings">Openings</option>
                  <option value="applications">Applications</option>
                </select>
                <button
                  type="button"
                  onClick={() => setOppSortAsc(!oppSortAsc)}
                  title={oppSortAsc ? "Sort Ascending" : "Sort Descending"}
                  className="p-2 rounded-xl border border-[#E8E8E3] hover:bg-[#F2F0ED] text-[#6E6E69] transition-colors"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Opportunities Table */}
          <div className="bg-white rounded-2xl border border-[#E8E8E3] shadow-soft-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Opportunity Title</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Type & Mode</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Openings</TableHead>
                  <TableHead>Applications</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOpportunities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-12">
                      <EmptyState
                        icon={<Briefcase className="w-10 h-10 text-[#8A8A85]" />}
                        title="No opportunities found"
                        description="Try adjusting your search criteria or create a new opportunity listing."
                        action={
                          <Button variant="secondary" size="sm" onClick={handleOpenAddModal}>
                            Add Opportunity
                          </Button>
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedOpportunities.map((opp) => (
                    <TableRow key={opp.id}>
                      {/* Title */}
                      <TableCell className="font-medium">
                        <div>
                          <p className="admin-century-title text-sm text-[#141413]">
                            {opp.title}
                          </p>
                          <span className="text-[11px] text-[#8A8A85] block truncate max-w-xs font-sans">
                            {opp.experience || "All experience levels"}
                          </span>
                        </div>
                      </TableCell>

                      {/* Department */}
                      <TableCell>
                        <span className="text-xs text-[#141413]">{opp.department}</span>
                      </TableCell>

                      {/* Employment Type & Mode */}
                      <TableCell>
                        <div className="text-xs">
                          <p className="text-[#141413]">{opp.employmentType}</p>
                          <span className="text-[11px] text-[#8A8A85]">{opp.workMode}</span>
                        </div>
                      </TableCell>

                      {/* Location */}
                      <TableCell>
                        <span className="text-xs text-[#6E6E69] flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#8A8A85]" />
                          {opp.location}
                        </span>
                      </TableCell>

                      {/* Openings */}
                      <TableCell>
                        <span className="text-xs font-medium text-[#141413]" data-numeric>
                          {opp.openings}
                        </span>
                      </TableCell>

                      {/* Applications Count */}
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => {
                            setAppOppFilter(opp.id);
                            setActiveTab("applications");
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EEF2FE] hover:bg-[#1345EE]/15 text-[#1345EE] text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <Users className="w-3 h-3" />
                          <span data-numeric>{opp.applicationCount || 0}</span>
                        </button>
                      </TableCell>

                      {/* Status */}
                      <TableCell>{renderStatusBadge(opp.status)}</TableCell>

                      {/* Created */}
                      <TableCell>
                        <span className="text-xs text-[#8A8A85]" data-numeric>
                          {new Date(opp.createdAt).toLocaleDateString()}
                        </span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Publish / Close */}
                          {opp.status === "draft" && (
                            <button
                              type="button"
                              onClick={() => handleQuickStatusChange(opp, "published")}
                              title="Publish Opportunity"
                              className="px-2 py-1 rounded-lg border border-[#CDE3D4] bg-[#F0F5F1] text-[#28633B] hover:bg-[#E2F0E7] text-[11px] font-medium transition-colors cursor-pointer"
                            >
                              Publish
                            </button>
                          )}
                          {opp.status === "published" && (
                            <button
                              type="button"
                              onClick={() => handleQuickStatusChange(opp, "closed")}
                              title="Close Opportunity"
                              className="px-2 py-1 rounded-lg border border-[#ECDDBB] bg-[#FAF5EC] text-[#865E16] hover:bg-[#F4EBDB] text-[11px] font-medium transition-colors cursor-pointer"
                            >
                              Close
                            </button>
                          )}
                          {opp.status === "closed" && (
                            <button
                              type="button"
                              onClick={() => handleQuickStatusChange(opp, "published")}
                              title="Re-open & Publish"
                              className="px-2 py-1 rounded-lg border border-[#E8E8E3] bg-white text-[#6E6E69] hover:bg-[#F2F0ED] text-[11px] font-medium transition-colors cursor-pointer"
                            >
                              Re-open
                            </button>
                          )}

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(opp)}
                            title="Edit Opportunity"
                            className="p-1.5 rounded-lg border border-[#E8E8E3] bg-white text-[#6E6E69] hover:text-[#1345EE] hover:border-[#1345EE]/30 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmOpp(opp)}
                            title="Delete Opportunity"
                            className="p-1.5 rounded-lg border border-[#E8E8E3] bg-white text-[#6E6E69] hover:text-[#B83838] hover:border-[#F2C6C6] hover:bg-[#FDF2F2] transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {filteredOpportunities.length > oppPageSize && (
              <div className="p-4 border-t border-[#E8E8E3]">
                <Pagination
                  currentPage={oppCurrentPage}
                  totalItems={filteredOpportunities.length}
                  pageSize={oppPageSize}
                  onPageChange={setOppCurrentPage}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. APPLICATION TRACKING VIEW */}
      {/* ========================================================================= */}
      {activeTab === "applications" && (
        <div className="space-y-4">
          {/* Applications Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-[#E8E8E3] shadow-soft-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="w-full md:w-80">
              <Input
                placeholder="Search candidates by name, email, phone..."
                value={appSearch}
                onChange={(e) => {
                  setAppSearch(e.target.value);
                  setAppCurrentPage(1);
                }}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Filter by Opportunity */}
              <div className="flex items-center gap-1.5 text-xs text-[#6E6E69]">
                <span>Role:</span>
                <select
                  value={appOppFilter}
                  onChange={(e) => {
                    setAppOppFilter(e.target.value);
                    setAppCurrentPage(1);
                  }}
                  className="bg-white border border-[#E8E8E3] rounded-xl px-3 py-2 text-xs text-[#141413] focus:outline-none focus:border-[#1345EE] max-w-xs"
                >
                  <option value="all">All Opportunities</option>
                  {opportunities.map((opp) => (
                    <option key={opp.id} value={opp.id}>
                      {opp.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter by Status */}
              <div className="flex items-center gap-1.5 text-xs text-[#6E6E69]">
                <span>Status:</span>
                <select
                  value={appStatusFilter}
                  onChange={(e) => {
                    setAppStatusFilter(e.target.value as any);
                    setAppCurrentPage(1);
                  }}
                  className="bg-white border border-[#E8E8E3] rounded-xl px-3 py-2 text-xs text-[#141413] focus:outline-none focus:border-[#1345EE]"
                >
                  <option value="all">All Statuses</option>
                  {APPLICATION_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Applications Table */}
          <div className="bg-white rounded-2xl border border-[#E8E8E3] shadow-soft-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate Name</TableHead>
                  <TableHead>Opportunity Applied For</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Application Date</TableHead>
                  <TableHead>Resume</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedApplications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12">
                      <EmptyState
                        icon={<Users className="w-10 h-10 text-[#8A8A85]" />}
                        title="No applications found"
                        description="Candidates submitting applications on the public Careers page will appear here."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedApplications.map((app) => (
                    <TableRow key={app.id}>
                      {/* Candidate Name */}
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#1345EE]/10 text-[#1345EE] flex items-center justify-center text-xs font-semibold shrink-0">
                            {app.candidateName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#141413]">
                              {app.candidateName}
                            </p>
                            {app.adminNotes && (
                              <span className="text-[10px] text-[#1345EE] flex items-center gap-1 font-medium">
                                <MessageSquare className="w-2.5 h-2.5" /> Note attached
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Opportunity */}
                      <TableCell>
                        <span className="admin-century-title text-xs text-[#141413]">
                          {app.opportunityTitle || "Opportunity"}
                        </span>
                      </TableCell>

                      {/* Email */}
                      <TableCell>
                        <a
                          href={`mailto:${app.email}`}
                          className="text-xs text-[#1345EE] hover:underline"
                        >
                          {app.email}
                        </a>
                      </TableCell>

                      {/* Phone */}
                      <TableCell>
                        <span className="text-xs text-[#6E6E69]" data-numeric>
                          {app.phone}
                        </span>
                      </TableCell>

                      {/* Applied Date */}
                      <TableCell>
                        <span className="text-xs text-[#8A8A85]" data-numeric>
                          {new Date(app.appliedAt).toLocaleDateString()}
                        </span>
                      </TableCell>

                      {/* Resume */}
                      <TableCell>
                        {app.resumeUrl ? (
                          <a
                            href={app.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#E8E8E3] bg-[#F2F0ED] hover:bg-[#E8E8E3] text-xs text-[#141413] transition-colors"
                          >
                            <FileDown className="w-3.5 h-3.5 text-[#1345EE]" />
                            <span>View CV</span>
                          </a>
                        ) : (
                          <span className="text-xs text-[#8A8A85]">—</span>
                        )}
                      </TableCell>

                      {/* Status Dropdown */}
                      <TableCell>
                        <select
                          value={app.status}
                          onChange={(e) =>
                            handleUpdateAppStatus(
                              app.id,
                              e.target.value as CareerApplicationStatus
                            )
                          }
                          className="bg-white border border-[#E8E8E3] rounded-lg px-2.5 py-1 text-xs font-medium text-[#141413] focus:outline-none focus:border-[#1345EE]"
                        >
                          {APPLICATION_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenApplication(app)}
                            className="px-3 py-1.5 rounded-lg border border-[#E8E8E3] bg-white text-xs font-medium text-[#141413] hover:bg-[#F2F0ED] hover:text-[#1345EE] transition-colors cursor-pointer"
                          >
                            Review
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmApp(app)}
                            title="Delete Application"
                            className="p-1.5 rounded-lg border border-[#E8E8E3] bg-white text-[#8A8A85] hover:text-[#B83838] hover:border-[#F2C6C6] hover:bg-[#FDF2F2] transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {filteredApplications.length > appPageSize && (
              <div className="p-4 border-t border-[#E8E8E3]">
                <Pagination
                  currentPage={appCurrentPage}
                  totalItems={filteredApplications.length}
                  pageSize={appPageSize}
                  onPageChange={setAppCurrentPage}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. ADD / EDIT OPPORTUNITY MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isOppModalOpen}
        onClose={() => setIsOppModalOpen(false)}
        maxWidth="2xl"
        title={
          <span className="admin-century-title text-xl text-[#141413]">
            {editingOpportunity ? "Edit Career Opportunity" : "Create Career Opportunity"}
          </span>
        }
        description="Configure job details, department requirements, and publication status."
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOppModalOpen(false)}
              disabled={isSubmittingOpp}
            >
              Cancel
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleSubmitOpportunity("draft")}
                isLoading={isSubmittingOpp}
              >
                Save as Draft
              </Button>
              <Button
                variant="premium-gradient"
                size="sm"
                onClick={() => handleSubmitOpportunity("published")}
                isLoading={isSubmittingOpp}
              >
                {editingOpportunity ? "Save & Publish" : "Publish Opportunity"}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4 py-2 text-left">
          {/* Row 1: Title & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="Opportunity Title *"
                placeholder="e.g. Senior Editorial Curator"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                error={formErrors.title}
              />
            </div>
            <div>
              <label className="block text-xs text-[#929292] font-medium mb-1">
                Department *
              </label>
              <select
                value={formDepartment}
                onChange={(e) => setFormDepartment(e.target.value)}
                className="w-full bg-white text-sm border border-[#E2E2DC] rounded-[12px] px-3.5 py-2.5 outline-none focus:border-[#181A1F]"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Employment Type & Work Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-[#929292] font-medium mb-1">
                Employment Type
              </label>
              <select
                value={formEmploymentType}
                onChange={(e) => setFormEmploymentType(e.target.value)}
                className="w-full bg-white text-sm border border-[#E2E2DC] rounded-[12px] px-3.5 py-2.5 outline-none focus:border-[#181A1F]"
              >
                {EMPLOYMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-[#929292] font-medium mb-1">
                Work Mode
              </label>
              <select
                value={formWorkMode}
                onChange={(e) => setFormWorkMode(e.target.value)}
                className="w-full bg-white text-sm border border-[#E2E2DC] rounded-[12px] px-3.5 py-2.5 outline-none focus:border-[#181A1F]"
              >
                {WORK_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Input
                label="Openings *"
                type="number"
                min={1}
                value={formOpenings}
                onChange={(e) => setFormOpenings(Math.max(1, parseInt(e.target.value) || 1))}
                error={formErrors.openings}
              />
            </div>
          </div>

          {/* Row 3: Location & Experience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="Location *"
                placeholder="e.g. New York, NY or Remote"
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                error={formErrors.location}
              />
            </div>
            <div>
              <Input
                label="Required Experience"
                placeholder="e.g. 5+ years in contemporary art"
                value={formExperience}
                onChange={(e) => setFormExperience(e.target.value)}
              />
            </div>
          </div>

          {/* Row 4: Deadline & Publication Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="Application Deadline"
                type="date"
                value={formDeadline}
                onChange={(e) => setFormDeadline(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-[#929292] font-medium mb-1">
                Status
              </label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as CareerOpportunityStatus)}
                className="w-full bg-white text-sm border border-[#E2E2DC] rounded-[12px] px-3.5 py-2.5 outline-none focus:border-[#181A1F]"
              >
                <option value="draft">Draft (Private)</option>
                <option value="published">Published (Live on website)</option>
                <option value="closed">Closed (No new applications)</option>
              </select>
            </div>
          </div>

          {/* Row 5: Job Description */}
          <div>
            <TextArea
              label="Job Description *"
              placeholder="Provide a comprehensive introduction to this role and how it impacts Eras Studio..."
              rows={3}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              error={formErrors.description}
            />
          </div>

          {/* Row 6: Responsibilities */}
          <div>
            <TextArea
              label="Key Responsibilities"
              placeholder="• Curate editorial features&#10;• Coordinate with artists worldwide&#10;• Maintain archival provenance..."
              rows={3}
              value={formResponsibilities}
              onChange={(e) => setFormResponsibilities(e.target.value)}
            />
          </div>

          {/* Row 7: Requirements */}
          <div>
            <TextArea
              label="Required Qualifications & Skills"
              placeholder="• 5+ years of relevant experience&#10;• Degree in Art History, Design, or Engineering&#10;• Excellent communication skills..."
              rows={3}
              value={formRequirements}
              onChange={(e) => setFormRequirements(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* 6. CANDIDATE APPLICATION DETAILS MODAL */}
      {/* ========================================================================= */}
      {selectedApplication && (
        <Modal
          isOpen={Boolean(selectedApplication)}
          onClose={() => setSelectedApplication(null)}
          maxWidth="2xl"
          title={
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#1345EE]/10 text-[#1345EE] flex items-center justify-center text-sm font-bold">
                {selectedApplication.candidateName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="admin-century-title text-xl text-[#141413]">
                  {selectedApplication.candidateName}
                </p>
                <span className="text-xs text-[#6E6E69] font-sans">
                  Applied for: {selectedApplication.opportunityTitle}
                </span>
              </div>
            </div>
          }
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedApplication(null)}
              >
                Close
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setDeleteConfirmApp(selectedApplication)}
                >
                  Delete Application
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-6 py-2 text-left">
            {/* Quick Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[#F2F0ED]/60 border border-[#E8E8E3]">
              <div>
                <span className="text-[11px] text-[#8A8A85] block">Email</span>
                <a
                  href={`mailto:${selectedApplication.email}`}
                  className="text-xs text-[#1345EE] hover:underline font-medium truncate block"
                >
                  {selectedApplication.email}
                </a>
              </div>
              <div>
                <span className="text-[11px] text-[#8A8A85] block">Phone</span>
                <span className="text-xs text-[#141413] font-medium" data-numeric>
                  {selectedApplication.phone}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#8A8A85] block">Applied Date</span>
                <span className="text-xs text-[#141413] font-medium" data-numeric>
                  {new Date(selectedApplication.appliedAt).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#8A8A85] block">Status</span>
                <div className="mt-0.5">{renderAppStatusBadge(selectedApplication.status)}</div>
              </div>
            </div>

            {/* Links Bar: Resume, Portfolio, LinkedIn */}
            <div className="flex flex-wrap items-center gap-3">
              {selectedApplication.resumeUrl && (
                <a
                  href={selectedApplication.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1345EE] text-white text-xs font-medium hover:bg-[#0E35B8] transition-colors"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Download / View Resume</span>
                </a>
              )}
              {selectedApplication.portfolioUrl && (
                <a
                  href={selectedApplication.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E8E8E3] bg-white text-xs text-[#141413] hover:bg-[#F2F0ED] transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#1345EE]" />
                  <span>Portfolio</span>
                </a>
              )}
              {selectedApplication.linkedinUrl && (
                <a
                  href={selectedApplication.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E8E8E3] bg-white text-xs text-[#141413] hover:bg-[#F2F0ED] transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#1345EE]" />
                  <span>LinkedIn Profile</span>
                </a>
              )}
            </div>

            {/* Status Change Section */}
            <div className="p-4 rounded-xl border border-[#E8E8E3] bg-white space-y-2">
              <label className="block text-xs font-medium text-[#6E6E69]">
                Change Application Stage:
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {APPLICATION_STATUSES.map((status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={isUpdatingStatus}
                    onClick={() => handleUpdateAppStatus(selectedApplication.id, status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      selectedApplication.status === status
                        ? "bg-[#1345EE] text-white shadow-2xs"
                        : "border border-[#E8E8E3] bg-white text-[#6E6E69] hover:bg-[#F2F0ED]"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Cover Letter */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#6E6E69]">
                Candidate Cover Letter / Introduction:
              </label>
              <div className="p-4 rounded-xl border border-[#E8E8E3] bg-[#FDFCFB] text-sm text-[#141413] leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                {selectedApplication.coverLetter}
              </div>
            </div>

            {/* Internal Admin Notes */}
            <div className="space-y-2 p-4 rounded-xl border border-[#ECDDBB] bg-[#FAF5EC]/40">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-[#865E16]">
                  Internal Admin Notes (Never exposed to candidate):
                </label>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSaveAdminNote}
                  isLoading={isSavingNote}
                >
                  Save Notes
                </Button>
              </div>
              <TextArea
                rows={3}
                placeholder="Add confidential notes, screening impression, salary notes, interview scheduling..."
                value={adminNoteText}
                onChange={(e) => setAdminNoteText(e.target.value)}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* 7. DELETE CONFIRMATION MODALS */}
      {/* ========================================================================= */}
      {deleteConfirmOpp && (
        <Modal
          isOpen={Boolean(deleteConfirmOpp)}
          onClose={() => setDeleteConfirmOpp(null)}
          title={
            <span className="admin-century-title text-xl text-[#B83838]">
              Delete Opportunity
            </span>
          }
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmOpp(null)}
                disabled={isDeletingOpp}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmDeleteOpp}
                isLoading={isDeletingOpp}
              >
                Confirm Delete
              </Button>
            </div>
          }
        >
          <div className="space-y-3 py-2 text-left">
            <p className="text-sm text-[#141413]">
              Are you sure you want to permanently delete{" "}
              <strong>&ldquo;{deleteConfirmOpp.title}&rdquo;</strong>?
            </p>
            <p className="text-xs text-[#8A8A85]">
              This action cannot be undone. All candidate applications submitted for this
              opportunity will also be removed.
            </p>
          </div>
        </Modal>
      )}

      {deleteConfirmApp && (
        <Modal
          isOpen={Boolean(deleteConfirmApp)}
          onClose={() => setDeleteConfirmApp(null)}
          title={
            <span className="admin-century-title text-xl text-[#B83838]">
              Delete Candidate Application
            </span>
          }
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmApp(null)}
                disabled={isDeletingApp}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmDeleteApp}
                isLoading={isDeletingApp}
              >
                Confirm Delete
              </Button>
            </div>
          }
        >
          <div className="space-y-3 py-2 text-left">
            <p className="text-sm text-[#141413]">
              Are you sure you want to delete the application submitted by{" "}
              <strong>&ldquo;{deleteConfirmApp.candidateName}&rdquo;</strong>?
            </p>
            <p className="text-xs text-[#8A8A85]">
              This record will be permanently deleted from the database.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
