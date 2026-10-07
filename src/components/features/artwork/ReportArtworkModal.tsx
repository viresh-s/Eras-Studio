'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  REPORT_REASONS,
  type ReportReason,
} from '@/types/report';
import { submitArtworkReport } from '@/actions/reportActions';

interface ReportArtworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  artworkId: string;
  artworkTitle: string;
  artworkOwnerId?: string | null;
  onSuccess?: () => void;
}

export default function ReportArtworkModal({
  isOpen,
  onClose,
  artworkId,
  artworkTitle,
  artworkOwnerId,
  onSuccess,
}: ReportArtworkModalProps) {
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
      const result = await submitArtworkReport({
        artworkId,
        artworkOwnerId: artworkOwnerId || null,
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

      // Auto close after showing toast message
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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-soft-xl border border-gray-100 overflow-hidden z-10 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 sm:px-8 pt-7 pb-5 border-b border-gray-100 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 leading-snug">
                    Report Artwork
                  </h3>
                  <p className="text-xs text-gray-500 font-medium truncate max-w-xs sm:max-w-sm">
                    Flagging &quot;{artworkTitle}&quot; for moderation review
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

            {/* Success Toast Banner */}
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
              <form onSubmit={handleSubmit} className="px-6 sm:px-8 py-6 space-y-5">
                {/* Error Banner */}
                {errorMessage && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700 text-xs font-medium">
                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Reason Selection */}
                <div className="space-y-2.5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Select a reason <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
                    {REPORT_REASONS.map((reason) => {
                      const isSelected = selectedReason === reason;
                      return (
                        <label
                          key={reason}
                          className={`flex items-center gap-3 p-3 rounded-xl border text-xs sm:text-sm font-medium cursor-pointer transition-all ${
                            isSelected
                              ? 'border-gray-900 bg-gray-50/80 text-gray-900 shadow-xs'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50/40'
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

                {/* Details Textarea */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="report-details"
                      className="text-xs font-bold text-gray-700 uppercase tracking-wider"
                    >
                      Additional Details (Optional)
                    </label>
                    <span
                      className={`text-[11px] font-medium ${
                        details.length > MAX_CHARS ? 'text-red-600' : 'text-gray-400'
                      }`}
                    >
                      {details.length}/{MAX_CHARS}
                    </span>
                  </div>
                  <textarea
                    id="report-details"
                    value={details}
                    onChange={(e) => setDetails(e.target.value.slice(0, MAX_CHARS))}
                    rows={3}
                    placeholder="Provide additional context or reference links to assist our review team..."
                    className="w-full px-4 py-3 text-sm bg-gray-50/50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 focus:bg-white transition-all resize-none placeholder:text-gray-400 text-gray-900"
                  />
                  <p className="text-[11px] text-gray-500 leading-normal">
                    Reports are confidential and reviewed within 24-48 hours according to ERAS Studio safety standards.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-full text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm"
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
