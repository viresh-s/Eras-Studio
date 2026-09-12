'use client';

import { useState } from 'react';
import { upgradeToPremiumServer } from '@/actions/profileActions';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Crown, Zap, Infinity, BarChart3, Star } from 'lucide-react';
import type { FreemiumStatus } from '@/lib/freemium/check';

interface UpgradePromptProps {
  userId: string;
  freemiumStatus: FreemiumStatus;
}

export default function UpgradePrompt({ userId, freemiumStatus }: UpgradePromptProps) {
  const router = useRouter();
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      await upgradeToPremiumServer(userId);

      router.refresh();
    } catch {
      setIsUpgrading(false);
    }
  };

  if (!freemiumStatus.isLocked) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="text-center">
        <div className="p-3 border-3 border-brand-black bg-brand-yellow inline-flex mb-4">
          <Crown size={32} />
        </div>

        <h2 className="font-heading text-3xl font-bold mb-3">Upgrade to Premium</h2>
        <p className="text-brand-gray mb-6 max-w-md mx-auto">{freemiumStatus.reason}</p>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 text-left">
          <div className="flex items-start gap-3 p-4 border-3 border-brand-black bg-brand-offwhite">
            <Infinity size={24} className="flex-shrink-0 text-brand-blue" />
            <div>
              <p className="font-heading font-bold">Unlimited Uploads</p>
              <p className="text-sm text-brand-gray">No more limits on your art</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 border-3 border-brand-black bg-brand-offwhite">
            <Zap size={24} className="flex-shrink-0 text-brand-yellow" />
            <div>
              <p className="font-heading font-bold">Priority Listing</p>
              <p className="text-sm text-brand-gray">Your art appears first</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 border-3 border-brand-black bg-brand-offwhite">
            <BarChart3 size={24} className="flex-shrink-0 text-brand-pink" />
            <div>
              <p className="font-heading font-bold">Analytics Dashboard</p>
              <p className="text-sm text-brand-gray">Track your performance</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 border-3 border-brand-black bg-brand-offwhite">
            <Star size={24} className="flex-shrink-0 text-brand-green" />
            <div>
              <p className="font-heading font-bold">Verified Badge</p>
              <p className="text-sm text-brand-gray">Stand out as verified</p>
            </div>
          </div>
        </div>

        <Button onClick={handleUpgrade} isLoading={isUpgrading} size="lg">
          <Crown size={20} />
          Upgrade Now — Demo
        </Button>

        <p className="text-xs text-brand-gray mt-3">
          Demo mode: This will activate premium features instantly
        </p>
      </Card>
    </div>
  );
}
