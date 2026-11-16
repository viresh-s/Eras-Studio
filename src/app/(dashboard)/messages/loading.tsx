import React from 'react';
import { ChatListSkeleton } from '@/components/ui/Skeleton';

export default function MessagesLoading() {
  return (
    <div className="py-4 max-w-5xl mx-auto">
      <ChatListSkeleton />
    </div>
  );
}
