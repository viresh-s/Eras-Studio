import React from 'react';
import { Activity, Clock, CheckCircle2 } from 'lucide-react';
import type { CorActivity } from '@/types/cor';

interface CorRecentActivityProps {
  activities: CorActivity[];
}

export default function CorRecentActivity({ activities }: CorRecentActivityProps) {
  return (
    <div className="bg-white border border-[#E8E8E3] rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col justify-between">
      <div>
        <h2 className="century-heading text-xl sm:text-2xl text-[#141413]">
          Recent activity
        </h2>

        {activities && activities.length > 0 ? (
          <div className="space-y-3.5 mt-3">
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
                  className="flex items-start gap-3 p-3 rounded-2xl bg-[#FAF9F6] border border-[#F0F0EB] hover:border-[#E8E8E3] transition-colors font-sans"
                >
                  <div className="mt-0.5 text-[#28633B] flex-shrink-0">
                    <CheckCircle2 size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#141413] leading-snug font-sans">
                      {act.title}
                    </p>
                    {act.description && (
                      <p className="text-[11px] text-[#6E6E69] mt-0.5 leading-relaxed truncate font-sans">
                        {act.description}
                      </p>
                    )}
                    <span suppressHydrationWarning className="text-[10px] text-[#8A8A85] flex items-center gap-1 mt-1 font-sans">
                      <Clock size={10} />
                      {timeStr}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="pt-3 text-xs text-[#6E6E69] font-sans">
            No recent activity logged yet.
          </div>
        )}
      </div>
    </div>
  );
}
