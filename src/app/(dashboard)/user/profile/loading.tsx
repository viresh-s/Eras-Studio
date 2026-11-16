import React from 'react';
import { FormSkeleton } from '@/components/ui/Skeleton';

export default function UserProfileLoading() {
  return (
    <div className="py-6">
      <FormSkeleton />
    </div>
  );
}
