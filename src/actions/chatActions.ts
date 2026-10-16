'use server';

import { requireAuth } from '@/lib/security/authGuard';
import { checkRateLimit } from '@/lib/security/rateLimiter';
import { sanitizeText } from '@/lib/security/validators';
import { securityLogger } from '@/lib/security/logger';
import { createNotification } from './notificationActions';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const createChatSchema = z.object({
  artworkId: z.string().uuid("Invalid artwork ID"),
  guestId: z.string().uuid("Invalid guest ID").optional(),
  creatorId: z.string().uuid("Invalid creator ID"),
  initialMessage: z.string().min(1, "Message cannot be empty").max(1000, "Message too long")
});

const sendMessageSchema = z.object({
  chatId: z.string().uuid("Invalid chat ID"),
  senderId: z.string().uuid("Invalid sender ID").optional(),
  content: z.string().min(1, "Message cannot be empty").max(1000, "Message too long")
});

const acceptChatSchema = z.object({
  chatId: z.string().uuid("Invalid chat ID")
});

const rejectChatSchema = z.object({
  chatId: z.string().uuid("Invalid chat ID")
});

export async function createChatSession(
  artworkId: string,
  _optionalGuestId: string,
  creatorId: string,
  initialMessage: string
) {
  // 1. Strict Server Authentication
  const { user, supabase } = await requireAuth({ requireActive: true });

  // 2. Rate Limiting for Chat Requests
  const rateLimit = checkRateLimit(`chat:create:${user.id}`, {
    maxRequests: 10,
    windowSeconds: 900,
  });
  if (!rateLimit.allowed) {
    securityLogger.alert('RATE_LIMIT_EXCEEDED_CHAT_CREATE', { userId: user.id });
    throw new Error('Too many interest requests. Please wait a few minutes before submitting another.');
  }

  // 3. Schema Validation
  const parsed = createChatSchema.safeParse({ artworkId, creatorId, initialMessage });
  if (!parsed.success) {
    throw new Error(`Validation Error: ${parsed.error.errors.map(e => e.message).join(', ')}`);
  }

  // 4. Sanitize Message
  const sanitizedMessage = sanitizeText(initialMessage, 1000);

  // 5. Check if chat already exists
  const { data: existingChat } = await supabase
    .from('inquiries_chats')
    .select('id, status, created_at')
    .eq('artwork_id', artworkId)
    .eq('guest_id', user.id)
    .single();

  let chatId: string;

  if (existingChat) {
    chatId = existingChat.id;
    
    const isExpired = existingChat.status === 'Pending' && 
      (new Date().getTime() - new Date(existingChat.created_at).getTime()) / (1000 * 60 * 60 * 24) > 5;
      
    if (existingChat.status === 'Rejected' || existingChat.status === 'Closed' || isExpired) {
      await supabase
        .from('inquiries_chats')
        .update({ status: 'Pending', created_at: new Date().toISOString() })
        .eq('id', chatId);

      await supabase.from('messages').delete().eq('chat_id', chatId);
      
      await createNotification(
        creatorId,
        'Interest Renewed',
        `A collector has renewed their interest in your artwork.`,
        'INTEREST_RAISED',
        `/messages?chatId=${chatId}`
      );
    }
  } else {
    // Insert new chat with server-enforced guest identity
    const { data: newChat, error: chatError } = await supabase
      .from('inquiries_chats')
      .insert({
        artwork_id: artworkId,
        guest_id: user.id, // Strictly derived from auth session
        creator_id: creatorId,
        status: 'Pending',
      })
      .select('id')
      .single();

    if (chatError) {
      securityLogger.alert('CHAT_CREATE_ERROR', { userId: user.id, error: chatError.message });
      throw new Error('Failed to create inquiry.');
    }
    chatId = newChat.id;

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
      sender_id: user.id,
      content: sanitizedMessage,
    });

  if (msgError) {
    securityLogger.alert('CHAT_INITIAL_MSG_ERROR', { chatId, userId: user.id, error: msgError.message });
    throw new Error('Failed to send initial message.');
  }

  securityLogger.info('CHAT_SESSION_CREATED', { chatId, guestId: user.id, creatorId });
  return chatId;
}

