'use client';

import { useState } from 'react';
import ArtworkGridCard from '@/components/features/creator/ArtworkGridCard';

interface ProfileTabsProps {
  artworks: any[];
  profile: any;
}

export default function ProfileTabs({ artworks, profile }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState('works');

  const tabs = [
    { id: 'works', label: 'Creative Works' },
    { id: 'collection', label: 'Collection' },
    { id: 'about', label: 'About' },
  ];

  return (
    <div>
      {/* Tab Headers */}
      <div className="flex items-center gap-2 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2 text-sm font-semibold rounded-full transition-colors ${
              activeTab === tab.id
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
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
              <p className="text-gray-500 text-sm">No artworks published yet.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'collection' && (
        <div className="text-center py-16">
          <p className="text-gray-500 text-sm">No collections yet. Group your works into themed collections.</p>
        </div>
      )}

      {activeTab === 'about' && (
        <div className="max-w-2xl">
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            {profile.about_me && (
              <div className="mb-6">
                <h3 className="text-xs font-semibold tracking-[0.15em] text-gray-400 uppercase mb-2">Biography</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{profile.about_me}</p>
              </div>
            )}
            {profile.artist_statement && (
              <div className="mb-6">
                <h3 className="text-xs font-semibold tracking-[0.15em] text-gray-400 uppercase mb-2">Artist Statement</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{profile.artist_statement}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-6">
              {profile.primary_medium && (
                <div>
                  <h3 className="text-xs font-semibold tracking-[0.15em] text-gray-400 uppercase mb-1">Medium</h3>
                  <p className="text-sm text-gray-900 font-medium">{profile.primary_medium}</p>
                </div>
              )}
              {(profile.location_city || profile.location_country) && (
                <div>
                  <h3 className="text-xs font-semibold tracking-[0.15em] text-gray-400 uppercase mb-1">Location</h3>
                  <p className="text-sm text-gray-900 font-medium">
                    {[profile.location_city, profile.location_country].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}
              {profile.art_forms && (
                <div>
                  <h3 className="text-xs font-semibold tracking-[0.15em] text-gray-400 uppercase mb-1">Art Forms</h3>
                  <p className="text-sm text-gray-900 font-medium">{profile.art_forms}</p>
                </div>
              )}
              {profile.awards && (
                <div>
                  <h3 className="text-xs font-semibold tracking-[0.15em] text-gray-400 uppercase mb-1">Awards</h3>
                  <p className="text-sm text-gray-900 font-medium">{profile.awards}</p>
                </div>
              )}
            </div>
            {/* Social links */}
            {(profile.portfolio_url || profile.social_links?.instagram || profile.social_links?.twitter) && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-xs font-semibold tracking-[0.15em] text-gray-400 uppercase mb-3">Links</h3>
                <div className="flex flex-wrap gap-3">
                  {profile.portfolio_url && (
                    <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-gray-900 underline">
                      Portfolio
                    </a>
                  )}
                  {profile.social_links?.instagram && (
                    <a href={`https://instagram.com/${profile.social_links.instagram}`} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-gray-900 underline">
                      Instagram
                    </a>
                  )}
                  {profile.social_links?.twitter && (
                    <a href={`https://twitter.com/${profile.social_links.twitter}`} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-gray-900 underline">
                      Twitter
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
