'use client';

import { useState } from 'react';
import ArtworkGridCard from '@/components/features/creator/ArtworkGridCard';
import { CollectionItem } from '@/actions/collectionActions';
import { ArrowLeft, Folder, Layers, Sparkles } from 'lucide-react';

interface ProfileTabsProps {
  artworks: any[];
  profile: any;
  collections?: CollectionItem[];
}

export default function ProfileTabs({ artworks, profile, collections = [] }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState('works');
  const [selectedCollection, setSelectedCollection] = useState<CollectionItem | null>(null);

  const tabs = [
    { id: 'works', label: 'Selected Works' },
    { id: 'collection', label: 'Collections' },
    { id: 'about', label: 'About' },
  ];

  // If user switches tab, reset selected collection
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSelectedCollection(null);
  };

  // Filter artworks for the active selected collection view
  const activeCollectionArtworks = selectedCollection
    ? artworks.filter(
        (a) =>
          a.collection_id === selectedCollection.id ||
          (a.collection && a.collection.trim().toLowerCase() === selectedCollection.title.trim().toLowerCase())
      )
    : [];

  return (
    <div style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}>
      {/* Tab Headers */}
      <div className="flex items-center gap-2 mb-10 border-b border-transparent">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`px-6 py-2.5 text-xs font-normal rounded-full transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#1A1A1A] text-white shadow-xs'
                : 'bg-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content: Selected Works */}
      {activeTab === 'works' && (
        <div>
          {artworks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {artworks.map((artwork) => (
                <ArtworkGridCard key={artwork.id} artwork={artwork} creatorName={profile.full_name} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-500 text-sm font-normal">No artworks published yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Collections */}
      {activeTab === 'collection' && (
        <div>
          {selectedCollection ? (
            /* Single Collection Deep-View */
            <div>
              {/* Back button and Collection Details */}
              <div className="mb-8">
                <button
                  onClick={() => setSelectedCollection(null)}
                  className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors mb-4 font-normal cursor-pointer"
                >
                  <ArrowLeft size={14} /> Back to all collections
                </button>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-gray-100 pb-5">
                  <div>
                    <h2
                      className="text-3xl font-serif italic font-normal text-gray-900 tracking-tight"
                      style={{
                        fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif",
                        fontStyle: 'italic',
                      }}
                    >
                      {selectedCollection.title}
                    </h2>
                    {selectedCollection.description && (
                      <p className="text-xs text-gray-600 font-normal mt-2 max-w-2xl leading-relaxed">
                        {selectedCollection.description}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 font-normal shrink-0">
                    {activeCollectionArtworks.length}{' '}
                    {activeCollectionArtworks.length === 1 ? 'Artwork' : 'Artworks'}
                  </span>
                </div>
              </div>

              {/* Artworks in this Collection */}
              {activeCollectionArtworks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {activeCollectionArtworks.map((artwork) => (
                    <ArtworkGridCard key={artwork.id} artwork={artwork} creatorName={profile.full_name} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-gray-50/60 rounded-3xl border border-gray-100">
                  <p className="text-gray-500 text-xs font-normal">
                    No published artworks currently assigned to this collection.
                  </p>
                </div>
              )}
            </div>
          ) : collections.length > 0 ? (
            /* Grid of Collection Cards */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map((col) => {
                const count = artworks.filter(
                  (a) =>
                    a.collection_id === col.id ||
                    (a.collection && a.collection.trim().toLowerCase() === col.title.trim().toLowerCase())
                ).length;

                return (
                  <div
                    key={col.id}
                    onClick={() => setSelectedCollection(col)}
                    className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col"
                  >
                    {/* Cover Preview */}
                    <div className="h-48 bg-gray-100 relative overflow-hidden">
                      {col.cover_image_url ? (
                        <img
                          src={col.cover_image_url}
                          alt={col.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400">
                          <Folder size={36} className="opacity-40" />
                        </div>
                      )}
                      <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-xs text-white text-[11px] font-normal px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                        <Layers size={11} />
                        <span>
                          {count} {count === 1 ? 'Artwork' : 'Artworks'}
                        </span>
                      </div>
                    </div>

                    {/* Card Info */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3
                          className="text-xl font-serif italic font-normal text-gray-900 tracking-tight mb-1.5 group-hover:text-[#2356FF] transition-colors"
                          style={{
                            fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif",
                            fontStyle: 'italic',
                          }}
                        >
                          {col.title}
                        </h3>
                        {col.description ? (
                          <p className="text-xs text-gray-600 line-clamp-2 font-normal leading-relaxed">
                            {col.description}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 font-normal italic">Series Collection</p>
                        )}
                      </div>
                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-normal">
                        <span className="text-[11px] text-[#2356FF]">Explore Collection &rarr;</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-16 bg-gray-50/50 rounded-3xl border border-gray-100">
              <Folder size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500 text-sm font-normal">No collections published yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: About */}
      {activeTab === 'about' && (
        <div className="max-w-2xl">
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            {profile.about_me && (
              <div className="mb-6">
                <h3 className="text-xs font-normal tracking-[0.15em] text-gray-400 uppercase mb-2">Biography</h3>
                <p className="text-sm text-gray-700 leading-relaxed font-normal">{profile.about_me}</p>
              </div>
            )}
            {profile.artist_statement && (
              <div className="mb-6">
                <h3 className="text-xs font-normal tracking-[0.15em] text-gray-400 uppercase mb-2">
                  Artist Statement
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed font-normal">{profile.artist_statement}</p>
              </div>
            )}
            {!profile.about_me && !profile.artist_statement && (
              <p className="text-gray-500 text-sm font-normal">No details provided yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
