'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Palette,
  MapPin,
  History,
  Globe,
  Award,
  Target,
  Plane,
  Building,
  Wrench,
  DollarSign,
  Users,
  FileCheck,
  ShieldAlert,
  SlidersHorizontal,
  ArrowRight,
  ArrowLeft,
  Check,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { CorFullProfile, ArtistIntakeQuestionnaire } from '@/types/cor';
import { saveArtistIntakeAction, submitCorProfileFinalAction } from '@/actions/corActions';
import Button from '@/components/ui/Button';

interface CorProfileWorkflowProps {
  initialProfile: CorFullProfile;
}

const STEPS = [
  { id: 0, title: 'Identity & Practice', sub: 'Sections A & B', icon: Palette },
  { id: 1, title: 'Location & Career', sub: 'Sections C & D', icon: History },
  { id: 2, title: 'Presence & Platforms', sub: 'Sections E & F', icon: Globe },
  { id: 3, title: 'Recognition & Goals', sub: 'Sections G & H', icon: Target },
  { id: 4, title: 'Mobility & Targets', sub: 'Sections I & J', icon: Plane },
  { id: 5, title: 'Studio & Financials', sub: 'Sections K & L', icon: DollarSign },
  { id: 6, title: 'Participation & History', sub: 'Sections M & N', icon: Users },
  { id: 7, title: 'Restrictions & Governance', sub: 'Sections O & P', icon: SlidersHorizontal },
];

const PRIMARY_MEDIUMS = [
  'Painting',
  'Sculpture',
  'Photography',
  'Performance',
  'Installation',
  'Printmaking',
  'Ceramics',
  'Textile',
  'Digital / New Media',
  'Mixed Media',
  'Video / Film',
  'Other',
];

const PAPER_MEDIUMS = ['Watercolor', 'Gouache', 'Ink', 'Tempera', 'Acrylic on Paper', 'Charcoal / Pastel'];
const CANVAS_MEDIUMS = ['Oil on Canvas', 'Acrylic on Canvas', 'Mixed Media on Canvas', 'Enamel', 'Linen / Raw Canvas'];
const SCULPTURE_MEDIUMS = ['Bronze', 'Clay / Terracotta', 'Stone', 'Wood', 'Metal / Steel', 'Resin', 'Found Objects', 'Glass'];
const DIGITAL_SOFTWARE = ['Photoshop', 'Procreate', 'Blender', 'Illustrator', 'TouchDesigner', 'Cinema 4D', 'Unreal Engine', 'After Effects', 'AI / Generative'];

const SIGNIFICANT_PLATFORMS_OPTIONS = [
  'Art fairs',
  'Biennales',
  'Triennales',
  'Festivals',
  'Symposiums',
  'Institutional programs',
  'Other',
];

const GOAL_PRIORITIES_OPTIONS = [
  'Funding for my practice',
  'International exposure',
  'Exhibitions',
  'Residencies',
  'Awards / recognition',
  'Press / publications',
  'Other',
];

const FACILITIES_OPTIONS = [
  'Private studio',
  'Shared studio',
  'Kiln',
  'Printing facilities',
  'Photography / video equipment',
  'Digital fabrication',
  'Other specialised facilities',
  'Other',
];

const PARTICIPATION_OPTIONS = [
  'Public presentations',
  'Workshops',
  'Talks / lectures',
  'Teaching',
  'Community engagement',
  'Open studios',
  'Performances',
  'Public-facing events',
];

