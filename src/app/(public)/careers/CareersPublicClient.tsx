"use client";

import React, { useState, useMemo, useRef } from "react";
import { CareerOpportunity } from "@/lib/types";
import { submitCareerApplicationAction } from "@/actions/careerActions";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import TextArea from "@/components/ui/TextArea";
import { Badge } from "@/components/ui/Badge";
import {
  Briefcase,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  UploadCloud,
  FileText,
  AlertCircle,
  Search,
  Building,
  Calendar,
  Globe,
  Share2,
  ShieldCheck,
  HeartHandshake,
  Layers,
  ChevronRight,
  X,
} from "lucide-react";

interface CareersPublicClientProps {
  initialOpportunities: CareerOpportunity[];
}

export function CareersPublicClient({ initialOpportunities }: CareersPublicClientProps) {
  const [opportunities] = useState<CareerOpportunity[]>(initialOpportunities);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("All");
  const [selectedWorkMode, setSelectedWorkMode] = useState<string>("All");

  // Detail Modal
  const [selectedOpportunity, setSelectedOpportunity] = useState<CareerOpportunity | null>(null);

  // Application Modal / Drawer
  const [applyingOpportunity, setApplyingOpportunity] = useState<CareerOpportunity | null>(null);
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [candidatePhone, setCandidatePhone] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeError, setResumeError] = useState("");

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Departments list for filter
  const departments = useMemo(() => {
    const set = new Set<string>();
    opportunities.forEach((o) => {
      if (o.department) set.add(o.department);
    });
    return ["All", ...Array.from(set)];
  }, [opportunities]);

  // Filtered Opportunities
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      // Must be published only
      if (opp.status !== "published") return false;

      if (selectedDepartment !== "All" && opp.department !== selectedDepartment) {
        return false;
      }
      if (selectedWorkMode !== "All" && opp.workMode !== selectedWorkMode) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = opp.title.toLowerCase().includes(q);
        const inDept = opp.department.toLowerCase().includes(q);
        const inLoc = opp.location.toLowerCase().includes(q);
        const inDesc = opp.description.toLowerCase().includes(q);
        if (!inTitle && !inDept && !inLoc && !inDesc) return false;
      }
      return true;
    });
  }, [opportunities, selectedDepartment, selectedWorkMode, searchQuery]);

  // Handle Resume File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResumeError("");
    const file = e.target.files?.[0];
    if (!file) {
      setResumeFile(null);
      return;
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_SIZE) {
      setResumeError("Resume file size exceeds the 5MB limit.");
      setResumeFile(null);
      return;
    }

    const allowed = [".pdf", ".doc", ".docx"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!allowed.includes(ext)) {
      setResumeError("Invalid format. Please upload a PDF, DOC, or DOCX file.");
      setResumeFile(null);
      return;
    }

    setResumeFile(file);
  };

  // Open Application Form
  const handleOpenApply = (opp: CareerOpportunity) => {
    setSelectedOpportunity(null); // close details if open
    setApplyingOpportunity(opp);
    setCandidateName("");
    setCandidateEmail("");
    setCandidatePhone("");
    setPortfolioUrl("");
    setLinkedinUrl("");
    setCoverLetter("");
    setResumeFile(null);
    setResumeError("");
    setFormErrors({});
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  // Submit Application
  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingOpportunity) return;

    const errors: Record<string, string> = {};
    if (!candidateName.trim() || candidateName.trim().length < 2) {
      errors.name = "Please enter your full name.";
    }
    if (!candidateEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidateEmail)) {
      errors.email = "Please enter a valid email address.";
    }
    if (!candidatePhone.trim() || candidatePhone.trim().length < 7) {
      errors.phone = "Please enter a valid contact phone number.";
    }
    if (!resumeFile) {
      errors.resume = "Please attach your resume (PDF or DOC).";
    }
    if (!coverLetter.trim() || coverLetter.trim().length < 20) {
      errors.coverLetter = "Please introduce yourself (minimum 20 characters).";
    }
    if (portfolioUrl.trim() && !/^https?:\/\//i.test(portfolioUrl.trim())) {
      errors.portfolioUrl = "URL must begin with http:// or https://";
    }
    if (linkedinUrl.trim() && !/^https?:\/\//i.test(linkedinUrl.trim())) {
      errors.linkedinUrl = "URL must begin with http:// or https://";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const formData = new FormData();
      formData.append("opportunityId", applyingOpportunity.id);
      formData.append("candidateName", candidateName.trim());
      formData.append("email", candidateEmail.trim().toLowerCase());
      formData.append("phone", candidatePhone.trim());
      formData.append("coverLetter", coverLetter.trim());
      if (portfolioUrl.trim()) formData.append("portfolioUrl", portfolioUrl.trim());
      if (linkedinUrl.trim()) formData.append("linkedinUrl", linkedinUrl.trim());
      if (resumeFile) formData.append("resume", resumeFile);

      const res = await submitCareerApplicationAction(formData);

      if (res.success) {
        setSubmitSuccess(true);
      } else {
        setSubmitError(res.error || "Failed to submit application. Please try again.");
      }
    } catch (err: any) {
      setSubmitError(err.message || "An unexpected error occurred during submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white text-[#141413] min-h-screen">
      {/* ========================================================================= */}
      {/* SECTION 1: HERO */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-24 border-b border-[#E8E8E3] bg-[#FAF9F5]">
        <div className="max-w-6xl mx-auto px-6 text-center">
          {/* Subtle Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#E8E8E3] bg-white text-xs text-[#6E6E69] mb-6 shadow-soft-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1345EE]" />
            <span>Eras Studio Careers</span>
            <span className="text-[#8A8A85]">·</span>
            <span className="text-[#1345EE] font-medium" data-numeric>
              {opportunities.length} Open Positions
            </span>
          </div>

          {/* Heading */}
          <h1 className="font-century-italic font-medium text-4xl sm:text-5xl md:text-6xl tracking-tight text-[#141413] mb-6 max-w-4xl mx-auto leading-[1.15]">
            Build Your Future With Us
          </h1>

          {/* Intro Text */}
          <p className="text-base sm:text-lg text-[#6E6E69] max-w-2xl mx-auto leading-relaxed mb-10">
            Join our mission to connect independent creators with passionate art patrons
            worldwide. We are building the editorial marketplace and institutional provenance
            layer for contemporary culture.
          </p>

          {/* Value Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-[#6E6E69]">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#1345EE]" />
              <span>Global Remote & Hybrid</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#865E16]" />
              <span>Artist-First Stewardship</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#28633B]" />
              <span>Institutional Excellence</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: OPEN OPPORTUNITIES */}
      {/* ========================================================================= */}
      <section className="py-16 md:py-24 max-w-6xl mx-auto px-6">
        {/* Section Header & Filters */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h2 className="font-century-italic font-medium text-3xl tracking-tight text-[#141413]">
              Open Opportunities
            </h2>
            <p className="text-sm text-[#6E6E69] mt-2">
              Browse current listings and discover your next chapter in creative technology.
            </p>
          </div>

          {/* Search & Work Mode Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="w-full sm:w-64">
              <Input
                placeholder="Search positions or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>

            <select
              value={selectedWorkMode}
              onChange={(e) => setSelectedWorkMode(e.target.value)}
              className="bg-white border border-[#E8E8E3] rounded-xl px-3.5 py-2.5 text-xs text-[#141413] focus:outline-none focus:border-[#1345EE]"
            >
              <option value="All">All Modes</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="On-site">On-site</option>
            </select>
          </div>
        </div>

        {/* Department Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 mb-10 pb-2 border-b border-[#E8E8E3]">
          {departments.map((dept) => (
            <button
              key={dept}
              type="button"
              onClick={() => setSelectedDepartment(dept)}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                selectedDepartment === dept
                  ? "bg-[#141413] text-white shadow-soft-sm"
                  : "bg-[#F2F0ED]/60 text-[#6E6E69] hover:bg-[#E8E8E3] hover:text-[#141413]"
              }`}
            >
              {dept}
            </button>
          ))}
        </div>

        {/* Opportunities Grid */}
        {filteredOpportunities.length === 0 ? (
          <div className="text-center py-16 bg-[#FAF9F5] rounded-3xl border border-[#E8E8E3] p-8">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mx-auto mb-4 border border-[#E8E8E3] shadow-soft-sm">
              <Briefcase className="w-6 h-6 text-[#8A8A85]" />
            </div>
            <h3 className="font-century-italic font-medium text-xl text-[#141413] mb-2">
              No matching positions at this moment
            </h3>
            <p className="text-sm text-[#6E6E69] max-w-md mx-auto mb-6">
              We update our institutional openings on an ongoing basis. Check back soon or reset
              your filters.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSelectedDepartment("All");
                setSelectedWorkMode("All");
                setSearchQuery("");
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredOpportunities.map((opp) => (
              <div
                key={opp.id}
                className="group bg-white rounded-2xl p-7 border border-[#E8E8E3] hover:border-[#1345EE]/40 hover:shadow-soft-md transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Top metadata tags */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#1345EE]">
                      {opp.department}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F2F0ED] text-[#6E6E69]">
                      {opp.workMode}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-century-italic font-medium text-2xl text-[#141413] group-hover:text-[#1345EE] transition-colors mb-3">
                    {opp.title}
                  </h3>

                  {/* Badges / Specs */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#6E6E69] mb-4">
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-[#8A8A85]" />
                      {opp.employmentType}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#8A8A85]" />
                      {opp.location}
                    </span>
                    {opp.experience && (
                      <>
                        <span>·</span>
                        <span>{opp.experience}</span>
                      </>
                    )}
                  </div>

                  {/* Short Description */}
                  <p className="text-sm text-[#6E6E69] leading-relaxed line-clamp-3 mb-6">
                    {opp.description}
                  </p>
                </div>

                {/* Footer Actions */}
                <div className="pt-5 border-t border-[#E8E8E3] flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedOpportunity(opp)}
                    className="text-xs font-semibold text-[#141413] hover:text-[#1345EE] transition-colors cursor-pointer"
                  >
                    View Details →
                  </button>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpenApply(opp)}
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Apply Now
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: OPPORTUNITY DETAILS MODAL */}
      {/* ========================================================================= */}
      {selectedOpportunity && (
        <Modal
          isOpen={Boolean(selectedOpportunity)}
          onClose={() => setSelectedOpportunity(null)}
          maxWidth="2xl"
          title={
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#1345EE] block mb-1">
                {selectedOpportunity.department}
              </span>
              <h2 className="font-century-italic font-medium text-2xl sm:text-3xl text-[#141413]">
                {selectedOpportunity.title}
              </h2>
            </div>
          }
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedOpportunity(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => handleOpenApply(selectedOpportunity)}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Apply for this Role
              </Button>
            </div>
          }
        >
          <div className="space-y-6 py-2 text-left">
            {/* Metadata Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-[#F2F0ED]/60 border border-[#E8E8E3] text-xs">
              <div>
                <span className="text-[#8A8A85] block mb-0.5">Employment</span>
                <span className="font-semibold text-[#141413]">
                  {selectedOpportunity.employmentType}
                </span>
              </div>
              <div>
                <span className="text-[#8A8A85] block mb-0.5">Workplace</span>
                <span className="font-semibold text-[#141413]">
                  {selectedOpportunity.workMode}
                </span>
              </div>
              <div>
                <span className="text-[#8A8A85] block mb-0.5">Location</span>
                <span className="font-semibold text-[#141413]">
                  {selectedOpportunity.location}
                </span>
              </div>
              <div>
                <span className="text-[#8A8A85] block mb-0.5">Openings</span>
                <span className="font-semibold text-[#141413]" data-numeric>
                  {selectedOpportunity.openings}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h4 className="font-century-italic font-medium text-lg text-[#141413]">
                About the Role
              </h4>
              <p className="text-sm text-[#4A4A46] leading-relaxed whitespace-pre-wrap">
                {selectedOpportunity.description}
              </p>
            </div>

            {/* Responsibilities */}
            {selectedOpportunity.responsibilities && (
              <div className="space-y-2">
                <h4 className="font-century-italic font-medium text-lg text-[#141413]">
                  Key Responsibilities
                </h4>
                <div className="text-sm text-[#4A4A46] leading-relaxed whitespace-pre-wrap pl-2 border-l-2 border-[#1345EE]/30">
                  {selectedOpportunity.responsibilities}
                </div>
              </div>
            )}

            {/* Requirements */}
            {selectedOpportunity.requirements && (
              <div className="space-y-2">
                <h4 className="font-century-italic font-medium text-lg text-[#141413]">
                  Requirements & Qualifications
                </h4>
                <div className="text-sm text-[#4A4A46] leading-relaxed whitespace-pre-wrap pl-2 border-l-2 border-[#28633B]/30">
                  {selectedOpportunity.requirements}
                </div>
              </div>
            )}

            {/* Deadline */}
            {selectedOpportunity.applicationDeadline && (
              <div className="p-3.5 rounded-xl bg-[#FAF5EC] border border-[#ECDDBB] flex items-center gap-2 text-xs text-[#865E16]">
                <Calendar className="w-4 h-4 shrink-0" />
                <span>
                  Applications review closes on:{" "}
                  <strong data-numeric>
                    {new Date(selectedOpportunity.applicationDeadline).toLocaleDateString()}
                  </strong>
                </span>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: APPLICATION FORM MODAL */}
      {/* ========================================================================= */}
      {applyingOpportunity && (
        <Modal
          isOpen={Boolean(applyingOpportunity)}
          onClose={() => setApplyingOpportunity(null)}
          maxWidth="2xl"
          title={
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#1345EE] block mb-1">
                Candidate Application
              </span>
              <h2 className="font-century-italic font-medium text-2xl text-[#141413]">
                Apply for {applyingOpportunity.title}
              </h2>
            </div>
          }
          description="Complete the form below to submit your credentials and resume to our curation and talent team."
        >
          {submitSuccess ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#F0F5F1] text-[#28633B] flex items-center justify-center mx-auto border border-[#CDE3D4]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-century-italic font-medium text-2xl text-[#141413]">
                Application Submitted Successfully
              </h3>
              <p className="text-sm text-[#6E6E69] max-w-md mx-auto leading-relaxed">
                Thank you for applying to Eras Studio. We have received your application and
                resume. Our team will review your portfolio and get in touch if there is a mutual
                fit.
              </p>
              <div className="pt-4">
                <Button
                  variant="primary"
                  onClick={() => setApplyingOpportunity(null)}
                >
                  Browse More Opportunities
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitApplication} className="space-y-4 py-2 text-left">
              {submitError && (
                <div className="p-3.5 rounded-xl bg-[#FDF2F2] border border-[#F2C6C6] flex items-center gap-2 text-xs text-[#9E3333]">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Row 1: Full Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name *"
                  placeholder="e.g. Maya Lin"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  error={formErrors.name}
                  disabled={isSubmitting}
                />
                <Input
                  label="Email Address *"
                  type="email"
                  placeholder="e.g. maya@example.com"
                  value={candidateEmail}
                  onChange={(e) => setCandidateEmail(e.target.value)}
                  error={formErrors.email}
                  disabled={isSubmitting}
                />
              </div>

              {/* Row 2: Phone & Portfolio URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Contact Phone *"
                  placeholder="e.g. +1 (555) 019-2834"
                  value={candidatePhone}
                  onChange={(e) => setCandidatePhone(e.target.value)}
                  error={formErrors.phone}
                  disabled={isSubmitting}
                />
                <Input
                  label="Portfolio / Website URL (Optional)"
                  placeholder="https://mywork.art"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  error={formErrors.portfolioUrl}
                  disabled={isSubmitting}
                />
              </div>

              {/* Row 3: LinkedIn Profile */}
              <div>
                <Input
                  label="LinkedIn Profile URL (Optional)"
                  placeholder="https://linkedin.com/in/username"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  error={formErrors.linkedinUrl}
                  disabled={isSubmitting}
                />
              </div>

              {/* Row 4: Resume File Upload */}
              <div className="space-y-1 text-left">
                <label className="block text-xs text-[#929292] font-medium mb-1">
                  Upload Resume / CV * (PDF, DOC, DOCX — Max 5MB)
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
                    resumeError || formErrors.resume
                      ? "border-red-400 bg-red-50/20"
                      : resumeFile
                      ? "border-[#28633B] bg-[#F0F5F1]/30"
                      : "border-[#E2E2DC] hover:border-[#1345EE] bg-[#FAF9F5]"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isSubmitting}
                  />

                  {resumeFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileText className="w-6 h-6 text-[#28633B]" />
                      <div className="text-left">
                        <p className="text-xs font-semibold text-[#141413]">{resumeFile.name}</p>
                        <span className="text-[11px] text-[#6E6E69]" data-numeric>
                          {(resumeFile.size / (1024 * 1024)).toFixed(2)} MB · Ready to upload
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setResumeFile(null);
                        }}
                        className="p-1 rounded-md text-[#8A8A85] hover:text-[#9E3333]"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <UploadCloud className="w-7 h-7 text-[#8A8A85] mx-auto" />
                      <p className="text-xs font-medium text-[#141413]">
                        Click or drag your resume file here
                      </p>
                      <p className="text-[11px] text-[#8A8A85]">
                        PDF, Word documents up to 5MB
                      </p>
                    </div>
                  )}
                </div>
                {(resumeError || formErrors.resume) && (
                  <p className="text-[11px] text-red-500 font-normal mt-1">
                    {resumeError || formErrors.resume}
                  </p>
                )}
              </div>

              {/* Row 5: Cover Letter */}
              <div>
                <TextArea
                  label="Cover Letter / Candidate Introduction *"
                  placeholder="Introduce your creative or technical philosophy, relevant achievements, and why you are drawn to Eras Studio..."
                  rows={4}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  error={formErrors.coverLetter}
                  disabled={isSubmitting}
                />
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-[#E8E8E3] flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setApplyingOpportunity(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSubmitting}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Submit Application
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}

