'use server';

import { createClient } from '@/lib/supabase/server';
import { createNotification } from './notificationActions';
import { z } from 'zod';

const createChatSchema = z.object({
  artworkId: z.string().uuid("Invalid artwork ID"),
  guestId: z.string().uuid("Invalid guest ID"),
  creatorId: z.string().uuid("Invalid creator ID"),
  initialMessage: z.string().min(1, "Message cannot be empty").max(1000, "Message too long")
});

const sendMessageSchema = z.object({
  chatId: z.string().uuid("Invalid chat ID"),
  senderId: z.string().uuid("Invalid sender ID"),
  content: z.string().min(1, "Message cannot be empty").max(1000, "Message too long")
});

const acceptChatSchema = z.object({
  chatId: z.string().uuid("Invalid chat ID")
});

export async function createChatSession(artworkId: string, guestId: string, creatorId: string, initialMessage: string) {
  // Validate inputs
  const parsed = createChatSchema.safeParse({ artworkId, guestId, creatorId, initialMessage });
  if (!parsed.success) {
    throw new Error(`Validation Error: ${parsed.error.errors.map(e => e.message).join(', ')}`);
  }
  const supabase = await createClient();

  // Check if chat already exists
  const { data: existingChat } = await supabase
    .from('inquiries_chats')
    .select('id')
    .eq('artwork_id', artworkId)
    .eq('guest_id', guestId)
    .single();

  let chatId: string;

  if (existingChat) {
    chatId = existingChat.id;
  } else {
    // Create new chat
    const { data: newChat, error: chatError } = await supabase
      .from('inquiries_chats')
      .insert({
        artwork_id: artworkId,
        guest_id: guestId,
        creator_id: creatorId,
        status: 'Pending',
      })
      .select('id')
      .single();

    if (chatError) throw new Error(chatError.message);
    chatId = newChat.id;

    // Send notification to creator
    await createNotification(
      creatorId,
      'New Interest Received',
      `A collector is interested in one of your artworks.`,
      'INTEREST_RAISED',
      `/messages?chatId=${chatId}`
    );
  }

  // Send first message
  const { error: msgError } = await supabase
    .from('messages')
    .insert({
      chat_id: chatId,
      sender_id: guestId,
      content: initialMessage,
    });

  if (msgError) throw new Error(msgError.message);

  return chatId;
}

export async function sendMessage(chatId: string, senderId: string, content: string) {
  const parsed = sendMessageSchema.safeParse({ chatId, senderId, content });
  if (!parsed.success) {
    throw new Error(`Validation Error: ${parsed.error.errors.map(e => e.message).join(', ')}`);
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('messages')
    .insert({
      chat_id: chatId,
      sender_id: senderId,
      content,
    });

  if (error) {
    throw new Error(error.message);
  }
}

export async function acceptChatRequest(chatId: string) {
  const parsed = acceptChatSchema.safeParse({ chatId });
  if (!parsed.success) {
    throw new Error(`Validation Error: ${parsed.error.errors.map(e => e.message).join(', ')}`);
  }

  const supabase = await createClient();

  const { data: chatData, error: fetchError } = await supabase
    .from('inquiries_chats')
    .select('guest_id, artworks(title)')
    .eq('id', chatId)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const { error } = await supabase
    .from('inquiries_chats')
    .update({ status: 'Active' })
    .eq('id', chatId);

  if (error) throw new Error(error.message);

  if (chatData) {
    const artworkTitle = chatData.artworks?.[0]?.title || 'an artwork';
    await createNotification(
      chatData.guest_id,
      'Interest Accepted',
      `Your interest in ${artworkTitle} was accepted! You can now message the creator.`,
      'INTEREST_ACCEPTED',
      `/messages?chatId=${chatId}`
    );
  }
}