export default function CorProfileWorkflow({ initialProfile }: CorProfileWorkflowProps) {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [completeness, setCompleteness] = useState(initialProfile.profile.completeness_percentage || 0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form State initialized from initialProfile.intake
  const [formData, setFormData] = useState<ArtistIntakeQuestionnaire>(() => {
    const existing = initialProfile.intake!;
    return {
      personal: { ...existing.personal },
      artistic_practice: {
        ...existing.artistic_practice,
        primary_medium: [...(existing.artistic_practice.primary_medium || [])],
        paper_painting_medium: [...(existing.artistic_practice.paper_painting_medium || [])],
        canvas_painting_medium: [...(existing.artistic_practice.canvas_painting_medium || [])],
        sculpture_medium: [...(existing.artistic_practice.sculpture_medium || [])],
        digital_art_software: [...(existing.artistic_practice.digital_art_software || [])],
      },
      geography: { ...existing.geography },
      career_history: { ...existing.career_history },
      digital_presence: { ...existing.digital_presence },
      significant_platforms: {
        ...existing.significant_platforms,
        platforms: [...(existing.significant_platforms.platforms || [])],
        platform_details: { ...(existing.significant_platforms.platform_details || {}) },
      },
      awards_recognition: { ...existing.awards_recognition },
      goals_priorities: {
        ...existing.goals_priorities,
        priorities: [...(existing.goals_priorities.priorities || [])],
      },
      mobility: { ...existing.mobility },
      target_opportunities: { ...existing.target_opportunities },
      facilities: {
        ...existing.facilities,
        selected_facilities: [...(existing.facilities.selected_facilities || [])],
      },
      financial: { ...existing.financial },
      participation: {
        ...existing.participation,
        preferred_activities: [...(existing.participation.preferred_activities || [])],
      },
      previous_applications: { ...existing.previous_applications },
      representation_restrictions: { ...existing.representation_restrictions },
      approval_preferences: { ...existing.approval_preferences },
    };
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Helper to toggle array values
  const toggleArrayItem = (list: string[], item: string): string[] => {
    return list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
  };

  // Save current intake draft to database
  const handleSaveDraft = async (silent = false) => {
    setSaving(true);
    try {
      const res = await saveArtistIntakeAction(formData);
      if (res?.success) {
        setCompleteness(res.completeness);
        const timeStr = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric' }).format(new Date());
        setLastSaved(`Saved at ${timeStr}`);
        if (!silent) {
          showToast('Draft progress saved successfully.', 'success');
        }
      }
    } catch (err: any) {
      console.error('Save draft error:', err);
      if (!silent) {
        showToast(err.message || 'Failed to save draft progress.', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  // Navigate between steps with auto-save
  const handleNextStep = async () => {
    await handleSaveDraft(true);
    if (activeStep < STEPS.length - 1) {
      setActiveStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setShowReviewModal(true);
    }
  };

  const handlePrevStep = () => {
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Final formal submission
  const handleFinalSubmit = async () => {
    setSubmitting(true);
    try {
      // First ensure latest form data is saved
      await saveArtistIntakeAction(formData);
      // Submit profile and create pending request
      const res = await submitCorProfileFinalAction();
      if (res?.success) {
        showToast('Your COR profile and questionnaire have been submitted!', 'success');
        setShowReviewModal(false);
        router.push('/cor');
      }
    } catch (err: any) {
      console.error('Submission error:', err);
      showToast(err.message || 'Failed to submit profile. Please review required fields.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const isMediumSelected = (medium: string) => formData.artistic_practice.primary_medium.includes(medium);

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

      {/* Main Grid: Left Step Navigator + Right Form Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Step Sidebar */}
        <aside className="lg:col-span-4 bg-white border border-[#E8E8E3] rounded-3xl p-5 sm:p-6 shadow-xs sticky top-24">
          <div className="mb-6 pb-5 border-b border-[#F0F0EB]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#73736C]">
              Artist Intake Questionnaire
            </p>
            <div className="flex items-center justify-between mt-2">
              <h3 className="font-serif text-xl font-semibold text-[#141413]">
                Profile Progress
              </h3>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#FAF5EC] text-[#865E16] border border-[#EADFCF]">
                {completeness}%
              </span>
            </div>
            <div className="w-full bg-[#F0F0EB] h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-[#B8532F] h-full transition-all duration-300 rounded-full"
                style={{ width: `${completeness}%` }}
              />
            </div>
            {lastSaved && (
              <p className="text-[10px] text-[#8A8A85] mt-2 flex items-center gap-1">
                <Check size={11} className="text-emerald-600" />
                <span>{lastSaved}</span>
              </p>
            )}
          </div>

          <nav className="space-y-1.5">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = activeStep === step.id;
              const isPast = activeStep > step.id;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={async () => {
                    await handleSaveDraft(true);
                    setActiveStep(step.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#141413] text-white shadow-xs'
                      : 'hover:bg-[#FAF9F6] text-[#6E6E69] hover:text-[#141413]'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-semibold ${
                      isActive
                        ? 'bg-white/10 text-white'
                        : isPast
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-[#F0F0EB] text-[#6E6E69]'
                    }`}
                  >
                    {isPast ? <Check size={14} /> : <Icon size={14} />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-semibold truncate ${isActive ? 'text-white' : 'text-[#141413]'}`}>
                      {step.title}
                    </p>
                    <p className={`text-[10px] truncate ${isActive ? 'text-neutral-400' : 'text-[#8A8A85]'}`}>
                      {step.sub}
                    </p>
                  </div>
                </button>
              );
            })}
          </nav>

          <div className="mt-6 pt-5 border-t border-[#F0F0EB] flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleSaveDraft(false)}
              disabled={saving}
              className="w-full text-xs flex items-center justify-center gap-1.5 border border-[#E8E8E3] bg-[#FAF9F6] hover:bg-[#F2F1ED]"
            >
              <Save size={13} />
              <span>{saving ? 'Saving...' : 'Save Draft'}</span>
            </Button>
          </div>
        </aside>

        {/* Right Form Container */}
        <main className="lg:col-span-8 bg-white border border-[#E8E8E3] rounded-3xl p-6 sm:p-8 shadow-xs space-y-8">
          {/* STEP HEADER */}
          <div className="border-b border-[#F0F0EB] pb-5 flex items-start justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#B8532F]">
                Step {activeStep + 1} of 8 · {STEPS[activeStep].sub}
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#141413] mt-1">
                {STEPS[activeStep].title}
              </h2>
            </div>
            <span className="text-xs text-[#8A8A85] self-center">
              * Indicates required fields
            </span>
          </div>

          {/* ======================================================== */}
          {/* STEP 0: Identity & Practice (Sections A & B)             */}
          {/* ======================================================== */}
          {activeStep === 0 && (
            <div className="space-y-8">
              {/* SECTION A: Personal Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-[#E8E8E3] pb-2">
                  <User size={16} className="text-[#B8532F]" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#141413]">
                    Section A — Personal Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.personal.full_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          personal: { ...formData.personal, full_name: e.target.value },
                        })
                      }
                      placeholder="e.g. Maya Krishnan"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                      Pen Name / Artist Pseudonym <span className="text-[#8A8A85] font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.personal.pen_name || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          personal: { ...formData.personal, pen_name: e.target.value },
                        })
                      }
                      placeholder="e.g. M. K. Praxis"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                      Primary Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={formData.personal.primary_phone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          personal: { ...formData.personal, primary_phone: e.target.value },
                        })
                      }
                      placeholder="+91 98765 43210"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                      Secondary Phone Number <span className="text-[#8A8A85] font-normal">(Optional)</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.personal.secondary_phone || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          personal: { ...formData.personal, secondary_phone: e.target.value },
                        })
                      }
                      placeholder="+91 91234 56789"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                      Primary Email Address *
                    </label>
                    <input
                      type="email"
                      value={formData.personal.primary_email}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          personal: { ...formData.personal, primary_email: e.target.value },
                        })
                      }
                      placeholder="artist@example.com"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                      Secondary Email Address <span className="text-[#8A8A85] font-normal">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      value={formData.personal.secondary_email || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          personal: { ...formData.personal, secondary_email: e.target.value },
                        })
                      }
                      placeholder="studio@example.com"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      value={formData.personal.date_of_birth}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          personal: { ...formData.personal, date_of_birth: e.target.value },
                        })
                      }
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION B: Artistic Practice */}
              <div className="space-y-4 pt-4 border-t border-[#F0F0EB]">
                <div className="flex items-center gap-2 border-b border-[#E8E8E3] pb-2">
                  <Palette size={16} className="text-[#B8532F]" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#141413]">
                    Section B — Artistic Practice
                  </h3>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141413] mb-2">
                    Primary Medium (Select all that apply to your practice) *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PRIMARY_MEDIUMS.map((medium) => {
                      const selected = isMediumSelected(medium);
                      return (
                        <button
                          key={medium}
                          type="button"
                          onClick={() => {
                            const updated = toggleArrayItem(formData.artistic_practice.primary_medium, medium);
                            setFormData({
                              ...formData,
                              artistic_practice: { ...formData.artistic_practice, primary_medium: updated },
                            });
                          }}
                          className={`text-xs px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${
                            selected
                              ? 'bg-[#141413] text-white border-[#141413]'
                              : 'bg-[#FAF9F6] text-[#6E6E69] border-[#E8E8E3] hover:border-[#141413] hover:text-[#141413]'
                          }`}
                        >
                          {medium}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Conditional Other Medium input */}
                {isMediumSelected('Other') && (
                  <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E8E3] space-y-1.5 animate-in fade-in">
                    <label className="block text-xs font-semibold text-[#141413]">
                      Please specify your other medium:
                    </label>
                    <input
                      type="text"
                      value={formData.artistic_practice.custom_medium || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          artistic_practice: { ...formData.artistic_practice, custom_medium: e.target.value },
                        })
                      }
                      placeholder="e.g. Soundscapes, Bio-art, Holography"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-white text-[#141413] focus:outline-none focus:border-[#141413]"
                    />
                  </div>
                )}

                {/* Conditional Painting mediums */}
                {isMediumSelected('Painting') && (
                  <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#E8E8E3] space-y-4 animate-in fade-in">
                    <h4 className="text-xs font-bold text-[#141413] uppercase tracking-wider">
                      Painting Specifics
                    </h4>

                    <div>
                      <label className="block text-xs font-medium text-[#6E6E69] mb-2">
                        Paper Painting Medium
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {PAPER_MEDIUMS.map((m) => {
                          const active = formData.artistic_practice.paper_painting_medium?.includes(m);
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => {
                                const list = formData.artistic_practice.paper_painting_medium || [];
                                const updated = toggleArrayItem(list, m);
                                setFormData({
                                  ...formData,
                                  artistic_practice: { ...formData.artistic_practice, paper_painting_medium: updated },
                                });
                              }}
                              className={`text-[11px] px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                                active
                                  ? 'bg-[#B8532F] text-white border-[#B8532F]'
                                  : 'bg-white text-[#6E6E69] border-[#E8E8E3] hover:border-[#141413]'
                              }`}
                            >
                              {m}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#6E6E69] mb-2">
                        Canvas Painting Medium
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {CANVAS_MEDIUMS.map((m) => {
                          const active = formData.artistic_practice.canvas_painting_medium?.includes(m);
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => {
                                const list = formData.artistic_practice.canvas_painting_medium || [];
                                const updated = toggleArrayItem(list, m);
                                setFormData({
                                  ...formData,
                                  artistic_practice: { ...formData.artistic_practice, canvas_painting_medium: updated },
                                });
                              }}
                              className={`text-[11px] px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                                active
                                  ? 'bg-[#B8532F] text-white border-[#B8532F]'
                                  : 'bg-white text-[#6E6E69] border-[#E8E8E3] hover:border-[#141413]'
                              }`}
                            >
                              {m}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Conditional Sculpture mediums */}
                {isMediumSelected('Sculpture') && (
                  <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#E8E8E3] space-y-2 animate-in fade-in">
                    <label className="block text-xs font-bold text-[#141413] uppercase tracking-wider mb-2">
                      Sculpture Specifics — Mediums used
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {SCULPTURE_MEDIUMS.map((m) => {
                        const active = formData.artistic_practice.sculpture_medium?.includes(m);
                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => {
                              const list = formData.artistic_practice.sculpture_medium || [];
                              const updated = toggleArrayItem(list, m);
                              setFormData({
                                ...formData,
                                artistic_practice: { ...formData.artistic_practice, sculpture_medium: updated },
                              });
                            }}
                            className={`text-[11px] px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                              active
                                ? 'bg-[#B8532F] text-white border-[#B8532F]'
                                : 'bg-white text-[#6E6E69] border-[#E8E8E3] hover:border-[#141413]'
                            }`}
                          >
                            {m}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Conditional Digital Art tools */}
                {isMediumSelected('Digital / New Media') && (
                  <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#E8E8E3] space-y-2 animate-in fade-in">
                    <label className="block text-xs font-bold text-[#141413] uppercase tracking-wider mb-2">
                      Digital Art Tools & Software
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {DIGITAL_SOFTWARE.map((s) => {
                        const active = formData.artistic_practice.digital_art_software?.includes(s);
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => {
                              const list = formData.artistic_practice.digital_art_software || [];
                              const updated = toggleArrayItem(list, s);
                              setFormData({
                                ...formData,
                                artistic_practice: { ...formData.artistic_practice, digital_art_software: updated },
                              });
                            }}
                            className={`text-[11px] px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                              active
                                ? 'bg-[#B8532F] text-white border-[#B8532F]'
                                : 'bg-white text-[#6E6E69] border-[#E8E8E3] hover:border-[#141413]'
                            }`}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 1: Location & Career (Sections C & D)                */}
          {/* ======================================================== */}
          {activeStep === 1 && (
            <div className="space-y-8">
              {/* SECTION C: Geography and Location */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-[#E8E8E3] pb-2">
                  <MapPin size={16} className="text-[#B8532F]" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#141413]">
                    Section C — Geography & Location
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-2">
                      Geographical Preference *
                    </label>
                    <div className="flex gap-2">
                      {(['Home State', 'Pan-India', 'Other'] as const).map((pref) => (
                        <button
                          key={pref}
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              geography: { ...formData.geography, geographical_preference: pref },
                            })
                          }
                          className={`text-xs px-4 py-2.5 rounded-xl border transition-all cursor-pointer ${
                            formData.geography.geographical_preference === pref
                              ? 'bg-[#141413] text-white border-[#141413]'
                              : 'bg-[#FAF9F6] text-[#6E6E69] border-[#E8E8E3] hover:border-[#141413]'
                          }`}
                        >
                          {pref}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                        Home State *
                      </label>
                      <input
                        type="text"
                        value={formData.geography.home_state}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            geography: { ...formData.geography, home_state: e.target.value },
                          })
                        }
                        placeholder="e.g. Maharashtra, Kerala, West Bengal"
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                        City / Town *
                      </label>
                      <input
                        type="text"
                        value={formData.geography.city_town}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            geography: { ...formData.geography, city_town: e.target.value },
                          })
                        }
                        placeholder="e.g. Mumbai, Kochi, Kolkata"
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                      Studio / Home Address *
                    </label>
                    <textarea
                      rows={2}
                      value={formData.geography.studio_address}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          geography: { ...formData.geography, studio_address: e.target.value },
                        })
                      }
                      placeholder="Street address, studio studio / workspace location"
                      className="w-full text-xs p-3.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION D: Career History */}
              <div className="space-y-4 pt-4 border-t border-[#F0F0EB]">
                <div className="flex items-center gap-2 border-b border-[#E8E8E3] pb-2">
                  <History size={16} className="text-[#B8532F]" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#141413]">
                    Section D — Career History
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                      Year Began Practicing *
                    </label>
                    <input
                      type="text"
                      value={formData.career_history.practicing_since_year}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          career_history: { ...formData.career_history, practicing_since_year: e.target.value },
                        })
                      }
                      placeholder="e.g. 2018"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                      Group Exhibitions Count
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.career_history.group_exhibitions_count}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          career_history: {
                            ...formData.career_history,
                            group_exhibitions_count: Math.max(0, parseInt(e.target.value) || 0),
                          },
                        })
                      }
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                      Solo Exhibitions Count
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.career_history.solo_exhibitions_count}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          career_history: {
                            ...formData.career_history,
                            solo_exhibitions_count: Math.max(0, parseInt(e.target.value) || 0),
                          },
                        })
                      }
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141413] mb-2">
                    Current Career Stage *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(['Emerging', 'Early Career', 'Mid-Career', 'Established', 'Other'] as const).map((stage) => (
                      <button
                        key={stage}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            career_history: { ...formData.career_history, career_stage: stage },
                          })
                        }
                        className={`text-xs px-4 py-2.5 rounded-xl border transition-all cursor-pointer ${
                          formData.career_history.career_stage === stage
                            ? 'bg-[#141413] text-white border-[#141413]'
                            : 'bg-[#FAF9F6] text-[#6E6E69] border-[#E8E8E3] hover:border-[#141413]'
                        }`}
                      >
                        {stage}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                    Most Important Exhibitions
                  </label>
                  <textarea
                    rows={3}
                    value={formData.career_history.important_exhibitions}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        career_history: { ...formData.career_history, important_exhibitions: e.target.value },
                      })
                    }
                    placeholder="List key exhibitions, dates, venues, and curatorial context"
                    className="w-full text-xs p-3.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-2">
                      Current Gallery Representation *
                    </label>
                    <div className="flex gap-2">
                      {(['Yes', 'No', 'Other'] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              career_history: { ...formData.career_history, gallery_representation: opt },
                            })
                          }
                          className={`text-xs px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${
                            formData.career_history.gallery_representation === opt
                              ? 'bg-[#141413] text-white border-[#141413]'
                              : 'bg-[#FAF9F6] text-[#6E6E69] border-[#E8E8E3]'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {formData.career_history.gallery_representation === 'Yes' && (
                    <div>
                      <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                        Gallery or Galleries Represented By:
                      </label>
                      <input
                        type="text"
                        value={formData.career_history.represented_galleries || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            career_history: { ...formData.career_history, represented_galleries: e.target.value },
                          })
                        }
                        placeholder="e.g. Vadehra Art Gallery, Chemould Prescott Road"
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                    Previous Residencies
                  </label>
                  <textarea
                    rows={2}
                    value={formData.career_history.previous_residencies}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        career_history: { ...formData.career_history, previous_residencies: e.target.value },
                      })
                    }
                    placeholder="Residency programs, hosts, and production periods"
                    className="w-full text-xs p-3.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 2: Digital Presence & Platforms (Sections E & F)    */}
          {/* ======================================================== */}
          {activeStep === 2 && (
            <div className="space-y-8">
              {/* SECTION E: Digital Presence */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-[#E8E8E3] pb-2">
                  <Globe size={16} className="text-[#B8532F]" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#141413]">
                    Section E — Digital Presence
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                      Website URL
                    </label>
                    <input
                      type="url"
                      value={formData.digital_presence.website_url || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          digital_presence: { ...formData.digital_presence, website_url: e.target.value },
                        })
                      }
                      placeholder="https://yourname.com"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                      Instagram Handle / URL
                    </label>
                    <input
                      type="text"
                      value={formData.digital_presence.instagram_handle || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          digital_presence: { ...formData.digital_presence, instagram_handle: e.target.value },
                        })
                      }
                      placeholder="@artist_studio or url"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                      LinkedIn ID / Profile URL
                    </label>
                    <input
                      type="text"
                      value={formData.digital_presence.linkedin_handle || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          digital_presence: { ...formData.digital_presence, linkedin_handle: e.target.value },
                        })
                      }
                      placeholder="linkedin.com/in/artist"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                      X (Twitter) Handle
                    </label>
                    <input
                      type="text"
                      value={formData.digital_presence.x_handle || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          digital_presence: { ...formData.digital_presence, x_handle: e.target.value },
                        })
                      }
                      placeholder="@artist_handle"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                      Facebook Page / ID
                    </label>
                    <input
                      type="text"
                      value={formData.digital_presence.facebook_handle || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          digital_presence: { ...formData.digital_presence, facebook_handle: e.target.value },
                        })
                      }
                      placeholder="facebook.com/artist"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION F: Significant Platforms */}
              <div className="space-y-4 pt-4 border-t border-[#F0F0EB]">
                <div className="flex items-center gap-2 border-b border-[#E8E8E3] pb-2">
                  <Sparkles size={16} className="text-[#B8532F]" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#141413]">
                    Section F — Significant Platforms
                  </h3>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141413] mb-2">
                    Select platforms you have engaged with:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SIGNIFICANT_PLATFORMS_OPTIONS.map((plat) => {
                      const selected = formData.significant_platforms.platforms.includes(plat);
                      return (
                        <button
                          key={plat}
                          type="button"
                          onClick={() => {
                            const updated = toggleArrayItem(formData.significant_platforms.platforms, plat);
                            setFormData({
                              ...formData,
                              significant_platforms: { ...formData.significant_platforms, platforms: updated },
                            });
                          }}
                          className={`text-xs px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${
                            selected
                              ? 'bg-[#141413] text-white border-[#141413]'
                              : 'bg-[#FAF9F6] text-[#6E6E69] border-[#E8E8E3] hover:border-[#141413]'
                          }`}
                        >
                          {plat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Details for selected platforms */}
                {formData.significant_platforms.platforms.length > 0 && (
                  <div className="space-y-3 pt-2">
                    {formData.significant_platforms.platforms.map((plat) => {
                      const details = formData.significant_platforms.platform_details[plat] || {
                        names: '',
                        description: '',
                      };
                      return (
                        <div key={plat} className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E8E3] space-y-2">
                          <p className="text-xs font-bold text-[#141413]">{plat} Details</p>
                          <input
                            type="text"
                            value={details.names}
                            onChange={(e) => {
                              const updated = {
                                ...formData.significant_platforms.platform_details,
                                [plat]: { ...details, names: e.target.value },
                              };
                              setFormData({
                                ...formData,
                                significant_platforms: { ...formData.significant_platforms, platform_details: updated },
                              });
                            }}
                            placeholder={`Specific ${plat} names (e.g. India Art Fair, Kochi-Muziris Biennale)`}
                            className="w-full text-xs px-3.5 py-2 rounded-xl border border-[#E8E8E3] bg-white text-[#141413] focus:outline-none focus:border-[#141413]"
                          />
                          <input
                            type="text"
                            value={details.description}
                            onChange={(e) => {
                              const updated = {
                                ...formData.significant_platforms.platform_details,
                                [plat]: { ...details, description: e.target.value },
                              };
                              setFormData({
                                ...formData,
                                significant_platforms: { ...formData.significant_platforms, platform_details: updated },
                              });
                            }}
                            placeholder="Brief description of work shown or participation role"
                            className="w-full text-xs px-3.5 py-2 rounded-xl border border-[#E8E8E3] bg-white text-[#141413] focus:outline-none focus:border-[#141413]"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 3: Recognition & Goals (Sections G & H)              */}
          {/* ======================================================== */}
          {activeStep === 3 && (
            <div className="space-y-8">
              {/* SECTION G: Awards, Funding and Recognition */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-[#E8E8E3] pb-2">
                  <Award size={16} className="text-[#B8532F]" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#141413]">
                    Section G — Awards, Funding & Recognition
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-2">
                      Previously received grants, fellowships, scholarships, or awards? *
                    </label>
                    <div className="flex gap-2">
                      {(['Yes', 'No'] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              awards_recognition: { ...formData.awards_recognition, has_funding_awards: opt },
                            })
                          }
                          className={`text-xs px-4 py-2 rounded-xl border transition-all cursor-pointer ${
                            formData.awards_recognition.has_funding_awards === opt
                              ? 'bg-[#141413] text-white border-[#141413]'
                              : 'bg-[#FAF9F6] text-[#6E6E69] border-[#E8E8E3]'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {formData.awards_recognition.has_funding_awards === 'Yes' && (
                    <div className="animate-in fade-in">
                      <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                        Details of Funding, Fellowships & Awards:
                      </label>
                      <textarea
                        rows={2}
                        value={formData.awards_recognition.funding_details || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            awards_recognition: { ...formData.awards_recognition, funding_details: e.target.value },
                          })
                        }
                        placeholder="List grantor, award title, year, and grant scope"
                        className="w-full text-xs p-3.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                      />
                    </div>
                  )}

                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-[#141413] mb-2">
                      Previously received press, publications, reviews, or interviews? *
                    </label>
                    <div className="flex gap-2">
                      {(['Yes', 'No'] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              awards_recognition: { ...formData.awards_recognition, has_press_publications: opt },
                            })
                          }
                          className={`text-xs px-4 py-2 rounded-xl border transition-all cursor-pointer ${
                            formData.awards_recognition.has_press_publications === opt
                              ? 'bg-[#141413] text-white border-[#141413]'
                              : 'bg-[#FAF9F6] text-[#6E6E69] border-[#E8E8E3]'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {formData.awards_recognition.has_press_publications === 'Yes' && (
                    <div className="animate-in fade-in">
                      <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                        Details of Press & Recognition:
                      </label>
                      <textarea
                        rows={2}
                        value={formData.awards_recognition.press_details || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            awards_recognition: { ...formData.awards_recognition, press_details: e.target.value },
                          })
                        }
                        placeholder="e.g. Featured in Art India, Platform Magazine review (2024)"
                        className="w-full text-xs p-3.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION H: Artist Goals and Funding Priorities */}
              <div className="space-y-4 pt-4 border-t border-[#F0F0EB]">
                <div className="flex items-center gap-2 border-b border-[#E8E8E3] pb-2">
                  <Target size={16} className="text-[#B8532F]" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#141413]">
                    Section H — Artist Goals & Priorities
                  </h3>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141413] mb-2">
                    Priorities for your practice (Select one or more) *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {GOAL_PRIORITIES_OPTIONS.map((p) => {
                      const selected = formData.goals_priorities.priorities.includes(p);
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => {
                            const updated = toggleArrayItem(formData.goals_priorities.priorities, p);
                            setFormData({
                              ...formData,
                              goals_priorities: { ...formData.goals_priorities, priorities: updated },
                            });
                          }}
                          className={`text-xs px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${
                            selected
                              ? 'bg-[#141413] text-white border-[#141413]'
                              : 'bg-[#FAF9F6] text-[#6E6E69] border-[#E8E8E3]'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                    Intended use of ₹1 lakh / $1,000 for your artistic practice *
                  </label>
                  <textarea
                    rows={2}
                    value={formData.goals_priorities.intended_use_of_funds}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        goals_priorities: { ...formData.goals_priorities, intended_use_of_funds: e.target.value },
                      })
                    }
                    placeholder="Specific equipment, materials, studio rental, or production costs"
                    className="w-full text-xs p-3.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                    Project you would pursue without funding limitations *
                  </label>
                  <textarea
                    rows={2}
                    value={formData.goals_priorities.dream_project}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        goals_priorities: { ...formData.goals_priorities, dream_project: e.target.value },
                      })
                    }
                    placeholder="Describe your ambitious long-term installation, body of work, or conceptual vision"
                    className="w-full text-xs p-3.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                    Current project proposal under development *
                  </label>
                  <textarea
                    rows={2}
                    value={formData.goals_priorities.current_proposal}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        goals_priorities: { ...formData.goals_priorities, current_proposal: e.target.value },
                      })
                    }
                    placeholder="Working title, thematic direction, materials, and target stage"
                    className="w-full text-xs p-3.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 4: Mobility & Target Opportunities (Sections I & J) */}
          {/* ======================================================== */}
          {activeStep === 4 && (
            <div className="space-y-8">
              {/* SECTION I: International Mobility */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-[#E8E8E3] pb-2">
                  <Plane size={16} className="text-[#B8532F]" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#141413]">
                    Section I — International Mobility
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-2">
                      Willingness to go outside the country: *
                    </label>
                    <div className="flex gap-2">
                      {(['Flexible', 'Not-flexible', 'Other'] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              mobility: { ...formData.mobility, willingness: opt },
                            })
                          }
                          className={`text-xs px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${
                            formData.mobility.willingness === opt
                              ? 'bg-[#141413] text-white border-[#141413]'
                              : 'bg-[#FAF9F6] text-[#6E6E69] border-[#E8E8E3]'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-2">
                      Willingness to relocate temporarily: *
                    </label>
                    <select
                      value={formData.mobility.relocate_temporarily}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          mobility: {
                            ...formData.mobility,
                            relocate_temporarily: e.target.value as any,
                          },
                        })
                      }
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413]"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                      <option value="Depends on location/opportunity">Depends on location/opportunity</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                      Maximum Residency Duration:
                    </label>
                    <select
                      value={formData.mobility.max_residency_duration}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          mobility: {
                            ...formData.mobility,
                            max_residency_duration: e.target.value as any,
                          },
                        })
                      }
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413]"
                    >
                      <option value="Under 1 month">Under 1 month</option>
                      <option value="1–3 months">1–3 months</option>
                      <option value="3–6 months">3–6 months</option>
                      <option value="6–12 months">6–12 months</option>
                      <option value="1 year+">1 year+</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-2">
                      Passport Status: *
                    </label>
                    <div className="flex gap-2">
                      {(['Yes', 'No', 'Expires soon'] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              mobility: { ...formData.mobility, passport_status: opt },
                            })
                          }
                          className={`text-xs px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${
                            formData.mobility.passport_status === opt
                              ? 'bg-[#141413] text-white border-[#141413]'
                              : 'bg-[#FAF9F6] text-[#6E6E69] border-[#E8E8E3]'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {(formData.mobility.passport_status === 'Yes' || formData.mobility.passport_status === 'Expires soon') && (
                    <div className="animate-in fade-in">
                      <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                        Passport Expiry Date:
                      </label>
                      <input
                        type="date"
                        value={formData.mobility.passport_expiry_date || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            mobility: { ...formData.mobility, passport_expiry_date: e.target.value },
                          })
                        }
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413]"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                      Countries you cannot or do not wish to visit:
                    </label>
                    <input
                      type="text"
                      value={formData.mobility.excluded_countries || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          mobility: { ...formData.mobility, excluded_countries: e.target.value },
                        })
                      }
                      placeholder="e.g. High-altitude regions, specific countries"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                    Visa restrictions or relevant travel limitations:
                  </label>
                  <input
                    type="text"
                    value={formData.mobility.travel_restrictions || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        mobility: { ...formData.mobility, travel_restrictions: e.target.value },
                      })
                    }
                    placeholder="e.g. Existing Schengen visa, single-entry limits, mobility assistance requirements"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413]"
                  />
                </div>
              </div>

              {/* SECTION J: Target Opportunities and Exclusions */}
              <div className="space-y-4 pt-4 border-t border-[#F0F0EB]">
                <div className="flex items-center gap-2 border-b border-[#E8E8E3] pb-2">
                  <Building size={16} className="text-[#B8532F]" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#141413]">
                    Section J — Target Opportunities & Exclusions
                  </h3>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                    Specific institutions, galleries, residencies, or awards you wish to target:
                  </label>
                  <textarea
                    rows={2}
                    value={formData.target_opportunities.target_institutions}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        target_opportunities: {
                          ...formData.target_opportunities,
                          target_institutions: e.target.value,
                        },
                      })
                    }
                    placeholder="e.g. Gasworks London, Khoj International, Rijksakademie, Inlaks Shivdasani"
                    className="w-full text-xs p-3.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                    Opportunities you DO NOT want the team to apply for:
                  </label>
                  <textarea
                    rows={2}
                    value={formData.target_opportunities.excluded_opportunities}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        target_opportunities: {
                          ...formData.target_opportunities,
                          excluded_opportunities: e.target.value,
                        },
                      })
                    }
                    placeholder="Specific institutions or commercial fairs to strictly exclude"
                    className="w-full text-xs p-3.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                    Reasons for excluding those opportunities:
                  </label>
                  <input
                    type="text"
                    value={formData.target_opportunities.exclusion_reasons}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        target_opportunities: {
                          ...formData.target_opportunities,
                          exclusion_reasons: e.target.value,
                        },
                      })
                    }
                    placeholder="e.g. Ethical misalignment, previous conflict, incompatible production scope"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 5: Studio & Financials (Sections K & L)             */}
          {/* ======================================================== */}
          {activeStep === 5 && (
            <div className="space-y-8">
              {/* SECTION K: Facilities and Resources */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-[#E8E8E3] pb-2">
                  <Wrench size={16} className="text-[#B8532F]" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#141413]">
                    Section K — Facilities & Resources
                  </h3>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141413] mb-2">
                    Studio facilities & equipment you require or currently utilize:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {FACILITIES_OPTIONS.map((f) => {
                      const selected = formData.facilities.selected_facilities.includes(f);
                      return (
                        <button
                          key={f}
                          type="button"
                          onClick={() => {
                            const updated = toggleArrayItem(formData.facilities.selected_facilities, f);
                            setFormData({
                              ...formData,
                              facilities: { ...formData.facilities, selected_facilities: updated },
                            });
                          }}
                          className={`text-xs px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${
                            selected
                              ? 'bg-[#141413] text-white border-[#141413]'
                              : 'bg-[#FAF9F6] text-[#6E6E69] border-[#E8E8E3]'
                          }`}
                        >
                          {f}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {formData.facilities.selected_facilities.includes('Other') && (
                  <div className="animate-in fade-in">
                    <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                      Specify other specialized facilities:
                    </label>
                    <input
                      type="text"
                      value={formData.facilities.custom_facilities || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          facilities: { ...formData.facilities, custom_facilities: e.target.value },
                        })
                      }
                      placeholder="e.g. Foundry, high-voltage kiln, soundproof acoustic chamber"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413]"
                    />
                  </div>
                )}
              </div>

              {/* SECTION L: Application Fees and Financial Circumstances */}
              <div className="space-y-4 pt-4 border-t border-[#F0F0EB]">
                <div className="flex items-center gap-2 border-b border-[#E8E8E3] pb-2">
                  <DollarSign size={16} className="text-[#B8532F]" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#141413]">
                    Section L — Fees & Financial Circumstances
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-2">
                      Willingness to pay application fees for open calls? *
                    </label>
                    <div className="flex gap-2">
                      {(['Yes', 'No'] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              financial: { ...formData.financial, willing_to_pay_fees: opt },
                            })
                          }
                          className={`text-xs px-4 py-2 rounded-xl border transition-all cursor-pointer ${
                            formData.financial.willing_to_pay_fees === opt
                              ? 'bg-[#141413] text-white border-[#141413]'
                              : 'bg-[#FAF9F6] text-[#6E6E69] border-[#E8E8E3]'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {formData.financial.willing_to_pay_fees === 'Yes' && (
                    <div className="animate-in fade-in">
                      <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                        Maximum acceptable fee per call (in INR):
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={500}
                        value={formData.financial.max_acceptable_fee_inr}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            financial: {
                              ...formData.financial,
                              max_acceptable_fee_inr: Math.max(0, parseInt(e.target.value) || 0),
                            },
                          })
                        }
                        placeholder="e.g. 2500"
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413]"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-[#141413] mb-2">
                      Current employment or study status: *
                    </label>
                    <select
                      value={formData.financial.employment_status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          financial: { ...formData.financial, employment_status: e.target.value as any },
                        })
                      }
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413]"
                    >
                      <option value="Yes">Full-time Employed</option>
                      <option value="No">Independent / Freelance Practice</option>
                      <option value="Part-time">Part-time / Academic</option>
                      <option value="Other">Enrolled in Degree / Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                    Financial, logistical, or personal circumstances relevant to opportunity selection:
                  </label>
                  <textarea
                    rows={2}
                    value={formData.financial.circumstances_notes || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        financial: { ...formData.financial, circumstances_notes: e.target.value },
                      })
                    }
                    placeholder="Caregiving responsibilities, travel constraints, stipend necessity"
                    className="w-full text-xs p-3.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 6: Participation & History (Sections M & N)          */}
          {/* ======================================================== */}
          {activeStep === 6 && (
            <div className="space-y-8">
              {/* SECTION M: Participation Preferences */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-[#E8E8E3] pb-2">
                  <Users size={16} className="text-[#B8532F]" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#141413]">
                    Section M — Participation Preferences
                  </h3>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141413] mb-2">
                    Activities you welcome participating in: (Select all that apply)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PARTICIPATION_OPTIONS.map((act) => {
                      const selected = formData.participation.preferred_activities.includes(act);
                      return (
                        <button
                          key={act}
                          type="button"
                          onClick={() => {
                            const updated = toggleArrayItem(formData.participation.preferred_activities, act);
                            setFormData({
                              ...formData,
                              participation: { ...formData.participation, preferred_activities: updated },
                            });
                          }}
                          className={`text-xs px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${
                            selected
                              ? 'bg-[#141413] text-white border-[#141413]'
                              : 'bg-[#FAF9F6] text-[#6E6E69] border-[#E8E8E3]'
                          }`}
                        >
                          {act}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                    Activities you DO NOT want to participate in:
                  </label>
                  <input
                    type="text"
                    value={formData.participation.excluded_activities || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        participation: { ...formData.participation, excluded_activities: e.target.value },
                      })
                    }
                    placeholder="e.g. Commercial promotional talks, children workshops, live performances"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413]"
                  />
                </div>
              </div>

              {/* SECTION N: Previous Applications */}
              <div className="space-y-4 pt-4 border-t border-[#F0F0EB]">
                <div className="flex items-center gap-2 border-b border-[#E8E8E3] pb-2">
                  <FileCheck size={16} className="text-[#B8532F]" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#141413]">
                    Section N — Previous Applications
                  </h3>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141413] mb-2">
                    Previously applied for grants, residencies, or awards? *
                  </label>
                  <div className="flex gap-2">
                    {(['Yes', 'No'] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            previous_applications: { ...formData.previous_applications, has_applied: opt },
                          })
                        }
                        className={`text-xs px-4 py-2 rounded-xl border transition-all cursor-pointer ${
                          formData.previous_applications.has_applied === opt
                            ? 'bg-[#141413] text-white border-[#141413]'
                            : 'bg-[#FAF9F6] text-[#6E6E69] border-[#E8E8E3]'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {formData.previous_applications.has_applied === 'Yes' && (
                  <div className="space-y-4 animate-in fade-in">
                    <div>
                      <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                        Names of previous applications / programs:
                      </label>
                      <textarea
                        rows={2}
                        value={formData.previous_applications.application_names || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            previous_applications: {
                              ...formData.previous_applications,
                              application_names: e.target.value,
                            },
                          })
                        }
                        placeholder="List programs applied to in the past 2 years"
                        className="w-full text-xs p-3.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#141413] mb-2">
                        Were any of those applications successful?
                      </label>
                      <div className="flex gap-2">
                        {(['Yes', 'No', 'Other'] as const).map((res) => (
                          <button
                            key={res}
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                previous_applications: {
                                  ...formData.previous_applications,
                                  was_successful: res,
                                },
                              })
                            }
                            className={`text-xs px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${
                              formData.previous_applications.was_successful === res
                                ? 'bg-[#141413] text-white border-[#141413]'
                                : 'bg-[#FAF9F6] text-[#6E6E69] border-[#E8E8E3]'
                            }`}
                          >
                            {res}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 7: Restrictions & Governance (Sections O & P)        */}
          {/* ======================================================== */}
          {activeStep === 7 && (
            <div className="space-y-8">
              {/* SECTION O: Application Representation and Restrictions */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-[#E8E8E3] pb-2">
                  <ShieldAlert size={16} className="text-[#B8532F]" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#141413]">
                    Section O — Representation & Restrictions
                  </h3>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                    CV, biography, or portfolio details you DO NOT want emphasized:
                  </label>
                  <textarea
                    rows={2}
                    value={formData.representation_restrictions.de_emphasize_details || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        representation_restrictions: {
                          ...formData.representation_restrictions,
                          de_emphasize_details: e.target.value,
                        },
                      })
                    }
                    placeholder="e.g. Early graphic design work, commercial client commissions, incomplete degrees"
                    className="w-full text-xs p-3.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                    Claims or statements the team must NEVER make or imply in an application:
                  </label>
                  <textarea
                    rows={2}
                    value={formData.representation_restrictions.never_claim_statements || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        representation_restrictions: {
                          ...formData.representation_restrictions,
                          never_claim_statements: e.target.value,
                        },
                      })
                    }
                    placeholder="e.g. Never claim full digital medium focus; never claim availability for immediate 6-month relocation"
                    className="w-full text-xs p-3.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                    Additional information about your practice, career, circumstances, or ambitions:
                  </label>
                  <textarea
                    rows={2}
                    value={formData.representation_restrictions.additional_info || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        representation_restrictions: {
                          ...formData.representation_restrictions,
                          additional_info: e.target.value,
                        },
                      })
                    }
                    placeholder="Any specific context you would like your dedicated COR advisor to keep in mind"
                    className="w-full text-xs p-3.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413]"
                  />
                </div>
              </div>

              {/* SECTION P: Outreach and Approval Preferences */}
              <div className="space-y-4 pt-4 border-t border-[#F0F0EB]">
                <div className="flex items-center gap-2 border-b border-[#E8E8E3] pb-2">
                  <SlidersHorizontal size={16} className="text-[#B8532F]" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#141413]">
                    Section P — Outreach & Approval Preferences
                  </h3>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141413] mb-2">
                    Outreach involvement during the first month: *
                  </label>
                  <div className="space-y-2">
                    {[
                      {
                        value: 'Hands-off',
                        title: 'Hands-off',
                        desc: 'Find opportunities and handle applications; involve me only when strictly necessary.',
                      },
                      {
                        value: 'Collaborative',
                        title: 'Collaborative',
                        desc: 'Shortlist and prepare applications together with mutual review.',
                      },
                      {
                        value: 'Highly involved',
                        title: 'Highly involved',
                        desc: 'Artist reviews and contributes directly to every application dossier before submission.',
                      },
                      {
                        value: 'Other',
                        title: 'Other',
                        desc: 'Custom interaction cadence based on residency schedules.',
                      },
                    ].map((item) => (
                      <label
                        key={item.value}
                        className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          formData.approval_preferences.outreach_involvement === item.value
                            ? 'bg-[#FAF5EC] border-[#B8532F]'
                            : 'bg-white border-[#E8E8E3] hover:border-[#141413]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="outreach_involvement"
                          value={item.value}
                          checked={formData.approval_preferences.outreach_involvement === item.value}
                          onChange={() =>
                            setFormData({
                              ...formData,
                              approval_preferences: {
                                ...formData.approval_preferences,
                                outreach_involvement: item.value as any,
                              },
                            })
                          }
                          className="mt-0.5"
                        />
                        <div>
                          <p className="text-xs font-bold text-[#141413]">{item.title}</p>
                          <p className="text-[11px] text-[#6E6E69] mt-0.5">{item.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                    Typical response time for additional information or documents:
                  </label>
                  <input
                    type="text"
                    value={formData.approval_preferences.response_time}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        approval_preferences: {
                          ...formData.approval_preferences,
                          response_time: e.target.value,
                        },
                      })
                    }
                    placeholder="e.g. Within 24 hours, Within 2 business days"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141413] mb-2">
                    Final application approval preference: *
                  </label>
                  <div className="space-y-2">
                    {[
                      {
                        value:
                          'Admin team can apply without prior approval and provide updates every 10 days',
                        title: 'Apply Without Prior Approval',
                        desc: 'The admin curatorial team applies proactively and sends dossier updates every 10 days.',
                      },
                      {
                        value: 'Artist must approve each application beforehand',
                        title: 'Artist Must Approve Each Application Beforehand',
                        desc: 'No call dossier will be formally submitted until you review and confirm.',
                      },
                    ].map((item) => (
                      <label
                        key={item.value}
                        className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          formData.approval_preferences.final_approval_preference === item.value
                            ? 'bg-[#FAF5EC] border-[#B8532F]'
                            : 'bg-white border-[#E8E8E3] hover:border-[#141413]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="final_approval_preference"
                          value={item.value}
                          checked={formData.approval_preferences.final_approval_preference === item.value}
                          onChange={() =>
                            setFormData({
                              ...formData,
                              approval_preferences: {
                                ...formData.approval_preferences,
                                final_approval_preference: item.value as any,
                              },
                            })
                          }
                          className="mt-0.5"
                        />
                        <div>
                          <p className="text-xs font-bold text-[#141413]">{item.title}</p>
                          <p className="text-[11px] text-[#6E6E69] mt-0.5">{item.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BOTTOM STEP CONTROLS */}
          <div className="pt-6 border-t border-[#F0F0EB] flex items-center justify-between">
            <Button
              size="sm"
              variant="secondary"
              onClick={handlePrevStep}
              disabled={activeStep === 0 || saving}
              className="text-xs flex items-center gap-1.5"
            >
              <ArrowLeft size={13} />
              <span>Previous</span>
            </Button>

            <div className="flex items-center gap-3">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleSaveDraft(false)}
                disabled={saving}
                className="text-xs flex items-center gap-1.5 border border-[#E8E8E3] bg-[#FAF9F6]"
              >
                <Save size={13} />
                <span>{saving ? 'Saving...' : 'Save Draft'}</span>
              </Button>

              <Button
                size="sm"
                variant="primary"
                onClick={handleNextStep}
                disabled={saving}
                className="text-xs flex items-center gap-1.5 bg-[#141413] text-white hover:bg-[#2A2A28]"
              >
                <span>{activeStep === STEPS.length - 1 ? 'Review & Submit' : 'Save & Next'}</span>
                <ArrowRight size={13} />
              </Button>
            </div>
          </div>
        </main>
      </div>

      {/* REVIEW & SUBMISSION MODAL */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto border border-[#E8E8E3] shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-[#F0F0EB] pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#B8532F]">
                  Final Verification
                </span>
                <h3 className="font-serif text-2xl font-bold text-[#141413] mt-0.5">
                  Review Your Artist Profile
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="text-[#8A8A85] hover:text-[#141413] text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#6E6E69] leading-relaxed">
              Your questionnaire responses will be directly submitted to the Eras curatorial operations team for verification. Please confirm your details below.
            </p>

            {/* Summary Sections */}
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E8E8E3]">
                <p className="font-bold text-[#141413] mb-1">A. Personal & Contact</p>
                <p className="text-[#6E6E69]">
                  {formData.personal.full_name} · {formData.personal.primary_email} · {formData.personal.primary_phone}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E8E8E3]">
                <p className="font-bold text-[#141413] mb-1">B. Practice & Mediums</p>
                <p className="text-[#6E6E69]">
                  {formData.artistic_practice.primary_medium.join(', ') || 'None selected'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E8E8E3]">
                <p className="font-bold text-[#141413] mb-1">C & D. Geography & Career History</p>
                <p className="text-[#6E6E69]">
                  {formData.geography.city_town}, {formData.geography.home_state} · Stage: {formData.career_history.career_stage} · Practicing since {formData.career_history.practicing_since_year}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E8E8E3]">
                <p className="font-bold text-[#141413] mb-1">Governance & Approval Preference</p>
                <p className="text-[#6E6E69]">
                  {formData.approval_preferences.final_approval_preference} · Outreach: {formData.approval_preferences.outreach_involvement}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#F0F0EB] flex items-center justify-end gap-3">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowReviewModal(false)}
                disabled={submitting}
                className="text-xs"
              >
                Back to Edit
              </Button>

              <Button
                size="sm"
                variant="primary"
                onClick={handleFinalSubmit}
                disabled={submitting}
                className="text-xs bg-[#141413] text-white hover:bg-[#2A2A28] flex items-center gap-1.5"
              >
                <span>{submitting ? 'Submitting...' : 'Confirm & Submit to COR'}</span>
                <Check size={14} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
