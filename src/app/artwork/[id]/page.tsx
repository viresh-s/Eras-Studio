import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Card from '@/components/ui/Card';
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
    <div className="min-h-screen bg-brand-offwhite">
      {/* Top Bar */}
      <div className="border-b-4 border-brand-black bg-white px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/browse" className="flex items-center gap-2 font-heading font-semibold hover:text-brand-blue">
            <ArrowLeft size={18} />
            Back to Gallery
          </Link>
          <Link href="/" className="font-heading text-xl font-bold">
            ERAS<span className="text-brand-yellow">.</span>
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image */}
          <Card padding="none">
            <div className="aspect-square bg-brand-lightgray overflow-hidden">
              <img
                src={artwork.image_url}
                alt={artwork.title}
                className="w-full h-full object-contain"
              />
            </div>
          </Card>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <Badge variant="green" className="mb-3">{artwork.art_type}</Badge>
              <h1 className="font-heading text-4xl font-bold mb-2">{artwork.title}</h1>
              <p className="text-brand-gray text-lg">by {artwork.artist_name}</p>
            </div>

            {artwork.price && (
              <div className="border-4 border-brand-black bg-brand-yellow p-4 shadow-brutal inline-block">
                <p className="font-heading text-3xl font-bold">${artwork.price}</p>
              </div>
            )}

            <div className="border-3 border-brand-black p-4 bg-white">
              <Badge variant={artwork.status === 'Available' ? 'green' : 'red'} className="mb-2">
                {artwork.status}
              </Badge>
            </div>

            {artwork.description && (
              <Card>
                <h3 className="font-heading font-bold mb-2">Description</h3>
                <p className="text-brand-gray leading-relaxed">{artwork.description}</p>
              </Card>
            )}

            {artwork.external_link && (
              <a
                href={artwork.external_link}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-brutal btn-brutal-blue inline-flex"
              >
                <ExternalLink size={18} />
                View Related Link
              </a>
            )}

            {/* Creator Info */}
            <Card>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 border-3 border-brand-black bg-brand-pink flex items-center justify-center overflow-hidden">
                  {(artwork.profiles as Record<string, string>)?.profile_pic_url ? (
                    <img
                      src={(artwork.profiles as Record<string, string>).profile_pic_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={24} />
                  )}
                </div>
                <div>
                  <p className="font-heading font-bold text-lg">
                    {(artwork.profiles as Record<string, string>)?.full_name}
                  </p>
                  {(artwork.profiles as Record<string, string>)?.portfolio_url && (
                    <a
                      href={(artwork.profiles as Record<string, string>).portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-blue text-sm hover:underline"
                    >
                      View Portfolio →
                    </a>
                  )}
                </div>
              </div>
            </Card>

            {/* Express Interest */}
            {canExpress && (
              <ExpressInterestButton
                artworkId={artwork.id}
                creatorId={artwork.creator_id}
                userId={user.id}
              />
            )}

            {!user && (
              <Link href="/login" className="btn-brutal btn-brutal-lg w-full text-center block">
                Sign In to Express Interest
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
