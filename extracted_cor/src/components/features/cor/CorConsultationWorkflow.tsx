'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  UserCheck,
  Video,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Sparkles,
} from 'lucide-react';
import type { CorConsultation } from '@/types/cor';
import { bookCorConsultationAction, cancelCorConsultationAction } from '@/actions/corActions';
import Button from '@/components/ui/Button';
import CorStatusBadge from './CorStatusBadge';

interface CorConsultationWorkflowProps {
  initialConsultations: CorConsultation[];
}

const DEFAULT_SLOTS = [
  'Monday, 10:30 AM IST',
  'Tuesday, 3:00 PM IST',
  'Wednesday, 11:00 AM IST',
  'Thursday, 4:30 PM IST',
  'Friday, 5:30 PM IST',
  'Saturday, 12:00 PM IST',
];

export default function CorConsultationWorkflow({
  initialConsultations,
}: CorConsultationWorkflowProps) {
  const router = useRouter();
  const [consultations, setConsultations] = useState<CorConsultation[]>(initialConsultations);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [purpose, setPurpose] = useState('Portfolio review & career direction');
  const [notes, setNotes] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const activeConsultations = consultations.filter((c) => c.status === 'scheduled');
  const bookedSlots = activeConsultations.map((c) => c.slot_time);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      showToast('Please select an available time slot', 'error');
      return;
    }

    setIsBooking(true);
    try {
      const res = await bookCorConsultationAction(selectedSlot, purpose, notes);
      setConsultations((prev) => [res.consultation, ...prev]);
      setSelectedSlot('');
      setNotes('');
      showToast('Career consultation scheduled successfully!', 'success');
      router.refresh();
    } catch (err: any) {
      console.error('Booking failed:', err);
      showToast(err.message || 'Failed to book consultation', 'error');
    } finally {
      setIsBooking(false);
    }
  };

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    try {
      await cancelCorConsultationAction(id);
      setConsultations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: 'cancelled' } : c))
      );
      showToast('Consultation booking cancelled', 'success');
      router.refresh();
    } catch (err: any) {
      console.error('Cancel failed:', err);
      showToast(err.message || 'Failed to cancel consultation', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-[#141413] text-white px-5 py-3.5 rounded-2xl shadow-xl border border-neutral-800 flex items-center gap-3 max-w-md">
            {toast.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-rose-400 flex-shrink-0" />
            )}
            <p className="text-xs text-neutral-200 leading-snug">{toast.message}</p>
          </div>
        </div>
      )}

      {/* 2-Column Split: Consultant Profile & Purpose vs Available Times */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (6 cols): Advisor Intro & Purpose */}
        <div className="lg:col-span-6 bg-white border border-[#E8E8E3] rounded-3xl p-7 sm:p-9 shadow-xs space-y-6">
          <div className="flex items-center gap-4 pb-5 border-b border-[#F0F0EB]">
            <div className="w-13 h-13 rounded-full bg-[#141413] text-white flex items-center justify-center font-serif text-lg font-bold">
              PN
            </div>
            <div>
              <h3 className="font-serif text-xl font-semibold text-[#141413]">
                Priya Nair
              </h3>
              <p className="text-xs text-[#6E6E69] flex items-center gap-1.5 mt-0.5">
                <UserCheck size={13} className="text-[#865E16]" />
                <span>Senior Career Consultant · 30 minutes</span>
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="font-serif text-2xl font-semibold text-[#141413]">
              Let’s talk about what’s next.
            </h2>
            <p className="text-xs sm:text-sm text-[#5A5A55] leading-relaxed font-normal">
              Review your portfolio, discuss curated open calls, strategize gallery representation, or get guided interview preparation.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                Session Focus / Primary Objective
              </label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413]"
              >
                <option value="Portfolio review & career direction">Portfolio review & career direction</option>
                <option value="Residency & grant application strategy">Residency & grant application strategy</option>
                <option value="Curatorial interview preparation">Curatorial interview preparation</option>
                <option value="Gallery pitch & representation guidance">Gallery pitch & representation guidance</option>
                <option value="Pricing, contracts & commissions">Pricing, contracts & commissions</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                Specific Questions / Artworks to Review (optional)
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Share any specific links or questions you would like your consultant to inspect beforehand..."
                className="w-full text-xs p-3 rounded-xl border border-[#E8E8E3] bg-[#FAF9F6] text-[#141413] focus:outline-none focus:border-[#141413] leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Right Column (6 cols): Slot Selection & Booking */}
        <div className="lg:col-span-6 bg-white border border-[#E8E8E3] rounded-3xl p-7 sm:p-9 shadow-xs space-y-6">
          <div className="border-b border-[#F0F0EB] pb-4">
            <h3 className="font-serif text-xl font-semibold text-[#141413]">
              Available time slots
            </h3>
            <p className="text-xs text-[#6E6E69] mt-0.5">
              Select an upcoming 30-minute calendar slot (IST timezone).
            </p>
          </div>

          <form onSubmit={handleBook} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DEFAULT_SLOTS.map((slot) => {
                const isBooked = bookedSlots.includes(slot);
                const isSelected = selectedSlot === slot;

                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={isBooked}
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-3.5 rounded-2xl border text-left text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#141413] text-white border-[#141413] shadow-xs'
                        : isBooked
                        ? 'bg-[#F9F9F8] border-[#E8E8E3] text-[#A0A09B] cursor-not-allowed'
                        : 'bg-[#FAF9F6] border-[#E8E8E3] text-[#141413] hover:border-[#141413]'
                    }`}
                  >
                    <span className="font-semibold block">{slot}</span>
                    <span className={`text-[10px] block mt-1 ${isSelected ? 'text-white/80' : 'text-[#8A8A85]'}`}>
                      {isBooked ? '· Booked by you' : '· Available (Video Call)'}
                    </span>
                  </button>
                );
              })}
            </div>

            <Button
              type="submit"
              size="md"
              disabled={!selectedSlot}
              isLoading={isBooking}
              className="w-full bg-[#141413] text-white hover:bg-[#2A2A28] rounded-full text-xs py-3 font-semibold inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Calendar size={14} />
              <span>Confirm Consultation Booking</span>
            </Button>
          </form>
        </div>
      </div>

      {/* Booked Consultations Section */}
      <div className="bg-white border border-[#E8E8E3] rounded-3xl p-7 sm:p-9 shadow-xs space-y-5">
        <div className="border-b border-[#F0F0EB] pb-4">
          <h3 className="font-serif text-xl font-semibold text-[#141413]">
            Your consultations ({consultations.length})
          </h3>
          <p className="text-xs text-[#6E6E69] mt-0.5">
            Active and past career advisory sessions.
          </p>
        </div>

        {consultations.length > 0 ? (
          <div className="space-y-3">
            {consultations.map((c) => (
              <div
                key={c.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E8E3]"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <strong className="text-xs font-bold text-[#141413]">
                      {c.slot_time}
                    </strong>
                    <CorStatusBadge status={c.status} />
                  </div>
                  <p className="text-xs text-[#6E6E69]">{c.purpose}</p>
                  <div className="flex items-center gap-3 text-[11px] text-[#8A8A85] pt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {c.duration_minutes} mins
                    </span>
                    <span>·</span>
                    <span>Consultant: {c.consultant_name}</span>
                  </div>
                </div>

                {c.status === 'scheduled' && (
                  <button
                    type="button"
                    disabled={cancellingId === c.id}
                    onClick={() => handleCancel(c.id)}
                    className="px-4 py-2 rounded-full border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors self-start sm:self-auto cursor-pointer"
                  >
                    {cancellingId === c.id ? 'Cancelling...' : 'Cancel booking'}
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-[#8A8A85]">
            No previous consultation history.
          </div>
        )}
      </div>
    </div>
  );
}
