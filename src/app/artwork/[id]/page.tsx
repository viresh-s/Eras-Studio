import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
<<<<<<< HEAD
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ExpressInterestButton from '@/components/features/artwork/ExpressInterestButton';
import SaveArtworkButton from '@/components/features/artwork/SaveArtworkButton';
import ArtworkImageGallery from '@/components/features/artwork/ArtworkImageGallery';
import ExpandableDescription from '@/components/features/artwork/ExpandableDescription';
=======
import ArtworkDiscoveryDetail from '@/components/features/artwork/ArtworkDiscoveryDetail';
>>>>>>> cfd4433 (Updated regarding COR)

interface ArtworkPageProps {
  params: Promise<{ id: string }>;
}

export default async function ArtworkPage({ params }: ArtworkPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: artwork } = await supabase
    .from('artworks')
    .select(`*, profiles(full_name, profile_pic_url, about_me, portfolio_url)`)
    .eq('id', id)
    .single();

  if (!artwork) notFound();

<<<<<<< HEAD
  const { data: { user } } = await supabase.auth.getUser();
  let userRole = null;
=======
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let userRole: string | null = null;
>>>>>>> cfd4433 (Updated regarding COR)

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
<<<<<<< HEAD
    userRole = profile?.role;
=======
    userRole = profile?.role || null;
>>>>>>> cfd4433 (Updated regarding COR)
  }

  const isOwner = user?.id === artwork.creator_id;
  const canExpress = user && userRole === 'User' && !isOwner;

  let existingChat = null;
  let isSaved = false;
<<<<<<< HEAD
=======

>>>>>>> cfd4433 (Updated regarding COR)
  if (canExpress && user) {
    const { data: chatData } = await supabase
      .from('inquiries_chats')
      .select('id, status, created_at')
      .eq('artwork_id', id)
      .eq('guest_id', user.id)
      .maybeSingle();
<<<<<<< HEAD
    
=======

>>>>>>> cfd4433 (Updated regarding COR)
    existingChat = chatData;

    // Check if artwork is saved (ignore errors if table missing)
    const { data: savedData } = await supabase
      .from('saved_artworks')
      .select('id')
      .eq('artwork_id', id)
      .eq('user_id', user.id)
      .maybeSingle();
<<<<<<< HEAD
      
    isSaved = !!savedData;
  }

  const creator = artwork.profiles as any;

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-[1400px] mx-auto px-6 py-12 lg:py-16">
        
        {/* Back Button */}
        <div className="mb-10">
          <Link 
            href="/discovery" 
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-900 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ArrowLeft size={14} />
            Back to discovery
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          
          {/* Left: Artwork Image Container */}
          <div className="w-full">
            <ArtworkImageGallery 
              primaryImage={artwork.image_url} 
              additionalImages={artwork.additional_images} 
              altText={artwork.title} 
            />
          </div>

          {/* Right: Details */}
          <div className="pt-4 lg:pt-8 w-full max-w-2xl mx-auto">
            
            {/* Header info */}
            <div className="mb-8">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-3">
                {artwork.art_type} | {artwork.year || '2023'}
              </p>
              <h1 className="text-5xl lg:text-6xl text-gray-900 mb-6 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                {artwork.title}
              </h1>
              
              <Link href={`/artist/${artwork.creator_id}`} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors -ml-3">
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600 overflow-hidden">
                  {creator?.profile_pic_url ? (
                    <img src={creator.profile_pic_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    creator?.full_name?.substring(0, 2).toUpperCase() || '?'
                  )}
                </div>
                <span className="text-sm font-semibold text-gray-900">{creator?.full_name}</span>
                <span className="text-gray-400 text-xs ml-1">↗</span>
              </Link>
            </div>

            {/* Expandable Description */}
            <ExpandableDescription text={artwork.description || ''} />

            {/* Metadata Table */}
            <div className="border-t border-gray-200/60 mb-12">
              {[
                { label: 'Medium', value: artwork.style || artwork.art_type },
                { label: 'Dimensions', value: artwork.dimensions || 'Contact for details' },
                { label: 'Year', value: artwork.year },
                { label: 'Location', value: artwork.location || 'Not specified' },
                { label: 'Collection', value: artwork.collection || artwork.title },
                { label: 'Availability', value: artwork.status },
              ].map((item, idx) => (
                <div key={idx} className="flex py-3.5 border-b border-gray-200/60 text-[13px]">
                  <div className="w-1/3 text-gray-500">{item.label}</div>
                  <div className="w-2/3 text-gray-900 font-medium">{item.value}</div>
                </div>
              ))}
            </div>

            {/* Price & Actions */}
            <div>
              <p className="text-lg font-bold text-gray-900 mb-5">
                {artwork.price_visibility === 'Hidden' ? 'Price on request' : (artwork.price ? `$${artwork.price.toLocaleString()}` : 'Price on request')}
              </p>
              
              <div className="flex flex-wrap items-center gap-3 mb-6">
                {canExpress ? (
                  <div className="w-auto">
                    <ExpressInterestButton
                      artworkId={artwork.id}
                      creatorId={artwork.creator_id}
                      userId={user.id}
                      initialChatId={existingChat?.id}
                      initialStatus={existingChat?.status}
                      initialCreatedAt={existingChat?.created_at}
                    />
                  </div>
                ) : !user ? (
                  <Link
                    href="/login"
                    className="px-6 py-3 bg-gray-900 text-white rounded-full text-sm font-semibold hover:bg-gray-800 transition-colors"
                  >
                    Sign in to Express Interest →
                  </Link>
                ) : null}

                <Link 
                  href={`/artist/${artwork.creator_id}`}
                  className="px-6 py-3 bg-white border border-gray-200 text-gray-900 rounded-full text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm"
                >
                  View Creator
                </Link>
                
                {user && !isOwner && (
                  <SaveArtworkButton 
                    artworkId={artwork.id} 
                    initialIsSaved={isSaved} 
                    userId={user.id} 
                  />
                )}
              </div>

              <p className="text-[11px] text-gray-500 leading-relaxed max-w-sm">
                A direct connection, not a checkout. Pricing and any expenses are discussed privately with the creator.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
=======

    isSaved = !!savedData;
  }

  return (
    <ArtworkDiscoveryDetail
      artwork={artwork}
      currentUser={user ? { id: user.id } : null}
      userRole={userRole}
      existingChat={existingChat}
      isSaved={isSaved}
    />
>>>>>>> cfd4433 (Updated regarding COR)
  );
}
