'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '@/components/ui/Input';
import TextArea from '@/components/ui/TextArea';
import { Send, Mail, MapPin, Clock, CheckCircle2 } from 'lucide-react';

const contactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Please enter a valid email'),
  subject: z.string().min(3, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type ContactForm = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async () => {
    setIsSubmitting(true);
    // Simulate brief network submission
    await new Promise((resolve) => setTimeout(resolve, 350));
    setIsSubmitting(false);
    setIsSubmitted(true);
    reset();
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#141413] font-sans selection:bg-[#141413] selection:text-white">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION (Editorial ERAS Style)                                     */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden pt-14 pb-14 sm:pt-20 sm:pb-18 border-b border-[#E8E8E3] bg-[#FAF9F5]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          {/* Editorial Title */}
          <h1
            className="font-serif italic font-medium text-4xl sm:text-5xl md:text-6xl tracking-tight text-[#141413] leading-[1.12]"
            style={{ fontFamily: "'Century', 'Century Schoolbook', serif", fontStyle: "italic" }}
          >
            Contact Us
          </h1>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. CONTACT CONTENT AREA                                                   */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 pb-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {/* Contact Info Cards */}
            <div className="space-y-4">
              {/* Email Card */}
              <a
                href="mailto:hello@eras.art"
                className="group block bg-white border border-[#E8E8E3] rounded-2xl p-5 hover:border-[#1345EE] hover:shadow-[0_4px_16px_rgba(19,69,238,0.06)] transition-all"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-[#FAF9F5] border border-[#E8E8E3] flex items-center justify-center shrink-0 text-[#6E6E69] group-hover:border-[#1345EE] group-hover:text-[#1345EE] transition-colors mt-0.5">
                    <Mail size={16} />
                  </div>
                  <div>
                    <h4
                      className="text-xs uppercase tracking-wider font-semibold text-[#141413] group-hover:text-[#1345EE] transition-colors mb-0.5"
                      style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                    >
                      Email Advisory
                    </h4>
                    <p
                      className="text-sm text-[#6E6E69] group-hover:text-[#141413] transition-colors"
                      style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                    >
                      hello@eras.art
                    </p>
                  </div>
                </div>
              </a>

              {/* Location Card */}
              <div className="group bg-white border border-[#E8E8E3] rounded-2xl p-5 hover:border-[#1345EE] hover:shadow-[0_4px_16px_rgba(19,69,238,0.06)] transition-all">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-[#FAF9F5] border border-[#E8E8E3] flex items-center justify-center shrink-0 text-[#6E6E69] group-hover:border-[#1345EE] group-hover:text-[#1345EE] transition-colors mt-0.5">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <h4
                      className="text-xs uppercase tracking-wider font-semibold text-[#141413] group-hover:text-[#1345EE] transition-colors mb-0.5"
                      style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                    >
                      Location
                    </h4>
                    <p
                      className="text-sm text-[#6E6E69]"
                      style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                    >
                      Worldwide, Remote First
                    </p>
                  </div>
                </div>
              </div>

              {/* Response Time Card */}
              <div className="group bg-white border border-[#E8E8E3] rounded-2xl p-5 hover:border-[#1345EE] hover:shadow-[0_4px_16px_rgba(19,69,238,0.06)] transition-all">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-[#FAF9F5] border border-[#E8E8E3] flex items-center justify-center shrink-0 text-[#6E6E69] group-hover:border-[#1345EE] group-hover:text-[#1345EE] transition-colors mt-0.5">
                    <Clock size={16} />
                  </div>
                  <div>
                    <h4
                      className="text-xs uppercase tracking-wider font-semibold text-[#141413] group-hover:text-[#1345EE] transition-colors mb-0.5"
                      style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                    >
                      Response Time
                    </h4>
                    <p
                      className="text-sm text-[#6E6E69]"
                      style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                    >
                      Within 24 hours
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form Card */}
            <div className="md:col-span-2">
              {isSubmitted ? (
                <div className="bg-[#FAF9F5] border border-[#E8E8E3] rounded-3xl p-10 sm:p-14 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={24} />
                  </div>
                  <h3
                    className="text-2xl sm:text-3xl font-serif italic font-medium text-[#141413] mb-2"
                    style={{ fontFamily: "'Century', 'Century Schoolbook', serif", fontStyle: "italic" }}
                  >
                    Message Sent
                  </h3>
                  <p
                    className="text-sm text-[#6E6E69] max-w-sm mx-auto mb-8 leading-relaxed"
                    style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                  >
                    Thank you for reaching out. A member of our team will review your message and respond shortly.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsSubmitted(false)}
                    className="btn-premium-gradient-pill px-8 py-3.5 text-xs uppercase tracking-[0.08em] font-medium cursor-pointer shadow-md"
                    style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-[#E8E8E3] p-8 sm:p-10 shadow-xs">
                  <h3
                    className="text-2xl sm:text-3xl font-serif italic font-medium text-[#141413] mb-6 tracking-tight"
                    style={{ fontFamily: "'Century', 'Century Schoolbook', serif", fontStyle: "italic" }}
                  >
                    Send a Message
                  </h3>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <Input
                        label="Name"
                        placeholder="Your name"
                        error={errors.name?.message}
                        {...register('name')}
                      />
                      <Input
                        label="Email"
                        type="email"
                        placeholder="you@example.com"
                        error={errors.email?.message}
                        {...register('email')}
                      />
                    </div>

                    <Input
                      label="Subject"
                      placeholder="What is this regarding?"
                      error={errors.subject?.message}
                      {...register('subject')}
                    />

                    <TextArea
                      label="Message"
                      placeholder="Write your message here..."
                      error={errors.message?.message}
                      {...register('message')}
                    />

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-premium-gradient-pill w-full py-3.5 text-xs uppercase tracking-[0.08em] font-medium gap-2 cursor-pointer shadow-md group disabled:opacity-50"
                        style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                      >
                        <Send size={15} className="group-hover:translate-x-0.5 transition-transform" />
                        <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
