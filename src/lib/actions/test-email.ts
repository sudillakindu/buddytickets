"use server";

import {
  sendSignUpOtpEmail,
  sendSignInOtpEmail,
  sendForgotPasswordOtpEmail,
  sendWelcomeEmail,
  sendPasswordChangedEmail,
} from "@/lib/auth/mail";

export type EmailType =
  | "signup-otp"
  | "signin-otp"
  | "forgot-password-otp"
  | "welcome"
  | "password-changed";

interface TestEmailResult {
  success: boolean;
  message: string;
}

const DEMO_OTP = "482916";
const DEMO_NAME = "Sudil Lakindu";

export async function sendTestEmail(
  type: EmailType,
  to: string,
): Promise<TestEmailResult> {
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return { success: false, message: "Please enter a valid email address." };
  }

  try {
    switch (type) {
      case "signup-otp":
        await sendSignUpOtpEmail(to, DEMO_OTP);
        break;
      case "signin-otp":
        await sendSignInOtpEmail(to, DEMO_OTP);
        break;
      case "forgot-password-otp":
        await sendForgotPasswordOtpEmail(to, DEMO_OTP);
        break;
      case "welcome":
        await sendWelcomeEmail(to, DEMO_NAME);
        break;
      case "password-changed":
        await sendPasswordChangedEmail(to, DEMO_NAME);
        break;
      default:
        return { success: false, message: "Unknown email type." };
    }

    return { success: true, message: `"${type}" email sent to ${to}` };
  } catch (err) {
    console.error("sendTestEmail error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, message: `Failed to send: ${msg}` };
  }
}
