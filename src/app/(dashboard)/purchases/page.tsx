import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PurchasesClient from '@/components/features/collector/PurchasesClient';

export const dynamic = 'force-dynamic';

export default async function PurchasesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch inquiries to use as "acquisitions"
  const { data: inquiries } = await supabase
    .from('inquiries_chats')
    .select(`
      id,
      status,
      created_at,
      artworks (
        id,
        title,
        image_url,
        price,
        status,
        art_type,
        artist_name,
        profiles (
          full_name,
          profile_pic_url
        )
      )
    `)
    .eq('guest_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch saved artworks with creator profiles
  const { data: savedItems } = await supabase
    .from('saved_artworks')
    .select(`
      artwork_id,
      artworks (
        *,
        profiles!artworks_creator_id_fkey (
          full_name,
          profile_pic_url
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const savedArtworks = savedItems?.map(item => item.artworks).filter(Boolean) || [];

  // Format data safely for client
  const formattedAcquisitions = (inquiries || [])
    .filter(inq => Boolean(inq.artworks))
    .map(inq => {
      const artwork = inq.artworks as any;
      return {
        id: inq.id,
        artworkId: artwork?.id,
        title: artwork?.title || 'Untitled Artwork',
        imageUrl: artwork?.image_url || '',
        price: artwork?.price ?? null,
        status: artwork?.status || 'Available',
        artType: artwork?.art_type || null,
        creatorName: artwork?.profiles?.full_name || artwork?.artist_name || 'Independent Artist',
        creatorAvatar: artwork?.profiles?.profile_pic_url || null,
        createdAt: inq.created_at,
        initialStatus: 'Interest Raised',
        dbStatus: inq.status || 'Active',
      };
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <PurchasesClient 
        initialAcquisitions={formattedAcquisitions} 
        savedArtworks={savedArtworks} 
      />
    </div>
  );
}
