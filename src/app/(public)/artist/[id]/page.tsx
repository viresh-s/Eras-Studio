import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ProfileTabs from '@/components/features/creator/ProfileTabs';
import { Mail, MapPin } from 'lucide-react';

interface ArtistProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function ArtistProfilePage({ params }: ArtistProfilePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch the artist profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (!profile || profile.role !== 'Creator') {
    notFound();
  }

  // Fetch their published artworks
  const { data: artworks } = await supabase
    .from('artworks')
    .select('*')
    .eq('creator_id', id)
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = user?.id === profile.id;

  return (
    <div className="min-h-screen bg-[#f4f5f5] pb-20">
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

        {/* Centered Avatar */}
        <div className="relative -mt-10 flex justify-center z-10">
          <div className="w-20 h-20 rounded-full bg-[#E5E5E5] flex items-center justify-center text-xl font-bold text-gray-700 overflow-hidden shadow-[0_4px_10px_rgba(0,0,0,0.1)] border-2 border-[#f4f5f5]" style={{ fontFamily: "'Playfair Display', serif" }}>
            {profile.profile_pic_url ? (
              <img src={profile.profile_pic_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              getInitials(profile.full_name)
            )}
          </div>
        </div>

        {/* Centered Info */}
        <div className="text-center mt-6 mb-12 max-w-3xl mx-auto">
          <p className="text-[11px] text-gray-500 font-medium mb-3">
            {profile.primary_medium || 'Artist'} 
            {profile.location_city && ` · ${profile.location_city}`}
          </p>
          
          <h1 className="text-5xl sm:text-6xl text-gray-900 mb-5 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            {profile.full_name}
          </h1>
          
          {profile.about_me && (
            <p className="text-sm text-gray-600 mb-6 leading-relaxed max-w-lg mx-auto">
              {profile.about_me}
            </p>
          )}

          <div className="flex justify-center items-center">
             <span className="px-4 py-1.5 text-[11px] font-semibold rounded-full bg-white border border-gray-200 text-gray-700 shadow-sm">
               Pro Creator
             </span>
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
