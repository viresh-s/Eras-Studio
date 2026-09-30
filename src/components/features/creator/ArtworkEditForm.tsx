'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Save, Link as LinkIcon, ArrowLeft, Upload, Trash2 } from 'lucide-react';
import { updateArtwork } from '@/actions/artworkActions';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import TextArea from '@/components/ui/TextArea';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const mediumOptions = [
  { value: 'Painting', label: 'Painting' },
  { value: 'Sculpture', label: 'Sculpture' },
  { value: 'Photography', label: 'Photography' },
  { value: 'Digital Art', label: 'Digital Art' },
  { value: 'Illustration', label: 'Illustration' },
  { value: 'Mixed Media', label: 'Mixed Media' },
];

const visibilityOptions = [
  { value: 'Show Price', label: 'Show Price' },
  { value: 'Price on Request', label: 'Price on Request' },
  { value: 'Hide Price', label: 'Hide Price' },
];

const availabilityOptions = [
  { value: 'Available', label: 'Available' },
  { value: 'For Sale', label: 'For Sale' },
  { value: 'Not for sale', label: 'Not for sale' },
  { value: 'Sold', label: 'Sold' },
];

const editSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  artType: z.string().min(1, 'Please select a medium'),
  artistName: z.string().min(2, 'Artist name is required'),
  year: z.string().optional(),
  dimensions: z.string().optional(),
  location: z.string().optional(),
  style: z.string().optional(),
  collection: z.string().optional(),
  tags: z.string().optional(),
  description: z.string().optional(),
  externalLink: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  price: z.string().optional(),
  priceVisibility: z.enum(['Show Price', 'Price on Request', 'Hide Price']),
  status: z.enum(['Available', 'For Sale', 'Not for sale', 'Sold']),
});

type EditForm = z.infer<typeof editSchema>;

interface ArtworkEditFormProps {
  userId: string;
  artwork: any;
}

