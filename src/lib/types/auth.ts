// ─── Auth Action Return Types ─────────────────────────────────────────────────

// Standard result returned by signUp, signIn, forgotPassword, resetPassword
export interface AuthResult {
  success: boolean;
  message: string;
  token?: string;
  redirectTo?: string;
  needsVerification?: boolean;
}

// Returned by verifyOtp — includes remaining attempts and optional reset token
export interface VerifyResult {
  success: boolean;
  message: string;
  attemptsRemaining?: number;
  redirectTo?: string;
  resetToken?: string;
  purpose?: string;
}

// Returned by resendOtp — includes cooldown remaining
export interface ResendResult {
  success: boolean;
  message: string;
  remainingSeconds?: number;
}

// OTP session status used by the /verify-email page
export interface OtpStatus {
  email: string;
  purpose: string;
  canResend: boolean;
  remainingSeconds: number;
}

// Generic wrapper for data-fetching server actions
export interface DataFetchResult<T> {
  success: boolean;
  message: string;
  data?: T;
}
