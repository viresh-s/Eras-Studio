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
        <h2 className="font-sans font-semibold text-xl sm:text-2xl text-[#141413] tracking-tight">
          Upcoming consultation
        </h2>

        {consultation ? (
          <div className="space-y-3 mt-3">
            <div className="p-4 bg-[#FAF9F6] border border-[#E8E8E3] rounded-2xl font-sans">
              <strong className="block text-sm font-semibold text-[#141413] font-sans">
                {consultation.slot_time}
              </strong>
              <p className="text-xs text-[#6E6E69] mt-1 leading-relaxed font-sans">
                {consultation.purpose}
              </p>
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#E8E8E3] text-[11px] text-[#73736C] font-sans">
                <span className="flex items-center gap-1 font-sans">
                  <Clock size={12} />
                  {consultation.duration_minutes} mins
                </span>
                <span className="flex items-center gap-1 font-medium text-[#141413] font-sans">
                  <Video size={12} />
                  Advisor: {consultation.consultant_name}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="pt-3 text-xs text-[#6E6E69] space-y-1 font-sans">
            <p className="font-semibold text-[#141413] text-xs font-sans">
              No consultation scheduled yet.
            </p>
            <p className="text-[11px] text-[#6E6E69] font-sans leading-relaxed">
              Meet 1 on 1 with an Eras career advisor to review your portfolio and interview strategy.
            </p>
            <p className="text-[11px] text-[#6E6E69] font-sans pt-1">
              Assigned consultant: <strong className="font-semibold text-[#141413] font-sans">Priya Nair</strong>
            </p>
          </div>
        )}
      </div>

      <div className="pt-4 mt-2">
        <Link
          href="/cor/consultations"
          className="px-5 py-2 rounded-full border border-[#141413] text-xs font-medium text-[#141413] hover:bg-neutral-50 transition-colors inline-flex items-center justify-center gap-1.5 font-sans"
        >
          <span>{consultation ? 'Manage Consultation' : 'Schedule Consultation'}</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}
