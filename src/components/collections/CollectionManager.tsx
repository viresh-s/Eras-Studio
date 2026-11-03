'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Folder,
  Layers,
  Edit2,
  Trash2,
  ExternalLink,
  ChevronRight,
  X,
  Check,
  Loader2,
  Sparkles,
  ArrowLeft,
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<CollectionItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Artwork assignment drawer state
  const [selectedCollectionForArtworks, setSelectedCollectionForArtworks] = useState<CollectionItem | null>(null);
  const [creatorArtworks, setCreatorArtworks] = useState<ArtworkSimple[]>([]);
  const [isLoadingArtworks, setIsLoadingArtworks] = useState(false);
  const [updatingArtworkId, setUpdatingArtworkId] = useState<string | null>(null);

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
    <div style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}>
      {/* Top Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 font-normal mb-2">
            <Link href="/portfolio" className="hover:text-gray-900 transition-colors flex items-center gap-1">
              <ArrowLeft size={14} /> Back to Portfolio
            </Link>
          </div>
          <h1
            className="text-4xl font-serif italic font-semibold text-gray-900 tracking-tight"
            style={{ fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif", fontStyle: 'italic' }}
          >
            My Collections
          </h1>
          <p className="text-xs text-gray-500 font-normal mt-1">
            Organize and curate your artworks into thematic series or exhibition collections.
          </p>
        </div>

        {/* Create Collection Button */}
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
          className="px-8 py-3.5 sm:px-9 sm:py-3.5 inline-flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.98] group select-none shadow-md"
        >
          <div
            style={{
              position: 'absolute',
              inset: 3,
              borderRadius: 37,
              border: '1px rgba(255, 255, 255, 0.15) solid',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              color: 'white',
              fontSize: 15,
              fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
              fontWeight: '400',
              lineHeight: '24px',
            }}
            className="flex items-center gap-2 relative z-10"
          >
            <Plus size={18} className="text-white" />
            <span>New Collection</span>
          </div>
        </button>
      </div>

      {/* Collections Grid */}
      {collections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((col) => {
            return (
              <div
                key={col.id}
                className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col group"
              >
                {/* Cover Preview */}
                <div
                  className="h-44 bg-gray-100 relative overflow-hidden cursor-pointer"
                  onClick={() => setSelectedCollectionForArtworks(col)}
                >
                  {col.cover_image_url ? (
                    <img
                      src={col.cover_image_url}
                      alt={col.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400 gap-2">
                      <Folder size={32} className="opacity-40" />
                      <span className="text-[11px] font-normal">Click to assign artworks</span>
                    </div>
                  )}

                  {/* Artwork Count Badge */}
                  <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-xs text-white text-[11px] font-normal px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                    <Layers size={11} />
                    <span>{col.artwork_count || 0} {col.artwork_count === 1 ? 'Artwork' : 'Artworks'}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3
                      className="text-xl font-serif italic font-normal text-gray-900 tracking-tight mb-1.5 cursor-pointer hover:text-[#2356FF] transition-colors"
                      style={{ fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif", fontStyle: 'italic' }}
                      onClick={() => setSelectedCollectionForArtworks(col)}
                    >
                      {col.title}
                    </h3>
                    {col.description ? (
                      <p className="text-xs text-gray-600 line-clamp-2 font-normal leading-relaxed">
                        {col.description}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 font-normal italic">
                        No curatorial statement provided.
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedCollectionForArtworks(col)}
                      className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full text-xs font-normal transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Layers size={13} />
                      <span>Manage Artworks</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingCollection(col);
                          setIsModalOpen(true);
                        }}
                        title="Edit Collection"
                        className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(col)}
                        disabled={deletingId === col.id}
                        title="Delete Collection"
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer disabled:opacity-50"
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
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-gray-200 p-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 text-[#2356FF] flex items-center justify-center">
            <Folder size={30} />
          </div>
          <p
            className="font-serif italic font-normal text-gray-900 text-2xl mb-2"
            style={{ fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif", fontStyle: 'italic' }}
          >
            No collections yet
          </p>
          <p className="text-xs text-gray-500 font-normal max-w-md mx-auto mb-6 leading-relaxed">
            Create collections to curate your artworks into series, seasonal drops, or solo exhibition themes.
          </p>
          <button
            onClick={() => {
              setEditingCollection(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-full text-xs font-normal hover:bg-black transition-all cursor-pointer shadow-xs select-none"
          >
            <Plus size={15} />
            <span>Create Your First Collection</span>
          </button>
        </div>
      )}

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
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-start justify-between pb-5 border-b border-gray-100">
              <div>
                <span className="text-[11px] font-normal tracking-[0.15em] text-[#2356FF] uppercase">
                  Curate Collection
                </span>
                <h2
                  className="text-2xl font-serif italic font-semibold text-gray-900 tracking-tight mt-1"
                  style={{ fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif", fontStyle: 'italic' }}
                >
                  {selectedCollectionForArtworks.title}
                </h2>
                <p className="text-xs text-gray-500 font-normal mt-1">
                  Click on an artwork to add or remove it from this collection.
                </p>
              </div>
              <button
                onClick={() => setSelectedCollectionForArtworks(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Artworks List */}
            <div className="flex-1 py-6">
              {isLoadingArtworks ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
                  <Loader2 size={24} className="animate-spin text-[#2356FF]" />
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
                            ? 'border-[#2356FF] bg-blue-50/40 ring-1 ring-[#2356FF]'
                            : 'border-gray-200 bg-white hover:border-gray-300'
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
                          <p className="text-xs font-normal text-gray-900 truncate">
                            {art.title}
                          </p>
                          <p className="text-[11px] text-gray-500 font-normal">
                            {art.year || 'Contemporary'}
                          </p>
                          {art.collection && (
                            <span className="inline-block text-[10px] text-gray-400 truncate max-w-full font-normal">
                              {isInCollection ? 'In this collection' : `In: ${art.collection}`}
                            </span>
                          )}
                        </div>

                        {/* Status Checkbox / Indicator */}
                        <div className="shrink-0 mr-1">
                          {isUpdating ? (
                            <Loader2 size={16} className="animate-spin text-[#2356FF]" />
                          ) : isInCollection ? (
                            <div className="w-6 h-6 rounded-full bg-[#2356FF] text-white flex items-center justify-center">
                              <Check size={14} />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-500" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-xs text-gray-500 font-normal">
                    You haven&apos;t uploaded any artworks yet.
                  </p>
                  <Link
                    href="/portfolio/upload"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#2356FF] font-normal hover:underline"
                  >
                    <Plus size={13} /> Upload Artwork
                  </Link>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-normal">
                {selectedCollectionForArtworks.artwork_count || 0} artworks in this collection
              </span>
              <button
                onClick={() => setSelectedCollectionForArtworks(null)}
                className="px-6 py-2.5 bg-[#181A1F] text-white rounded-full text-xs font-normal hover:bg-black transition-all cursor-pointer"
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
