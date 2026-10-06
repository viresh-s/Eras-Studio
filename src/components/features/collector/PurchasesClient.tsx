'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Layers, ChevronDown } from 'lucide-react';

const PROGRESS_STAGES = [
  'Interest Raised',
  'Discussion',
  'Confirmed',
  'Processing',
  'Completed'
];

type Acquisition = {
  id: string;
  artworkId: string;
  title: string;
  imageUrl: string;
  price: number | null;
  creatorName: string;
  createdAt: string;
  initialStatus: string;
  dbStatus?: string;
};

export default function PurchasesClient({ initialAcquisitions }: { initialAcquisitions: Acquisition[] }) {
  const [activeTab, setActiveTab] = useState<'Active' | 'Completed' | 'Interested'>('Active');
  
  // Local state to simulate status changes
  const [statuses, setStatuses] = useState<Record<string, string>>(
    initialAcquisitions.reduce((acc, acq) => ({ ...acc, [acq.id]: acq.initialStatus }), {})
  );

  const handleStatusChange = (id: string, newStatus: string) => {
    setStatuses(prev => ({ ...prev, [id]: newStatus }));
  };

  const activeAcquisitions = initialAcquisitions.filter(acq => statuses[acq.id] !== 'Completed');
  const completedAcquisitions = initialAcquisitions.filter(acq => statuses[acq.id] === 'Completed');

  const formatPrice = (price: number | null) => {
    if (!price) return 'Price on Request';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const renderEmptyState = () => (
    <div className="bg-[#F3F4F6] rounded-2xl border border-dashed border-gray-300 p-16 flex flex-col items-center justify-center text-center mt-6">
      <Layers className="w-8 h-8 text-gray-500 mb-4" />
      <h3 className="text-xl font-bold text-gray-900 mb-2 font-heading" style={{ fontFamily: "'Playfair Display', serif" }}>
        No acquisitions in this view.
      </h3>
      <p className="text-sm text-gray-500">
        Artwork purchases are always arranged directly with creators.
      </p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pt-4 pb-20">
      {/* Header */}
      <p className="text-[10px] font-bold tracking-[0.15em] text-gray-500 uppercase mb-3">
        YOUR COLLECTION, IN THE MAKING
      </p>
      <h1 className="text-5xl text-gray-900 mb-3 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
        Acquisition journal
      </h1>
      <p className="text-gray-500 text-sm mb-8">
        A conceptual tracker for conversations and independently arranged acquisitions.
      </p>

      {/* Demo Banner */}
      <div className="bg-[#E5E7EB] text-gray-800 text-xs font-medium py-3.5 px-5 rounded-xl mb-8">
        No checkout, payments, shipping or actual transactions. Status changes below are demo-only.
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-8">
        {(['Active', 'Completed', 'Interested'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 text-xs font-semibold rounded-full transition-colors ${
              activeTab === tab
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'Active' && (
          activeAcquisitions.length === 0 ? renderEmptyState() : activeAcquisitions.map(acq => (
            <div key={acq.id} className="bg-white rounded-3xl border border-gray-200 p-8 flex flex-col md:flex-row gap-10">
              <div className="flex-shrink-0">
                <img 
                  src={acq.imageUrl} 
                  alt={acq.title} 
                  className="w-48 aspect-[3/4] object-cover rounded-2xl"
                />
              </div>
              <div className="flex-1">
                <div className="inline-flex px-3 py-1 bg-gray-100 text-gray-800 text-[11px] font-bold rounded-full mb-5">
                  {statuses[acq.id]}
                </div>
                
                <h2 className="text-3xl text-gray-900 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {acq.title}
                </h2>
                
                <p className="text-sm text-gray-500 mb-10">
                  {acq.creatorName} · {formatPrice(acq.price)} illustrative value
                </p>

                {/* Stepper */}
                <div className="flex items-center gap-2 mb-10">
                  {PROGRESS_STAGES.map((stage, idx) => {
                    const currentStageIdx = PROGRESS_STAGES.indexOf(statuses[acq.id]);
                    const isActiveOrPast = idx <= currentStageIdx;
                    
                    return (
                      <div key={stage} className="flex-1 flex flex-col gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isActiveOrPast ? 'text-gray-900' : 'text-gray-400'}`}>
                          {idx + 1}. {stage}
                        </span>
                        <div className={`h-[3px] rounded-full w-full ${isActiveOrPast ? 'bg-gray-900' : 'bg-gray-200'}`} />
                      </div>
                    );
                  })}
                </div>

                {/* Simulate Dropdown */}
                <div className="max-w-xs">
                  <label className="block text-[11px] font-bold text-gray-900 mb-2 uppercase tracking-wider">
                    Simulate progress
                  </label>
                  <div className="relative">
                    <select
                      value={statuses[acq.id]}
                      onChange={(e) => handleStatusChange(acq.id, e.target.value)}
                      className="w-full appearance-none bg-white border border-gray-300 text-sm text-gray-900 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    >
                      {PROGRESS_STAGES.map(stage => (
                        <option key={stage} value={stage}>{stage}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {activeTab === 'Completed' && (
          completedAcquisitions.length === 0 ? renderEmptyState() : completedAcquisitions.map(acq => (
            <div key={acq.id} className="bg-white rounded-3xl border border-gray-200 p-8 flex flex-col md:flex-row gap-10">
              <div className="flex-shrink-0">
                <img 
                  src={acq.imageUrl} 
                  alt={acq.title} 
                  className="w-48 aspect-[3/4] object-cover rounded-2xl opacity-80"
                />
              </div>
              <div className="flex-1">
                <div className="inline-flex px-3 py-1 bg-green-50 text-green-700 text-[11px] font-bold rounded-full mb-5 border border-green-200">
                  {statuses[acq.id]}
                </div>
                
                <h2 className="text-3xl text-gray-900 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {acq.title}
                </h2>
                
                <p className="text-sm text-gray-500 mb-10">
                  {acq.creatorName} · {formatPrice(acq.price)} illustrative value
                </p>

                <div className="max-w-xs">
                  <label className="block text-[11px] font-bold text-gray-900 mb-2 uppercase tracking-wider">
                    Simulate progress
                  </label>
                  <div className="relative">
                    <select
                      value={statuses[acq.id]}
                      onChange={(e) => handleStatusChange(acq.id, e.target.value)}
                      className="w-full appearance-none bg-white border border-gray-300 text-sm text-gray-900 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    >
                      {PROGRESS_STAGES.map(stage => (
                        <option key={stage} value={stage}>{stage}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {activeTab === 'Interested' && (
          initialAcquisitions.length === 0 ? renderEmptyState() : (
            <div className="space-y-3">
              {initialAcquisitions.map(acq => (
                <div key={acq.id} className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <h4 className="font-bold text-gray-900">{acq.title}</h4>
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider rounded-full">
                      {acq.dbStatus || 'Pending'}
                    </span>
                  </div>
                  <Link
                    href={`/messages?chatId=${acq.id}`}
                    className="px-5 py-2 border border-gray-200 rounded-full text-xs font-semibold text-gray-900 hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    View Interest
                  </Link>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
