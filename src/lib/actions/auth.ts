"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import {
  generateOtp,
  hashOtp,
  compareOtp,
  expiresAt,
  resendDelay,
  MAX_ATTEMPTS,
} from "@/lib/utils/otp";
import { hashPassword, comparePassword } from "@/lib/utils/password";
import {
  sendSignUpOtpEmail,
  sendSignInOtpEmail,
  sendForgotPasswordOtpEmail,
  sendWelcomeEmail,
  sendPasswordChangedEmail,
} from "@/lib/utils/mail";
import {
  createSession,
  getSession,
  destroySession,
  type SessionUser,
} from "@/lib/utils/session";
import type {
  AuthResult,
  VerifyResult,
  ResendResult,
  OtpStatus,
  DataFetchResult,
} from "@/lib/types/auth";

const DASHBOARD_ROLES = new Set(["SYSTEM", "ORGANIZER", "STAFF"]);

function newToken(): string {
  return crypto.randomUUID();
}

function flowExpiry(): string {
  return new Date(Date.now() + 30 * 60_000).toISOString();
}

function resetExpiry(): string {
  return new Date(Date.now() + 15 * 60_000).toISOString();
}

async function invalidateActiveRecords(
  email: string,
  purpose: string,
): Promise<void> {
  await Promise.all([
    getSupabaseAdmin()
      .from("otp_records")
      .update({ is_used: true })
      .eq("email", email)
      .eq("purpose", purpose)
      .eq("is_used", false),
    getSupabaseAdmin()
      .from("auth_flow_tokens")
      .update({ is_used: true })
      .eq("email", email)
      .eq("purpose", purpose)
      .eq("is_used", false),
  ]);
}

async function createOtpSession(
  userId: string,
  email: string,
  purpose: string,
): Promise<string> {
  await invalidateActiveRecords(email, purpose);

  const otp = generateOtp();
  const otpHash = await hashOtp(otp);
  const token = newToken();

  const [{ error: otpErr }, { error: tokenErr }] = await Promise.all([
    getSupabaseAdmin()
      .from("otp_records")
      .insert({
        user_id: userId,
        email,
        otp_hash: otpHash,
        purpose,
        expires_at: expiresAt(),
      }),
    getSupabaseAdmin()
      .from("auth_flow_tokens")
      .insert({ email, purpose, token, expires_at: flowExpiry() }),
  ]);

  if (otpErr || tokenErr) {
    if (otpErr)
      logger.error({
        fn: "createOtpSession",
        message: "OTP insert error",
        meta: otpErr.message,
      });
    if (tokenErr)
      logger.error({
        fn: "createOtpSession",
        message: "Token insert error",
        meta: tokenErr.message,
      });
    throw new Error("Failed to create verification session.");
  }

  sendOtpEmail(email, otp, purpose).catch((err) =>
    logger.error({
      fn: "createOtpSession",
      message: `Email send failed (${purpose})`,
      meta: err,
    }),
  );
  return token;
}

async function sendOtpEmail(
  email: string,
  otp: string,
  purpose: string,
): Promise<void> {
  if (purpose === "signup") return sendSignUpOtpEmail(email, otp);
  if (purpose === "signin") return sendSignInOtpEmail(email, otp);
  if (purpose === "forgot-password")
    return sendForgotPasswordOtpEmail(email, otp);
}

async function autoLogin(userId: string): Promise<string | null> {
  const { data: user, error } = await getSupabaseAdmin()
    .from("users")
    .select("user_id, name, email, role, image_url")
    .eq("user_id", userId)
    .single();

  if (error || !user) {
    if (error)
      logger.error({
        fn: "autoLogin",
        message: "User fetch error",
        meta: error.message,
      });
    return null;
  }

  await createSession(user);
  await getSupabaseAdmin()
    .from("users")
    .update({ last_login_at: new Date().toISOString() })
    .eq("user_id", userId);

  return user.role as string;
}

