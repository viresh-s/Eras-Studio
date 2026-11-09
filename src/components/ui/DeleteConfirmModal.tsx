'use client';

import React, { useEffect } from 'react';
import { Trash2, X, Loader2 } from 'lucide-react';

export interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  itemName?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description = 'This action cannot be undone.',
  itemName,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isLoading = false,
}: DeleteConfirmModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, isLoading]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#141413]/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => {
          if (!isLoading) onClose();
        }}
      />

      {/* Modal Container */}
      <div
        className="relative w-full max-w-md bg-white border border-[#E8E8E3] rounded-3xl p-6 sm:p-7 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200 overflow-hidden"
        style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-5 right-5 p-1.5 rounded-full text-[#6E6E69] hover:text-[#141413] hover:bg-[#F7F7F5] transition-colors cursor-pointer disabled:opacity-40"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Red Icon Badge */}
        <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 mb-4 shadow-2xs">
          <Trash2 size={22} strokeWidth={2} />
        </div>

        {/* Content */}
        <div className="flex flex-col gap-1.5">
          <h3 className="text-lg font-semibold text-[#141413] tracking-tight">
            {title}
          </h3>
          <p className="text-xs sm:text-[13px] text-[#6E6E69] leading-relaxed">
            {description}
          </p>
        </div>

        {/* Item Preview Box */}
        {itemName && (
          <div className="mt-4 px-3.5 py-2.5 rounded-xl bg-[#F7F7F5] border border-[#E8E8E3] flex items-center gap-2.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
            <span className="text-xs font-medium text-[#141413] truncate">
              {itemName}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 pt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-5 py-2.5 rounded-full border border-[#E8E8E3] bg-white text-xs sm:text-sm font-medium text-[#141413] hover:bg-[#F7F7F5] hover:border-black transition-colors cursor-pointer select-none disabled:opacity-40"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-medium transition-colors shadow-sm cursor-pointer select-none disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin text-white" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>{confirmLabel}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

