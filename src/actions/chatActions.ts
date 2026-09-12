'use server';

import { createClient } from '@/lib/supabase/server';

export async function createChatSession(artworkId: string, guestId: string, creatorId: string, initialMessage: string) {
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
        status: 'Active',
      })
      .select('id')
      .single();

    if (chatError) throw new Error(chatError.message);
    chatId = newChat.id;
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
