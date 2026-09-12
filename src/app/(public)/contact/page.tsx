'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import TextArea from '@/components/ui/TextArea';
import Card from '@/components/ui/Card';
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
      <section className="border-b-4 border-brand-black bg-white">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h1 className="font-heading text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl text-brand-gray">
            We&apos;d love to hear from you. Get in touch with the ERAS team.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div className="space-y-4">
              <Card className="bg-brand-yellow">
                <div className="flex items-start gap-3">
                  <Mail size={20} className="flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-heading font-bold">Email</h4>
                    <p className="text-sm">hello@eras.art</p>
                  </div>
                </div>
              </Card>

              <Card className="bg-brand-pink">
                <div className="flex items-start gap-3">
                  <MapPin size={20} className="flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-heading font-bold">Location</h4>
                    <p className="text-sm">Worldwide, Remote First</p>
                  </div>
                </div>
              </Card>

              <Card className="bg-brand-blue text-white">
                <div className="flex items-start gap-3">
                  <MessageCircle size={20} className="flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-heading font-bold">Response Time</h4>
                    <p className="text-sm">Within 24 hours</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="md:col-span-2">
              {isSubmitted ? (
                <Card className="text-center py-12 bg-brand-green">
                  <Send size={48} className="mx-auto mb-4" />
                  <h3 className="font-heading text-2xl font-bold mb-2">Message Sent!</h3>
                  <p className="mb-4">Thank you for reaching out. We&apos;ll get back to you soon.</p>
                  <Button onClick={() => setIsSubmitted(false)} variant="black">
                    Send Another Message
                  </Button>
                </Card>
              ) : (
                <Card>
                  <h3 className="font-heading text-2xl font-bold mb-6">Send a Message</h3>
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
                      <Send size={18} />
                      Send Message
                    </Button>
                  </form>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
