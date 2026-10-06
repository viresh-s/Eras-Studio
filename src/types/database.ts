export type UserRole = 'Admin' | 'User' | 'Creator';
export type ArtworkStatus = 'Available' | 'For Sale' | 'Not for sale' | 'Sold';
export type ChatStatus = 'Pending' | 'Active' | 'Closed';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  role: UserRole;
  location_country: string | null;
  location_city: string | null;
  portfolio_url: string | null;
  about_me: string | null;
  profile_pic_url: string | null;
  cover_image_url: string | null;
  primary_medium: string | null;
  artist_statement: string | null;
  art_forms: string | null;
  awards: string | null;
  other_links: string | null;
  social_links: SocialLinks;
  is_premium: boolean;
  created_at: string;
}

export interface SocialLinks {
  instagram?: string;
  twitter?: string;
  website?: string;
  [key: string]: string | undefined;
}

export interface Artwork {
  id: string;
  creator_id: string;
  title: string;
  art_type: string;
  artist_name: string;
  description: string | null;
  external_link: string | null;
  image_url: string;
  additional_images: string[];
  price: number | null;
  status: ArtworkStatus;
  year: string | null;
  dimensions: string | null;
  location: string | null;
  style: string | null;
  tags: string[];
  collection: string | null;
  price_visibility: string | null;
  is_published: boolean;
  created_at: string;
}

export interface ArtworkWithCreator extends Artwork {
  profiles: Pick<Profile, 'full_name' | 'profile_pic_url'>;
}

export interface InquiryChat {
  id: string;
  artwork_id: string;
  guest_id: string;
  creator_id: string;
  status: ChatStatus;
  created_at: string;
}

export interface InquiryChatWithDetails extends InquiryChat {
  artworks: Pick<Artwork, 'title' | 'image_url'>;
  guest: Pick<Profile, 'full_name' | 'profile_pic_url'>;
  creator: Pick<Profile, 'full_name' | 'profile_pic_url'>;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface MessageWithSender extends Message {
  profiles: Pick<Profile, 'full_name' | 'profile_pic_url'>;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
}
