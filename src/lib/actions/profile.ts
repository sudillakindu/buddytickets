"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSession, createSession } from "@/lib/auth/session";
import { hashPassword, comparePassword } from "@/lib/auth/password";
import { sendPasswordChangedEmail } from "@/lib/auth/mail";

interface ActionResult {
  success: boolean;
  message: string;
}

export interface UserProfile {
  user_id: string;
  name: string;
  email: string;
  mobile: string;
  username: string;
  image_url: string | null;
  role: string;
  created_at: string;
}

// ─── GET USER PROFILE ─────────────────────────────────────────────────────────

export async function getUserProfile(): Promise<{
  success: boolean;
  message: string;
  data: UserProfile | null;
}> {
  try {
    const session = await getSession();
    if (!session?.sub) {
      return { success: false, message: "Unauthorized. Please sign in.", data: null };
    }

    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("user_id, name, email, mobile, username, image_url, role, created_at")
      .eq("user_id", session.sub)
      .single();

    if (error || !user) {
      return { success: false, message: "Failed to fetch profile.", data: null };
    }

    return { success: true, message: "Profile fetched.", data: user as UserProfile };
  } catch (e) {
    console.error("getUserProfile error:", e);
    return { success: false, message: "An unexpected error occurred.", data: null };
  }
}

// ─── UPDATE PROFILE ───────────────────────────────────────────────────────────

export async function updateProfile(data: {
  name: string;
  mobile: string;
  image_url: string | null;
}): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session?.sub) {
      return { success: false, message: "Unauthorized. Please sign in." };
    }

    const { name, mobile, image_url } = data;

    // Validate name
    if (!name || name.trim().length < 3) {
      return { success: false, message: "Name must be at least 3 characters." };
    }

    // Validate mobile
    if (!mobile || !/^\d{10}$/.test(mobile)) {
      return { success: false, message: "Mobile must be 10 digits." };
    }

    // Check mobile uniqueness (excluding current user)
    const { data: mobileCheck } = await supabaseAdmin
      .from("users")
      .select("user_id")
      .eq("mobile", mobile)
      .neq("user_id", session.sub)
      .maybeSingle();

    if (mobileCheck) {
      return { success: false, message: "Mobile number is already registered by another user." };
    }

    // Update user
    const { error } = await supabaseAdmin
      .from("users")
      .update({
        name: name.trim(),
        mobile,
        image_url: image_url || null,
      })
      .eq("user_id", session.sub);

    if (error) {
      return { success: false, message: "Failed to update profile." };
    }

    // Refresh session with updated data
    await createSession({
      user_id: session.sub,
      name: name.trim(),
      email: session.email,
      role: session.role,
      image_url: image_url || null,
    });

    return { success: true, message: "Profile updated successfully." };
  } catch (e) {
    console.error("updateProfile error:", e);
    return { success: false, message: "An unexpected error occurred." };
  }
}

// ─── CHANGE PASSWORD ──────────────────────────────────────────────────────────

export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session?.sub) {
      return { success: false, message: "Unauthorized. Please sign in." };
    }

    const { currentPassword, newPassword } = data;

    if (!currentPassword || !newPassword) {
      return { success: false, message: "Both current and new passwords are required." };
    }

    if (newPassword.length < 6) {
      return { success: false, message: "New password must be at least 6 characters." };
    }

    if (currentPassword === newPassword) {
      return { success: false, message: "New password must be different from the current one." };
    }

    // Fetch current password hash
    const { data: user, error: fetchErr } = await supabaseAdmin
      .from("users")
      .select("password_hash, email, name")
      .eq("user_id", session.sub)
      .single();

    if (fetchErr || !user?.password_hash) {
      return { success: false, message: "Failed to verify current password." };
    }

    // Verify current password
    const match = await comparePassword(currentPassword, user.password_hash);
    if (!match) {
      return { success: false, message: "Current password is incorrect." };
    }

    // Hash new password
    const newHash = await hashPassword(newPassword);

    // Update password
    const { error: updateErr } = await supabaseAdmin
      .from("users")
      .update({ password_hash: newHash })
      .eq("user_id", session.sub);

    if (updateErr) {
      return { success: false, message: "Failed to update password." };
    }

    // Send password changed notification email (non-blocking)
    sendPasswordChangedEmail(user.email, user.name).catch(() => {});

    return { success: true, message: "Password changed successfully." };
  } catch (e) {
    console.error("changePassword error:", e);
    return { success: false, message: "An unexpected error occurred." };
  }
}
