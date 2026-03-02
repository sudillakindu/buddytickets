// lib/types/profile.ts
export interface UserProfile {
  user_id: string;
  name: string;
  email: string;
  is_email_verified: boolean;
  mobile: string;
  is_mobile_verified: boolean;
  username: string;
  role: string;
  is_active: boolean;
  image_url: string | null;
  created_at: string;
  last_login_at: string | null;
}

export interface ProfileResult {
  success: boolean;
  message: string;
}

export interface ProfileFetchResult extends ProfileResult {
  profile?: UserProfile;
}

export interface ProfileImageResult extends ProfileResult {
  imageUrl?: string;
}