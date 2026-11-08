'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Folder,
  Layers,
  Pencil,
  Trash2,
  X,
  Check,
  Loader2,
  Sparkles,
  ArrowLeft,
  Search,
  Image as ImageIcon,
} from 'lucide-react';
import {
  CollectionItem,
  deleteCollection,
  assignArtworkToCollection,
  getCreatorCollections,
} from '@/actions/collectionActions';
import CreateCollectionModal from './CreateCollectionModal';
import { createClient } from '@/lib/supabase/client';

interface ArtworkSimple {
  id: string;
  title: string;
  image_url: string;
  collection: string | null;
  collection_id?: string | null;
  year?: string | null;
  price?: number | null;
}

interface CollectionManagerProps {
  initialCollections: CollectionItem[];
  userId: string;
}

export default function CollectionManager({
  initialCollections,
  userId,
}: CollectionManagerProps) {
  const router = useRouter();
  const [collections, setCollections] = useState<CollectionItem[]>(initialCollections);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<CollectionItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Artwork assignment drawer state
  const [selectedCollectionForArtworks, setSelectedCollectionForArtworks] = useState<CollectionItem | null>(null);
  const [creatorArtworks, setCreatorArtworks] = useState<ArtworkSimple[]>([]);
  const [isLoadingArtworks, setIsLoadingArtworks] = useState(false);
  const [updatingArtworkId, setUpdatingArtworkId] = useState<string | null>(null);

  // Filter collections by search query
  const filteredCollections = useMemo(() => {
    if (!searchQuery.trim()) return collections;
    const q = searchQuery.toLowerCase().trim();
    return collections.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q)
    );
  }, [collections, searchQuery]);

  // Load all artworks when drawer opens
  useEffect(() => {
    if (selectedCollectionForArtworks) {
      let isMounted = true;
      setIsLoadingArtworks(true);
      const supabase = createClient();
      async function fetchArtworks() {
        try {
          const { data } = await (supabase.from('artworks') as any)
            .select('id, title, image_url, collection, collection_id, year, price')
            .eq('creator_id', userId)
            .order('created_at', { ascending: false });
          if (isMounted) {
            setCreatorArtworks((data as ArtworkSimple[]) || []);
          }
        } catch (err) {
          console.error('Failed to load artworks', err);
        } finally {
          if (isMounted) {
            setIsLoadingArtworks(false);
          }
        }
      }
      fetchArtworks();
      return () => {
        isMounted = false;
      };
    }
  }, [selectedCollectionForArtworks, userId]);

  const handleCreatedOrUpdated = (updatedCol: CollectionItem) => {
    setCollections((prev) => {
      const idx = prev.findIndex((c) => c.id === updatedCol.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedCol;
        return copy;
      }
      return [updatedCol, ...prev];
    });
    router.refresh();
  };

  const handleDelete = async (col: CollectionItem) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the collection "${col.title}"? Your artworks will remain intact and will simply be moved out of this collection.`
      )
    ) {
      return;
    }

    setDeletingId(col.id);
    try {
      const res = await deleteCollection(col.id);
      if (res.success) {
        setCollections((prev) => prev.filter((c) => c.id !== col.id));
        if (selectedCollectionForArtworks?.id === col.id) {
          setSelectedCollectionForArtworks(null);
        }
        router.refresh();
      } else {
        alert(res.error || 'Failed to delete collection.');
      }
    } catch {
      alert('An error occurred while deleting.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleArtworkInCollection = async (artwork: ArtworkSimple) => {
    if (!selectedCollectionForArtworks) return;
    const isCurrentlyIn =
      artwork.collection_id === selectedCollectionForArtworks.id ||
      (artwork.collection && artwork.collection.trim().toLowerCase() === selectedCollectionForArtworks.title.trim().toLowerCase());

    const targetCollectionId = isCurrentlyIn ? null : selectedCollectionForArtworks.id;
    const targetCollectionTitle = isCurrentlyIn ? null : selectedCollectionForArtworks.title;

    setUpdatingArtworkId(artwork.id);

    try {
      await assignArtworkToCollection(artwork.id, targetCollectionId, targetCollectionTitle);

      // Optimistically update artworks state
      setCreatorArtworks((prev) =>
        prev.map((a) =>
          a.id === artwork.id
            ? { ...a, collection_id: targetCollectionId, collection: targetCollectionTitle }
            : a
        )
      );

      // Update artwork count on collection card
      setCollections((prev) =>
        prev.map((c) => {
          if (c.id === selectedCollectionForArtworks.id) {
            const newCount = Math.max(0, (c.artwork_count || 0) + (isCurrentlyIn ? -1 : 1));
            return { ...c, artwork_count: newCount };
          }
          return c;
        })
      );
    } catch (err) {
      console.error('Failed to toggle artwork in collection', err);
    } finally {
      setUpdatingArtworkId(null);
    }
  };

  return (
    <div
      className="-mt-8 -mx-6 -mb-8 flex flex-col flex-1 min-h-screen"
      style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
    >
      {/* ======================================================== */}
      {/* 1. TOP HEADER SECTION: PURE WHITE                        */}
      {/* ======================================================== */}
      <div className="bg-white border-b border-[#E3E3E7] w-full pt-8 sm:pt-10 pb-6">
        <div className="max-w-[1400px] mx-auto px-6">
          {/* Breadcrumb / Back Link */}
          <div className="mb-4">
            <Link
              href="/portfolio"
              className="inline-flex items-center gap-1.5 text-xs text-[#6E6E69] hover:text-[#141413] transition-colors font-normal select-none"
            >
              <ArrowLeft size={14} /> Back to Portfolio
            </Link>
          </div>

          {/* Title Row + New Collection Button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1
                className="text-2xl sm:text-[28px] font-semibold text-[#141413] tracking-normal"
                style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
              >
                Manage Collections
              </h1>
              <p
                className="text-xs sm:text-[13px] text-[#6E6E69] font-normal mt-1"
                style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
              >
                Organize and curate your artworks into thematic series or exhibition drops.
              </p>
            </div>

            {/* Create Collection Button (matching ERAS blue gradient button) */}
            <button
              onClick={() => {
                setEditingCollection(null);
                setIsModalOpen(true);
              }}
              style={{
                position: 'relative',
                background: 'linear-gradient(90deg, #082779 0%, #1345EE 62%, #458CFF 100%)',
                boxShadow:
                  '0px 7px 22px rgba(35, 77, 255, 0.13), 0px 3px 3px rgba(255, 255, 255, 0.65) inset, 0px -3px 6px rgba(6, 42, 137, 0.33) inset',
                overflow: 'hidden',
                borderRadius: 40,
                outline: '2px #2356FF solid',
                outlineOffset: '-2px',
              }}
              className="px-6 py-2.5 sm:px-8 sm:py-3 inline-flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.98] select-none text-white text-xs sm:text-sm font-medium shadow-md shrink-0"
            >
              <Plus size={16} className="text-white" />
              <span>New Collection</span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. LOWER SECTION: WARM #F2F0ED BACKGROUND                */}
      {/* ======================================================== */}
      <div className="bg-[#F2F0ED] flex-1 w-full py-8 sm:py-10">
        <div className="max-w-[1400px] mx-auto px-6">
          {/* Controls Bar: Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
            <div
              className="relative w-full sm:w-[320px] lg:w-[380px] bg-white border border-[#E3E3E7] px-3.5 py-2.5 flex items-center gap-2.5 shadow-2xs"
              style={{ borderRadius: 4 }}
            >
              <Search size={16} className="text-[#6E6E69] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search collections"
                className="w-full bg-transparent text-xs sm:text-sm text-[#141413] placeholder-[#6E6E69] outline-none font-normal"
                style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
              />
            </div>

            <div className="text-xs text-[#6E6E69] font-normal">
              <span>{filteredCollections.length} {filteredCollections.length === 1 ? 'collection' : 'collections'}</span>
            </div>
          </div>

          {/* Collections Grid */}
          {filteredCollections.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredCollections.map((col) => {
                return (
                  <div
                    key={col.id}
                    className="bg-white border border-[#E8E8E3] overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow group select-none"
                    style={{ borderRadius: 14 }}
                  >
                    {/* Cover Preview */}
                    <div
                      className="relative w-full aspect-[16/10.5] bg-gray-100 overflow-hidden cursor-pointer"
                      onClick={() => setSelectedCollectionForArtworks(col)}
                    >
                      {col.cover_image_url ? (
                        <img
                          src={col.cover_image_url}
                          alt={col.title}
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out select-none pointer-events-none"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#FAFAF8] to-[#ECEAE5] text-[#6E6E69] gap-2">
                          <Folder size={36} className="opacity-40 text-[#6E6E69]" />
                          <span className="text-[12px] font-normal text-[#6E6E69]">Curated Collection</span>
                        </div>
                      )}
                      <div className="absolute inset-0 z-[1]" />
                      {col.is_published === false && (
                        <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-amber-100 text-amber-800 z-[2] shadow-2xs">
                          Draft
                        </span>
                      )}

                      {/* Artwork Count Badge */}
                      <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-xs text-white text-[11px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-2xs z-[2]">
                        <Layers size={12} />
                        <span>
                          {col.artwork_count || 0} {col.artwork_count === 1 ? 'Artwork' : 'Artworks'}
                        </span>
                      </div>
                    </div>

                    {/* Content Body */}
                    <div className="p-4 sm:p-5 flex flex-col gap-3">
                      {/* Row 1: Title & Year */}
                      <div className="flex items-center justify-between gap-2">
                        <h3
                          onClick={() => setSelectedCollectionForArtworks(col)}
                          className="text-[16px] sm:text-[17px] font-medium text-[#141413] truncate hover:text-[#1345EE] transition-colors cursor-pointer"
                          style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                        >
                          {col.title}
                        </h3>
                        <span
                          className="text-[11px] sm:text-xs text-[#6E6E69] font-normal shrink-0"
                          style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                        >
                          {col.created_at ? new Date(col.created_at).getFullYear() : 2025}
                        </span>
                      </div>

                      {/* Row 2: Status */}
                      <div
                        className="flex items-center gap-1.5 text-[11px] sm:text-xs text-[#6E6E69] font-normal truncate"
                        style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                      >
                        <span className="truncate">Curated Collection</span>
                        <span className="text-[#E8E8E3]">·</span>
                        <span className="truncate">{col.artwork_count || 0} items</span>
                      </div>

                      {/* Row 3: Description */}
                      <p
                        className="text-[11px] sm:text-xs text-[#6E6E69] line-clamp-2 leading-relaxed"
                        style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                      >
                        {col.description || 'No curatorial statement provided.'}
                      </p>

                      {/* Divider Line */}
                      <div className="h-[1px] bg-[#E8E8E3] w-full my-0.5" />

                      {/* Row 4: Action Buttons (Edit + Manage on Left, Delete on Right) */}
                      <div className="flex items-center justify-between pt-0.5">
                        <div className="flex items-center gap-2">
                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCollection(col);
                              setIsModalOpen(true);
                            }}
                            className="w-8 h-9 sm:w-[32px] sm:h-[34px] bg-white border border-[#E8E8E3] flex items-center justify-center text-[#6E6E69] hover:text-[#141413] hover:border-gray-400 transition-colors shadow-2xs cursor-pointer"
                            style={{ borderRadius: 8 }}
                            title="Edit collection"
                          >
                            <Pencil size={14} className="text-[#6E6E69]" />
                          </button>

                          {/* Manage Artworks Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedCollectionForArtworks(col)}
                            className="h-9 sm:h-[34px] px-3.5 sm:px-4 rounded-full bg-[#FAF5EC] border border-[#EACEC0] text-[#865E16] text-[11px] sm:text-xs font-medium hover:bg-[#F5EADB] transition-colors cursor-pointer select-none flex items-center justify-center"
                            style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                          >
                            Manage Artworks
                          </button>
                        </div>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDelete(col)}
                          disabled={deletingId === col.id}
                          className="w-8 h-9 sm:w-[32px] sm:h-[34px] bg-white border border-[#E8E8E3] flex items-center justify-center text-[#6E6E69] hover:text-red-600 hover:border-red-200 transition-colors shadow-2xs cursor-pointer ml-auto"
                          style={{ borderRadius: 8 }}
                          title="Delete collection"
                        >
                          {deletingId === col.id ? (
                            <Loader2 size={14} className="animate-spin text-red-500" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-3xl border border-[#E8E8E3] p-12 sm:p-16 text-center max-w-xl mx-auto shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4 text-gray-500">
                <Folder size={26} />
              </div>
              <h3 className="text-lg font-semibold text-[#141413] mb-2">
                {searchQuery ? 'No matching collections' : 'No collections yet'}
              </h3>
              <p className="text-xs sm:text-sm text-[#6E6E69] max-w-md mx-auto mb-6">
                {searchQuery
                  ? 'Try clearing your search query or check back later.'
                  : 'Organize and curate your artworks into thematic series or exhibition drops.'}
              </p>
              <button
                onClick={() => {
                  setEditingCollection(null);
                  setIsModalOpen(true);
                }}
                style={{
                  position: 'relative',
                  background: 'linear-gradient(90deg, #082779 0%, #1345EE 62%, #458CFF 100%)',
                  boxShadow:
                    '0px 7px 22px rgba(35, 77, 255, 0.13), 0px 3px 3px rgba(255, 255, 255, 0.65) inset, 0px -3px 6px rgba(6, 42, 137, 0.33) inset',
                  overflow: 'hidden',
                  borderRadius: 40,
                  outline: '2px #2356FF solid',
                  outlineOffset: '-2px',
                }}
                className="px-6 py-2.5 inline-flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.98] select-none text-white text-xs font-medium shadow-md"
              >
                <Plus size={14} />
                <span>Create First Collection</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal for Create/Edit Collection */}
      <CreateCollectionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCollection(null);
        }}
        onSuccess={handleCreatedOrUpdated}
        collectionToEdit={editingCollection}
      />

      {/* Slide-over Drawer for Managing Artworks in this Collection */}
      {selectedCollectionForArtworks && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity"
          onClick={() => setSelectedCollectionForArtworks(null)}
        >
          <div
            className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col p-6 sm:p-8 overflow-y-auto"
            style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-start justify-between pb-5 border-b border-[#E8E8E3]">
              <div>
                <span className="text-[11px] font-medium tracking-[0.1em] text-[#1345EE] uppercase">
                  Curate Collection
                </span>
                <h2
                  className="text-xl sm:text-2xl font-semibold text-[#141413] tracking-normal mt-1"
                  style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                >
                  {selectedCollectionForArtworks.title}
                </h2>
                <p className="text-xs text-[#6E6E69] font-normal mt-1">
                  Click on an artwork to add or remove it from this collection.
                </p>
              </div>
              <button
                onClick={() => setSelectedCollectionForArtworks(null)}
                className="p-1.5 rounded-full text-[#6E6E69] hover:text-[#141413] hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Artworks List */}
            <div className="flex-1 py-6">
              {isLoadingArtworks ? (
                <div className="flex flex-col items-center justify-center py-20 text-[#6E6E69] gap-2">
                  <Loader2 size={24} className="animate-spin text-[#1345EE]" />
                  <span className="text-xs font-normal">Loading your artworks...</span>
                </div>
              ) : creatorArtworks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {creatorArtworks.map((art) => {
                    const isInCollection =
                      art.collection_id === selectedCollectionForArtworks.id ||
                      (art.collection && art.collection.trim().toLowerCase() === selectedCollectionForArtworks.title.trim().toLowerCase());
                    const isUpdating = updatingArtworkId === art.id;

                    return (
                      <div
                        key={art.id}
                        onClick={() => !isUpdating && handleToggleArtworkInCollection(art)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 relative select-none ${
                          isInCollection
                            ? 'border-[#1345EE] bg-blue-50/40 ring-1 ring-[#1345EE]'
                            : 'border-[#E8E8E3] bg-white hover:border-gray-400'
                        }`}
                      >
                        {/* Thumbnail */}
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0 relative">
                          {art.image_url ? (
                            <img src={art.image_url} alt={art.title} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon size={20} className="m-auto text-gray-300 h-full" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[#141413] truncate">
                            {art.title}
                          </p>
                          <p className="text-[11px] text-[#6E6E69] font-normal">
                            {art.year || 'Contemporary'}
                          </p>
                          {art.collection && (
                            <span className="inline-block text-[10px] text-[#6E6E69] truncate max-w-full font-normal">
                              {isInCollection ? 'In this collection' : `In: ${art.collection}`}
                            </span>
                          )}
                        </div>

                        {/* Status Checkbox / Indicator */}
                        <div className="shrink-0 mr-1">
                          {isUpdating ? (
                            <Loader2 size={16} className="animate-spin text-[#1345EE]" />
                          ) : isInCollection ? (
                            <div className="w-6 h-6 rounded-full bg-[#1345EE] text-white flex items-center justify-center">
                              <Check size={14} />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full border border-[#BEBEC7] flex items-center justify-center hover:border-gray-600" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-xs text-[#6E6E69] font-normal">
                    You haven&apos;t uploaded any artworks yet.
                  </p>
                  <Link
                    href="/portfolio/upload"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#1345EE] font-medium hover:underline"
                  >
                    <Plus size={13} /> Upload Artwork
                  </Link>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-[#E8E8E3] flex items-center justify-between">
              <span className="text-xs text-[#6E6E69] font-normal">
                {selectedCollectionForArtworks.artwork_count || 0} artworks in this collection
              </span>
              <button
                onClick={() => setSelectedCollectionForArtworks(null)}
                className="px-6 py-2.5 bg-black text-white rounded-full text-xs font-medium hover:bg-gray-800 transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
