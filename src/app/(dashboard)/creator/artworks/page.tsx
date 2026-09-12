import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default async function CreatorArtworksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: artworks } = await supabase
    .from('artworks')
    .select('*')
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-3xl font-bold">My Artworks</h1>
        <Link href="/creator/upload" className="btn-brutal">
          <Plus size={18} />
          Upload New
        </Link>
      </div>

      {artworks && artworks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {artworks.map((artwork) => (
            <Link key={artwork.id} href={`/artwork/${artwork.id}`}>
              <Card padding="none" className="cursor-pointer">
                <div className="aspect-[4/3] bg-brand-lightgray border-b-3 border-brand-black overflow-hidden">
                  <img
                    src={artwork.image_url}
                    alt={artwork.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-heading font-bold text-lg truncate">{artwork.title}</h3>
                  <p className="text-brand-gray text-sm mt-1">{artwork.art_type}</p>
                  <div className="flex items-center justify-between mt-3">
                    {artwork.price ? (
                      <span className="font-heading font-bold text-lg">${artwork.price}</span>
                    ) : (
                      <span className="text-brand-gray text-sm">Price on request</span>
                    )}
                    <Badge variant={artwork.status === 'Available' ? 'green' : 'red'}>
                      {artwork.status}
                    </Badge>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <div className="text-center py-12">
            <p className="font-heading text-xl font-bold mb-2">No artworks yet</p>
            <p className="text-brand-gray mb-4">Upload your first artwork to get started</p>
            <Link href="/creator/upload" className="btn-brutal">
              <Plus size={18} /> Upload Artwork
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
