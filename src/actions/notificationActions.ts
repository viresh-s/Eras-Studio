'use server';

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const notificationSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  title: z.string().min(1).max(255),
  message: z.string().min(1).max(2000),
  type: z.string().max(50),
  link: z.string().max(500).optional()
});

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: string,
  link?: string
) {
  const parsed = notificationSchema.safeParse({ userId, title, message, type, link });
  if (!parsed.success) {
    throw new Error(`Validation Error: ${parsed.error.errors.map(e => e.message).join(', ')}`);
  }

  const supabase = await createClient();

  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    title,
    message,
    type,
    link,
  });

  if (error) {
    console.error('Error creating notification:', error);
    throw new Error('Failed to create notification');
  }

  // NOTE: Here is where you would integrate an email service like Resend, Sendgrid, etc.
  // Example for Resend:
  // await resend.emails.send({
  //   from: 'Eras Studio <notifications@eras.studio>',
  //   to: userEmail,
  //   subject: title,
  //   html: `<p>${message}</p>`,
  // });
  console.log(`[MOCK EMAIL SENT TO ${userId}] Subject: ${title} - Body: ${message}`);
}
