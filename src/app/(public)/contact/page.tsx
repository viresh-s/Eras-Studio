'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import TextArea from '@/components/ui/TextArea';
import { Send } from 'lucide-react';

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
    setIsSubmitted(true);
    reset();
  };

  return (
    <div className="py-20 text-[#141413]">
      <section className="max-w-4xl mx-auto px-6 text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-serif font-bold tracking-tight text-[#141413]">
          Contact Us
        </h1>
      </section>

      <section className="pb-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div className="space-y-4">
              <div className="bg-[#FAF9F6] border border-[#E8E8E3] rounded-2xl p-6">
                <div>
                  <h4 className="font-serif font-bold text-[#141413] text-sm">Email</h4>
                  <p className="text-[#6E6E69] text-sm mt-0.5">hello@eras.art</p>
                </div>
              </div>

              <div className="bg-[#FAF9F6] border border-[#E8E8E3] rounded-2xl p-6">
                <div>
                  <h4 className="font-serif font-bold text-[#141413] text-sm">Location</h4>
                  <p className="text-[#6E6E69] text-sm mt-0.5">Worldwide, Remote First</p>
                </div>
              </div>

              <div className="bg-[#FAF9F6] border border-[#E8E8E3] rounded-2xl p-6">
                <div>
                  <h4 className="font-serif font-bold text-[#141413] text-sm">Response Time</h4>
                  <p className="text-[#6E6E69] text-sm mt-0.5">Within 24 hours</p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="md:col-span-2">
              {isSubmitted ? (
                <div className="bg-[#FAF9F6] border border-[#E8E8E3] rounded-3xl p-12 text-center">
                  <h3 className="text-2xl font-serif font-bold text-[#141413] mb-6">Message Sent</h3>
                  <Button onClick={() => setIsSubmitted(false)} variant="primary">
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-[#E8E8E3] p-8 shadow-xs">
                  <h3 className="text-xl font-serif font-bold text-[#141413] mb-6">Send a Message</h3>
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
