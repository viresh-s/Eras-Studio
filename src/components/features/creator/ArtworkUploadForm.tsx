'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Upload, Image, Link as LinkIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { createArtwork } from '@/actions/artworkActions';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import TextArea from '@/components/ui/TextArea';
import Card from '@/components/ui/Card';
import type { FreemiumStatus } from '@/lib/freemium/check';

const artTypes = [
  { value: 'painting', label: 'Painting' },
  { value: 'sculpture', label: 'Sculpture' },
  { value: 'photography', label: 'Photography' },
  { value: 'digital-art', label: 'Digital Art' },
  { value: 'drawing', label: 'Drawing' },
  { value: 'print', label: 'Print' },
  { value: 'mixed-media', label: 'Mixed Media' },
  { value: 'collage', label: 'Collage' },
  { value: 'textile', label: 'Textile Art' },
  { value: 'ceramic', label: 'Ceramic' },
  { value: 'other', label: 'Other' },
];

const uploadSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  artType: z.string().min(1, 'Please select an art type'),
  artistName: z.string().min(2, 'Artist name is required'),
  description: z.string().optional(),
  externalLink: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  price: z.string().optional(),
});

type UploadForm = z.infer<typeof uploadSchema>;

interface UploadFormProps {
  userId: string;
  freemiumStatus: FreemiumStatus;
}

export default function ArtworkUploadForm({ userId, freemiumStatus }: UploadFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UploadForm>({
    resolver: zodResolver(uploadSchema),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const onSubmit = async (data: UploadForm) => {
    if (!selectedFile) {
      setError('Please select an image file');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Upload image to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('artworks')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('artworks')
        .getPublicUrl(fileName);

      // Insert artwork record via Server Action
      await createArtwork({
        userId,
        title: data.title,
        artType: data.artType,
        artistName: data.artistName,
        description: data.description,
        externalLink: data.externalLink,
        imageUrl: urlData.publicUrl,
        price: data.price ? parseFloat(data.price) : null,
      });

      router.push('/creator/artworks');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  if (freemiumStatus.isLocked) {
    return null; // UpgradePrompt handles this case
  }

  return (
    <Card>
      <h2 className="font-heading text-2xl font-bold mb-6">Upload New Artwork</h2>

      {!freemiumStatus.isLocked && freemiumStatus.artworksLimit > 0 && (
        <div className="mb-4 p-3 border-3 border-brand-black bg-brand-yellow">
          <p className="font-heading text-sm font-semibold">
            Free Plan: {freemiumStatus.artworksUsed}/{freemiumStatus.artworksLimit} uploads used
            {freemiumStatus.daysRemaining > 0 && ` · ${freemiumStatus.daysRemaining} days remaining`}
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 border-3 border-brand-red bg-red-50 p-3 text-brand-red text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Image Upload */}
        <div>
          <label className="font-heading font-semibold text-sm uppercase tracking-wide block mb-2">
            Artwork Image *
          </label>
          <div
            className={`border-3 border-dashed border-brand-black p-6 text-center cursor-pointer transition-all hover:bg-brand-lightgray ${
              previewUrl ? 'border-solid' : ''
            }`}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-64 mx-auto border-2 border-brand-black"
                />
                <p className="mt-2 text-sm text-brand-gray">Click to change image</p>
              </div>
            ) : (
              <div>
                <Upload size={48} className="mx-auto mb-3 text-brand-gray" />
                <p className="font-heading font-semibold">Click to upload</p>
                <p className="text-sm text-brand-gray mt-1">PNG, JPG, WEBP up to 10MB</p>
              </div>
            )}
          </div>
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            label="Title *"
            placeholder="Name of the artwork"
            error={errors.title?.message}
            {...register('title')}
          />

          <Select
            label="Type of Art *"
            options={artTypes}
            placeholder="Select art type"
            error={errors.artType?.message}
            {...register('artType')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            label="Artist Name *"
            placeholder="Who created this?"
            error={errors.artistName?.message}
            {...register('artistName')}
          />

          <Input
            label="Price ($)"
            type="number"
            placeholder="0.00"
            error={errors.price?.message}
            {...register('price')}
          />
        </div>

        <TextArea
          label="Description"
          placeholder="Tell collectors about this piece..."
          error={errors.description?.message}
          {...register('description')}
        />

        <div className="relative">
          <Input
            label="Related Link"
            placeholder="https://..."
            error={errors.externalLink?.message}
            {...register('externalLink')}
          />
          <LinkIcon className="absolute right-3 top-9 text-brand-gray" size={18} />
        </div>

        <Button type="submit" fullWidth isLoading={isLoading} variant="pink">
          <Image size={18} />
          Upload Artwork
        </Button>
      </form>
    </Card>
  );
}
