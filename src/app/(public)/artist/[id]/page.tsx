import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ProfileTabs from '@/components/features/creator/ProfileTabs';
import ReportUserButton from '@/components/features/user/ReportUserButton';
import ArtistProfileAvatar from '@/components/features/creator/ArtistProfileAvatar';
import { Sparkles } from 'lucide-react';

interface ArtistProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function ArtistProfilePage({ params }: ArtistProfilePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Concurrently fetch profile, published artworks, and auth user
  const [
    { data: profile },
    { data: artworks },
    { data: { user } }
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle(),
    supabase
      .from('artworks')
      .select('*')
      .eq('creator_id', id)
      .eq('is_published', true)
      .order('created_at', { ascending: false }),
    supabase.auth.getUser(),
  ]);

  if (!profile || profile.role !== 'Creator') {
    notFound();
  }

  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const isOwner = user?.id === profile.id;

  // Determine subscription tier ('pro' | 'lite' | 'free')
  const rawPlan = (profile.plan || '').toLowerCase().trim();
  const isPro = Boolean(profile.is_premium || rawPlan === 'pro' || rawPlan === 'elite');
  const isLite = !isPro && (rawPlan === 'lite' || rawPlan === 'light');

  const tierConfig = isPro
    ? {
        label: 'Pro Creator',
        badgeClass: 'bg-blue-50 border-blue-200 text-blue-700',
        dotClass: 'bg-blue-600',
      }
    : isLite
    ? {
        label: 'Lite Creator',
        badgeClass: 'bg-sky-50 border-sky-200 text-sky-700',
        dotClass: 'bg-sky-500',
      }
    : {
        label: 'Free Creator',
        badgeClass: 'bg-blue-50/70 border-blue-200/80 text-blue-600',
        dotClass: 'bg-blue-400',
      };

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="max-w-[1400px] mx-auto px-6 pt-10">
        
        {/* Cover Image (Rounded, not full width) */}
        <div className="h-48 md:h-64 rounded-[20px] bg-gradient-to-br from-[#2C4A5A] to-[#4A6670] relative overflow-hidden shadow-sm mx-auto max-w-6xl">
          {profile.cover_image_url ? (
            <img
              src={profile.cover_image_url}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0">
              <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-[#C4775A]/50 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-[#2C4A5A]/60 rounded-full blur-2xl" />
            </div>
          )}
        </div>

        {/* Centered Avatar (Enlarged with Click-to-View Pop-up Window) */}
        <div className="relative -mt-16 sm:-mt-18 md:-mt-20 flex justify-center z-10">
          <ArtistProfileAvatar
            profilePicUrl={profile.profile_pic_url}
            fullName={profile.full_name}
            initials={getInitials(profile.full_name)}
          />
        </div>

        {/* Centered Info */}
        <div className="text-center mt-6 mb-12 max-w-3xl mx-auto">
          <p className="text-[11px] text-gray-500 font-medium mb-3 font-sans" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {profile.primary_medium || 'Artist'} 
            {profile.location_city && ` · ${profile.location_city}`}
          </p>
          
          <h1
            className="text-5xl sm:text-6xl text-gray-900 mb-5 tracking-tight font-serif italic"
            style={{ fontFamily: "'Century Schoolbook', Century, serif", fontStyle: 'italic' }}
          >
            {profile.full_name}
          </h1>
          
          {profile.about_me && (
            <p className="text-sm text-gray-600 mb-6 leading-relaxed max-w-lg mx-auto">
              {profile.about_me}
            </p>
          )}

          <div className="flex justify-center items-center gap-3">
             <span
               className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-full border shadow-2xs ${tierConfig.badgeClass}`}
               style={{ fontFamily: "'Poppins', sans-serif" }}
             >
               {isPro ? (
                 <Sparkles size={13} className="text-blue-600 shrink-0" />
               ) : (
                 <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${tierConfig.dotClass}`} />
               )}
               <span>{tierConfig.label}</span>
             </span>
             {user && !isOwner && (
                <ReportUserButton
                  reportedUserId={profile.id}
                  reportedUserName={profile.full_name}
                  currentUserId={user.id}
                  variant="icon-only"
                />
             )}
          </div>
        </div>

        {/* Profile Tabs */}
        <div className="mt-8 max-w-6xl mx-auto">
          <ProfileTabs artworks={artworks || []} profile={profile} />
        </div>
      </div>
    </div>
  );
}
