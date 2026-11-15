'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, Sparkles } from 'lucide-react';
import { createCollection, updateCollection, CollectionItem } from '@/actions/collectionActions';

interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (collection: CollectionItem) => void;
  collectionToEdit?: CollectionItem | null;
}

export default function CreateCollectionModal({
  isOpen,
  onClose,
  onSuccess,
  collectionToEdit,
}: CreateCollectionModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (collectionToEdit) {
      setTitle(collectionToEdit.title || '');
      setDescription(collectionToEdit.description || '');
    } else {
      setTitle('');
      setDescription('');
    }
    setError(null);
  }, [collectionToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Collection title is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (collectionToEdit) {
        const res = await updateCollection(collectionToEdit.id, {
          title: trimmedTitle,
          description: description.trim() || null,
        });
        if (res.success && res.collection) {
          onSuccess(res.collection as CollectionItem);
          onClose();
        } else {
          setError(res.error || 'Failed to update collection.');
        }
      } else {
        const res = await createCollection({
          title: trimmedTitle,
          description: description.trim() || null,
        });
        if (res.success && res.collection) {
          onSuccess(res.collection as CollectionItem);
          onClose();
        } else {
          setError(res.error || 'Failed to create collection.');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[24px] border border-[#E8E8E3] shadow-2xl w-full max-w-[460px] p-5 sm:p-6 relative animate-in fade-in zoom-in-95 duration-150"
        style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#F0F0EB] mb-4">
          <h2
            className="text-xl sm:text-2xl font-serif italic font-semibold text-[#141413] tracking-tight"
            style={{ fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif", fontStyle: 'italic' }}
          >
            {collectionToEdit ? 'Edit Collection' : 'Create New Collection'}
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-[#8E8E88] hover:text-[#141413] transition-colors cursor-pointer p-1.5 rounded-full hover:bg-gray-100 -mr-1"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-normal">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div>
            <label className="block text-xs font-medium text-[#73736C] mb-1.5">
              Collection Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              required
              placeholder="e.g. Monsoon Studies, Urban Silence, Solitude"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-[12px] input-gradient-border-12 bg-white text-[#181A1F] placeholder:text-[#9A9A94] outline-none transition-all font-normal"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#73736C] mb-1.5">
              Curatorial Statement / Description (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Describe the conceptual background, inspiration, or narrative connecting the works in this series..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-[12px] input-gradient-border-12 bg-white text-[#181A1F] placeholder:text-[#9A9A94] outline-none transition-all font-normal resize-none leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 mt-2 pt-4 border-t border-[#F0F0EB]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-full border border-[#E8E8E3] text-xs font-medium text-[#6E6E69] hover:text-[#141413] hover:bg-[#F7F7F5] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="btn-premium-gradient-pill px-6 py-2 text-xs font-semibold gap-1.5 cursor-pointer shadow-xs active:scale-95 disabled:opacity-40 select-none"
            >
              {isSubmitting ? (
                <Loader2 size={13} className="animate-spin text-white" />
              ) : (
                <Sparkles size={13} />
              )}
              <span>{collectionToEdit ? 'Save Changes' : 'Create Collection'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

