import { createClient, getAuthenticatedUser, getAuthenticatedProfile } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import ArtworkGridCard from '@/components/features/creator/ArtworkGridCard';
import ArtworkCardActions from '@/components/features/creator/ArtworkCardActions';
import RestrictedUploadAction from './components/RestrictedUploadAction';
import { getCreatorCollections } from '@/actions/collectionActions';

import { evaluateFreemiumStatus } from '@/lib/freemium/check';

export default async function CreatorDashboard() {
  const user = await getAuthenticatedUser();
  if (!user) redirect('/login');

  const supabase = await createClient();

  // Fetch profile via request cache (shared with DashboardLayout) and remaining counts in parallel
  const [
    profile,
    { count: artworkCount },
    { count: chatCount },
    { data: artworks },
    collections,
  ] = await Promise.all([
    getAuthenticatedProfile(user.id),
    supabase.from('artworks').select('*', { count: 'exact', head: true }).eq('creator_id', user.id),
    supabase.from('inquiries_chats').select('*', { count: 'exact', head: true }).eq('creator_id', user.id),
    supabase
      .from('artworks')
      .select('*')
      .eq('creator_id', user.id)
      .eq('is_published', true)
      .order('created_at', { ascending: false }),
    getCreatorCollections(user.id),
  ]);

  const freemiumStatus = evaluateFreemiumStatus(profile, artworkCount || 0);

  // Calculate profile completeness matching EditProfileForm dossier fields
  const profileFields = [
    Boolean(profile?.full_name),
    Boolean(profile?.profile_pic_url),
    Boolean(profile?.location_city || profile?.location_country),
    Boolean(profile?.primary_medium),
    Boolean(profile?.about_me || profile?.artist_statement),
    Boolean(profile?.artist_bio_file_url),
    Boolean(profile?.cv_file_url),
    Boolean(profile?.artist_statement_file_url),
    Boolean(profile?.short_portfolio_file_url),
    Boolean(profile?.long_portfolio_file_url || profile?.portfolio_url),
    Boolean(profile?.top_artworks_drive_url),
  ];
  const filledFields = profileFields.filter(Boolean).length;
  const completeness = Math.round((filledFields / profileFields.length) * 100);

  const isLimited = freemiumStatus.isLocked;

  return (
    <div style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}>
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1
              className="text-4xl font-serif italic font-semibold text-[var(--color-cor-ink)] tracking-tight"
              style={{ fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif", fontStyle: 'italic' }}
            >
              Portfolio Work
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-4 sm:mt-0">
            <Link
              href={`/artist/${profile?.id}`}
              style={{
                position: 'relative',
                background: '#181A1F',
                overflow: 'hidden',
                borderRadius: 40,
              }}
              className="px-8 py-3.5 sm:px-10 sm:py-4 inline-flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 hover:bg-black active:scale-[0.98] shadow-md select-none"
            >
              <span
                style={{
                  color: 'white',
                  fontSize: 15,
                  fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                  fontWeight: '400',
                  lineHeight: '24px',
                }}
                className="flex items-center gap-2 relative z-10"
              >
                <Eye size={17} className="text-white" />
                <span>Preview Profile</span>
              </span>
            </Link>
            <RestrictedUploadAction 
              isLimited={isLimited} 
              label="Add Artwork" 
              variant="gradient"
            />
          </div>
        </div>
      </div>

      {/* Profile Completion Progress Bar - Compact Sleek Capsule */}
      {completeness < 100 && (
        <div className="bg-white rounded-full border border-[#EBEBE6] px-3.5 py-2 sm:px-5 sm:py-2.5 mb-6 flex items-center justify-between gap-3 sm:gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
            <span className="text-[11px] sm:text-xs font-normal text-gray-700 whitespace-nowrap">
              Profile Completeness
            </span>
            <div className="flex-1 max-w-[140px] sm:max-w-xs bg-blue-100/60 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: `${completeness}%`,
                  background: 'linear-gradient(90deg, #082779 0%, #1345EE 62%, #458CFF 100%)',
                }}
              />
            </div>
            <span className="text-[11px] sm:text-xs font-medium text-[#1345EE] shrink-0">
              {completeness}%
            </span>
          </div>

          <Link
            href="/profile"
            className="h-7 px-3 sm:h-7.5 sm:px-3.5 inline-flex items-center justify-center rounded-full bg-[#181A1F] text-white text-[11px] sm:text-xs font-normal hover:bg-black active:scale-[0.98] transition-all shrink-0 select-none shadow-xs"
          >
            Edit Profile
          </Link>
        </div>
      )}

      {/* Sleek, Compact Filter Buttons (Capsule pill, white background, ERAS blue gradient border & text, smooth hover) */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 mb-8">
        {[
          { id: 'published', label: 'Published Artworks', count: artworkCount || 0, href: '#your-works', isActive: true },
          { id: 'collections', label: 'Collections', count: collections?.length || 0, href: '/portfolio/collections', isActive: false },
          { id: 'views', label: 'Profile Views', count: 0, href: profile?.id ? `/artist/${profile.id}` : '#', isActive: false },
          { id: 'shortlisted', label: 'Shortlisted', count: chatCount || 0, href: '/messages', isActive: false },
        ].map((stat) => {
          const isActive = stat.isActive;

          return (
            <Link
              key={stat.id}
              href={stat.href}
              style={
                isActive
                  ? {
                      background:
                        'linear-gradient(#ffffff, #ffffff) padding-box, linear-gradient(90deg, #082779 0%, #1345EE 62%, #458CFF 100%) border-box',
                      border: '1.5px solid transparent',
                      boxShadow:
                        '0px 3px 12px rgba(35, 77, 255, 0.12), 0px 1px 3px rgba(35, 77, 255, 0.08)',
                    }
                  : {
                      background: '#FFFFFF',
                      border: '1.5px solid #EBEBE6',
                    }
              }
              className={`relative h-9 px-3.5 sm:px-4 inline-flex items-center gap-2 rounded-full text-left transition-all duration-200 cursor-pointer select-none group box-border shrink-0 ${
                isActive
                  ? 'shadow-xs'
                  : 'hover:border-[#2356FF] hover:shadow-[0_2px_10px_rgba(35,77,255,0.08)] active:scale-[0.98]'
              }`}
            >
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
                className={`text-xs font-normal tracking-wide transition-colors ${
                  isActive ? 'font-medium' : 'text-gray-700 group-hover:text-[#2356FF]'
                }`}
              >
                {stat.label}
              </span>

              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-medium transition-colors ${
                  isActive
                    ? 'bg-[#EEF2FF] text-[#1345EE]'
                    : 'bg-[#F4F4F0] text-gray-500 group-hover:bg-[#EEF2FF] group-hover:text-[#2356FF]'
                }`}
              >
                {stat.count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Your Works Section */}
      <div className="mb-8" id="your-works">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2
              className="text-2xl font-serif italic font-normal text-[var(--color-cor-ink)] tracking-tight"
              style={{ fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif", fontStyle: 'italic' }}
            >
              Your works
            </h2>
          </div>
          <Link
            href="/portfolio/collections"
            className="px-4 py-2 text-sm font-normal text-[var(--color-cor-ink)] bg-[var(--color-cor-surface)] border border-[var(--color-cor-border)] rounded-full hover:bg-[#F4F4ED] transition-colors"
          >
            Manage Collections
          </Link>
        </div>

        {artworks && artworks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {artworks.map((artwork) => (
              <ArtworkGridCard key={artwork.id} artwork={artwork} creatorName={profile?.full_name}>
                <ArtworkCardActions artwork={artwork} userId={user.id} />
              </ArtworkGridCard>
            ))}
          </div>
        ) : (
          <div className="bg-[var(--color-cor-surface)] rounded-3xl border border-[var(--color-cor-border)] p-16 text-center">
            <p
              className="font-serif italic font-normal text-[var(--color-cor-ink)] text-xl mb-6"
              style={{ fontFamily: "'Century Schoolbook', Century, 'TeX Gyre Schola', Georgia, serif", fontStyle: 'italic' }}
            >
              No artworks yet
            </p>
            <RestrictedUploadAction 
              isLimited={isLimited} 
              label="Upload Your First Artwork"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[var(--color-cor-ink)] text-white rounded-full text-sm font-normal hover:bg-[#2A2A28] transition-all" 
            />
          </div>
        )}
      </div>
    </div>
  );
}
