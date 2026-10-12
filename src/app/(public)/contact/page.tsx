'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import TextArea from '@/components/ui/TextArea';
import { Send, MapPin, Mail, MessageCircle } from 'lucide-react';

const contactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Please enter a valid email'),
  subject: z.string().min(3, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type ContactForm = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async () => {
    // UI-only for now
    setIsSubmitted(true);
    reset();
  };

  return (
    <div>
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-5">Contact Us</h1>
          <p className="text-xl text-gray-500">
            We&apos;d love to hear from you. Get in touch with the Eras Studio team.
          </p>
        </div>
      </section>

      <section className="pb-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-orange-50 to-rose-50 rounded-2xl p-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                    <Mail size={18} className="text-accent-coral" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Email</h4>
                    <p className="text-gray-500 text-sm mt-0.5">hello@eras.art</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                    <MapPin size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Location</h4>
                    <p className="text-gray-500 text-sm mt-0.5">Worldwide, Remote First</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                    <MessageCircle size={18} className="text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Response Time</h4>
                    <p className="text-gray-500 text-sm mt-0.5">Within 24 hours</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="md:col-span-2">
              {isSubmitted ? (
                <div className="bg-emerald-50 rounded-2xl p-12 text-center">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <Send size={24} className="text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                  <p className="text-gray-600 mb-6">Thank you for reaching out. We&apos;ll get back to you soon.</p>
                  <Button onClick={() => setIsSubmitted(false)} variant="primary">
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgb(0,0,0,0.04)] p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Send a Message</h3>
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
                      placeholder="What's this about?"
                      error={errors.subject?.message}
                      {...register('subject')}
                    />

                    <TextArea
                      label="Message"
                      placeholder="Tell us more..."
                      error={errors.message?.message}
                      {...register('message')}
                    />

                    <Button type="submit" fullWidth>
                      <Send size={16} />
                      Send Message
                    </Button>
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
