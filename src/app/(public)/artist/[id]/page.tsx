import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ProfileTabs from '@/components/features/creator/ProfileTabs';
import { Mail, MapPin } from 'lucide-react';

export default async function ArtistProfilePage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  // Fetch the artist profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!profile || profile.role !== 'Creator') {
    notFound();
  }

  // Fetch their published artworks
  const { data: artworks } = await supabase
    .from('artworks')
    .select('*')
    .eq('user_id', params.id)
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
        
        {/* Cover Image (Rounded, not full width) */}
        <div className="h-64 md:h-80 rounded-2xl bg-gradient-to-br from-[#2C4A5A] to-[#4A6670] relative overflow-hidden shadow-sm">
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
              <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 800 300">
                <path d="M0,150 Q200,50 400,150 T800,150" fill="none" stroke="white" strokeWidth="2" />
                <path d="M0,180 Q200,80 400,180 T800,180" fill="none" stroke="white" strokeWidth="1.5" />
                <path d="M0,120 Q200,20 400,120 T800,120" fill="none" stroke="white" strokeWidth="1" />
              </svg>
            </div>
          )}
        </div>

        {/* Centered Avatar */}
        <div className="relative -mt-12 flex justify-center z-10">
          <div className="w-24 h-24 rounded-full border-4 border-[#f4f5f5] bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-600 overflow-hidden shadow-sm">
            {profile.profile_pic_url ? (
              <img src={profile.profile_pic_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              getInitials(profile.full_name)
            )}
          </div>
        </div>

        {/* Centered Info */}
        <div className="text-center mt-4 mb-12">
          <p className="text-[10px] text-gray-500 font-medium uppercase tracking-[0.2em] mb-2">
            {profile.primary_medium || 'Artist'} 
            {profile.location_city && ` · ${profile.location_city}`}
          </p>
          
          <h1 className="text-4xl sm:text-5xl font-heading text-gray-900 mb-4 tracking-tight">
            {profile.full_name}
          </h1>
          
          {profile.about_me && (
            <p className="text-sm text-gray-500 max-w-2xl mx-auto mb-6 leading-relaxed">
              {profile.about_me}
            </p>
          )}

          <div className="flex justify-center items-center gap-3">
             <span className="px-4 py-1.5 text-xs font-semibold rounded-full bg-white border border-gray-200 text-gray-700 shadow-sm">
               Pro Creator
             </span>
             {isOwner ? (
               <a href="/profile" className="px-4 py-1.5 text-xs font-semibold rounded-full bg-white border border-gray-200 text-gray-900 shadow-sm hover:bg-gray-50 transition-colors">
                 Edit Profile
               </a>
             ) : (
               <button className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-full bg-gray-900 text-white shadow-sm hover:bg-gray-800 transition-colors">
                 <Mail size={12} /> Contact
               </button>
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
