'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateArtwork, deleteArtwork } from '@/actions/artworkActions';
import { ChevronDown, Loader2, Check } from 'lucide-react';

interface ArtworkCardActionsProps {
  artwork: {
    id: string;
    status: string;
    collection: string | null;
    is_published?: boolean;
  };
  userId: string;
}

const standardCollections = [
  'Monsoon Studies',
  'Urban Silence',
  'Fragments of Memory',
  'Spring Collection',
  'Autumn Collection',
];

export default function ArtworkCardActions({ artwork, userId }: ArtworkCardActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Optimistic local state for immediate responsiveness (0ms perceptual lag)
  const [selectedStatus, setSelectedStatus] = useState(artwork.status || 'Available');
  const [selectedCollection, setSelectedCollection] = useState(artwork.collection || 'none');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingCollection, setIsUpdatingCollection] = useState(false);
  const [collectionSaved, setCollectionSaved] = useState(false);

  // Dynamically include custom collection if present and not in standard list
  const collectionList = artwork.collection && !standardCollections.includes(artwork.collection)
    ? [...standardCollections, artwork.collection]
    : standardCollections;

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/portfolio/artworks/${artwork.id}/edit`);
  };

  const handleTogglePublish = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setIsPublishing(true);
      await updateArtwork(artwork.id, { userId, isPublished: !artwork.is_published });
      router.refresh();
    } catch (error) {
      console.error('Failed to update publish state', error);
      alert('Failed to update artwork');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this artwork? This will also delete any chats associated with it.')) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteArtwork(artwork.id, userId);
      router.refresh();
    } catch (error) {
      console.error('Failed to delete artwork', error);
      alert('Failed to delete artwork');
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const newStatus = e.target.value;

    // Instant optimistic update
    setSelectedStatus(newStatus);
    setIsUpdatingStatus(true);

    try {
      await updateArtwork(artwork.id, { userId, status: newStatus });
      router.refresh();
    } catch (error) {
      console.error('Failed to update status', error);
      setSelectedStatus(artwork.status);
      alert('Failed to update status. Please try again.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCollectionChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const newCollectionVal = e.target.value;
    const newCollection = newCollectionVal === 'none' ? null : newCollectionVal;

    // Instant optimistic update (0ms lag)
    setSelectedCollection(newCollectionVal);
    setIsUpdatingCollection(true);

    try {
      await updateArtwork(artwork.id, { userId, collection: newCollection });
      setCollectionSaved(true);
      setTimeout(() => setCollectionSaved(false), 2000);
      router.refresh();
    } catch (error) {
      console.error('Failed to update collection', error);
      setSelectedCollection(artwork.collection || 'none');
      alert('Failed to update collection. Please try again.');
    } finally {
      setIsUpdatingCollection(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-3" onClick={(e) => e.preventDefault()}>
      
      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleEdit}
          disabled={isDeleting || isPublishing}
          className="flex-1 py-1.5 px-3 bg-white border border-gray-200 text-gray-700 rounded-full text-xs font-semibold hover:bg-gray-50 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={handleTogglePublish}
          disabled={isDeleting || isPublishing}
          className="flex-1 py-1.5 px-3 bg-white border border-gray-200 text-gray-700 rounded-full text-xs font-semibold hover:bg-gray-50 transition-colors"
        >
          {isPublishing ? <Loader2 size={12} className="animate-spin inline" /> : (artwork.is_published === false ? 'Publish' : 'Archive')}
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting || isPublishing}
          className="flex-1 py-1.5 px-3 bg-white border border-gray-200 text-gray-700 rounded-full text-xs font-semibold hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors flex justify-center items-center"
        >
          {isDeleting ? <Loader2 size={14} className="animate-spin" /> : 'Delete'}
        </button>
      </div>

      {/* Select Dropdowns */}
      <div className="flex flex-col gap-2 relative z-20">
        {/* Status Dropdown */}
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={handleStatusChange}
            disabled={isDeleting}
            className="w-full appearance-none bg-white border border-gray-200 text-gray-700 text-xs rounded-xl py-2 pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-gray-900 cursor-pointer transition-all"
          >
            <option value="Available">Available</option>
            <option value="For Sale">For Sale</option>
            <option value="Not for sale">Not for sale</option>
            <option value="Sold">Sold</option>
          </select>
          {isUpdatingStatus ? (
            <Loader2 size={13} className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          ) : (
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          )}
        </div>

        {/* Collection Dropdown */}
        <div className="relative">
          <select
            value={selectedCollection}
            onChange={handleCollectionChange}
            disabled={isDeleting}
            className="w-full appearance-none bg-white border border-gray-200 text-gray-700 text-xs rounded-xl py-2 pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-gray-900 cursor-pointer transition-all"
          >
            <option value="none">No Collection</option>
            {collectionList.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>
          {isUpdatingCollection ? (
            <Loader2 size={13} className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          ) : collectionSaved ? (
            <Check size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none" />
          ) : (
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          )}
        </div>
      </div>

    </div>
  );
}
