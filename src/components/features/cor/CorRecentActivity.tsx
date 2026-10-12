import React from 'react';
import { Activity, Clock, CheckCircle2 } from 'lucide-react';
import type { CorActivity } from '@/types/cor';

interface CorRecentActivityProps {
  activities: CorActivity[];
}

export default function CorRecentActivity({ activities }: CorRecentActivityProps) {
  return (
    <div className="bg-white border border-[#E8E8E3] rounded-3xl p-6 sm:p-7 shadow-xs">
      <div className="flex items-center gap-2 pb-4 border-b border-[#F0F0EB] mb-4">
        <div className="w-8 h-8 rounded-full bg-[#FAF9F6] border border-[#E8E8E3] flex items-center justify-center text-[#141413]">
          <Activity size={16} />
        </div>
        <h2 className="font-serif text-lg sm:text-xl font-semibold text-[#141413]">
          Recent activity
        </h2>
      </div>

      {activities && activities.length > 0 ? (
        <div className="space-y-3.5">
          {activities.map((act) => {
            const timeStr = new Date(act.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={act.id}
                className="flex items-start gap-3 p-3 rounded-2xl bg-[#FAF9F6] border border-[#F0F0EB] hover:border-[#E8E8E3] transition-colors"
              >
                <div className="mt-0.5 text-[#28633B] flex-shrink-0">
                  <CheckCircle2 size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#141413] leading-snug">
                    {act.title}
                  </p>
                  {act.description && (
                    <p className="text-[11px] text-[#6E6E69] mt-0.5 leading-relaxed truncate">
                      {act.description}
                    </p>
                  )}
                  <span className="text-[10px] text-[#8A8A85] flex items-center gap-1 mt-1">
                    <Clock size={10} />
                    {timeStr}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-8 text-center text-xs text-[#8A8A85]">
          No recent activity logged yet.
        </div>
      )}
    </div>
  );
}
