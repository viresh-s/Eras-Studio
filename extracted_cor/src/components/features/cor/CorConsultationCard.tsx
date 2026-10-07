import React from 'react';
import Link from 'next/link';
import { Calendar, ArrowRight, Clock, Video } from 'lucide-react';
import type { CorConsultation } from '@/types/cor';
import CorStatusBadge from './CorStatusBadge';

interface CorConsultationCardProps {
  consultation: CorConsultation | null;
}

export default function CorConsultationCard({ consultation }: CorConsultationCardProps) {
  return (
    <div className="bg-white border border-[#E8E8E3] rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-[#F0F0EB] mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#FAF9F6] border border-[#E8E8E3] flex items-center justify-center text-[#141413]">
              <Calendar size={16} />
            </div>
            <h2 className="font-serif text-lg sm:text-xl font-semibold text-[#141413]">
              Upcoming consultation
            </h2>
          </div>

          {consultation && <CorStatusBadge status={consultation.status} />}
        </div>

        {consultation ? (
          <div className="space-y-3">
            <div className="p-4 bg-[#FAF9F6] border border-[#E8E8E3] rounded-2xl">
              <strong className="block text-sm font-semibold text-[#141413]">
                {consultation.slot_time}
              </strong>
              <p className="text-xs text-[#6E6E69] mt-1 leading-relaxed">
                {consultation.purpose}
              </p>
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#E8E8E3] text-[11px] text-[#73736C]">
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {consultation.duration_minutes} mins
                </span>
                <span className="flex items-center gap-1 font-medium text-[#141413]">
                  <Video size={12} />
                  Advisor: {consultation.consultant_name}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-[#6E6E69] space-y-2">
            <p>No consultation scheduled yet.</p>
            <p className="text-[11px] text-[#8A8A85]">
              Meet 1-on-1 with an iRAS career advisor to review your portfolio and interview strategy.
            </p>
          </div>
        )}
      </div>

      <div className="pt-4 mt-4 border-t border-[#F0F0EB]">
        <Link
          href="/cor/consultations"
          className="w-full py-2.5 px-4 rounded-full border border-[#141413] text-xs font-semibold text-[#141413] hover:bg-neutral-50 transition-colors inline-flex items-center justify-center gap-1.5"
        >
          <span>{consultation ? 'Manage Consultation' : 'Schedule Consultation'}</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}
