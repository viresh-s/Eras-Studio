'use client';

import { useState } from 'react';
import { upgradeToPremiumServer } from '@/actions/profileActions';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
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
      <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgb(0,0,0,0.06)] p-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-5">
          <Crown size={28} className="text-amber-600" />
        </div>

        <h2 className="text-2xl font-extrabold text-gray-900 mb-3">Upgrade to Premium</h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto text-sm">{freemiumStatus.reason}</p>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 text-left">
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
            <Infinity size={20} className="flex-shrink-0 text-blue-600 mt-0.5" />
            <div>
              <p className="font-bold text-gray-900 text-sm">Unlimited Uploads</p>
              <p className="text-xs text-gray-500">No more limits on your art</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
            <Zap size={20} className="flex-shrink-0 text-amber-500 mt-0.5" />
            <div>
              <p className="font-bold text-gray-900 text-sm">Priority Listing</p>
              <p className="text-xs text-gray-500">Your art appears first</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
            <BarChart3 size={20} className="flex-shrink-0 text-pink-600 mt-0.5" />
            <div>
              <p className="font-bold text-gray-900 text-sm">Analytics Dashboard</p>
              <p className="text-xs text-gray-500">Track your performance</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
            <Star size={20} className="flex-shrink-0 text-emerald-600 mt-0.5" />
            <div>
              <p className="font-bold text-gray-900 text-sm">Verified Badge</p>
              <p className="text-xs text-gray-500">Stand out as verified</p>
            </div>
          </div>
        </div>

        <Button onClick={handleUpgrade} isLoading={isUpgrading} size="lg">
          <Crown size={18} />
          Upgrade Now — Demo
        </Button>

        <p className="text-xs text-gray-400 mt-3">
          Demo mode: This will activate premium features instantly
        </p>
      </div>
    </div>
  );
}
