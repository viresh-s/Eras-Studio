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
        className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-lg p-6 sm:p-8 relative"
        style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer p-1 rounded-full hover:bg-gray-100"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <h2
            className="text-2xl font-serif italic font-semibold text-gray-900 tracking-tight"
            style={{ fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif", fontStyle: 'italic' }}
          >
            {collectionToEdit ? 'Edit Collection' : 'Create New Collection'}
          </h2>
          <p className="text-xs text-gray-500 font-normal mt-1">
            Curate a series or theme of artworks to present together on your portfolio and public profile.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-normal">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-normal text-gray-700 mb-1.5">
              Collection Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              required
              placeholder="e.g. Monsoon Studies, Urban Silence, Solitude"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#2356FF] focus:ring-1 focus:ring-[#2356FF] transition-all font-normal"
            />
          </div>

          <div>
            <label className="block text-xs font-normal text-gray-700 mb-1.5">
              Curatorial Statement / Description (Optional)
            </label>
            <textarea
              rows={4}
              placeholder="Describe the conceptual background, inspiration, or narrative connecting the works in this series..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#2356FF] focus:ring-1 focus:ring-[#2356FF] transition-all font-normal resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-normal text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-6 py-2.5 bg-[#181A1F] text-white rounded-full text-xs font-normal hover:bg-black transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs select-none"
            >
              {isSubmitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Sparkles size={14} />
              )}
              <span>{collectionToEdit ? 'Save Changes' : 'Create Collection'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

