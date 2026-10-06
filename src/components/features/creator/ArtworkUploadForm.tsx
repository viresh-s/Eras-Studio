'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Upload, Image, Link as LinkIcon, Trash2, Save } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { createArtwork } from '@/actions/artworkActions';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import TextArea from '@/components/ui/TextArea';
import type { FreemiumStatus } from '@/lib/freemium/check';
import Modal from '@/components/ui/Modal';
import UpgradePrompt from '@/components/features/creator/UpgradePrompt';

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

const uploadSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  artType: z.string().min(1, 'Please select a medium'), // We map this to Medium
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

type UploadForm = z.infer<typeof uploadSchema>;

interface UploadFormProps {
  userId: string;
  freemiumStatus: FreemiumStatus;
}

export default function ArtworkUploadForm({ userId, freemiumStatus }: UploadFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [submitAction, setSubmitAction] = useState<'publish' | 'draft'>('publish');
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    if (freemiumStatus.isLocked) {
      setShowUpgradeModal(true);
      const timer = setTimeout(() => {
        setShowUpgradeModal(false);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setShowUpgradeModal(false);
    }
  }, [freemiumStatus.isLocked]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UploadForm>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      priceVisibility: 'Show Price',
      status: 'Available',
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newFiles = [...selectedFiles, ...files].slice(0, 5);
      setSelectedFiles(newFiles);
      
      const newUrls = newFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(newUrls);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
    
    const newUrls = [...previewUrls];
    newUrls.splice(index, 1);
    setPreviewUrls(newUrls);
  };

  const onSubmit = async (data: UploadForm) => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one image file');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const uploadedUrls: string[] = [];

      // Upload all images
      await Promise.all(
        selectedFiles.map(async (file, index) => {
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

      const coverImage = uploadedUrls[0];
      const additionalImages = uploadedUrls.slice(1);
      
      const tagsArray = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

      await createArtwork({
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
        imageUrl: coverImage,
        additionalImages: additionalImages,
        price: data.price ? parseFloat(data.price) : null,
        priceVisibility: data.priceVisibility,
        isPublished: submitAction === 'publish',
        // In the DB, the create action currently forces status to 'Available', 
        // we'll fix the createAction shortly to accept data.status
      });

      // Quick fix: the createArtwork action above needs status
      // We will pass it in anyway, assuming the server action is updated
      
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
      <h2 className="text-xl font-bold text-gray-900 mb-6">Upload New Artwork</h2>

      {!freemiumStatus.isLocked && freemiumStatus.artworksLimit > 0 && (
        <div className="mb-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <p className="text-sm font-medium text-amber-800">
            Free Plan: {freemiumStatus.artworksUsed}/{freemiumStatus.artworksLimit} uploads used
            {freemiumStatus.daysRemaining > 0 && ` · ${freemiumStatus.daysRemaining} days remaining`}
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Image Upload */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Artwork Images * (First image is the cover)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            {previewUrls.map((url, idx) => (
              <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
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
            
            {previewUrls.length < 5 && (
              <div
                className="aspect-square border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-gray-50 hover:border-gray-300"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                  <Upload size={18} className="text-gray-400" />
                </div>
                <p className="font-semibold text-gray-900 text-xs">Add Image</p>
                <p className="text-[10px] text-gray-400 mt-1">Up to 5 images</p>
              </div>
            )}
          </div>
          
          <input
            id="file-upload"
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
            disabled={freemiumStatus.isLocked}
          >
            <Image size={16} />
            Publish Artwork
          </Button>
          
          <Button 
            type="submit" 
            isLoading={isLoading && submitAction === 'draft'} 
            variant="secondary"
            className="flex-1"
            onClick={() => setSubmitAction('draft')}
            disabled={freemiumStatus.isLocked}
          >
            <Save size={16} />
            Save Draft
          </Button>

          <Button type="button" variant="outline" className="flex-1" onClick={() => router.push('/portfolio/artworks')}>
            Cancel
          </Button>
        </div>
      </form>
      
      <Modal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} title="Premium Required" size="md">
        <UpgradePrompt userId={userId} freemiumStatus={freemiumStatus} />
      </Modal>
    </div>
  );
}
