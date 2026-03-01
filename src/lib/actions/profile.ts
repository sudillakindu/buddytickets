// lib/actions/profile.ts
'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { comparePassword, hashPassword } from '@/lib/utils/password';
import { uploadProfileImageToStorage } from '@/lib/utils/profile-image-upload';
import { getSession } from '@/lib/utils/session';
import type {
  UserProfile,
  ProfileResult,
  ProfileFetchResult,
  ProfileImageResult,
} from '@/lib/types/profile';

// ─── Internal Helpers ────────────────────────────────────────────────────────

async function getAuthenticatedUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.sub ?? null;
}

// ─── Queries (GET) ───────────────────────────────────────────────────────────

export async function getUserProfile(): Promise<ProfileFetchResult> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return { success: false, message: 'Unauthorized.' };

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('user_id, name, email, mobile, is_mobile_verified, username, role, is_active, image_url, created_at, last_login_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return { success: false, message: 'Failed to load profile.' };

    return { success: true, message: 'Profile loaded.', profile: data as UserProfile };
  } catch (err) {
    console.error('[getUserProfile]', err);
    return { success: false, message: 'An unexpected error occurred.' };
  }
}

// ─── Mutations (POST/PUT/DELETE) ─────────────────────────────────────────────

export async function uploadProfileImage(formData: FormData): Promise<ProfileImageResult> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return { success: false, message: 'Unauthorized.' };

    const file = formData.get('file');
    if (!(file instanceof File)) return { success: false, message: 'Please select a valid image.' };

    const upload = await uploadProfileImageToStorage(file, userId);
    if (!upload.success || !upload.imageUrl) return { success: false, message: upload.message };

    const { error } = await supabaseAdmin
      .from('users')
      .update({ image_url: upload.imageUrl })
      .eq('user_id', userId);

    if (error) {
      console.error('[uploadProfileImage] DB update error:', error.message);
      return { success: false, message: 'Image uploaded but failed to update profile.' };
    }

    return { success: true, message: 'Profile image updated.', imageUrl: upload.imageUrl };
  } catch (err) {
    console.error('[uploadProfileImage]', err);
    return { success: false, message: 'An unexpected error occurred.' };
  }
}

export async function updateProfile(data: {
  name: string;
  username: string;
  mobile: string;
  image_url: string | null;
}): Promise<ProfileResult> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return { success: false, message: 'Unauthorized.' };

    const name = data.name.trim();
    const username = data.username.trim().toLowerCase();
    const mobile = data.mobile.trim();
    const imageUrl = data.image_url?.trim() || null;

    if (!name || name.length < 3) return { success: false, message: 'Name must be at least 3 characters.' };
    if (!/^[a-z0-9_]{3,}$/.test(username)) return { success: false, message: 'Username must be at least 3 characters (a–z, 0–9, _).' };
    if (!/^\d{10}$/.test(mobile)) return { success: false, message: 'Mobile must be 10 digits.' };

    const { data: current, error: fetchErr } = await supabaseAdmin
      .from('users')
      .select('mobile')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchErr || !current) return { success: false, message: 'Unable to validate profile update.' };

    const [{ data: takenUsername }, { data: takenMobile }] = await Promise.all([
      supabaseAdmin.from('users').select('user_id').eq('username', username).neq('user_id', userId).maybeSingle(),
      supabaseAdmin.from('users').select('user_id').eq('mobile', mobile).neq('user_id', userId).maybeSingle(),
    ]);

    if (takenUsername) return { success: false, message: 'Username is already taken.' };
    if (takenMobile) return { success: false, message: 'Mobile number is already registered.' };

    const payload: Record<string, unknown> = { name, username, mobile, image_url: imageUrl };
    if (current.mobile !== mobile) payload.is_mobile_verified = false;

    const { error: updateErr } = await supabaseAdmin.from('users').update(payload).eq('user_id', userId);

    if (updateErr) return { success: false, message: 'Failed to update profile.' };

    return { success: true, message: 'Profile updated successfully.' };
  } catch (err) {
    console.error('[updateProfile]', err);
    return { success: false, message: 'An unexpected error occurred.' };
  }
}

export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}): Promise<ProfileResult> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return { success: false, message: 'Unauthorized.' };

    const { currentPassword, newPassword } = data;

    if (!currentPassword) return { success: false, message: 'Current password is required.' };
    if (!newPassword || newPassword.length < 6) return { success: false, message: 'New password must be at least 6 characters.' };
    if (newPassword === currentPassword) return { success: false, message: 'New password must differ from current password.' };

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('password_hash')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !user?.password_hash) return { success: false, message: 'Failed to validate current password.' };

    const isValid = await comparePassword(currentPassword, user.password_hash);
    if (!isValid) return { success: false, message: 'Current password is incorrect.' };

    const newHash = await hashPassword(newPassword);
    const { error: updateErr } = await supabaseAdmin.from('users').update({ password_hash: newHash }).eq('user_id', userId);

    if (updateErr) return { success: false, message: 'Failed to change password.' };

    return { success: true, message: 'Password changed successfully.' };
  } catch (err) {
    console.error('[changePassword]', err);
    return { success: false, message: 'An unexpected error occurred.' };
  }
}