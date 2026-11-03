import { createClient, getAuthenticatedUser, getAuthenticatedProfile } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import ArtworkGridCard from '@/components/features/creator/ArtworkGridCard';
import ArtworkCardActions from '@/components/features/creator/ArtworkCardActions';
import RestrictedUploadAction from './components/RestrictedUploadAction';

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
    <div>
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
                  fontWeight: '600',
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

      {/* Profile Completion Progress Bar */}
      {completeness < 100 && (
        <div className="bg-[var(--color-cor-surface)] rounded-3xl border border-[var(--color-cor-border)] p-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-2xs">
          <div className="flex-1 max-w-xl">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-[var(--color-cor-ink)]">
                Profile Completeness
              </span>
              <span className="text-xs font-semibold text-[var(--color-cor-ink)]">
                {completeness}%
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-blue-100/70 rounded-full h-2 overflow-hidden">
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${completeness}%`,
                  background: 'linear-gradient(90deg, #082779 0%, #1345EE 62%, #458CFF 100%)',
                }}
              />
            </div>
          </div>
          <Link
            href="/profile"
            style={{
              position: 'relative',
              background: '#F3F3F3',
              overflow: 'hidden',
              borderRadius: 42.35,
            }}
            className="px-7 py-3 sm:px-8 sm:py-3.5 inline-flex items-center justify-center transition-all duration-200 hover:bg-[#EAEAEA] active:scale-[0.98] cursor-pointer select-none whitespace-nowrap self-start sm:self-center shrink-0"
          >
            <span
              style={{
                color: '#343434',
                fontSize: 14.82,
                fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
                fontWeight: '600',
                lineHeight: '17.05px',
                wordWrap: 'break-word',
              }}
              className="text-center"
            >
              Edit Profile
            </span>
          </Link>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="bg-[var(--color-cor-surface)] rounded-3xl border border-[var(--color-cor-border)] p-5">
          <p className="text-[11px] font-semibold tracking-[0.15em] text-[var(--color-cor-ink-light)] uppercase mb-2">Published Artworks</p>
          <p className="text-3xl font-serif font-semibold text-[var(--color-cor-ink)]">{artworkCount || 0}</p>
        </div>
        <div className="bg-[var(--color-cor-surface)] rounded-3xl border border-[var(--color-cor-border)] p-5">
          <p className="text-[11px] font-semibold tracking-[0.15em] text-[var(--color-cor-ink-light)] uppercase mb-2">Collections</p>
          <p className="text-3xl font-serif font-semibold text-[var(--color-cor-ink)]">0</p>
        </div>
        <div className="bg-[var(--color-cor-surface)] rounded-3xl border border-[var(--color-cor-border)] p-5">
          <p className="text-[11px] font-semibold tracking-[0.15em] text-[var(--color-cor-ink-light)] uppercase mb-2">Profile Views</p>
          <p className="text-3xl font-serif font-semibold text-[var(--color-cor-ink)]">0</p>
        </div>
        <div className="bg-[var(--color-cor-surface)] rounded-3xl border border-[var(--color-cor-border)] p-5">
          <p className="text-[11px] font-semibold tracking-[0.15em] text-[var(--color-cor-ink-light)] uppercase mb-2">Shortlisted</p>
          <p className="text-3xl font-serif font-semibold text-[var(--color-cor-ink)]">{chatCount || 0}</p>
        </div>
      </div>

      {/* Your Works Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-2xl font-sans font-semibold text-[var(--color-cor-ink)]">Your works</h2>
          </div>
          <Link
            href="/portfolio/artworks"
            className="px-4 py-2 text-sm font-semibold text-[var(--color-cor-ink)] bg-[var(--color-cor-surface)] border border-[var(--color-cor-border)] rounded-full hover:bg-[#F4F4ED] transition-colors"
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
            <p className="font-serif font-semibold text-[var(--color-cor-ink)] text-xl mb-6">No artworks yet</p>
            <RestrictedUploadAction 
              isLimited={isLimited} 
              label="Upload Your First Artwork"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[var(--color-cor-ink)] text-white rounded-full text-sm font-semibold hover:bg-[#2A2A28] transition-all" 
            />
          </div>
        )}
      </div>
    </div>
  );
}
