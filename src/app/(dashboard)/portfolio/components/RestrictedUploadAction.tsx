'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface Props {
  isLimited: boolean;
  label: string;
  className?: string;
}

export default function RestrictedUploadAction({ isLimited, label, className = '' }: Props) {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Show the modal automatically on first render if limited
    if (isLimited) {
      setShowModal(true);
    }
  }, [isLimited]);

  return (
    <>
      {isLimited ? (
        <button
          onClick={() => setShowModal(true)}
          className={className || "inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-full text-sm font-semibold hover:bg-gray-800 transition-all shadow-sm"}
        >
          <Plus size={16} />
          {label}
        </button>
      ) : (
        <Link
          href="/portfolio/upload"
          className={className || "inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-full text-sm font-semibold hover:bg-gray-800 transition-all shadow-sm"}
        >
          <Plus size={16} />
          {label}
        </Link>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Upgrade to Premium"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus size={24} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Limit Reached</h3>
          <p className="text-gray-500 mb-6 leading-relaxed text-sm">
            You've hit the limits of the free plan. Upgrade your account to continue uploading new artworks and unlock unlimited access to Eras Studio.
          </p>
          <Button variant="coral" fullWidth onClick={() => alert('Upgrade flow coming soon!')}>
            Upgrade your plan
          </Button>
          <button 
            onClick={() => setShowModal(false)}
            className="mt-4 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </Modal>
    </>
  );
}
