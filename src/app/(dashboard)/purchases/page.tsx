import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PurchasesClient from '@/components/features/collector/PurchasesClient';

export const dynamic = 'force-dynamic';

export default async function PurchasesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch inquiries to use as "acquisitions" for the demo
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
        profiles (
          full_name
        )
      )
    `)
    .eq('guest_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch saved artworks
  const { data: savedItems } = await supabase
    .from('saved_artworks')
    .select(`
      artwork_id,
      artworks (
        *,
        profiles!artworks_creator_id_fkey (full_name)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const savedArtworks = savedItems?.map(item => item.artworks).filter(Boolean) || [];

  // Format data for the client
  const formattedAcquisitions = (inquiries || []).map(inq => {
    const artwork = inq.artworks as any;
    return {
      id: inq.id,
      artworkId: artwork.id,
      title: artwork.title,
      imageUrl: artwork.image_url,
      price: artwork.price,
      creatorName: artwork.profiles?.full_name || 'Unknown Artist',
      createdAt: inq.created_at,
      // Default mock status for the demo
      initialStatus: 'Interest Raised',
      dbStatus: inq.status
    };
  });

  return (
    <div>
      <PurchasesClient 
        initialAcquisitions={formattedAcquisitions} 
        savedArtworks={savedArtworks} 
      />
    </div>
  );
}
