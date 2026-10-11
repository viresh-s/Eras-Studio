'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  REPORT_REASONS,
  type ReportReason,
} from '@/types/report';
import { submitUserReport } from '@/actions/reportActions';

interface ReportUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUserId: string;
  reportedUserName: string;
  onSuccess?: () => void;
}

export default function ReportUserModal({
  isOpen,
  onClose,
  reportedUserId,
  reportedUserName,
  onSuccess,
}: ReportUserModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason>(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const MAX_CHARS = 2000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const result = await submitUserReport({
        reportedUserId,
        reason: selectedReason,
        details: details.trim(),
      });

      if (!result.success) {
        setErrorMessage(result.message);
        setIsSubmitting(false);
        return;
      }

      setSuccessToast(result.message);
      setIsSubmitting(false);
      onSuccess?.();

      setTimeout(() => {
        setSuccessToast(null);
        setDetails('');
        onClose();
      }, 2200);
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setErrorMessage(null);
    setSuccessToast(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-md max-h-[90vh] flex flex-col bg-[var(--color-cor-surface)] rounded-3xl shadow-soft-xl border border-[var(--color-cor-border)] z-10 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-[var(--color-cor-border-light)] flex items-start justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FAF5EC] border border-[#E8E8E3] flex items-center justify-center text-[#9A3B3B]">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-bold text-[var(--color-cor-ink)] leading-snug">
                    Report User
                  </h3>
                  <p className="text-xs text-[var(--color-cor-ink-light)] font-medium truncate max-w-[200px] sm:max-w-[250px]">
                    Flagging &quot;{reportedUserName}&quot; for moderation review
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {successToast ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                  <CheckCircle2 size={32} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-gray-900">Report Submitted</h4>
                  <p className="text-sm text-gray-600 max-w-sm mx-auto leading-relaxed">
                    {successToast}
                  </p>
                </div>
                <p className="text-xs text-gray-400">This window will close shortly...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="px-5 sm:px-6 py-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                {errorMessage && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700 text-xs font-medium">
                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[var(--color-cor-ink)] uppercase tracking-wider">
                    Select a reason <span className="text-[#9A3B3B]">*</span>
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {REPORT_REASONS.map((reason) => {
                      const isSelected = selectedReason === reason;
                      return (
                        <label
                          key={reason}
                          className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs sm:text-sm font-medium cursor-pointer transition-all ${
                            isSelected
                              ? 'border-[var(--color-cor-ink)] bg-[#F4F4ED] text-[var(--color-cor-ink)] shadow-xs'
                              : 'border-[var(--color-cor-border-light)] hover:border-[var(--color-cor-border)] text-[var(--color-cor-ink-light)] hover:bg-[#FAF5EC]'
                          }`}
                        >
                          <input
                            type="radio"
                            name="reportReason"
                            value={reason}
                            checked={isSelected}
                            onChange={() => setSelectedReason(reason)}
                            className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-900 focus:ring-offset-0"
                          />
                          <span className="flex-1">{reason}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="report-details"
                      className="text-xs font-bold text-[var(--color-cor-ink)] uppercase tracking-wider"
                    >
                      Additional Details (Optional)
                    </label>
                    <span
                      className={`text-[11px] font-medium ${
                        details.length > MAX_CHARS ? 'text-[#9A3B3B]' : 'text-[var(--color-cor-ink-light)]'
                      }`}
                    >
                      {details.length}/{MAX_CHARS}
                    </span>
                  </div>
                  <textarea
                    id="report-details"
                    value={details}
                    onChange={(e) => setDetails(e.target.value.slice(0, MAX_CHARS))}
                    rows={2}
                    placeholder="Provide additional context or reference links to assist our review team..."
                    className="w-full px-4 py-3 text-sm bg-[#F4F4ED] border border-[var(--color-cor-border-light)] rounded-2xl outline-none focus:ring-1 focus:ring-[var(--color-cor-ink)] focus:border-[var(--color-cor-ink)] focus:bg-white transition-all resize-none placeholder:text-[var(--color-cor-ink-light)] text-[var(--color-cor-ink)]"
                  />
                  <p className="text-[11px] text-[var(--color-cor-ink-light)] leading-normal">
                    Reports are confidential and reviewed within 24-48 hours according to ERAS Studio safety standards.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3 border-t border-[var(--color-cor-border-light)] shrink-0">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-full text-xs font-bold text-[var(--color-cor-ink-light)] hover:text-[var(--color-cor-ink)] hover:bg-[#F4F4ED] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-[var(--color-cor-ink)] hover:bg-black disabled:opacity-60 text-white rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Report'
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