export async function getVerifyEmailData(
  token: string,
): Promise<DataFetchResult<OtpStatus>> {
  try {
    const { data: ft, error: ftErr } = await getSupabaseAdmin()
      .from("auth_flow_tokens")
      .select("email, purpose")
      .eq("token", token)
      .eq("is_used", false)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (ftErr) {
      logger.error({
        fn: "getVerifyEmailData",
        message: "Token lookup error",
        meta: ftErr.message,
      });
      return {
        success: false,
        message: "Failed to validate session. Please try again.",
      };
    }
    if (!ft)
      return { success: false, message: "Session expired. Please start over." };

    const { data: rec, error: recErr } = await getSupabaseAdmin()
      .from("otp_records")
      .select("resend_count, last_sent_at")
      .eq("email", ft.email)
      .eq("purpose", ft.purpose)
      .eq("is_used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recErr)
      logger.error({
        fn: "getVerifyEmailData",
        message: "OTP lookup error",
        meta: recErr.message,
      });

    let canResend = true;
    let remainingSeconds = 0;

    if (rec) {
      const cooldownMs = resendDelay(rec.resend_count) * 1000;
      const canResendAt = new Date(rec.last_sent_at).getTime() + cooldownMs;
      const now = Date.now();
      if (now < canResendAt) {
        canResend = false;
        remainingSeconds = Math.ceil((canResendAt - now) / 1000);
      }
    }

    return {
      success: true,
      message: "Session data loaded.",
      data: {
        email: ft.email,
        purpose: ft.purpose,
        canResend,
        remainingSeconds,
      },
    };
  } catch (err) {
    logger.error({
      fn: "getVerifyEmailData",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function validateResetToken(
  token: string,
): Promise<DataFetchResult<{ email: string }>> {
  try {
    const { data } = await getSupabaseAdmin()
      .from("auth_flow_tokens")
      .select("email")
      .eq("token", token)
      .eq("purpose", "reset-password")
      .eq("is_used", false)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (!data)
      return {
        success: false,
        message: "Reset link is invalid or has expired.",
      };
    return { success: true, message: "Valid reset token.", data };
  } catch (err) {
    logger.error({
      fn: "validateResetToken",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function getSessionUser(): Promise<DataFetchResult<SessionUser>> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "No active session." };
    return { success: true, message: "Session loaded.", data: session };
  } catch (err) {
    logger.error({
      fn: "getSessionUser",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "Failed to load session." };
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
    const { name, username, password } = data;
    const email = data.email.toLowerCase().trim();
    const mobile = data.mobile.trim();

    if (!name || name.trim().length < 3)
      return { success: false, message: "Name must be at least 3 characters." };
    if (!username || !/^[a-z0-9_]{3,}$/.test(username))
      return {
        success: false,
        message: "Username must be at least 3 characters (a–z, 0–9, _).",
      };
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return { success: false, message: "Invalid email address." };
    if (!mobile || !/^\d{10}$/.test(mobile))
      return { success: false, message: "Mobile number must be 10 digits." };
    if (!password || password.length < 6)
      return {
        success: false,
        message: "Password must be at least 6 characters.",
      };

    const [emailCheck, usernameCheck, mobileCheck] = await Promise.all([
      getSupabaseAdmin()
        .from("users")
        .select("email")
        .eq("email", email)
        .maybeSingle(),
      getSupabaseAdmin()
        .from("users")
        .select("username")
        .eq("username", username)
        .maybeSingle(),
      getSupabaseAdmin()
        .from("users")
        .select("mobile")
        .eq("mobile", mobile)
        .maybeSingle(),
    ]);

    if (emailCheck.data)
      return { success: false, message: "Email is already registered." };
    if (usernameCheck.data)
      return { success: false, message: "Username is already taken." };
    if (mobileCheck.data)
      return {
        success: false,
        message: "Mobile number is already registered.",
      };

    const passwordHash = await hashPassword(password);

    const { data: user, error: insertErr } = await getSupabaseAdmin()
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
      if (insertErr)
        logger.error({
          fn: "signUp",
          message: "User insert error",
          meta: insertErr.message,
        });
      return {
        success: false,
        message: "Failed to create account. Please try again.",
      };
    }

    const token = await createOtpSession(user.user_id, email, "signup");
    sendWelcomeEmail(email, name.trim()).catch((err) =>
      logger.error({
        fn: "signUp",
        message: "Welcome email failed",
        meta: err,
      }),
    );

    return {
      success: true,
      message: "Account created. Please verify your email to continue.",
      token,
    };
  } catch (err) {
    logger.error({ fn: "signUp", message: "Unexpected error", meta: err });
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function signIn(data: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  try {
    const email = data.email.toLowerCase().trim();
    if (!email || !data.password)
      return { success: false, message: "Email and password are required." };

    const { data: user, error } = await getSupabaseAdmin()
      .from("users")
      .select(
        "user_id, name, email, role, image_url, password_hash, is_active, is_email_verified",
      )
      .eq("email", email)
      .maybeSingle();

    if (error)
      logger.error({ fn: "signIn", message: "DB error", meta: error.message });
    if (!user || !user.password_hash)
      return { success: false, message: "Invalid email or password." };
    if (!user.is_active)
      return {
        success: false,
        message: "Your account has been deactivated. Contact support.",
      };

    const passwordMatch = await comparePassword(
      data.password,
      user.password_hash,
    );
    if (!passwordMatch)
      return { success: false, message: "Invalid email or password." };

    if (!user.is_email_verified) {
      const token = await createOtpSession(user.user_id, email, "signin");
      return {
        success: false,
        needsVerification: true,
        message: "Please verify your email before signing in.",
        token,
      };
    }

    await createSession(user);
    await getSupabaseAdmin()
      .from("users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("user_id", user.user_id);

    const redirectTo = DASHBOARD_ROLES.has(user.role) ? "/dashboard" : "/";
    return { success: true, message: "Signed in successfully.", redirectTo };
  } catch (err) {
    logger.error({ fn: "signIn", message: "Unexpected error", meta: err });
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function forgotPassword(data: {
  email: string;
}): Promise<AuthResult> {
  try {
    const email = data.email.toLowerCase().trim();
    if (!email)
      return { success: false, message: "Email address is required." };

    const { data: user, error } = await getSupabaseAdmin()
      .from("users")
      .select("user_id")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      logger.error({
        fn: "forgotPassword",
        message: "User lookup error",
        meta: error.message,
      });
      return {
        success: false,
        message: "Failed to process request. Please try again.",
      };
    }

    if (!user)
      return {
        success: true,
        message:
          "If an account exists with this email, a verification code has been sent.",
      };

    const token = await createOtpSession(
      user.user_id,
      email,
      "forgot-password",
    );
    return {
      success: true,
      message:
        "If an account exists with this email, a verification code has been sent.",
      token,
    };
  } catch (err) {
    logger.error({
      fn: "forgotPassword",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function verifyOtp(
  token: string,
  otp: string,
): Promise<VerifyResult> {
  try {
    if (!otp || otp.length !== 6)
      return { success: false, message: "Please enter a valid 6-digit code." };

    const { data: ft } = await getSupabaseAdmin()
      .from("auth_flow_tokens")
      .select("token_id, email, purpose")
      .eq("token", token)
      .eq("is_used", false)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (!ft)
      return {
        success: false,
        message: "Session expired. Please start the process again.",
      };

    const { data: rec } = await getSupabaseAdmin()
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

    if (rec.verify_attempts >= MAX_ATTEMPTS) {
      await getSupabaseAdmin()
        .from("otp_records")
        .update({ is_used: true })
        .eq("otp_id", rec.otp_id);
      return {
        success: false,
        message: "Too many failed attempts. Please request a new code.",
      };
    }

    const isValid = await compareOtp(otp, rec.otp_hash);

    if (!isValid) {
      const newAttempts = rec.verify_attempts + 1;
      await getSupabaseAdmin()
        .from("otp_records")
        .update({ verify_attempts: newAttempts })
        .eq("otp_id", rec.otp_id);
      return {
        success: false,
        message: "Invalid code. Please try again.",
        attemptsRemaining: MAX_ATTEMPTS - newAttempts,
      };
    }

    await Promise.all([
      getSupabaseAdmin()
        .from("otp_records")
        .update({ is_used: true })
        .eq("otp_id", rec.otp_id),
      getSupabaseAdmin()
        .from("auth_flow_tokens")
        .update({ is_used: true })
        .eq("token_id", ft.token_id),
    ]);

    if (ft.purpose === "signup" || ft.purpose === "signin") {
      let redirectTo = "/";
      if (rec.user_id) {
        await getSupabaseAdmin()
          .from("users")
          .update({ is_email_verified: true })
          .eq("user_id", rec.user_id);
        const role = await autoLogin(rec.user_id);
        if (role && DASHBOARD_ROLES.has(role)) redirectTo = "/dashboard";
      }
      return {
        success: true,
        message: "Email verified successfully.",
        purpose: ft.purpose,
        redirectTo,
      };
    }

    if (ft.purpose === "forgot-password") {
      const resetToken = newToken();
      await getSupabaseAdmin()
        .from("auth_flow_tokens")
        .insert({
          email: ft.email,
          purpose: "reset-password",
          token: resetToken,
          expires_at: resetExpiry(),
        });
      return {
        success: true,
        message: "Code verified. Please set your new password.",
        purpose: "forgot-password",
        resetToken,
      };
    }

    return {
      success: true,
      message: "Verification successful.",
      redirectTo: "/sign-in",
    };
  } catch (err) {
    logger.error({ fn: "verifyOtp", message: "Unexpected error", meta: err });
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function resendOtp(token: string): Promise<ResendResult> {
  try {
    const { data: ft } = await getSupabaseAdmin()
      .from("auth_flow_tokens")
      .select("email, purpose")
      .eq("token", token)
      .eq("is_used", false)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (!ft)
      return {
        success: false,
        message: "Session expired. Please start the process again.",
      };

    const { data: rec } = await getSupabaseAdmin()
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
        message: "No active session found. Please start over.",
      };

    const cooldownMs = resendDelay(rec.resend_count) * 1000;
    const canResendAt = new Date(rec.last_sent_at).getTime() + cooldownMs;
    const now = Date.now();

    if (now < canResendAt) {
      return {
        success: false,
        message: "Please wait before requesting a new code.",
        remainingSeconds: Math.ceil((canResendAt - now) / 1000),
      };
    }

    const newOtp = generateOtp();
    const newOtpHash = await hashOtp(newOtp);
    const newCount = rec.resend_count + 1;

    await getSupabaseAdmin()
      .from("otp_records")
      .update({
        otp_hash: newOtpHash,
        resend_count: newCount,
        last_sent_at: new Date().toISOString(),
        expires_at: expiresAt(),
        verify_attempts: 0,
      })
      .eq("otp_id", rec.otp_id);

    sendOtpEmail(ft.email, newOtp, ft.purpose).catch((err) =>
      logger.error({
        fn: "resendOtp",
        message: `Email resend failed (${ft.purpose})`,
        meta: err,
      }),
    );

    return {
      success: true,
      message: "A new code has been sent to your email.",
      remainingSeconds: resendDelay(newCount),
    };
  } catch (err) {
    logger.error({ fn: "resendOtp", message: "Unexpected error", meta: err });
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function resetPassword(
  resetToken: string,
  data: { password: string; confirmPassword: string },
): Promise<AuthResult> {
  try {
    if (!data.password || data.password.length < 6)
      return {
        success: false,
        message: "Password must be at least 6 characters.",
      };
    if (data.password !== data.confirmPassword)
      return { success: false, message: "Passwords do not match." };

    const { data: ft } = await getSupabaseAdmin()
      .from("auth_flow_tokens")
      .select("token_id, email")
      .eq("token", resetToken)
      .eq("purpose", "reset-password")
      .eq("is_used", false)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (!ft)
      return {
        success: false,
        message: "Reset link has expired. Please request a new one.",
      };

    const { data: markedToken, error: markErr } = await getSupabaseAdmin()
      .from("auth_flow_tokens")
      .update({ is_used: true })
      .eq("token_id", ft.token_id)
      .eq("is_used", false)
      .select("token_id")
      .maybeSingle();

    if (markErr || !markedToken) {
      logger.error({
        fn: "resetPassword",
        message: "Token already used or mark failed",
        meta: markErr?.message,
      });
      return {
        success: false,
        message: "Reset link has already been used. Please request a new one.",
      };
    }

    const passwordHash = await hashPassword(data.password);
    const { error } = await getSupabaseAdmin()
      .from("users")
      .update({ password_hash: passwordHash })
      .eq("email", ft.email);

    if (error) {
      logger.error({
        fn: "resetPassword",
        message: "Failed to update password",
        meta: error,
      });
      return {
        success: false,
        message: "Failed to update password. Please try again.",
      };
    }

    const { data: u } = await getSupabaseAdmin()
      .from("users")
      .select("name")
      .eq("email", ft.email)
      .single();
    if (u?.name)
      sendPasswordChangedEmail(ft.email, u.name).catch((err) =>
        logger.error({
          fn: "resetPassword",
          message: "Security email failed",
          meta: err,
        }),
      );

    return {
      success: true,
      message: "Password reset successfully. You can now sign in.",
    };
  } catch (err) {
    logger.error({
      fn: "resetPassword",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function signOut(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    await destroySession();
    return { success: true, message: "Signed out successfully." };
  } catch (err) {
    logger.error({ fn: "signOut", message: "Unexpected error", meta: err });
    return { success: false, message: "Failed to sign out. Please try again." };
  }
}
