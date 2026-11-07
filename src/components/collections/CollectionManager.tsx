'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Folder,
  Layers,
  Edit2,
  Trash2,
  X,
  Check,
  Loader2,
  ArrowLeft,
  Search,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';
import {
  CollectionItem,
  deleteCollection,
  assignArtworkToCollection,
} from '@/actions/collectionActions';
import CreateCollectionModal from './CreateCollectionModal';
import { PROTECTED_CONTAINER_CLASS, PROTECTED_IMAGE_CLASS } from '@/lib/media/assetProtection';

export interface ArtworkSimple {
  id: string;
  title: string;
  image_url: string;
  collection: string | null;
  collection_id?: string | null;
  year?: string | null;
  price?: number | null;
  art_type?: string | null;
  status?: string | null;
  is_published?: boolean;
}

interface CollectionManagerProps {
  initialCollections: CollectionItem[];
  initialArtworks?: ArtworkSimple[];
  userId: string;
}

export default function CollectionManager({
  initialCollections,
  initialArtworks = [],
  userId: _userId,
}: CollectionManagerProps) {
  const router = useRouter();
  const [collections, setCollections] = useState<CollectionItem[]>(initialCollections);
  const [creatorArtworks, setCreatorArtworks] = useState<ArtworkSimple[]>(initialArtworks);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<CollectionItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Active filter tab: 'collections' | 'curated' | 'unassigned' | 'all'
  const [activeTab, setActiveTab] = useState<'collections' | 'curated' | 'unassigned' | 'all'>('collections');

  // Artwork assignment drawer state (Curate specific collection)
  const [selectedCollectionForArtworks, setSelectedCollectionForArtworks] = useState<CollectionItem | null>(null);
  const [drawerSearch, setDrawerSearch] = useState('');
  const [drawerFilter, setDrawerFilter] = useState<'all' | 'in_collection' | 'unassigned'>('all');
  const [updatingArtworkId, setUpdatingArtworkId] = useState<string | null>(null);

  // Quick Assign Modal state (for assigning an artwork directly from unassigned/all tab)
  const [artworkToAssign, setArtworkToAssign] = useState<ArtworkSimple | null>(null);
  const [isAssigningModalAction, setIsAssigningModalAction] = useState(false);

  // Stats calculations
  const totalCollections = collections.length;
  const curatedArtworks = useMemo(() => {
    return creatorArtworks.filter(
      (a) => Boolean(a.collection_id) || (Boolean(a.collection) && a.collection?.trim().toLowerCase() !== 'none')
    );
  }, [creatorArtworks]);

  const unassignedArtworks = useMemo(() => {
    return creatorArtworks.filter(
      (a) => !a.collection_id && (!a.collection || a.collection?.trim().toLowerCase() === 'none')
    );
  }, [creatorArtworks]);

  const curatedArtworksCount = curatedArtworks.length;
  const unassignedArtworksCount = unassignedArtworks.length;

  // Handle create or update modal success
  const handleCreatedOrUpdated = (updatedCol: CollectionItem) => {
    setCollections((prev) => {
      const idx = prev.findIndex((c) => c.id === updatedCol.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          ...updatedCol,
          artwork_count: copy[idx].artwork_count || 0,
          artworks: copy[idx].artworks || [],
        };
        return copy;
      }
      return [
        {
          ...updatedCol,
          artwork_count: 0,
          artworks: [],
        },
        ...prev,
      ];
    });
    router.refresh();
  };

  // Handle collection deletion
  const handleDelete = async (col: CollectionItem) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the collection "${col.title}"? Your artworks will remain intact and will simply become standalone.`
      )
    ) {
      return;
    }

    setDeletingId(col.id);
    try {
      const res = await deleteCollection(col.id);
      if (res.success) {
        setCollections((prev) => prev.filter((c) => c.id !== col.id));
        // Disassociate artworks locally
        setCreatorArtworks((prev) =>
          prev.map((a) =>
            a.collection_id === col.id ||
            (a.collection && a.collection.trim().toLowerCase() === col.title.trim().toLowerCase())
              ? { ...a, collection_id: null, collection: null }
              : a
          )
        );
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

  // Toggle artwork in/out of selected collection
  const handleToggleArtworkInCollection = async (artwork: ArtworkSimple) => {
    if (!selectedCollectionForArtworks) return;

    const isCurrentlyIn =
      artwork.collection_id === selectedCollectionForArtworks.id ||
      (artwork.collection &&
        artwork.collection.trim().toLowerCase() === selectedCollectionForArtworks.title.trim().toLowerCase());

    const targetCollectionId = isCurrentlyIn ? null : selectedCollectionForArtworks.id;
    const targetCollectionTitle = isCurrentlyIn ? null : selectedCollectionForArtworks.title;

    setUpdatingArtworkId(artwork.id);

    // Optimistically update artworks state
    setCreatorArtworks((prev) =>
      prev.map((a) =>
        a.id === artwork.id
          ? { ...a, collection_id: targetCollectionId, collection: targetCollectionTitle }
          : a
      )
    );

    // Optimistically update collections count and cover preview
    setCollections((prev) =>
      prev.map((c) => {
        if (c.id === selectedCollectionForArtworks.id) {
          const newCount = Math.max(0, (c.artwork_count || 0) + (isCurrentlyIn ? -1 : 1));
          let updatedArtworksList = c.artworks ? [...c.artworks] : [];
          if (isCurrentlyIn) {
            updatedArtworksList = updatedArtworksList.filter((a: { id: string }) => a.id !== artwork.id);
          } else {
            updatedArtworksList.push(artwork);
          }
          const updatedCover =
            c.cover_image_url ||
            (updatedArtworksList[0] ? updatedArtworksList[0].image_url : null);

          return {
            ...c,
            artwork_count: newCount,
            artworks: updatedArtworksList,
            cover_image_url: updatedCover,
          };
        }
        return c;
      })
    );

    try {
      const res = await assignArtworkToCollection(
        artwork.id,
        targetCollectionId,
        targetCollectionTitle
      );
      if (!res.success) {
        console.error('Failed to update collection assignment on server:', res.error);
      }
    } catch (err) {
      console.error('Failed to toggle artwork in collection', err);
      // Revert on error
      setCreatorArtworks((prev) =>
        prev.map((a) => (a.id === artwork.id ? artwork : a))
      );
    } finally {
      setUpdatingArtworkId(null);
    }
  };

  // Direct assign from Quick Assign Modal
  const handleDirectAssignArtwork = async (artwork: ArtworkSimple, col: CollectionItem | null) => {
    const targetId = col ? col.id : null;
    const targetTitle = col ? col.title : null;

    setIsAssigningModalAction(true);

    // Optimistically update artworks state
    setCreatorArtworks((prev) =>
      prev.map((a) =>
        a.id === artwork.id
          ? { ...a, collection_id: targetId, collection: targetTitle }
          : a
      )
    );

    // Optimistically update collections
    setCollections((prev) =>
      prev.map((c) => {
        const wasInThis =
          artwork.collection_id === c.id ||
          (artwork.collection && artwork.collection.trim().toLowerCase() === c.title.trim().toLowerCase());
        const isNowInThis = col && c.id === col.id;

        if (wasInThis && !isNowInThis) {
          const newCount = Math.max(0, (c.artwork_count || 0) - 1);
          return {
            ...c,
            artwork_count: newCount,
            artworks: (c.artworks || []).filter((a: { id: string }) => a.id !== artwork.id),
          };
        } else if (!wasInThis && isNowInThis) {
          const newCount = (c.artwork_count || 0) + 1;
          const updatedArtworks = [...(c.artworks || []), artwork];
          return {
            ...c,
            artwork_count: newCount,
            artworks: updatedArtworks,
            cover_image_url: c.cover_image_url || artwork.image_url,
          };
        }
        return c;
      })
    );

    try {
      await assignArtworkToCollection(artwork.id, targetId, targetTitle);
    } catch (err) {
      console.error('Failed to assign artwork directly', err);
    } finally {
      setIsAssigningModalAction(false);
      setArtworkToAssign(null);
    }
  };

  // Drawer artworks filtered by search and filter tab
  const drawerArtworks = useMemo(() => {
    if (!selectedCollectionForArtworks) return [];

    let list = creatorArtworks;

    // Search filter
    if (drawerSearch.trim()) {
      const q = drawerSearch.toLowerCase();
      list = list.filter((a) => a.title.toLowerCase().includes(q));
    }

    // Tab filter
    if (drawerFilter === 'in_collection') {
      list = list.filter(
        (a) =>
          a.collection_id === selectedCollectionForArtworks.id ||
          (a.collection &&
            a.collection.trim().toLowerCase() === selectedCollectionForArtworks.title.trim().toLowerCase())
      );
    } else if (drawerFilter === 'unassigned') {
      list = list.filter(
        (a) =>
          !a.collection_id &&
          (!a.collection || a.collection.trim().toLowerCase() === 'none')
      );
    }

    return list;
  }, [creatorArtworks, selectedCollectionForArtworks, drawerSearch, drawerFilter]);

  const activeArtworksInCurrent = useMemo(() => {
    if (!selectedCollectionForArtworks) return 0;
    return creatorArtworks.filter(
      (a) =>
        a.collection_id === selectedCollectionForArtworks.id ||
        (a.collection &&
          a.collection.trim().toLowerCase() === selectedCollectionForArtworks.title.trim().toLowerCase())
    ).length;
  }, [creatorArtworks, selectedCollectionForArtworks]);

  // Define the 4 interactive button boxes
  const statsTabs = [
    { id: 'collections', label: 'Collections', count: totalCollections },
    { id: 'curated', label: 'Curated Works', count: curatedArtworksCount },
    { id: 'unassigned', label: 'Unassigned', count: unassignedArtworksCount },
    { id: 'all', label: 'Total Pieces', count: creatorArtworks.length },
  ] as const;

  return (
    <div style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}>
      {/* Header Section matching /portfolio */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1
              className="text-4xl sm:text-5xl font-serif italic font-semibold text-[var(--color-cor-ink,#141413)] tracking-tight"
              style={{
                fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif",
                fontStyle: 'italic',
              }}
            >
              Collections
            </h1>
            <p className="text-xs text-gray-500 font-normal mt-1.5">
              Curate and organize your artworks into thematic series and solo exhibition collections.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-4 sm:mt-0">
            {/* Back to Portfolio Link */}
            <Link
              href="/portfolio"
              style={{
                position: 'relative',
                background: '#181A1F',
                overflow: 'hidden',
                borderRadius: 40,
              }}
              className="px-7 py-3 sm:px-8 sm:py-3.5 inline-flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 hover:bg-black active:scale-[0.98] shadow-md select-none"
            >
              <span
                style={{
                  color: 'white',
                  fontSize: 14,
                  fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                  fontWeight: '400',
                  lineHeight: '20px',
                }}
                className="flex items-center gap-2 relative z-10"
              >
                <ArrowLeft size={15} className="text-white" />
                <span>Back to Portfolio</span>
              </span>
            </Link>

            {/* New Collection Button with signature blue gradient */}
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
              className="px-7 py-3 sm:px-8 sm:py-3.5 inline-flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.98] group select-none shadow-md"
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
                  fontSize: 14,
                  fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                  fontWeight: '400',
                  lineHeight: '20px',
                }}
                className="flex items-center gap-2 relative z-10"
              >
                <Plus size={16} className="text-white" />
                <span>New Collection</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Small Button Boxes Section (White background, blue gradient border & text on active/hover, no full gradient fill) */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 mb-8">
        {statsTabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={
                isActive
                  ? {
                      background:
                        'linear-gradient(#ffffff, #ffffff) padding-box, linear-gradient(90deg, #082779 0%, #1345EE 62%, #458CFF 100%) border-box',
                      border: '1.5px solid transparent',
                      boxShadow:
                        '0px 4px 14px rgba(35, 77, 255, 0.12), 0px 1px 3px rgba(35, 77, 255, 0.08)',
                    }
                  : {
                      background: '#FFFFFF',
                      border: '1.5px solid #EBEBE6',
                    }
              }
              className={`relative min-w-[135px] sm:min-w-[155px] flex-1 sm:flex-none px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl text-left transition-all duration-200 cursor-pointer select-none group box-border ${
                isActive
                  ? 'shadow-xs'
                  : 'hover:border-[#2356FF] hover:shadow-[0_2px_12px_rgba(35,77,255,0.08)] active:scale-[0.99]'
              }`}
            >
              <div className="flex flex-col justify-between">
                <p
                  className={`text-[10px] sm:text-[11px] font-normal tracking-[0.14em] uppercase mb-1 truncate transition-colors ${
                    isActive ? 'text-[#1345EE]' : 'text-gray-500 group-hover:text-[#2356FF]'
                  }`}
                >
                  {tab.label}
                </p>
                <span
                  style={
                    isActive
                      ? {
                          background: 'linear-gradient(90deg, #082779 0%, #1345EE 62%, #458CFF 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }
                      : undefined
                  }
                  className={`text-xl sm:text-2xl font-normal leading-tight transition-colors ${
                    isActive ? '' : 'text-gray-900 group-hover:text-[#2356FF]'
                  }`}
                >
                  {tab.count}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Content Area based on Active Tab */}
      <div className="mb-10 min-h-[380px]">
        {/* TAB 1: COLLECTIONS */}
        {activeTab === 'collections' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2
                className="text-2xl font-serif italic font-normal text-[var(--color-cor-ink,#141413)] tracking-tight"
                style={{
                  fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif",
                  fontStyle: 'italic',
                }}
              >
                Your collections
              </h2>
              <span className="text-xs text-gray-500 font-normal">
                {collections.length} {collections.length === 1 ? 'collection' : 'collections'}
              </span>
            </div>

            {collections.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {collections.map((col) => {
                  const matchingArtworks = creatorArtworks.filter(
                    (a) =>
                      a.collection_id === col.id ||
                      (a.collection && a.collection.trim().toLowerCase() === col.title.trim().toLowerCase())
                  );
                  const artworkCount = col.artwork_count !== undefined ? col.artwork_count : matchingArtworks.length;
                  const coverImage = col.cover_image_url || matchingArtworks[0]?.image_url || null;

                  return (
                    <div
                      key={col.id}
                      className="bg-white rounded-3xl border border-[#EBEBE6] overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col group"
                    >
                      {/* Cover Preview with Anti-Download Shield */}
                      <div
                        className={`h-48 bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden cursor-pointer ${PROTECTED_CONTAINER_CLASS}`}
                        onClick={() => {
                          setDrawerSearch('');
                          setDrawerFilter('all');
                          setSelectedCollectionForArtworks(col);
                        }}
                      >
                        {coverImage ? (
                          <>
                            <img
                              src={coverImage}
                              alt={col.title}
                              draggable={false}
                              onContextMenu={(e) => e.preventDefault()}
                              onDragStart={(e) => e.preventDefault()}
                              className={`w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out select-none pointer-events-none ${PROTECTED_IMAGE_CLASS}`}
                              loading="lazy"
                            />
                            <div
                              className="absolute inset-0 z-[1]"
                              onContextMenu={(e) => e.preventDefault()}
                              onDragStart={(e) => e.preventDefault()}
                              aria-hidden="true"
                            />
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                            <Folder size={34} className="opacity-35" />
                            <span className="text-[11px] font-normal text-gray-500">
                              Click to curate artworks
                            </span>
                          </div>
                        )}

                        {/* Artwork Count Floating Badge */}
                        <div className="absolute bottom-3 left-3 z-[2] bg-black/70 backdrop-blur-md text-white text-[11px] font-normal px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                          <Layers size={11} />
                          <span>
                            {artworkCount} {artworkCount === 1 ? 'Artwork' : 'Artworks'}
                          </span>
                        </div>

                        {/* Status Floating Badge */}
                        <div className="absolute top-3 right-3 z-[2] bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-normal text-gray-800 shadow-xs border border-white/40 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>{col.is_published ? 'Published' : 'Draft'}</span>
                        </div>
                      </div>

                      {/* Content Container */}
                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <h3
                            className="text-2xl font-serif italic font-normal text-gray-900 tracking-tight mb-2 cursor-pointer hover:text-[#1345EE] transition-colors truncate"
                            style={{
                              fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif",
                              fontStyle: 'italic',
                            }}
                            onClick={() => {
                              setDrawerSearch('');
                              setDrawerFilter('all');
                              setSelectedCollectionForArtworks(col);
                            }}
                          >
                            {col.title}
                          </h3>

                          {col.description ? (
                            <p className="text-xs text-gray-500 font-normal line-clamp-2 leading-relaxed mb-4">
                              {col.description}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-400 font-normal italic mb-4">
                              No curatorial statement provided.
                            </p>
                          )}

                          {/* Artwork Mini Thumbnails Strip */}
                          <div className="flex items-center gap-1.5 mb-2">
                            {matchingArtworks.length > 0 ? (
                              <div className="flex items-center -space-x-2">
                                {matchingArtworks.slice(0, 4).map((art) => (
                                  <div
                                    key={art.id}
                                    className="w-7 h-7 rounded-full border-2 border-white overflow-hidden bg-gray-200 shrink-0 shadow-2xs"
                                  >
                                    <img
                                      src={art.image_url}
                                      alt={art.title}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ))}
                                {matchingArtworks.length > 4 && (
                                  <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-900 text-white text-[10px] font-normal flex items-center justify-center shrink-0 shadow-2xs">
                                    +{matchingArtworks.length - 4}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-[11px] text-gray-400 font-normal">
                                No artworks assigned yet
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons Row */}
                        <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                          <button
                            onClick={() => {
                              setDrawerSearch('');
                              setDrawerFilter('all');
                              setSelectedCollectionForArtworks(col);
                            }}
                            className="px-4 py-2 bg-[#181A1F] hover:bg-black text-white rounded-full text-xs font-normal transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                          >
                            <Layers size={13} />
                            <span>Manage Artworks</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingCollection(col);
                                setIsModalOpen(true);
                              }}
                              title="Edit Collection"
                              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(col)}
                              disabled={deletingId === col.id}
                              title="Delete Collection"
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer disabled:opacity-50"
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
              /* Empty State matching /portfolio and /purchases */
              <div className="bg-white rounded-3xl border border-gray-200 p-12 sm:p-16 flex flex-col items-center justify-center text-center shadow-2xs min-h-[360px]">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#2356FF] flex items-center justify-center mb-4">
                  <Folder size={28} />
                </div>
                <h3
                  className="text-2xl font-serif italic font-normal text-gray-900 mb-2 tracking-tight"
                  style={{
                    fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif",
                    fontStyle: 'italic',
                  }}
                >
                  No collections yet
                </h3>
                <p className="text-xs text-gray-500 font-normal max-w-md mx-auto mb-6 leading-relaxed">
                  Curate your portfolio into thematic series, seasonal drops, or solo exhibition themes.
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
                    borderRadius: 40,
                    outline: '2px #2356FF solid',
                    outlineOffset: '-2px',
                  }}
                  className="px-8 py-3.5 inline-flex items-center gap-2 text-white text-xs font-normal hover:brightness-110 transition-all cursor-pointer shadow-md select-none"
                >
                  <Plus size={16} className="text-white" />
                  <span>Create Your First Collection</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CURATED WORKS */}
        {activeTab === 'curated' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2
                className="text-2xl font-serif italic font-normal text-[var(--color-cor-ink,#141413)] tracking-tight"
                style={{
                  fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif",
                  fontStyle: 'italic',
                }}
              >
                Curated Works
              </h2>
              <span className="text-xs text-gray-500 font-normal">
                {curatedArtworks.length} {curatedArtworks.length === 1 ? 'artwork' : 'artworks'}
              </span>
            </div>

            {curatedArtworks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {curatedArtworks.map((art) => (
                  <div
                    key={art.id}
                    className="bg-white rounded-3xl border border-[#EBEBE6] p-4 flex flex-col justify-between hover:shadow-md transition-all group"
                  >
                    <div>
                      {/* Image Thumbnail with protection */}
                      <div className={`aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100 relative mb-3 ${PROTECTED_CONTAINER_CLASS}`}>
                        {art.image_url ? (
                          <>
                            <img
                              src={art.image_url}
                              alt={art.title}
                              draggable={false}
                              onContextMenu={(e) => e.preventDefault()}
                              onDragStart={(e) => e.preventDefault()}
                              className={`w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 select-none pointer-events-none ${PROTECTED_IMAGE_CLASS}`}
                            />
                            <div
                              className="absolute inset-0 z-[1]"
                              onContextMenu={(e) => e.preventDefault()}
                              onDragStart={(e) => e.preventDefault()}
                              aria-hidden="true"
                            />
                          </>
                        ) : (
                          <ImageIcon size={24} className="m-auto text-gray-300 h-full" />
                        )}

                        {/* Collection Badge on image */}
                        <div className="absolute bottom-2.5 left-2.5 z-[2] bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-normal text-white flex items-center gap-1.5 shadow-xs">
                          <Layers size={10} />
                          <span className="truncate max-w-[140px]">{art.collection}</span>
                        </div>
                      </div>

                      {/* Title & Info */}
                      <h4
                        className="text-base font-serif italic font-normal text-gray-900 tracking-tight truncate mb-1"
                        style={{
                          fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif",
                          fontStyle: 'italic',
                        }}
                      >
                        {art.title}
                      </h4>
                      <p className="text-[11px] text-gray-500 font-normal">
                        {art.art_type || 'Artwork'} {art.year ? `· ${art.year}` : ''}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          const parentCol = collections.find(
                            (c) =>
                              c.id === art.collection_id ||
                              (art.collection && c.title.toLowerCase() === art.collection.toLowerCase())
                          );
                          if (parentCol) {
                            setSelectedCollectionForArtworks(parentCol);
                          } else {
                            setArtworkToAssign(art);
                          }
                        }}
                        className="flex-1 py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full text-xs font-normal transition-colors cursor-pointer text-center"
                      >
                        Change Series
                      </button>
                      <button
                        onClick={() => handleDirectAssignArtwork(art, null)}
                        title="Remove from collection"
                        className="py-1.5 px-3 border border-gray-200 text-gray-600 hover:text-red-600 hover:bg-red-50 hover:border-red-100 rounded-full text-xs font-normal transition-colors cursor-pointer"
                      >
                        Unassign
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#2356FF] flex items-center justify-center mx-auto mb-4">
                  <Layers size={28} />
                </div>
                <h3
                  className="text-xl font-serif italic font-normal text-gray-900 mb-2"
                  style={{
                    fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif",
                    fontStyle: 'italic',
                  }}
                >
                  No curated artworks yet
                </h3>
                <p className="text-xs text-gray-500 font-normal max-w-sm mx-auto mb-5 leading-relaxed">
                  Assign pieces to a collection to display your organized series and thematic drops.
                </p>
                <button
                  onClick={() => setActiveTab('unassigned')}
                  className="px-6 py-2.5 bg-gray-900 text-white rounded-full text-xs font-normal hover:bg-black transition-all cursor-pointer"
                >
                  Browse Unassigned Artworks
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: UNASSIGNED WORKS */}
        {activeTab === 'unassigned' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2
                className="text-2xl font-serif italic font-normal text-[var(--color-cor-ink,#141413)] tracking-tight"
                style={{
                  fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif",
                  fontStyle: 'italic',
                }}
              >
                Unassigned Works
              </h2>
              <span className="text-xs text-gray-500 font-normal">
                {unassignedArtworks.length} {unassignedArtworks.length === 1 ? 'artwork' : 'artworks'}
              </span>
            </div>

            {unassignedArtworks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {unassignedArtworks.map((art) => (
                  <div
                    key={art.id}
                    className="bg-white rounded-3xl border border-[#EBEBE6] p-4 flex flex-col justify-between hover:shadow-md transition-all group"
                  >
                    <div>
                      {/* Image Thumbnail with protection */}
                      <div className={`aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100 relative mb-3 ${PROTECTED_CONTAINER_CLASS}`}>
                        {art.image_url ? (
                          <>
                            <img
                              src={art.image_url}
                              alt={art.title}
                              draggable={false}
                              onContextMenu={(e) => e.preventDefault()}
                              onDragStart={(e) => e.preventDefault()}
                              className={`w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 select-none pointer-events-none ${PROTECTED_IMAGE_CLASS}`}
                            />
                            <div
                              className="absolute inset-0 z-[1]"
                              onContextMenu={(e) => e.preventDefault()}
                              onDragStart={(e) => e.preventDefault()}
                              aria-hidden="true"
                            />
                          </>
                        ) : (
                          <ImageIcon size={24} className="m-auto text-gray-300 h-full" />
                        )}

                        <div className="absolute bottom-2.5 left-2.5 z-[2] bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-normal text-gray-700 shadow-xs border border-white/40">
                          Standalone Piece
                        </div>
                      </div>

                      {/* Title & Info */}
                      <h4
                        className="text-base font-serif italic font-normal text-gray-900 tracking-tight truncate mb-1"
                        style={{
                          fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif",
                          fontStyle: 'italic',
                        }}
                      >
                        {art.title}
                      </h4>
                      <p className="text-[11px] text-gray-500 font-normal">
                        {art.art_type || 'Artwork'} {art.year ? `· ${art.year}` : ''}
                      </p>
                    </div>

                    {/* Quick Assign Action Button */}
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => setArtworkToAssign(art)}
                        className="w-full py-2 px-3 bg-[#181A1F] hover:bg-black text-white rounded-full text-xs font-normal transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <Plus size={13} />
                        <span>Assign to Collection</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={28} />
                </div>
                <h3
                  className="text-xl font-serif italic font-normal text-gray-900 mb-2"
                  style={{
                    fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif",
                    fontStyle: 'italic',
                  }}
                >
                  All pieces are in collections
                </h3>
                <p className="text-xs text-gray-500 font-normal max-w-sm mx-auto mb-5 leading-relaxed">
                  Every artwork in your portfolio is assigned to a collection.
                </p>
                <Link
                  href="/portfolio/upload"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#181A1F] text-white rounded-full text-xs font-normal hover:bg-black transition-all cursor-pointer shadow-xs"
                >
                  <Plus size={14} /> Upload New Artwork
                </Link>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: TOTAL PIECES */}
        {activeTab === 'all' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2
                className="text-2xl font-serif italic font-normal text-[var(--color-cor-ink,#141413)] tracking-tight"
                style={{
                  fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif",
                  fontStyle: 'italic',
                }}
              >
                All Artworks
              </h2>
              <span className="text-xs text-gray-500 font-normal">
                {creatorArtworks.length} {creatorArtworks.length === 1 ? 'piece' : 'pieces'}
              </span>
            </div>

            {creatorArtworks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {creatorArtworks.map((art) => {
                  const isInCol = Boolean(art.collection_id) || (Boolean(art.collection) && art.collection !== 'none');

                  return (
                    <div
                      key={art.id}
                      className="bg-white rounded-3xl border border-[#EBEBE6] p-4 flex flex-col justify-between hover:shadow-md transition-all group"
                    >
                      <div>
                        {/* Image Thumbnail with protection */}
                        <div className={`aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100 relative mb-3 ${PROTECTED_CONTAINER_CLASS}`}>
                          {art.image_url ? (
                            <>
                              <img
                                src={art.image_url}
                                alt={art.title}
                                draggable={false}
                                onContextMenu={(e) => e.preventDefault()}
                                onDragStart={(e) => e.preventDefault()}
                                className={`w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 select-none pointer-events-none ${PROTECTED_IMAGE_CLASS}`}
                              />
                              <div
                                className="absolute inset-0 z-[1]"
                                onContextMenu={(e) => e.preventDefault()}
                                onDragStart={(e) => e.preventDefault()}
                                aria-hidden="true"
                              />
                            </>
                          ) : (
                            <ImageIcon size={24} className="m-auto text-gray-300 h-full" />
                          )}

                          <div className="absolute bottom-2.5 left-2.5 z-[2] bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-normal text-white flex items-center gap-1.5 shadow-xs">
                            {isInCol ? (
                              <>
                                <Layers size={10} />
                                <span className="truncate max-w-[140px]">{art.collection}</span>
                              </>
                            ) : (
                              <span>Standalone</span>
                            )}
                          </div>
                        </div>

                        {/* Title & Info */}
                        <h4
                          className="text-base font-serif italic font-normal text-gray-900 tracking-tight truncate mb-1"
                          style={{
                            fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif",
                            fontStyle: 'italic',
                          }}
                        >
                          {art.title}
                        </h4>
                        <p className="text-[11px] text-gray-500 font-normal">
                          {art.art_type || 'Artwork'} {art.year ? `· ${art.year}` : ''}
                        </p>
                      </div>

                      {/* Action Button */}
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => setArtworkToAssign(art)}
                          className="w-full py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full text-xs font-normal transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Layers size={12} />
                          <span>{isInCol ? 'Change Collection' : 'Add to Collection'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center">
                <p className="text-xs text-gray-500 font-normal mb-4">
                  You haven&apos;t uploaded any artworks yet.
                </p>
                <Link
                  href="/portfolio/upload"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-full text-xs font-normal hover:bg-black transition-all"
                >
                  <Plus size={14} /> Upload Your First Artwork
                </Link>
              </div>
            )}
          </div>
        )}
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

      {/* Quick Collection Picker Dialog (for assigning an artwork from Unassigned or All view) */}
      {artworkToAssign && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs transition-opacity"
          onClick={() => !isAssigningModalAction && setArtworkToAssign(null)}
        >
          <div
            className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-md p-6 sm:p-7 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-4 border-b border-gray-100 mb-4">
              <div>
                <span className="text-[11px] font-normal tracking-[0.14em] text-[#2356FF] uppercase">
                  Assign Artwork
                </span>
                <h3
                  className="text-xl font-serif italic font-normal text-gray-900 mt-0.5 truncate"
                  style={{
                    fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif",
                    fontStyle: 'italic',
                  }}
                >
                  {artworkToAssign.title}
                </h3>
                <p className="text-xs text-gray-500 font-normal mt-0.5">
                  Select a collection to add this artwork into.
                </p>
              </div>
              <button
                onClick={() => setArtworkToAssign(null)}
                disabled={isAssigningModalAction}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {collections.length > 0 ? (
              <div className="flex flex-col gap-2 max-h-72 overflow-y-auto py-1">
                {collections.map((col) => {
                  const isAssigned =
                    artworkToAssign.collection_id === col.id ||
                    (artworkToAssign.collection &&
                      artworkToAssign.collection.trim().toLowerCase() === col.title.trim().toLowerCase());

                  return (
                    <button
                      key={col.id}
                      disabled={isAssigningModalAction}
                      onClick={() => handleDirectAssignArtwork(artworkToAssign, isAssigned ? null : col)}
                      className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isAssigned
                          ? 'border-[#2356FF] bg-blue-50/50 text-[#2356FF] ring-1 ring-[#2356FF]'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 shrink-0 overflow-hidden">
                          {col.cover_image_url ? (
                            <img src={col.cover_image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Folder size={16} />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-normal text-gray-900">{col.title}</p>
                          <p className="text-[11px] text-gray-400 font-normal">
                            {col.artwork_count || 0} {col.artwork_count === 1 ? 'artwork' : 'artworks'}
                          </p>
                        </div>
                      </div>

                      {isAssigned ? (
                        <div className="w-5 h-5 rounded-full bg-[#2356FF] text-white flex items-center justify-center shadow-xs">
                          <Check size={12} />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-gray-300" />
                      )}
                    </button>
                  );
                })}

                {/* Option to create a new collection directly */}
                <button
                  disabled={isAssigningModalAction}
                  onClick={() => {
                    setArtworkToAssign(null);
                    setEditingCollection(null);
                    setIsModalOpen(true);
                  }}
                  className="mt-2 p-3 rounded-2xl border border-dashed border-gray-300 hover:border-gray-500 hover:bg-gray-50 text-gray-700 text-xs font-normal flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Create New Collection</span>
                </button>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-gray-500 font-normal mb-4">
                  You don&apos;t have any collections yet. Create a collection first to assign this artwork.
                </p>
                <button
                  onClick={() => {
                    setArtworkToAssign(null);
                    setEditingCollection(null);
                    setIsModalOpen(true);
                  }}
                  className="px-5 py-2.5 bg-[#181A1F] text-white rounded-full text-xs font-normal hover:bg-black transition-all cursor-pointer shadow-xs inline-flex items-center gap-2"
                >
                  <Plus size={14} /> Create Collection
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Slide-over Drawer for Managing Artworks in Collection */}
      {selectedCollectionForArtworks && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity"
          onClick={() => setSelectedCollectionForArtworks(null)}
        >
          <div
            className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-gray-100 flex items-start justify-between bg-white shrink-0">
              <div>
                <span className="text-[11px] font-normal tracking-[0.15em] text-[#2356FF] uppercase">
                  Curate Collection
                </span>
                <h2
                  className="text-2xl font-serif italic font-normal text-gray-900 tracking-tight mt-1"
                  style={{
                    fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif",
                    fontStyle: 'italic',
                  }}
                >
                  {selectedCollectionForArtworks.title}
                </h2>
                <p className="text-xs text-gray-500 font-normal mt-1">
                  Click on an artwork to assign or remove it from this series.
                </p>
              </div>
              <button
                onClick={() => setSelectedCollectionForArtworks(null)}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="px-6 py-3.5 border-b border-gray-100 bg-[#FCFCF9] flex flex-col gap-3 shrink-0">
              {/* Search input */}
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Search your artworks..."
                  value={drawerSearch}
                  onChange={(e) => setDrawerSearch(e.target.value)}
                  className="w-full text-xs pl-9 pr-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#2356FF] focus:ring-1 focus:ring-[#2356FF] transition-all font-normal"
                />
                {drawerSearch && (
                  <button
                    onClick={() => setDrawerSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setDrawerFilter('all')}
                  className={`px-3 py-1 rounded-full text-xs font-normal transition-colors cursor-pointer ${
                    drawerFilter === 'all'
                      ? 'bg-gray-900 text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  All ({creatorArtworks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerFilter('in_collection')}
                  className={`px-3 py-1 rounded-full text-xs font-normal transition-colors cursor-pointer ${
                    drawerFilter === 'in_collection'
                      ? 'bg-[#2356FF] text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  In Collection ({activeArtworksInCurrent})
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerFilter('unassigned')}
                  className={`px-3 py-1 rounded-full text-xs font-normal transition-colors cursor-pointer ${
                    drawerFilter === 'unassigned'
                      ? 'bg-gray-900 text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Unassigned ({unassignedArtworksCount})
                </button>
              </div>
            </div>

            {/* Artworks List in Drawer */}
            <div className="flex-1 p-6 overflow-y-auto">
              {drawerArtworks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {drawerArtworks.map((art) => {
                    const isInCollection =
                      art.collection_id === selectedCollectionForArtworks.id ||
                      (art.collection &&
                        art.collection.trim().toLowerCase() ===
                          selectedCollectionForArtworks.title.trim().toLowerCase());
                    const isUpdating = updatingArtworkId === art.id;

                    return (
                      <div
                        key={art.id}
                        onClick={() => !isUpdating && handleToggleArtworkInCollection(art)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 relative select-none ${
                          isInCollection
                            ? 'border-[#2356FF] bg-blue-50/50 ring-1 ring-[#2356FF]'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50'
                        }`}
                      >
                        {/* Thumbnail with protection */}
                        <div
                          className={`w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0 relative ${PROTECTED_CONTAINER_CLASS}`}
                        >
                          {art.image_url ? (
                            <>
                              <img
                                src={art.image_url}
                                alt={art.title}
                                draggable={false}
                                onContextMenu={(e) => e.preventDefault()}
                                onDragStart={(e) => e.preventDefault()}
                                className={`w-full h-full object-cover select-none pointer-events-none ${PROTECTED_IMAGE_CLASS}`}
                              />
                              <div
                                className="absolute inset-0 z-[1]"
                                onContextMenu={(e) => e.preventDefault()}
                                onDragStart={(e) => e.preventDefault()}
                                aria-hidden="true"
                              />
                            </>
                          ) : (
                            <ImageIcon size={20} className="m-auto text-gray-300 h-full" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-xs font-normal text-gray-900 truncate"
                            style={{
                              fontFamily:
                                "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif",
                              fontStyle: 'italic',
                            }}
                          >
                            {art.title}
                          </p>
                          <p className="text-[11px] text-gray-500 font-normal">
                            {art.art_type || 'Artwork'} {art.year ? `· ${art.year}` : ''}
                          </p>
                          {art.collection && (
                            <span className="inline-block text-[10px] text-gray-400 truncate max-w-full font-normal">
                              {isInCollection ? 'In this collection' : `In: ${art.collection}`}
                            </span>
                          )}
                        </div>

                        {/* Status Checkbox Indicator */}
                        <div className="shrink-0 mr-1">
                          {isUpdating ? (
                            <Loader2 size={16} className="animate-spin text-[#2356FF]" />
                          ) : isInCollection ? (
                            <div className="w-6 h-6 rounded-full bg-[#2356FF] text-white flex items-center justify-center shadow-xs">
                              <Check size={14} />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-500 transition-colors" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-xs text-gray-500 font-normal">
                    {drawerSearch
                      ? `No artworks match "${drawerSearch}"`
                      : drawerFilter === 'in_collection'
                      ? 'No artworks currently in this collection.'
                      : drawerFilter === 'unassigned'
                      ? 'All artworks are already assigned to a collection.'
                      : 'No artworks uploaded yet.'}
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
            <div className="p-4 border-t border-gray-100 bg-white flex items-center justify-between shrink-0">
              <span className="text-xs text-gray-500 font-normal">
                {activeArtworksInCurrent} artworks in this collection
              </span>
              <button
                onClick={() => setSelectedCollectionForArtworks(null)}
                className="px-6 py-2.5 bg-[#181A1F] text-white rounded-full text-xs font-normal hover:bg-black transition-all cursor-pointer shadow-xs select-none"
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
