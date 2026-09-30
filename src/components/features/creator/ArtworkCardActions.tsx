'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateArtwork, deleteArtwork } from '@/actions/artworkActions';
import { ChevronDown, Loader2 } from 'lucide-react';

interface ArtworkCardActionsProps {
  artwork: {
    id: string;
    status: string;
    collection: string | null;
    is_published?: boolean;
  };
  userId: string;
}

export default function ArtworkCardActions({ artwork, userId }: ArtworkCardActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/portfolio/artworks/${artwork.id}/edit`);
  };

  const handleTogglePublish = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setIsUpdating(true);
      await updateArtwork(artwork.id, { userId, isPublished: !artwork.is_published });
    } catch (error) {
      console.error('Failed to update publish state', error);
      alert('Failed to update artwork');
    } finally {
      setIsUpdating(false);
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
    } catch (error) {
      console.error('Failed to delete artwork', error);
      alert('Failed to delete artwork');
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setIsUpdating(true);
      await updateArtwork(artwork.id, { userId, status: e.target.value });
    } catch (error) {
      console.error('Failed to update status', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCollectionChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const newCollection = e.target.value === 'none' ? null : e.target.value;
    try {
      setIsUpdating(true);
      // @ts-ignore
      await updateArtwork(artwork.id, { userId, collection: newCollection });
    } catch (error) {
      console.error('Failed to update collection', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-3" onClick={(e) => e.preventDefault()}>
      
      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleEdit}
          disabled={isDeleting || isUpdating}
          className="flex-1 py-1.5 px-3 bg-white border border-gray-200 text-gray-700 rounded-full text-xs font-semibold hover:bg-gray-50 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={handleTogglePublish}
          disabled={isDeleting || isUpdating}
          className="flex-1 py-1.5 px-3 bg-white border border-gray-200 text-gray-700 rounded-full text-xs font-semibold hover:bg-gray-50 transition-colors"
        >
          {artwork.is_published === false ? 'Publish' : 'Archive'}
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting || isUpdating}
          className="flex-1 py-1.5 px-3 bg-white border border-gray-200 text-gray-700 rounded-full text-xs font-semibold hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors flex justify-center items-center"
        >
          {isDeleting ? <Loader2 size={14} className="animate-spin" /> : 'Delete'}
        </button>
      </div>

      {/* Select Dropdowns */}
      <div className="flex flex-col gap-2 relative z-20">
        <div className="relative">
          <select
            value={artwork.status}
            onChange={handleStatusChange}
            disabled={isUpdating || isDeleting}
            className="w-full appearance-none bg-white border border-gray-200 text-gray-700 text-xs rounded-xl py-2 pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-gray-900 cursor-pointer"
          >
            <option value="Available">Available</option>
            <option value="For Sale">For Sale</option>
            <option value="Not for sale">Not for sale</option>
            <option value="Sold">Sold</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={artwork.collection || 'none'}
            onChange={handleCollectionChange}
            disabled={isUpdating || isDeleting}
            className="w-full appearance-none bg-white border border-gray-200 text-gray-700 text-xs rounded-xl py-2 pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-gray-900 cursor-pointer"
          >
            <option value="none">No Collection</option>
            <option value="Monsoon Studies">Monsoon Studies</option>
            <option value="Urban Silence">Urban Silence</option>
            <option value="Fragments of Memory">Fragments of Memory</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

    </div>
  );
}
