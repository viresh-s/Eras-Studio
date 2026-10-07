'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Briefcase,
  Wrench,
  GraduationCap,
  History,
  Link2,
  FileText,
  Target,
  ArrowRight,
  ArrowLeft,
  Check,
  Plus,
  Trash2,
  Upload,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import type { CorFullProfile, CorEducation, CorExperience, CorDocument } from '@/types/cor';
import {
  saveCorStepAction,
  submitCorProfileFinalAction,
  submitCorRequestAction,
  uploadCorDocumentAction,
} from '@/actions/corActions';
import Button from '@/components/ui/Button';

interface CorProfileWorkflowProps {
  initialProfile: CorFullProfile;
}

const STEPS = [
  { id: 0, title: 'Personal Information', icon: User },
  { id: 1, title: 'Career Information', icon: Briefcase },
  { id: 2, title: 'Skills & Specialisation', icon: Wrench },
  { id: 3, title: 'Education', icon: GraduationCap },
  { id: 4, title: 'Experience', icon: History },
  { id: 5, title: 'Professional Links', icon: Link2 },
  { id: 6, title: 'Documents', icon: FileText },
  { id: 7, title: 'Career Goals', icon: Target },
];

export default function CorProfileWorkflow({ initialProfile }: CorProfileWorkflowProps) {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const isMember = initialProfile.profile.status === 'active';
  const [completeness, setCompleteness] = useState(initialProfile.profile.completeness_percentage || 0);

  // Form State
  const [personal, setPersonal] = useState(initialProfile.personal);
  const [career, setCareer] = useState(initialProfile.career);
  const [skills, setSkills] = useState(initialProfile.skills);
  const [educationList, setEducationList] = useState<CorEducation[]>(
    initialProfile.education.length > 0
      ? initialProfile.education
      : [
          {
            id: 'temp-1',
            creator_id: initialProfile.profile.creator_id,
            degree: 'Bachelor of Fine Arts (BFA)',
            institute: 'National Institute of Design / Arts Academy',
            year: '2022',
            additional_education: '',
            display_order: 0,
          },
        ]
  );
  const [experienceList, setExperienceList] = useState<CorExperience[]>(
    initialProfile.experience.length > 0
      ? initialProfile.experience
      : [
          {
            id: 'temp-1',
            creator_id: initialProfile.profile.creator_id,
            company: 'Studio Praxis / Independent Practice',
            role: 'Lead Resident Artist',
            duration: '2023 - Present',
            start_date: '2023-01',
            end_date: '',
            is_current: true,
            responsibilities: 'Executed studio series, curated contemporary exhibitions, and oversaw production.',
            achievements: '',
            display_order: 0,
          },
        ]
  );
  const [links, setLinks] = useState(initialProfile.links);
  const [documents, setDocuments] = useState<CorDocument[]>(initialProfile.documents || []);
  const [goals, setGoals] = useState(initialProfile.goals);

  // Uploading state
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Helper to save current step
  const handleSaveStep = async (stepIdx: number, silent = false) => {
    setSaving(true);
    try {
      let payload: any = {};
      if (stepIdx === 0) payload = personal;
      else if (stepIdx === 1) payload = career;
      else if (stepIdx === 2) payload = skills;
      else if (stepIdx === 3) payload = { education: educationList };
      else if (stepIdx === 4) payload = { experience: experienceList };
      else if (stepIdx === 5) payload = links;
      else if (stepIdx === 6) payload = { documents };
      else if (stepIdx === 7) payload = goals;

      const res = await saveCorStepAction(stepIdx, payload);
      if (res.completeness !== undefined) {
        setCompleteness(res.completeness);
      }
      if (!silent) {
        showToast('Progress saved automatically', 'success');
      }
    } catch (err: any) {
      console.error('Failed to auto-save step:', err);
      showToast(err.message || 'Auto-save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeStep < 7) {
      await handleSaveStep(activeStep, true);
      setActiveStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Final submission validation
      if (!personal.full_name?.trim() || !personal.email?.trim()) {
        setActiveStep(0);
        showToast('Please add your Full Name and Email before submitting.', 'error');
        return;
      }

      await handleSaveStep(7, true);

      if (!isMember) {
        // Show Review & Confirmation screen before submitting COR request (Phase 9)
        setShowReviewModal(true);
      } else {
        showToast('Career profile updated successfully.', 'success');
        router.push('/cor');
      }
    }
  };

  const handleConfirmSubmitRequest = async () => {
    setSubmitting(true);
    try {
      await submitCorRequestAction();
      setShowReviewModal(false);
      showToast('Your COR request has been submitted for curatorial review!', 'success');
      router.push('/cor');
      router.refresh();
    } catch (err: any) {
      console.error('Failed to submit COR request:', err);
      showToast(err.message || 'Submission failed. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStepClick = async (idx: number) => {
    await handleSaveStep(activeStep, true);
    setActiveStep(idx);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Document upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: 'cv' | 'resume' | 'portfolio_pdf') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('docType', docType);

      const res = await uploadCorDocumentAction(formData);
      if (res.success) {
        const newDoc: CorDocument = {
          id: `doc-${Date.now()}`,
          creator_id: initialProfile.profile.creator_id,
          doc_type: docType,
          file_name: res.fileName,
          file_url: res.fileUrl,
          storage_path: '',
          created_at: new Date().toISOString(),
        };
        setDocuments((prev) => [newDoc, ...prev]);
        showToast(`Uploaded ${res.fileName} successfully!`, 'success');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      showToast(err.message || 'Failed to upload document', 'error');
    } finally {
      setUploadingDoc(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-[#141413] text-white px-5 py-3.5 rounded-2xl shadow-xl border border-neutral-800 flex items-center gap-3 max-w-md">
            {toast.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-rose-400 flex-shrink-0" />
            )}
            <p className="text-xs text-neutral-200 leading-snug">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Main Grid: Left Steps Navigation + Right Form Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Step Sidebar */}
        <aside className="lg:col-span-4 bg-white border border-[#E8E8E3] rounded-3xl p-5 sm:p-6 shadow-xs sticky top-24">
          <div className="mb-6 pb-5 border-b border-[#F0F0EB]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#73736C]">
              Career Questionnaire
            </p>
            <div className="flex items-center justify-between mt-2">
              <h3 className="font-serif text-xl font-semibold text-[#141413]">
                Profile Progress
              </h3>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#FAF5EC] text-[#865E16] border border-[#EADFCF]">
                {completeness}%
              </span>
            </div>
            {/* Progress track */}
            <div className="w-full bg-[#EFECE6] h-1.5 rounded-full overflow-hidden mt-3">
              <div
                className="bg-[#141413] h-full transition-all duration-300 rounded-full"
                style={{ width: `${((activeStep + 1) / 8) * 100}%` }}
              />
            </div>
          </div>

          <nav className="space-y-1">
            {STEPS.map((s, idx) => {
              const isActive = activeStep === idx;
              const isPassed = activeStep > idx;
              const Icon = s.icon;

              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleStepClick(idx)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-[#141413] text-white shadow-xs'
                      : isPassed
                      ? 'text-[#141413] hover:bg-[#FAF9F6]'
                      : 'text-[#8A8A85] hover:bg-neutral-50 hover:text-[#141413]'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-colors ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : isPassed
                        ? 'bg-[#EAF2EC] text-[#28633B] border border-[#CCE2D2]'
                        : 'bg-[#F0F0EB] text-[#8A8A85]'
                    }`}
                  >
                    {isPassed ? <Check size={12} strokeWidth={3} /> : idx + 1}
                  </span>
                  <span className="truncate">{s.title}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Right Form Panel */}
        <div className="lg:col-span-8 bg-white border border-[#E8E8E3] rounded-3xl p-7 sm:p-9 shadow-xs">
          <form onSubmit={handleNext} className="space-y-6">
            {/* Header */}
            <div className="border-b border-[#F0F0EB] pb-5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8A85]">
                  STEP {activeStep + 1} OF 8
                </span>
                {saving && (
                  <span className="text-[11px] text-[#8A8A85] animate-pulse">
                    Saving...
                  </span>
                )}
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#141413] mt-1">
                {STEPS[activeStep].title}
              </h2>
            </div>

            {/* STEP 0: Personal Information */}
            {activeStep === 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={personal.full_name}
                      onChange={(e) => setPersonal({ ...personal, full_name: e.target.value })}
                      placeholder="e.g. Maya Patel"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={personal.email}
                      onChange={(e) => setPersonal({ ...personal, email: e.target.value })}
                      placeholder="e.g. maya@example.com"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={personal.phone}
                      onChange={(e) => setPersonal({ ...personal, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                      Primary Location / City
                    </label>
                    <input
                      type="text"
                      value={personal.location}
                      onChange={(e) => setPersonal({ ...personal, location: e.target.value })}
                      placeholder="e.g. Bengaluru, India"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                    Artist Statement / Biography
                  </label>
                  <textarea
                    rows={4}
                    value={personal.bio || ''}
                    onChange={(e) => setPersonal({ ...personal, bio: e.target.value })}
                    placeholder="Briefly describe your creative background, inspiration, and themes explored in your practice..."
                    className="w-full text-xs p-3 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413] leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* STEP 1: Career Information */}
            {activeStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                      Current Role / Practice Title
                    </label>
                    <input
                      type="text"
                      value={career.current_role}
                      onChange={(e) => setCareer({ ...career, current_role: e.target.value })}
                      placeholder="e.g. Contemporary Visual Artist"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                      Current Studio / Organization (optional)
                    </label>
                    <input
                      type="text"
                      value={career.current_company}
                      onChange={(e) => setCareer({ ...career, current_company: e.target.value })}
                      placeholder="e.g. Studio Praxis / Independent"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                      Years of Experience
                    </label>
                    <select
                      value={career.years_of_experience}
                      onChange={(e) => setCareer({ ...career, years_of_experience: e.target.value })}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                    >
                      <option value="0-1 years">0-1 years (Emerging)</option>
                      <option value="1-3 years">1-3 years (Junior / Developing)</option>
                      <option value="3-5 years">3-5 years (Mid-Career)</option>
                      <option value="5-10 years">5-10 years (Established)</option>
                      <option value="10+ years">10+ years (Senior / Master)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                      Professional Category
                    </label>
                    <select
                      value={career.professional_category}
                      onChange={(e) => setCareer({ ...career, professional_category: e.target.value })}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                    >
                      <option value="Visual & Digital Arts">Visual & Digital Arts</option>
                      <option value="Fine Arts & Painting">Fine Arts & Painting</option>
                      <option value="Sculpture & Installation">Sculpture & Installation</option>
                      <option value="Photography & Mixed Media">Photography & Mixed Media</option>
                      <option value="Curatorial Practice">Curatorial Practice</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                      Remote Preference
                    </label>
                    <select
                      value={career.remote_preference}
                      onChange={(e) => setCareer({ ...career, remote_preference: e.target.value })}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                    >
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="Onsite">Onsite Studio</option>
                      <option value="Flexible">Flexible / Open</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                    Preferred Roles (comma separated)
                  </label>
                  <input
                    type="text"
                    value={career.preferred_roles.join(', ')}
                    onChange={(e) =>
                      setCareer({
                        ...career,
                        preferred_roles: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    placeholder="e.g. Resident Artist, Exhibition Designer, Creative Consultant"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: Skills & Specialisation */}
            {activeStep === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                    Primary Skills (comma separated)
                  </label>
                  <input
                    type="text"
                    value={skills.primary_skills.join(', ')}
                    onChange={(e) =>
                      setSkills({
                        ...skills,
                        primary_skills: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    placeholder="e.g. Oil on Canvas, Digital Illustration, Mixed Media, Printmaking"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                    Secondary Skills (comma separated)
                  </label>
                  <input
                    type="text"
                    value={skills.secondary_skills.join(', ')}
                    onChange={(e) =>
                      setSkills({
                        ...skills,
                        secondary_skills: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    placeholder="e.g. Exhibition Curation, Art Writing, Archival Preservation"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                      Software / Digital Tools
                    </label>
                    <input
                      type="text"
                      value={skills.software.join(', ')}
                      onChange={(e) =>
                        setSkills({
                          ...skills,
                          software: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                        })
                      }
                      placeholder="e.g. Photoshop, Procreate, Blender, Illustrator"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                      Studio Tools & Equipment
                    </label>
                    <input
                      type="text"
                      value={skills.tools.join(', ')}
                      onChange={(e) =>
                        setSkills({
                          ...skills,
                          tools: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                        })
                      }
                      placeholder="e.g. Etching Press, Kiln, Darkroom, Color Grading Monitor"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                    Core Specialization / Niche
                  </label>
                  <input
                    type="text"
                    value={skills.specialization}
                    onChange={(e) => setSkills({ ...skills, specialization: e.target.value })}
                    placeholder="e.g. Architectural abstraction and botanical realism"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                  />
                </div>
              </div>
            )}

            {/* STEP 3: Education */}
            {activeStep === 3 && (
              <div className="space-y-4">
                <div className="space-y-3">
                  {educationList.map((edu, idx) => (
                    <div
                      key={edu.id || idx}
                      className="p-4 rounded-2xl border border-[#E8E8E3] bg-[#FAF9F6] space-y-3 relative group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#141413]">
                          Education Entry #{idx + 1}
                        </span>
                        {educationList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setEducationList(educationList.filter((_, i) => i !== idx))}
                            className="text-[#8A8A85] hover:text-rose-600 transition-colors p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-[#141413] mb-1">
                            Degree / Certificate
                          </label>
                          <input
                            type="text"
                            value={edu.degree}
                            onChange={(e) => {
                              const updated = [...educationList];
                              updated[idx].degree = e.target.value;
                              setEducationList(updated);
                            }}
                            placeholder="e.g. BFA in Painting"
                            className="w-full text-xs px-3 py-2 rounded-xl border border-[#E8E8E3] bg-white text-[#141413] focus:outline-none focus:border-[#141413]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-[#141413] mb-1">
                            Graduation Year
                          </label>
                          <input
                            type="text"
                            value={edu.year}
                            onChange={(e) => {
                              const updated = [...educationList];
                              updated[idx].year = e.target.value;
                              setEducationList(updated);
                            }}
                            placeholder="e.g. 2022"
                            className="w-full text-xs px-3 py-2 rounded-xl border border-[#E8E8E3] bg-white text-[#141413] focus:outline-none focus:border-[#141413]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#141413] mb-1">
                          Institute / University
                        </label>
                        <input
                          type="text"
                          value={edu.institute}
                          onChange={(e) => {
                            const updated = [...educationList];
                            updated[idx].institute = e.target.value;
                            setEducationList(updated);
                          }}
                          placeholder="e.g. College of Art, New Delhi"
                          className="w-full text-xs px-3 py-2 rounded-xl border border-[#E8E8E3] bg-white text-[#141413] focus:outline-none focus:border-[#141413]"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setEducationList([
                      ...educationList,
                      {
                        id: `edu-${Date.now()}`,
                        creator_id: initialProfile.profile.creator_id,
                        degree: '',
                        institute: '',
                        year: '',
                        display_order: educationList.length,
                      },
                    ])
                  }
                  className="w-full py-2.5 rounded-2xl border border-dashed border-[#D5D3CE] text-xs font-semibold text-[#141413] hover:bg-[#FAF9F6] transition-colors inline-flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>+ Add Another Education</span>
                </button>
              </div>
            )}

            {/* STEP 4: Experience */}
            {activeStep === 4 && (
              <div className="space-y-4">
                <div className="space-y-4">
                  {experienceList.map((exp, idx) => (
                    <div
                      key={exp.id || idx}
                      className="p-4 rounded-2xl border border-[#E8E8E3] bg-[#FAF9F6] space-y-3 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#141413]">
                          Experience Entry #{idx + 1}
                        </span>
                        {experienceList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setExperienceList(experienceList.filter((_, i) => i !== idx))}
                            className="text-[#8A8A85] hover:text-rose-600 transition-colors p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-[#141413] mb-1">
                            Company / Studio Name
                          </label>
                          <input
                            type="text"
                            value={exp.company}
                            onChange={(e) => {
                              const updated = [...experienceList];
                              updated[idx].company = e.target.value;
                              setExperienceList(updated);
                            }}
                            placeholder="e.g. Studio Praxis"
                            className="w-full text-xs px-3 py-2 rounded-xl border border-[#E8E8E3] bg-white text-[#141413] focus:outline-none focus:border-[#141413]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-[#141413] mb-1">
                            Role / Position
                          </label>
                          <input
                            type="text"
                            value={exp.role}
                            onChange={(e) => {
                              const updated = [...experienceList];
                              updated[idx].role = e.target.value;
                              setExperienceList(updated);
                            }}
                            placeholder="e.g. Resident Visual Creator"
                            className="w-full text-xs px-3 py-2 rounded-xl border border-[#E8E8E3] bg-white text-[#141413] focus:outline-none focus:border-[#141413]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#141413] mb-1">
                          Duration (e.g. Jan 2023 – Present)
                        </label>
                        <input
                          type="text"
                          value={exp.duration || ''}
                          onChange={(e) => {
                            const updated = [...experienceList];
                            updated[idx].duration = e.target.value;
                            setExperienceList(updated);
                          }}
                          placeholder="e.g. 2023 - Present"
                          className="w-full text-xs px-3 py-2 rounded-xl border border-[#E8E8E3] bg-white text-[#141413] focus:outline-none focus:border-[#141413]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#141413] mb-1">
                          Responsibilities & Highlights
                        </label>
                        <textarea
                          rows={2}
                          value={exp.responsibilities}
                          onChange={(e) => {
                            const updated = [...experienceList];
                            updated[idx].responsibilities = e.target.value;
                            setExperienceList(updated);
                          }}
                          placeholder="Describe the projects created, exhibitions prepared, or key accomplishments..."
                          className="w-full text-xs p-2.5 rounded-xl border border-[#E8E8E3] bg-white text-[#141413] focus:outline-none focus:border-[#141413]"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setExperienceList([
                      ...experienceList,
                      {
                        id: `exp-${Date.now()}`,
                        creator_id: initialProfile.profile.creator_id,
                        company: '',
                        role: '',
                        duration: '',
                        is_current: false,
                        responsibilities: '',
                        display_order: experienceList.length,
                      },
                    ])
                  }
                  className="w-full py-2.5 rounded-2xl border border-dashed border-[#D5D3CE] text-xs font-semibold text-[#141413] hover:bg-[#FAF9F6] transition-colors inline-flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>+ Add Experience</span>
                </button>
              </div>
            )}

            {/* STEP 5: Professional Links */}
            {activeStep === 5 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                      Portfolio URL
                    </label>
                    <input
                      type="url"
                      value={links.portfolio_url}
                      onChange={(e) => setLinks({ ...links, portfolio_url: e.target.value })}
                      placeholder="https://yourportfolio.com"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                      LinkedIn
                    </label>
                    <input
                      type="url"
                      value={links.linkedin_url}
                      onChange={(e) => setLinks({ ...links, linkedin_url: e.target.value })}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                      Behance Profile
                    </label>
                    <input
                      type="url"
                      value={links.behance_url}
                      onChange={(e) => setLinks({ ...links, behance_url: e.target.value })}
                      placeholder="https://behance.net/username"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                      Dribbble Profile
                    </label>
                    <input
                      type="url"
                      value={links.dribbble_url}
                      onChange={(e) => setLinks({ ...links, dribbble_url: e.target.value })}
                      placeholder="https://dribbble.com/username"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                      Personal Website
                    </label>
                    <input
                      type="url"
                      value={links.personal_website}
                      onChange={(e) => setLinks({ ...links, personal_website: e.target.value })}
                      placeholder="https://artistname.art"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                      Instagram / Art Handle
                    </label>
                    <input
                      type="text"
                      value={links.instagram_url}
                      onChange={(e) => setLinks({ ...links, instagram_url: e.target.value })}
                      placeholder="@artist_handle"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: Documents */}
            {activeStep === 6 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* CV Upload */}
                  <div className="p-4 rounded-2xl border border-[#E8E8E3] bg-[#FAF9F6] text-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-white border border-[#E8E8E3] flex items-center justify-center mx-auto text-[#141413]">
                      <FileText size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#141413]">Curriculum Vitae (CV)</h4>
                      <p className="text-[11px] text-[#6E6E69] mt-0.5">Comprehensive career chronology</p>
                    </div>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#141413] text-xs font-semibold text-[#141413] hover:bg-neutral-50 cursor-pointer transition-colors shadow-2xs">
                      <Upload size={12} />
                      <span>{uploadingDoc ? 'Uploading...' : 'Upload CV'}</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        disabled={uploadingDoc}
                        onChange={(e) => handleFileUpload(e, 'cv')}
                      />
                    </label>
                  </div>

                  {/* Resume Upload */}
                  <div className="p-4 rounded-2xl border border-[#E8E8E3] bg-[#FAF9F6] text-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-white border border-[#E8E8E3] flex items-center justify-center mx-auto text-[#141413]">
                      <FileText size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#141413]">Resume</h4>
                      <p className="text-[11px] text-[#6E6E69] mt-0.5">One-page summary of accomplishments</p>
                    </div>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#141413] text-xs font-semibold text-[#141413] hover:bg-neutral-50 cursor-pointer transition-colors shadow-2xs">
                      <Upload size={12} />
                      <span>{uploadingDoc ? 'Uploading...' : 'Upload Resume'}</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        disabled={uploadingDoc}
                        onChange={(e) => handleFileUpload(e, 'resume')}
                      />
                    </label>
                  </div>

                  {/* Portfolio PDF */}
                  <div className="p-4 rounded-2xl border border-[#E8E8E3] bg-[#FAF9F6] text-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-white border border-[#E8E8E3] flex items-center justify-center mx-auto text-[#141413]">
                      <FileText size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#141413]">Portfolio PDF</h4>
                      <p className="text-[11px] text-[#6E6E69] mt-0.5">Catalog of select high-res works</p>
                    </div>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#141413] text-xs font-semibold text-[#141413] hover:bg-neutral-50 cursor-pointer transition-colors shadow-2xs">
                      <Upload size={12} />
                      <span>{uploadingDoc ? 'Uploading...' : 'Upload PDF'}</span>
                      <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        disabled={uploadingDoc}
                        onChange={(e) => handleFileUpload(e, 'portfolio_pdf')}
                      />
                    </label>
                  </div>
                </div>

                {/* Attached Documents List */}
                <div className="space-y-2 pt-2 border-t border-[#F0F0EB]">
                  <p className="text-xs font-bold text-[#141413]">
                    Attached Documents ({documents.length})
                  </p>
                  {documents.length > 0 ? (
                    <div className="space-y-2">
                      {documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-[#FAF9F6] border border-[#E8E8E3] text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <FileText size={15} className="text-[#865E16] flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="font-semibold text-[#141413] truncate">{doc.file_name}</p>
                              <span className="text-[10px] text-[#8A8A85] uppercase">
                                {doc.doc_type}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setDocuments(documents.filter((d) => d.id !== doc.id))}
                            className="text-[#8A8A85] hover:text-rose-600 transition-colors p-1"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#8A8A85] italic">
                      No documents attached yet. Documents are optional but strongly recommended for curatorial review.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* STEP 7: Career Goals */}
            {activeStep === 7 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                      Expected Compensation / Grant Target
                    </label>
                    <input
                      type="text"
                      value={goals.expected_salary}
                      onChange={(e) => setGoals({ ...goals, expected_salary: e.target.value })}
                      placeholder="e.g. ₹12,00,000 / year or $40,000 stipend"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                      Desired Role Title
                    </label>
                    <input
                      type="text"
                      value={goals.desired_role}
                      onChange={(e) => setGoals({ ...goals, desired_role: e.target.value })}
                      placeholder="e.g. Resident Artist / Principal Designer"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                      Opportunity Type Preference
                    </label>
                    <select
                      value={goals.opportunity_type}
                      onChange={(e) => setGoals({ ...goals, opportunity_type: e.target.value })}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                    >
                      <option value="Institutional Residency">Institutional Residency</option>
                      <option value="Museum Commission">Museum Commission</option>
                      <option value="Full-time Studio Role">Full-time Studio Role</option>
                      <option value="Commercial Brand Collaboration">Commercial Brand Collaboration</option>
                      <option value="Open to all curatorial opportunities">Open to all curatorial opportunities</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                      Compensation Privacy Setting
                    </label>
                    <select
                      value={goals.salary_privacy}
                      onChange={(e) => setGoals({ ...goals, salary_privacy: e.target.value as any })}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                    >
                      <option value="confidential">Confidential (Career Team Only)</option>
                      <option value="shared_with_curators">Shareable with Verified Recruiters</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                    Career Ambition & Statement of Direction
                  </label>
                  <textarea
                    rows={3}
                    value={goals.career_goal}
                    onChange={(e) => setGoals({ ...goals, career_goal: e.target.value })}
                    placeholder="Where do you see your practice in the next 2-3 years? What kind of representation, institutional exposure, or artistic milestones are you targeting?"
                    className="w-full text-xs p-3 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413] leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                    Additional Notes for Career Advisors
                  </label>
                  <textarea
                    rows={2}
                    value={goals.additional_notes}
                    onChange={(e) => setGoals({ ...goals, additional_notes: e.target.value })}
                    placeholder="Any specific companies, collectors, or geographical constraints you would like us to note..."
                    className="w-full text-xs p-3 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                  />
                </div>
              </div>
            )}

            {/* Bottom Actions: Back and Continue / Submit */}
            <div className="pt-6 border-t border-[#F0F0EB] flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={activeStep === 0 || saving || submitting}
                onClick={() => handleStepClick(activeStep - 1)}
                className="rounded-full px-5 text-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft size={13} />
                <span>Back</span>
              </Button>

              <div className="flex items-center gap-3">
                <Button
                  type="submit"
                  size="sm"
                  isLoading={saving || submitting}
                  className="bg-[#141413] text-white hover:bg-[#2A2A28] rounded-full px-6 text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {activeStep === 7 ? (
                    <>
                      <Sparkles size={13} className="text-[#FBBF24]" />
                      <span>{isMember ? 'Save & Update Profile' : 'Review & Submit COR Request'}</span>
                    </>
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight size={13} />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Phase 9 Review & Confirmation Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-[#E8E8E3] space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="space-y-1.5 border-b border-[#F0F0EB] pb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#FAF5EC] text-[#865E16] border border-[#EADFCF]">
                <Sparkles size={12} />
                <span>CONFIRM SUBMISSION</span>
              </div>
              <h3 className="font-serif text-2xl font-semibold text-[#141413]">
                Submit COR Membership Request
              </h3>
              <p className="text-xs text-[#6E6E69]">
                Please review your career details before sending them to the iRAS curatorial team.
              </p>
            </div>

            {/* Profile Summary */}
            <div className="space-y-3 text-xs bg-[#FAF9F6] p-4 rounded-2xl border border-[#E8E8E3]">
              <div className="flex justify-between border-b border-[#F0F0EB] pb-2">
                <span className="text-[#8A8A85]">Full Name:</span>
                <span className="font-semibold text-[#141413]">{personal.full_name}</span>
              </div>
              <div className="flex justify-between border-b border-[#F0F0EB] pb-2">
                <span className="text-[#8A8A85]">Email:</span>
                <span className="font-semibold text-[#141413]">{personal.email}</span>
              </div>
              <div className="flex justify-between border-b border-[#F0F0EB] pb-2">
                <span className="text-[#8A8A85]">Current Role:</span>
                <span className="font-semibold text-[#141413]">{career.current_role || 'Artist / Creator'}</span>
              </div>
              <div className="flex justify-between border-b border-[#F0F0EB] pb-2">
                <span className="text-[#8A8A85]">Experience:</span>
                <span className="font-semibold text-[#141413]">{career.years_of_experience || '3+ years'}</span>
              </div>
              <div className="flex justify-between border-b border-[#F0F0EB] pb-2">
                <span className="text-[#8A8A85]">Specialisation:</span>
                <span className="font-semibold text-[#141413]">{skills.specialization || 'Visual Arts'}</span>
              </div>
              <div className="flex justify-between border-b border-[#F0F0EB] pb-2">
                <span className="text-[#8A8A85]">Education Records:</span>
                <span className="font-semibold text-[#141413]">{educationList.length} entry(s)</span>
              </div>
              <div className="flex justify-between border-b border-[#F0F0EB] pb-2">
                <span className="text-[#8A8A85]">Experience Records:</span>
                <span className="font-semibold text-[#141413]">{experienceList.length} entry(s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A8A85]">Attached Documents:</span>
                <span className="font-semibold text-[#141413]">{documents.length} file(s)</span>
              </div>
            </div>

            {/* Advisory Note */}
            <div className="p-4 rounded-2xl bg-[#FAF5EC] border border-[#EADFCF] flex items-start gap-2.5 text-xs text-[#5A5A55]">
              <CheckCircle2 size={16} className="text-[#865E16] flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold text-[#141413] block">
                  Admin-Managed Review Process
                </span>
                <p className="text-[11px] leading-relaxed text-[#6E6E69]">
                  Upon submission, your request enters the Pending review queue. Our career specialists will evaluate your submission, verify institutional alignment, and once approved as a member, prepare and submit applications on your behalf.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={submitting}
                onClick={() => setShowReviewModal(false)}
                className="rounded-full px-5 text-xs cursor-pointer"
              >
                Back to Edit
              </Button>

              <Button
                type="button"
                size="sm"
                isLoading={submitting}
                onClick={handleConfirmSubmitRequest}
                className="bg-[#141413] text-white hover:bg-[#2A2A28] rounded-full px-6 text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Confirm & Submit Request</span>
                <ArrowRight size={13} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
