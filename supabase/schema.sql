-- =============================================
-- ERAS Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. PROFILES TABLE
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT,
  role TEXT NOT NULL DEFAULT 'User' CHECK (role IN ('Admin', 'User', 'Creator')),
  location_country TEXT,
  location_city TEXT,
  portfolio_url TEXT,
  about_me TEXT,
  profile_pic_url TEXT,
  cover_image_url TEXT,
  primary_medium TEXT,
  artist_statement TEXT,
  art_forms TEXT,
  awards TEXT,
  other_links TEXT,
  social_links JSONB DEFAULT '{}',
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =============================================
-- 2. ARTWORKS TABLE
-- =============================================
CREATE TABLE public.artworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  art_type TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  description TEXT,
  external_link TEXT,
  image_url TEXT NOT NULL,
  additional_images TEXT[] DEFAULT '{}',
  price DECIMAL(10, 2),
  status TEXT NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'For Sale', 'Not for sale', 'Sold')),
  year TEXT,
  dimensions TEXT,
  location TEXT,
  style TEXT,
  tags TEXT[] DEFAULT '{}',
  collection TEXT,
  price_visibility TEXT DEFAULT 'Show Price' CHECK (price_visibility IN ('Show Price', 'Price on Request', 'Hide Price')),
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for artworks
ALTER TABLE public.artworks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artworks are viewable by everyone"
  ON public.artworks FOR SELECT
  USING (true);

CREATE POLICY "Creators can insert own artworks"
  ON public.artworks FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own artworks"
  ON public.artworks FOR UPDATE
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can delete own artworks"
  ON public.artworks FOR DELETE
  USING (auth.uid() = creator_id);

-- =============================================
-- 3. INQUIRIES_CHATS TABLE
-- =============================================
CREATE TABLE public.inquiries_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id UUID NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES public.profiles(id),
  creator_id UUID NOT NULL REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Active', 'Rejected', 'Closed', 'Expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(artwork_id, guest_id)
);

-- RLS for inquiries_chats
ALTER TABLE public.inquiries_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chat participants can view their chats"
  ON public.inquiries_chats FOR SELECT
  USING (auth.uid() = guest_id OR auth.uid() = creator_id);

CREATE POLICY "Users can create inquiries"
  ON public.inquiries_chats FOR INSERT
  WITH CHECK (auth.uid() = guest_id);

CREATE POLICY "Participants can update chat status"
  ON public.inquiries_chats FOR UPDATE
  USING (auth.uid() = guest_id OR auth.uid() = creator_id);

-- =============================================
-- 4. MESSAGES TABLE
-- =============================================
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.inquiries_chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chat participants can view messages"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.inquiries_chats
      WHERE id = messages.chat_id
      AND (guest_id = auth.uid() OR creator_id = auth.uid())
    )
  );

CREATE POLICY "Chat participants can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.inquiries_chats
      WHERE id = messages.chat_id
      AND (guest_id = auth.uid() OR creator_id = auth.uid())
    )
  );

-- =============================================
-- 5. TRIGGER: Auto-create profile on signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone_number, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone_number', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'User')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 6. INDEXES for performance
-- =============================================
CREATE INDEX idx_artworks_creator_id ON public.artworks(creator_id);
CREATE INDEX idx_artworks_art_type ON public.artworks(art_type);
CREATE INDEX idx_artworks_status ON public.artworks(status);
CREATE INDEX idx_inquiries_guest_id ON public.inquiries_chats(guest_id);
CREATE INDEX idx_inquiries_creator_id ON public.inquiries_chats(creator_id);
CREATE INDEX idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);

-- =============================================
-- 7. ENABLE REALTIME on messages table
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- =============================================
-- 8. STORAGE BUCKETS (run separately if needed)
-- =============================================
-- Note: Create these via Supabase Dashboard > Storage:
-- Bucket: "artworks" (public)
-- Bucket: "avatars" (public)
-- 
-- Or via SQL:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('artworks', 'artworks', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
--
-- Storage policies:
-- CREATE POLICY "Anyone can view artwork images" ON storage.objects FOR SELECT USING (bucket_id = 'artworks');
-- CREATE POLICY "Authenticated users can upload artwork images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'artworks' AND auth.role() = 'authenticated');
-- CREATE POLICY "Users can update own artwork images" ON storage.objects FOR UPDATE USING (bucket_id = 'artworks' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users can delete own artwork images" ON storage.objects FOR DELETE USING (bucket_id = 'artworks' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
-- CREATE POLICY "Authenticated users can upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
-- CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users can delete own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =============================================
-- Admin policy additions
-- =============================================
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

CREATE POLICY "Admins can view all chats"
  ON public.inquiries_chats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

-- =============================================
-- 9. SAVED_ARTWORKS TABLE
-- =============================================
CREATE TABLE public.saved_artworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  artwork_id UUID NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, artwork_id)
);

-- RLS for saved_artworks
ALTER TABLE public.saved_artworks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved artworks"
  ON public.saved_artworks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save artworks"
  ON public.saved_artworks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave artworks"
  ON public.saved_artworks FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_saved_artworks_user_id ON public.saved_artworks(user_id);

-- =============================================
-- 10. NOTIFICATIONS TABLE
-- =============================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- e.g., 'UPGRADE', 'INTEREST_RAISED', 'INTEREST_ACCEPTED'
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  link TEXT, -- Optional link to redirect when clicked
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true); -- In a real app, you might restrict this to service role, but for Server Actions we allow it

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);
<<<<<<< HEAD
=======

-- =============================================
-- 11. REPORTS TABLE (Artwork Moderation & Safety)
-- =============================================
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id UUID NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
  reporter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artwork_owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT NOT NULL CHECK (reason IN (
    'Possible copyright infringement',
    'Inappropriate / NSFW content',
    'Plagiarism or stolen work',
    'Spam or misleading information',
    'Harassment or hate speech',
    'Other / Policy violation'
  )),
  details TEXT CHECK (char_length(details) <= 2000),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_user_id);

CREATE POLICY "Users can view their own submitted reports"
  ON public.reports FOR SELECT
  USING (auth.uid() = reporter_user_id);

CREATE POLICY "Admins can view all reports"
  ON public.reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

CREATE POLICY "Admins can update report status"
  ON public.reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

CREATE INDEX idx_reports_artwork_id ON public.reports(artwork_id);
CREATE INDEX idx_reports_reporter_user_id ON public.reports(reporter_user_id);
CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_reports_created_at ON public.reports(created_at);

-- =============================================
-- 12. COR (Curatorial Opportunities & Representation)
-- For complete COR tables (cor_profiles, cor_career_info, cor_skills, cor_experience,
-- cor_education, cor_links, cor_documents, cor_representation, cor_opportunities,
-- cor_applications, cor_consultations, cor_activity_logs), see: supabase/cor_schema.sql
-- =============================================



>>>>>>> cfd4433 (Updated regarding COR)
