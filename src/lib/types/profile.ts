// ─── Profile Types ────────────────────────────────────────────────────────────

// Maps 1:1 to users table columns exposed to the profile page
export interface UserProfile {
  user_id: string;
  name: string;
  email: string;
  mobile: string;
  is_mobile_verified: boolean;
  username: string;
  role: string;
  is_active: boolean;
  image_url: string | null;
  created_at: string;
  last_login_at: string | null;
}

// ─── Profile Action Return Types ──────────────────────────────────────────────

// Base result for profile mutations
export interface ProfileResult {
  success: boolean;
  message: string;
}

// Returned by getUserProfile
export interface ProfileFetchResult extends ProfileResult {
  profile?: UserProfile;
}

// Returned by uploadProfileImage
export interface ProfileImageResult extends ProfileResult {
  imageUrl?: string;
}
