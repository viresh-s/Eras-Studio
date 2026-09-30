import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Badge from '@/components/ui/Badge';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, User } from 'lucide-react';
import ExpressInterestButton from '@/components/features/artwork/ExpressInterestButton';

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

  const { data: { user } } = await supabase.auth.getUser();
  let userRole = null;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    userRole = profile?.role;
  }

  const isOwner = user?.id === artwork.creator_id;
  const canExpress = user && userRole === 'User' && !isOwner;

  return (
    <div className="min-h-screen bg-white">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/browse" className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft size={16} />
            Back to Gallery
          </Link>
          <Link href="/" className="text-lg font-extrabold tracking-tight text-gray-900">
            Eras Studio
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Image */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_20px_rgb(0,0,0,0.04)]">
            <div className="aspect-square bg-gray-50 overflow-hidden">
              <img
                src={artwork.image_url}
                alt={artwork.title}
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <Badge variant="green" className="mb-3">{artwork.art_type}</Badge>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 mb-2">{artwork.title}</h1>
              <p className="text-gray-500 text-lg">by {artwork.artist_name}</p>
            </div>

            {artwork.price && (
              <div className="bg-gray-50 rounded-2xl p-5 inline-block">
                <p className="text-3xl font-extrabold text-gray-900">${artwork.price}</p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Badge variant={artwork.status === 'Available' ? 'green' : 'red'}>
                {artwork.status}
              </Badge>
            </div>

            {artwork.description && (
              <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgb(0,0,0,0.04)] p-6">
                <h3 className="font-bold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-500 leading-relaxed text-sm">{artwork.description}</p>
              </div>
            )}

            {artwork.external_link && (
              <a
                href={artwork.external_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                <ExternalLink size={16} />
                View Related Link
              </a>
            )}

            {/* Creator Info */}
            <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgb(0,0,0,0.04)] p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-400 to-orange-300 flex items-center justify-center overflow-hidden shadow-sm">
                  {(artwork.profiles as Record<string, string>)?.profile_pic_url ? (
                    <img
                      src={(artwork.profiles as Record<string, string>).profile_pic_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={22} className="text-white" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-gray-900">
                    {(artwork.profiles as Record<string, string>)?.full_name}
                  </p>
                  {(artwork.profiles as Record<string, string>)?.portfolio_url && (
                    <a
                      href={(artwork.profiles as Record<string, string>).portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-coral text-sm font-medium hover:underline"
                    >
                      View Portfolio →
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Express Interest */}
            {canExpress && (
              <ExpressInterestButton
                artworkId={artwork.id}
                creatorId={artwork.creator_id}
                userId={user.id}
              />
            )}

            {!user && (
              <Link
                href="/login"
                className="block w-full text-center px-6 py-3.5 bg-gray-900 text-white rounded-full font-semibold hover:bg-gray-800 transition-all hover:scale-[1.02]"
              >
                Sign In to Express Interest
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
