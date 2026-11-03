'use client';

import React, { useState, useEffect } from 'react';
import { getCreatorCollections, createCollection, CollectionItem } from '@/actions/collectionActions';
import { Plus, Check, Loader2, Sparkles } from 'lucide-react';

interface CollectionSelectProps {
  value: string;
  onChange: (val: string) => void;
  creatorId?: string;
  label?: string;
  className?: string;
  placeholder?: string;
}

const DEFAULT_SUGGESTIONS = [
  'Monsoon Studies',
  'Urban Silence',
  'Fragments of Memory',
  'Spring Collection',
  'Autumn Collection',
  'Portraits',
  'Landscapes',
];

export default function CollectionSelect({
  value,
  onChange,
  creatorId,
  label = 'Collection / Series',
  className = '',
}: CollectionSelectProps) {
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectMode, setSelectMode] = useState<string>('none');
  const [isOtherSelected, setIsOtherSelected] = useState(false);
  const [customName, setCustomName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [justCreatedMessage, setJustCreatedMessage] = useState<string | null>(null);

  // Fetch collections on mount
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await getCreatorCollections(creatorId);
        if (mounted) {
          setCollections(data);
        }
      } catch (err) {
        console.error('Failed to load collections', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [creatorId]);

  // Sync internal selectMode with external value
  useEffect(() => {
    if (!value || value === 'none') {
      setSelectMode('none');
      setIsOtherSelected(false);
    } else {
      setSelectMode(value);
      setIsOtherSelected(false);
    }
  }, [value]);

  // Combine fetched user collections and suggestions (deduplicated)
  const collectionNames: string[] = Array.from(
    new Set([
      ...collections.map((c) => c.title.trim()),
      ...(value && value !== 'none' && value.toLowerCase() !== 'other' ? [value.trim()] : []),
      ...DEFAULT_SUGGESTIONS,
    ])
  ).filter((name) => name && name.toLowerCase() !== 'other');

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'other') {
      setIsOtherSelected(true);
      setSelectMode('other');
    } else {
      setIsOtherSelected(false);
      setSelectMode(val);
      onChange(val === 'none' ? '' : val);
    }
  };

  const handleCreateCustom = async () => {
    const trimmed = customName.trim();
    if (!trimmed) return;

    setIsCreating(true);
    try {
      const res = await createCollection({ title: trimmed });
      if (res.success && res.collection) {
        // Add to local collections list
        setCollections((prev) => [res.collection as CollectionItem, ...prev]);
        // Select newly created collection
        onChange(trimmed);
        setSelectMode(trimmed);
        setIsOtherSelected(false);
        setCustomName('');
        setJustCreatedMessage(`Collection "${trimmed}" added!`);
        setTimeout(() => setJustCreatedMessage(null), 3000);
      }
    } catch (err) {
      console.error('Failed to create collection', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreateCustom();
    }
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-normal text-[#141413] tracking-normal">
          {label}
        </label>
      )}

      {/* Dropdown */}
      <div className="relative">
        <select
          value={selectMode}
          onChange={handleSelectChange}
          disabled={isLoading}
          style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
          className="w-full text-xs px-3 py-2.5 rounded-lg border border-[#E8E8E3] bg-white text-[#141413] focus:outline-none focus:border-[#2356FF] focus:ring-1 focus:ring-[#2356FF] transition-all cursor-pointer font-normal"
        >
          <option value="none">No Collection (Default)</option>
          {collectionNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
          <option value="other">+ Other (Add new collection...)</option>
        </select>
        {isLoading && (
          <Loader2
            size={13}
            className="animate-spin absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        )}
      </div>

      {/* Inline 'Other' Box: slides in when user selects 'Other' */}
      {isOtherSelected && (
        <div className="mt-1 p-3 bg-[#F8F9FA] rounded-xl border border-[#E2E8F0] flex flex-col gap-2 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-normal text-[#64748B] flex items-center gap-1.5">
              <Sparkles size={12} className="text-[#2356FF]" />
              Type new collection name:
            </span>
            <button
              type="button"
              onClick={() => {
                setIsOtherSelected(false);
                setSelectMode(value || 'none');
              }}
              className="text-[11px] text-[#94A3B8] hover:text-[#475569] font-normal"
            >
              Cancel
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              autoFocus
              placeholder="e.g. Neon Horizons, Winter 2026..."
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isCreating}
              style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
              className="flex-1 text-xs px-3 py-2 rounded-lg border border-[#CBD5E1] bg-white text-[#141413] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2356FF] focus:ring-1 focus:ring-[#2356FF] font-normal"
            />
            <button
              type="button"
              onClick={handleCreateCustom}
              disabled={isCreating || !customName.trim()}
              className="px-3.5 py-2 bg-[#181A1F] text-white rounded-lg text-xs font-normal hover:bg-black transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer select-none"
            >
              {isCreating ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Plus size={13} />
              )}
              <span>Add</span>
            </button>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {justCreatedMessage && (
        <div className="text-[11px] text-emerald-600 flex items-center gap-1 mt-0.5 font-normal">
          <Check size={12} />
          <span>{justCreatedMessage}</span>
        </div>
      )}
    </div>
  );
}
