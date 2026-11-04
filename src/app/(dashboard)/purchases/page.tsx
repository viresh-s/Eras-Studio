import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PurchasesClient, {
  FormattedAcquisition,
  SavedArtwork,
} from '@/components/features/collector/PurchasesClient';

export const dynamic = 'force-dynamic';

interface InquiryArtwork {
  id?: string;
  title?: string;
  image_url?: string;
  price?: number | null;
  status?: string;
  art_type?: string | null;
  artist_name?: string | null;
  profiles?: {
    full_name?: string | null;
    profile_pic_url?: string | null;
  } | null;
}

interface RawSavedArtworkRecord {
  id?: string;
  title?: string;
  image_url?: string;
  art_type?: string | null;
  artist_name?: string | null;
  status?: string | null;
  profiles?: {
    full_name?: string | null;
    profile_pic_url?: string | null;
  } | null;
}

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

  const savedArtworks: SavedArtwork[] = [];
  (savedItems || []).forEach((item) => {
    const art = (Array.isArray(item.artworks) ? item.artworks[0] : item.artworks) as RawSavedArtworkRecord | null;
    if (art && art.id && art.image_url) {
      savedArtworks.push({
        id: art.id,
        title: art.title || 'Untitled',
        image_url: art.image_url,
        art_type: art.art_type ?? null,
        artist_name: art.artist_name ?? null,
        status: art.status ?? 'Available',
        profiles: art.profiles
          ? {
              full_name: art.profiles.full_name ?? null,
              profile_pic_url: art.profiles.profile_pic_url ?? null,
            }
          : null,
      });
    }
  });

  // Format data safely for client
  const formattedAcquisitions: FormattedAcquisition[] = (inquiries || [])
    .filter((inq) => Boolean(inq.artworks))
    .map((inq) => {
      const artwork = inq.artworks as InquiryArtwork | null;
      return {
        id: inq.id,
        artworkId: artwork?.id || '',
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
