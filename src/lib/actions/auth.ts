"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { hashPassword, comparePassword } from "@/lib/auth/password";
import {
  createSession,
  getSession,
  destroySession,
  type SessionUser,
} from "@/lib/auth/session";
import {
  generateOtp,
  hashOtp,
  compareOtp,
  expiresAt,
  resendDelay,
  MAX_ATTEMPTS,
} from "@/lib/auth/otp";
import {
  sendSignUpOtpEmail,
  sendSignInOtpEmail,
  sendForgotPasswordOtpEmail,
  sendWelcomeEmail,
  sendPasswordChangedEmail,
} from "@/lib/auth/mail";

interface AuthResult {
  success: boolean;
  message?: string;
  token?: string;
  redirectTo?: string;
  needsVerification?: boolean;
}

interface VerifyResult {
  success: boolean;
  message?: string;
  attemptsRemaining?: number;
  redirectTo?: string;
  resetToken?: string;
  purpose?: string;
}

interface OtpStatus {
  email: string;
  purpose: string;
  canResend: boolean;
  remainingSeconds: number;
}

interface ResendResult {
  success: boolean;
  message?: string;
  remainingSeconds?: number;
}

function flowToken(): string {
  return crypto.randomUUID();
}

function flowExpiry(): string {
  return new Date(Date.now() + 30 * 60_000).toISOString();
}

async function invalidateOld(email: string, purpose: string): Promise<void> {
  await Promise.all([
    supabaseAdmin
      .from("otp_records")
      .update({ is_used: true })
      .eq("email", email)
      .eq("purpose", purpose)
      .eq("is_used", false),
    supabaseAdmin
      .from("auth_flow_tokens")
      .update({ is_used: true })
      .eq("email", email)
      .eq("purpose", purpose)
      .eq("is_used", false),
  ]);
}

async function createOtpAndToken(
  userId: string,
  email: string,
  purpose: string,
): Promise<string> {
  await invalidateOld(email, purpose);

  const otp = generateOtp();
  const hashed = await hashOtp(otp);

  await supabaseAdmin.from("otp_records").insert({
    user_id: userId,
    email,
    otp_hash: hashed,
    purpose,
    expires_at: expiresAt(),
  });

  const token = flowToken();

  await supabaseAdmin.from("auth_flow_tokens").insert({
    email,
    purpose,
    token,
    expires_at: flowExpiry(),
  });

  await sendOtpByPurpose(email, otp, purpose);
  return token;
}

async function sendOtpByPurpose(
  email: string,
  otp: string,
  purpose: string,
): Promise<void> {
  switch (purpose) {
    case "signup":
      await sendSignUpOtpEmail(email, otp);
      break;
    case "signin":
      await sendSignInOtpEmail(email, otp);
      break;
    case "forgot-password":
      await sendForgotPasswordOtpEmail(email, otp);
      break;
  }
}

export async function signUp(data: {
  name: string;
  username: string;
  email: string;
  mobile: string;
  password: string;
}): Promise<AuthResult> {
  try {
    const { name, username, email: rawEmail, mobile, password } = data;
    const email = rawEmail.toLowerCase().trim();

    if (!name || name.trim().length < 3)
      return {
        success: false,
        message: "Name must be at least 3 characters.",
      };
    if (!username || !/^[a-z0-9_]{3,}$/.test(username))
      return {
        success: false,
        message:
          "Username must be at least 3 characters (lowercase, numbers, underscores).",
      };
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return {
        success: false,
        message: "Invalid email address.",
      };
    if (!mobile || !/^\d{10}$/.test(mobile))
      return {
        success: false,
        message: "Mobile must be 10 digits.",
      };
    if (!password || password.length < 6)
      return {
        success: false,
        message: `Password must be at least 6 characters.`,
      };

    const [emailCheck, usernameCheck, mobileCheck] = await Promise.all([
      supabaseAdmin
        .from("users")
        .select("user_id")
        .eq("email", email)
        .maybeSingle(),
      supabaseAdmin
        .from("users")
        .select("user_id")
        .eq("username", username)
        .maybeSingle(),
      supabaseAdmin
        .from("users")
        .select("user_id")
        .eq("mobile", mobile)
        .maybeSingle(),
    ]);

    if (emailCheck.data)
      return {
        success: false,
        message: "Email is already registered.",
      };
    if (usernameCheck.data)
      return {
        success: false,
        message: "Username is already taken.",
      };
    if (mobileCheck.data)
      return {
        success: false,
        message: "Mobile number is already registered.",
      };

    const passwordHash = await hashPassword(password);

    const { data: user, error: insertErr } = await supabaseAdmin
      .from("users")
      .insert({
        name: name.trim(),
        username,
        email,
        mobile,
        password_hash: passwordHash,
      })
      .select("user_id")
      .single();

    if (insertErr || !user) {
      return {
        success: false,
        message: "Failed to create account. Please try again.",
      };
    }

    const token = await createOtpAndToken(user.user_id, email, "signup");

    sendWelcomeEmail(email, name.trim()).catch(() => {});

    return {
      success: true,
      message: "Account created successfully. Please verify your email.",
      token,
    };
  } catch (e) {
    console.error("signUp error:", e);
    return {
      success: false,
      message: "An unexpected error occurred.",
    };
  }
}