export async function sendMessage(chatId: string, _optionalSenderId: string, content: string) {
  // 1. Strict Server Authentication
  const { user, supabase } = await requireAuth({ requireActive: true });

  // 2. Rate Limiting for Chat Messages (60 msgs / min)
  const rateLimit = checkRateLimit(`message:send:${user.id}`, {
    maxRequests: 60,
    windowSeconds: 60,
  });
  if (!rateLimit.allowed) {
    securityLogger.alert('RATE_LIMIT_EXCEEDED_MESSAGE_SEND', { userId: user.id });
    throw new Error('Message rate limit reached. Please slow down.');
  }

  // 3. Validate Inputs
  const parsed = sendMessageSchema.safeParse({ chatId, content });
  if (!parsed.success) {
    throw new Error(`Validation Error: ${parsed.error.errors.map(e => e.message).join(', ')}`);
  }

  // 4. Verify Participation & Chat Status (Prevents Unauthorized Chat Injection)
  const { data: chat, error: chatError } = await supabase
    .from('inquiries_chats')
    .select('id, guest_id, creator_id, status')
    .eq('id', chatId)
    .single();

  if (chatError || !chat) {
    securityLogger.alert('MESSAGE_SEND_UNKNOWN_CHAT', { chatId, userId: user.id });
    throw new Error('Chat session not found.');
  }

  const isParticipant = chat.guest_id === user.id || chat.creator_id === user.id;
  if (!isParticipant) {
    securityLogger.alert('UNAUTHORIZED_CHAT_INJECTION_ATTEMPT', { chatId, userId: user.id });
    throw new Error('You are not authorized to send messages in this chat.');
  }

  if (chat.status !== 'Active' && chat.status !== 'Pending') {
    throw new Error('This chat session is no longer active.');
  }

  // 5. Sanitize Content
  const sanitizedContent = sanitizeText(content, 1000);

  // 6. Insert Message
  const { error } = await supabase
    .from('messages')
    .insert({
      chat_id: chatId,
      sender_id: user.id, // Strictly server-enforced
      content: sanitizedContent,
    });

  if (error) {
    securityLogger.alert('MESSAGE_INSERT_ERROR', { chatId, userId: user.id, error: error.message });
    throw new Error('Failed to send message.');
  }
}

export async function acceptChatRequest(chatId: string) {
  const { user, supabase } = await requireAuth({ requireActive: true });

  const parsed = acceptChatSchema.safeParse({ chatId });
  if (!parsed.success) {
    throw new Error(`Validation Error: ${parsed.error.errors.map(e => e.message).join(', ')}`);
  }

  // Verify caller is the creator of this chat
  const { data: chatData, error: fetchError } = await supabase
    .from('inquiries_chats')
    .select('guest_id, creator_id, artworks(title)')
    .eq('id', chatId)
    .single();

  if (fetchError || !chatData) {
    throw new Error('Chat not found.');
  }

  if (chatData.creator_id !== user.id) {
    securityLogger.alert('UNAUTHORIZED_CHAT_ACCEPT_ATTEMPT', { chatId, userId: user.id });
    throw new Error('Only the artwork creator can accept this request.');
  }

  const { error } = await supabase
    .from('inquiries_chats')
    .update({ status: 'Active' })
    .eq('id', chatId);

  if (error) {
    securityLogger.alert('CHAT_ACCEPT_ERROR', { chatId, userId: user.id, error: error.message });
    throw new Error('Failed to accept chat.');
  }

  securityLogger.info('CHAT_ACCEPTED', { chatId, creatorId: user.id });

  const artworkObj = Array.isArray(chatData.artworks) ? chatData.artworks[0] : chatData.artworks;
  const artworkTitle = (artworkObj as any)?.title || 'an artwork';
  await createNotification(
    chatData.guest_id,
    'Interest Accepted',
    `Your interest in ${artworkTitle} was accepted! You can now message the creator.`,
    'INTEREST_ACCEPTED',
    `/messages?chatId=${chatId}`
  );

  revalidatePath('/messages');
}

export async function rejectChatRequest(chatId: string) {
  const { user, supabase } = await requireAuth({ requireActive: true });

  const parsed = rejectChatSchema.safeParse({ chatId });
  if (!parsed.success) {
    throw new Error(`Validation Error: ${parsed.error.errors.map(e => e.message).join(', ')}`);
  }

  // Verify caller is the creator of this chat
  const { data: chatData, error: fetchError } = await supabase
    .from('inquiries_chats')
    .select('guest_id, creator_id, artworks(title)')
    .eq('id', chatId)
    .single();

  if (fetchError || !chatData) {
    throw new Error('Chat not found.');
  }

  if (chatData.creator_id !== user.id) {
    securityLogger.alert('UNAUTHORIZED_CHAT_REJECT_ATTEMPT', { chatId, userId: user.id });
    throw new Error('Only the artwork creator can decline this request.');
  }

  const { error } = await supabase
    .from('inquiries_chats')
    .update({ status: 'Rejected' })
    .eq('id', chatId);

  if (error) {
    securityLogger.alert('CHAT_REJECT_ERROR', { chatId, userId: user.id, error: error.message });
    throw new Error('Failed to decline chat.');
  }

  securityLogger.info('CHAT_REJECTED', { chatId, creatorId: user.id });

  const artworkObj = Array.isArray(chatData.artworks) ? chatData.artworks[0] : chatData.artworks;
  const artworkTitle = (artworkObj as any)?.title || 'an artwork';
  await createNotification(
    chatData.guest_id,
    'Interest Declined',
    `The creator is not proceeding with your interest in ${artworkTitle} at this time.`,
    'INTEREST_REJECTED',
    `/messages`
  );
}