export default function ArtworkEditForm({ userId, artwork }: ArtworkEditFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [submitAction, setSubmitAction] = useState<'publish' | 'draft'>('publish');
  const [error, setError] = useState<string | null>(null);

  // Initial images from the database
  const initialImages = [artwork.image_url, ...(artwork.additional_images || [])].filter(Boolean);
  
  const [existingUrls, setExistingUrls] = useState<string[]>(initialImages);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const totalImages = existingUrls.length + newFiles.length;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      title: artwork.title || '',
      artType: artwork.art_type || '',
      artistName: artwork.artist_name || '',
      year: artwork.year || '',
      dimensions: artwork.dimensions || '',
      location: artwork.location || '',
      style: artwork.style || '',
      collection: artwork.collection || '',
      tags: artwork.tags ? artwork.tags.join(', ') : '',
      description: artwork.description || '',
      externalLink: artwork.external_link || '',
      price: artwork.price ? artwork.price.toString() : '',
      priceVisibility: artwork.price_visibility || 'Show Price',
      status: artwork.status as any || 'Available',
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const availableSlots = 5 - totalImages;
      const filesToAdd = files.slice(0, availableSlots);
      
      const updatedFiles = [...newFiles, ...filesToAdd];
      setNewFiles(updatedFiles);
      
      const newPreviewUrls = filesToAdd.map(file => URL.createObjectURL(file));
      setPreviewUrls([...previewUrls, ...newPreviewUrls]);
    }
    // Reset input so the same file can be selected again if needed
    e.target.value = '';
  };

  const removeExisting = (index: number) => {
    const updated = [...existingUrls];
    updated.splice(index, 1);
    setExistingUrls(updated);
  };

  const removeNewFile = (index: number) => {
    const updatedFiles = [...newFiles];
    updatedFiles.splice(index, 1);
    setNewFiles(updatedFiles);
    
    const updatedPreviews = [...previewUrls];
    updatedPreviews.splice(index, 1);
    setPreviewUrls(updatedPreviews);
  };

  const onSubmit = async (data: EditForm) => {
    if (totalImages === 0) {
      setError('Please have at least one image for this artwork.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const uploadedUrls: string[] = [];

      // Upload any newly added images
      if (newFiles.length > 0) {
        await Promise.all(
          newFiles.map(async (file, index) => {
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}/${Date.now()}_${index}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
              .from('artworks')
              .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
              .from('artworks')
              .getPublicUrl(fileName);

            uploadedUrls.push(urlData.publicUrl);
          })
        );
      }

      const finalUrls = [...existingUrls, ...uploadedUrls];
      const coverImage = finalUrls[0];
      const additionalImages = finalUrls.slice(1);
      
      const tagsArray = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

      await updateArtwork(artwork.id, {
        userId,
        title: data.title,
        artType: data.artType,
        artistName: data.artistName,
        year: data.year,
        dimensions: data.dimensions,
        location: data.location,
        style: data.style,
        collection: data.collection,
        tags: tagsArray,
        description: data.description,
        externalLink: data.externalLink,
        price: data.price ? parseFloat(data.price) : null,
        priceVisibility: data.priceVisibility,
        status: data.status,
        isPublished: submitAction === 'publish',
        imageUrl: coverImage,
        additionalImages: additionalImages,
      });

      router.push('/portfolio/artworks');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgb(0,0,0,0.04)] p-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/portfolio/artworks" className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h2 className="text-xl font-bold text-gray-900">Edit Artwork</h2>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Editable Image Gallery */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Artwork Images * (First image is the cover)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            {/* Existing Images */}
            {existingUrls.map((url, idx) => (
              <div key={`existing-${idx}`} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                <img src={url} alt={`Existing ${idx + 1}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => removeExisting(idx)}
                    className="bg-red-500 text-white w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-600 shadow-lg transform hover:scale-105 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                {idx === 0 && (
                  <div className="absolute bottom-2 left-2 bg-gray-900/90 text-white text-[10px] font-bold px-2 py-1 rounded">
                    COVER
                  </div>
                )}
              </div>
            ))}

            {/* New Image Previews */}
            {previewUrls.map((url, idx) => (
              <div key={`new-${idx}`} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100 border border-blue-200">
                <img src={url} alt={`New Preview ${idx + 1}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button
                    type="button"
                    onClick={() => removeNewFile(idx)}
                    className="bg-red-500 text-white w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-600 shadow-lg transform hover:scale-105 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                {existingUrls.length === 0 && idx === 0 && (
                  <div className="absolute bottom-2 left-2 bg-gray-900/90 text-white text-[10px] font-bold px-2 py-1 rounded z-0">
                    COVER
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded z-0">
                  NEW
                </div>
              </div>
            ))}
            
            {/* Add More Button */}
            {totalImages < 5 && (
              <div
                className="aspect-square border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-gray-50 hover:border-gray-300"
                onClick={() => document.getElementById('edit-file-upload')?.click()}
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                  <Upload size={18} className="text-gray-400" />
                </div>
                <p className="font-semibold text-gray-900 text-xs">Add Image</p>
                <p className="text-[10px] text-gray-400 mt-1">{5 - totalImages} slots left</p>
              </div>
            )}
          </div>
          
          <input
            id="edit-file-upload"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input label="Title *" placeholder="Name of the artwork" error={errors.title?.message} {...register('title')} />
          <Input label="Artist Name *" placeholder="Who created this?" error={errors.artistName?.message} {...register('artistName')} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Select label="Medium *" options={mediumOptions} placeholder="Select Medium" error={errors.artType?.message} {...register('artType')} />
          <Input label="Year" placeholder="e.g. 2024" error={errors.year?.message} {...register('year')} />
          <Input label="Dimensions" placeholder="e.g. 24x36 in" error={errors.dimensions?.message} {...register('dimensions')} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Input label="Location" placeholder="e.g. New York, NY" error={errors.location?.message} {...register('location')} />
          <Input label="Style" placeholder="e.g. Abstract, Minimalist" error={errors.style?.message} {...register('style')} />
          <Input label="Collection" placeholder="e.g. Summer Series" error={errors.collection?.message} {...register('collection')} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Input label="Tags (comma separated)" placeholder="e.g. oil, canvas, blue" error={errors.tags?.message} {...register('tags')} />
          <Select label="Availability" options={availabilityOptions} error={errors.status?.message} {...register('status')} />
          <Select label="Price Visibility" options={visibilityOptions} error={errors.priceVisibility?.message} {...register('priceVisibility')} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input label="Price ($)" type="number" placeholder="0.00" error={errors.price?.message} {...register('price')} />
          <div className="relative">
            <Input label="Related Link" placeholder="https://..." error={errors.externalLink?.message} {...register('externalLink')} />
            <LinkIcon className="absolute right-3 top-9 text-gray-400" size={16} />
          </div>
        </div>

        <TextArea label="Description" placeholder="Tell collectors about this piece..." error={errors.description?.message} {...register('description')} />

        <div className="flex gap-4 pt-4 border-t border-gray-100">
          <Button 
            type="submit" 
            isLoading={isLoading && submitAction === 'publish'} 
            variant="coral"
            className="flex-1"
            onClick={() => setSubmitAction('publish')}
          >
            <Save size={16} />
            Publish Changes
          </Button>
          
          <Button 
            type="submit" 
            isLoading={isLoading && submitAction === 'draft'} 
            variant="secondary"
            className="flex-1"
            onClick={() => setSubmitAction('draft')}
          >
            <Save size={16} />
            Save as Draft
          </Button>

          <Button type="button" variant="outline" className="flex-1" onClick={() => router.push('/portfolio/artworks')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
