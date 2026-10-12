import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { Plus, Eye } from 'lucide-react';
import ArtworkGridCard from '@/components/features/creator/ArtworkGridCard';
import ArtworkCardActions from '@/components/features/creator/ArtworkCardActions';
import RestrictedUploadAction from './components/RestrictedUploadAction';

export default async function CreatorDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch stats
  const { count: artworkCount } = await supabase
    .from('artworks')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', user.id);

  const { count: chatCount } = await supabase
    .from('inquiries_chats')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', user.id);

  const { data: artworks } = await supabase
    .from('artworks')
    .select('*')
    .eq('creator_id', user.id)
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  // Calculate profile completeness
  const profileFields = [
    profile?.full_name, profile?.about_me, profile?.location_city,
    profile?.portfolio_url, profile?.profile_pic_url,
  ];
  const filledFields = profileFields.filter(Boolean).length;
  const completeness = Math.round((filledFields / profileFields.length) * 100);

  const { checkFreemiumStatus } = await import('@/lib/freemium/check');
  const freemiumStatus = await checkFreemiumStatus(user.id);
  const isLimited = freemiumStatus.isLocked;

  console.log('[DEBUG Limits]', {
    isPremium: profile?.is_premium,
    profileCreatedAt: profile?.created_at,
    isLimited,
    reason: freemiumStatus.reason
  });

  return (
    <div>
      {/* Header Section */}
      <div className="mb-8">
        <p className="text-xs font-semibold tracking-[0.2em] text-[var(--color-cor-ink-light)] uppercase mb-2">
          Your Creative Workspace
        </p>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-serif font-semibold text-[var(--color-cor-ink)] tracking-tight mb-1">My Portfolio</h1>
            <p className="text-[var(--color-cor-ink-light)] text-sm">Make space for the work that matters.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-4 sm:mt-0">
            <Link
              href={`/artist/${profile?.id}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-cor-surface)] border border-[var(--color-cor-border)] text-[var(--color-cor-ink)] rounded-full text-xs uppercase tracking-[0.08em] font-medium hover:bg-[#F4F4ED] hover:border-[var(--color-cor-ink)] transition-all shadow-none"
            >
              <Eye size={15} />
              Preview Profile
            </Link>
            <RestrictedUploadAction 
              isLimited={isLimited} 
              label="Add Artwork" 
            />
          </div>
        </div>
      </div>

      {/* Profile Completion Bar */}
      {completeness < 100 && (
        <div className="bg-[var(--color-cor-surface)] rounded-3xl border border-[var(--color-cor-border)] p-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--color-cor-ink)]">Your profile is {completeness}% complete</p>
            <p className="text-xs text-[var(--color-cor-ink-light)] mt-0.5">A little more about you makes a lasting impression.</p>
          </div>
          <Link
            href="/profile"
            className="px-4 py-2 text-sm font-semibold text-[var(--color-cor-ink)] bg-[var(--color-cor-surface)] border border-[var(--color-cor-border)] rounded-full hover:bg-[#F4F4ED] transition-colors whitespace-nowrap"
          >
            Edit Profile →
          </Link>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="bg-[var(--color-cor-surface)] rounded-3xl border border-[var(--color-cor-border)] p-5">
          <p className="text-[11px] font-semibold tracking-[0.15em] text-[var(--color-cor-ink-light)] uppercase mb-3">Published Artworks</p>
          <p className="text-3xl font-serif font-semibold text-[var(--color-cor-ink)]">{artworkCount || 0}</p>
          <p className="text-xs text-[var(--color-cor-ink-light)] mt-1">Pieces listed</p>
        </div>
        <div className="bg-[var(--color-cor-surface)] rounded-3xl border border-[var(--color-cor-border)] p-5">
          <p className="text-[11px] font-semibold tracking-[0.15em] text-[var(--color-cor-ink-light)] uppercase mb-3">Collections</p>
          <p className="text-3xl font-serif font-semibold text-[var(--color-cor-ink)]">0</p>
          <p className="text-xs text-[var(--color-cor-ink-light)] mt-1">Curated sets</p>
        </div>
        <div className="bg-[var(--color-cor-surface)] rounded-3xl border border-[var(--color-cor-border)] p-5">
          <p className="text-[11px] font-semibold tracking-[0.15em] text-[var(--color-cor-ink-light)] uppercase mb-3">Profile Views</p>
          <p className="text-3xl font-serif font-semibold text-[var(--color-cor-ink)]">0</p>
          <p className="text-xs text-[var(--color-cor-ink-light)] mt-1">Visitors</p>
        </div>
        <div className="bg-[var(--color-cor-surface)] rounded-3xl border border-[var(--color-cor-border)] p-5">
          <p className="text-[11px] font-semibold tracking-[0.15em] text-[var(--color-cor-ink-light)] uppercase mb-3">Shortlisted</p>
          <p className="text-3xl font-serif font-semibold text-[var(--color-cor-ink)]">{chatCount || 0}</p>
          <p className="text-xs text-[var(--color-cor-ink-light)] mt-1">Inquiries</p>
        </div>
      </div>

      {/* Your Works Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-2xl font-serif font-semibold text-[var(--color-cor-ink)]">Your works</h2>
            <p className="text-xs text-[var(--color-cor-ink-light)] mt-0.5">
              {artworkCount || 0} Artworks in total · Portfolio
            </p>
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
            <div className="w-16 h-16 rounded-full bg-[#F4F4ED] flex items-center justify-center mx-auto mb-4">
              <Eye size={24} className="text-[var(--color-cor-ink-light)]" />
            </div>
            <p className="font-serif font-semibold text-[var(--color-cor-ink)] text-lg mb-2">No artworks yet</p>
            <p className="text-[var(--color-cor-ink-light)] text-sm mb-6">Start showcasing your work to the world</p>
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
