'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';

import { comparePassword, hashPassword } from '@/lib/utils/password';
import { uploadProfileImageToStorage } from '@/lib/utils/profile-image-upload';

import { getSession } from '@/lib/utils/session';

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

interface ProfileResult {
  success: boolean;
  message: string;
}

interface ProfileFetchResult extends ProfileResult {
  profile?: UserProfile;
}

interface ProfileImageResult extends ProfileResult {
  imageUrl?: string;
}

async function getCurrentUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.sub ?? null;
}

export async function getUserProfile(): Promise<ProfileFetchResult> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, message: 'Unauthorized access.' };

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('user_id, name, email, mobile, is_mobile_verified, username, role, is_active, image_url, created_at, last_login_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return { success: false, message: 'Failed to load profile data.' };

    return { success: true, message: 'Profile loaded successfully.', profile: data as UserProfile };
  } catch (error) {
    console.error('getUserProfile error:', error);
    return { success: false, message: 'An unexpected error occurred.' };
  }
}

export async function uploadProfileImage(formData: FormData): Promise<ProfileImageResult> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, message: 'Unauthorized access.' };

    const file = formData.get('file');
    if (!(file instanceof File)) return { success: false, message: 'Please select a valid image file.' };

    const result = await uploadProfileImageToStorage(file, userId);
    if (!result.success || !result.imageUrl) return { success: false, message: result.message };

    return { success: true, message: result.message, imageUrl: result.imageUrl };
  } catch (error) {
    console.error('uploadProfileImage action error:', error);
    return { success: false, message: 'An unexpected error occurred.' };
  }
}

export async function updateProfile(data: { name: string; username: string; mobile: string; image_url: string | null }): Promise<ProfileResult> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, message: 'Unauthorized access.' };

    const name = data.name.trim();
    const username = data.username.trim().toLowerCase();
    const mobile = data.mobile.trim();
    const imageUrl = data.image_url?.trim() || null;

    if (!name || name.length < 3) return { success: false, message: 'Name must be at least 3 characters.' };
    if (!/^[a-z0-9_]{3,}$/.test(username)) return { success: false, message: 'Username must be at least 3 characters (lowercase, numbers, underscores).' };
    if (!/^\d{10}$/.test(mobile)) return { success: false, message: 'Mobile must be 10 digits.' };

    const { data: currentUser, error: currentError } = await supabaseAdmin.from('users').select('mobile').eq('user_id', userId).maybeSingle();
    if (currentError || !currentUser) return { success: false, message: 'Unable to validate profile update.' };

    // Parallel execution for checking conflicts to improve performance
    const [{ data: usernameOwner }, { data: mobileOwner }] = await Promise.all([
      supabaseAdmin.from('users').select('user_id').eq('username', username).neq('user_id', userId).maybeSingle(),
      supabaseAdmin.from('users').select('user_id').eq('mobile', mobile).neq('user_id', userId).maybeSingle(),
    ]);

    if (usernameOwner) return { success: false, message: 'Username is already taken.' };
    if (mobileOwner) return { success: false, message: 'Mobile number is already registered.' };

    const updatePayload: any = { name, username, mobile, image_url: imageUrl };
    if (currentUser.mobile !== mobile) updatePayload.is_mobile_verified = false;

    const { error: updateError } = await supabaseAdmin.from('users').update(updatePayload).eq('user_id', userId);
    if (updateError) return { success: false, message: 'Failed to update profile.' };

    return { success: true, message: 'Profile updated successfully.' };
  } catch (error) {
    console.error('updateProfile error:', error);
    return { success: false, message: 'An unexpected error occurred.' };
  }
}

export async function changePassword(data: { currentPassword: string; newPassword: string }): Promise<ProfileResult> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, message: 'Unauthorized access.' };

    const { currentPassword, newPassword } = data;
    if (!currentPassword) return { success: false, message: 'Current password is required.' };
    if (!newPassword || newPassword.length < 6) return { success: false, message: 'New password must be at least 6 characters.' };
    if (newPassword === currentPassword) return { success: false, message: 'New password must be different from current password.' };

    const { data: user, error } = await supabaseAdmin.from('users').select('password_hash').eq('user_id', userId).maybeSingle();
    if (error || !user?.password_hash) return { success: false, message: 'Failed to validate current password.' };

    const isValidCurrent = await comparePassword(currentPassword, user.password_hash);
    if (!isValidCurrent) return { success: false, message: 'Current password is incorrect.' };

    const passwordHash = await hashPassword(newPassword);
    const { error: updateError } = await supabaseAdmin.from('users').update({ password_hash: passwordHash }).eq('user_id', userId);

    if (updateError) return { success: false, message: 'Failed to change password.' };

    return { success: true, message: 'Password changed successfully.' };
  } catch (error) {
    console.error('changePassword error:', error);
    return { success: false, message: 'An unexpected error occurred.' };
  }
}