export async function signIn(data: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  try {
    const email = data.email.toLowerCase().trim();

    if (!email || !data.password) {
      return {
        success: false,
        message: "Email and password are required.",
      };
    }

    const { data: user } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (!user || !user.password_hash)
      return {
        success: false,
        message: "Invalid email or password.",
      };
    if (!user.is_active)
      return {
        success: false,
        message: "Your account has been deactivated.",
      };

    const match = await comparePassword(data.password, user.password_hash);
    if (!match)
      return {
        success: false,
        message: "Invalid email or password.",
      };

    if (!user.is_email_verified) {
      const token = await createOtpAndToken(user.user_id, email, "signin");
      return {
        success: false,
        needsVerification: true,
        token,
        message: "Please verify your email first.",
      };
    }

    await createSession(user);

    await supabaseAdmin
      .from("users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("user_id", user.user_id);

    return {
      success: true,
      message: "Signed in successfully.",
      redirectTo: "/",
    };
  } catch (e) {
    console.error("signIn error:", e);
    return {
      success: false,
      message: "An unexpected error occurred.",
    };
  }
}

export async function forgotPassword(data: {
  email: string;
}): Promise<AuthResult> {
  try {
    const email = data.email.toLowerCase().trim();
    if (!email)
      return {
        success: false,
        message: "Email is required.",
      };

    const { data: user } = await supabaseAdmin
      .from("users")
      .select("user_id, email")
      .eq("email", email)
      .maybeSingle();

    if (!user)
      return {
        success: false,
        message: "No account found with this email.",
      };

    const token = await createOtpAndToken(
      user.user_id,
      email,
      "forgot-password",
    );
    return {
      success: true,
      message: "Verification code sent to your email.",
      token,
    };
  } catch (e) {
    console.error("forgotPassword error:", e);
    return {
      success: false,
      message: "An unexpected error occurred.",
    };
  }
}

export async function verifyOtp(
  token: string,
  otp: string,
): Promise<VerifyResult> {
  try {
    if (!otp || otp.length !== 6) {
      return {
        success: false,
        message: "Please enter a valid 6-digit code.",
      };
    }

    const { data: ft } = await supabaseAdmin
      .from("auth_flow_tokens")
      .select("token_id, email, purpose")
      .eq("token", token)
      .eq("is_used", false)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (!ft)
      return {
        success: false,
        message: "Session expired. Please start over.",
      };

    const { data: rec } = await supabaseAdmin
      .from("otp_records")
      .select("otp_id, otp_hash, verify_attempts, user_id")
      .eq("email", ft.email)
      .eq("purpose", ft.purpose)
      .eq("is_used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!rec)
      return {
        success: false,
        message: "Code has expired. Please request a new one.",
      };

    // Lock out the OTP record if max attempts are exceeded to prevent brute force
    if (rec.verify_attempts >= MAX_ATTEMPTS) {
      await supabaseAdmin
        .from("otp_records")
        .update({ is_used: true })
        .eq("otp_id", rec.otp_id);
      return {
        success: false,
        message: "Too many attempts. Please request a new code.",
      };
    }

    const valid = await compareOtp(otp, rec.otp_hash);

    if (!valid) {
      const attempts = rec.verify_attempts + 1;
      await supabaseAdmin
        .from("otp_records")
        .update({ verify_attempts: attempts })
        .eq("otp_id", rec.otp_id);

      return {
        success: false,
        message: "Invalid code.",
        attemptsRemaining: MAX_ATTEMPTS - attempts,
      };
    }

    await Promise.all([
      supabaseAdmin
        .from("otp_records")
        .update({ is_used: true })
        .eq("otp_id", rec.otp_id),
      supabaseAdmin
        .from("auth_flow_tokens")
        .update({ is_used: true })
        .eq("token_id", ft.token_id),
    ]);

    if (ft.purpose === "signup" || ft.purpose === "signin") {
      if (rec.user_id) {
        await supabaseAdmin
          .from("users")
          .update({ is_email_verified: true })
          .eq("user_id", rec.user_id);
      }
      return {
        success: true,
        message: "Email verified successfully.",
        redirectTo: "/sign-in",
        purpose: ft.purpose,
      };
    }

    if (ft.purpose === "forgot-password") {
      const resetToken = flowToken();

      await supabaseAdmin.from("auth_flow_tokens").insert({
        email: ft.email,
        purpose: "forgot-password",
        token: resetToken,
        expires_at: new Date(Date.now() + 15 * 60_000).toISOString(),
      });

      return {
        success: true,
        message: "Code verified successfully.",
        purpose: "forgot-password",
        resetToken,
      };
    }

    return {
      success: true,
      message: "Verification successful.",
      redirectTo: "/sign-in",
    };
  } catch (e) {
    console.error("verifyOtp error:", e);
    return {
      success: false,
      message: "An unexpected error occurred.",
    };
  }
}

export async function resendOtp(token: string): Promise<ResendResult> {
  try {
    const { data: ft } = await supabaseAdmin
      .from("auth_flow_tokens")
      .select("email, purpose")
      .eq("token", token)
      .eq("is_used", false)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (!ft)
      return {
        success: false,
        message: "Session expired. Please start over.",
      };

    const { data: rec } = await supabaseAdmin
      .from("otp_records")
      .select("otp_id, resend_count, last_sent_at")
      .eq("email", ft.email)
      .eq("purpose", ft.purpose)
      .eq("is_used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!rec)
      return {
        success: false,
        message: "No active session found.",
      };

    const delay = resendDelay(rec.resend_count);
    const canResendAt = new Date(rec.last_sent_at).getTime() + delay * 1000;
    const now = Date.now();

    if (now < canResendAt) {
      return {
        success: false,
        message: "Please wait before requesting a new code.",
        remainingSeconds: Math.ceil((canResendAt - now) / 1000),
      };
    }

    const otp = generateOtp();
    const hashed = await hashOtp(otp);
    const newCount = rec.resend_count + 1;

    // Re-use the existing active OTP record but update its hash, delay counter, and expiry
    await supabaseAdmin
      .from("otp_records")
      .update({
        otp_hash: hashed,
        resend_count: newCount,
        last_sent_at: new Date().toISOString(),
        expires_at: expiresAt(),
        verify_attempts: 0,
      })
      .eq("otp_id", rec.otp_id);

    await sendOtpByPurpose(ft.email, otp, ft.purpose);

    return {
      success: true,
      message: "A new code has been sent to your email.",
      remainingSeconds: resendDelay(newCount),
    };
  } catch (e) {
    console.error("resendOtp error:", e);
    return {
      success: false,
      message: "An unexpected error occurred.",
    };
  }
}

export async function resetPassword(
  resetToken: string,
  data: { password: string; confirmPassword: string },
): Promise<AuthResult> {
  try {
    if (!data.password || data.password.length < 6) {
      return {
        success: false,
        message: `Password must be at least 6 characters.`,
      };
    }

    if (data.password !== data.confirmPassword) {
      return {
        success: false,
        message: "Passwords do not match.",
      };
    }

    const { data: ft } = await supabaseAdmin
      .from("auth_flow_tokens")
      .select("token_id, email")
      .eq("token", resetToken)
      .eq("purpose", "forgot-password")
      .eq("is_used", false)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (!ft)
      return {
        success: false,
        message: "Reset link expired. Please try again.",
      };

    const passwordHash = await hashPassword(data.password);

    const { error } = await supabaseAdmin
      .from("users")
      .update({ password_hash: passwordHash })
      .eq("email", ft.email);

    if (error)
      return {
        success: false,
        message: "Failed to reset password.",
      };

    await supabaseAdmin
      .from("auth_flow_tokens")
      .update({ is_used: true })
      .eq("token_id", ft.token_id);

    const { data: resetUser } = await supabaseAdmin
      .from("users")
      .select("name")
      .eq("email", ft.email)
      .single();

    if (resetUser?.name) {
      sendPasswordChangedEmail(ft.email, resetUser.name).catch(() => {});
    }

    return {
      success: true,
      message: "Password reset successfully.",
    };
  } catch (e) {
    console.error("resetPassword error:", e);
    return {
      success: false,
      message: "An unexpected error occurred.",
    };
  }
}

export async function getVerifyEmailData(
  token: string,
): Promise<OtpStatus | null> {
  try {
    const { data: ft } = await supabaseAdmin
      .from("auth_flow_tokens")
      .select("email, purpose")
      .eq("token", token)
      .eq("is_used", false)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (!ft) return null;

    const { data: rec } = await supabaseAdmin
      .from("otp_records")
      .select("resend_count, last_sent_at")
      .eq("email", ft.email)
      .eq("purpose", ft.purpose)
      .eq("is_used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let canResend = true;
    let remainingSeconds = 0;

    if (rec) {
      const canResendAt =
        new Date(rec.last_sent_at).getTime() +
        resendDelay(rec.resend_count) * 1000;
      const now = Date.now();

      if (now < canResendAt) {
        canResend = false;
        remainingSeconds = Math.ceil((canResendAt - now) / 1000);
      }
    }

    return {
      email: ft.email,
      purpose: ft.purpose,
      canResend,
      remainingSeconds,
    };
  } catch {
    return null;
  }
}

export async function validateResetToken(
  t: string,
): Promise<{ email: string } | null> {
  const { data } = await supabaseAdmin
    .from("auth_flow_tokens")
    .select("email")
    .eq("token", t)
    .eq("purpose", "forgot-password")
    .eq("is_used", false)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  return data;
}

export async function signOut(): Promise<void> {
  await destroySession();
}

export async function getSessionUser(): Promise<SessionUser | null> {
  return getSession();
}
