import React from 'react';
import { FormSkeleton } from '@/components/ui/Skeleton';

export default function ProfileLoading() {
  return (
    <div className="py-6">
      <FormSkeleton />
    </div>
  );
}
