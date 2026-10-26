'use client';

import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAssetProtection, PROTECTED_CONTAINER_CLASS, PROTECTED_IMAGE_CLASS } from '@/lib/media/assetProtection';

interface ArtworkImageGalleryProps {
  primaryImage: string;
  /** Full-resolution URL for primary image (detail/zoom view) */
  primaryImageFull?: string | null;
  additionalImages?: string[] | null;
  /** Full-resolution URLs for additional images */
  additionalImagesFull?: string[] | null;
  altText: string;
}

export default function ArtworkImageGallery({
  primaryImage,
  primaryImageFull,
  additionalImages,
  additionalImagesFull,
  altText,
}: ArtworkImageGalleryProps) {
  // Use full-res URLs for detail view, fall back to card URLs
  const allCardImages = [primaryImage, ...(additionalImages || []).filter(Boolean)];
  const allFullImages = [
    primaryImageFull || primaryImage,
    ...(additionalImagesFull || additionalImages || []).filter(Boolean),
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Anti-download protection
  useAssetProtection(containerRef);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % allCardImages.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + allCardImages.length) % allCardImages.length);
  };

  return (
    <div
      ref={containerRef}
      className={`relative group bg-white border border-gray-100 rounded-xl shadow-sm p-2.5 flex items-center justify-center ${PROTECTED_CONTAINER_CLASS}`}
    >
      <div className="relative w-full max-h-[80vh] overflow-hidden rounded-lg bg-gray-50 flex items-center justify-center">
        {/* Use full-res image for detail view */}
        <img
          src={allFullImages[currentIndex]}
          alt={`${altText} - Image ${currentIndex + 1}`}
          className={`w-full h-auto max-h-[80vh] object-contain ${PROTECTED_IMAGE_CLASS}`}
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
          style={{
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none',
          }}
        />

        {/* Transparent overlay shield — prevents direct image interaction */}
        <div
          className="absolute inset-0 z-[2]"
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
          aria-hidden="true"
        />
        
        {allCardImages.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 text-gray-900 shadow-md backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white z-[3]"
              aria-label="Previous image"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 text-gray-900 shadow-md backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white z-[3]"
              aria-label="Next image"
            >
              <ChevronRight size={20} />
            </button>
            
            {/* Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-sm z-[3]">
              {allCardImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    idx === currentIndex ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80'
                  }`}
                  aria-label={`Go to image ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
