// lib/types/auth.ts
export interface AuthResult {
  success: boolean;
  message: string;
  token?: string;
  redirectTo?: string;
  needsVerification?: boolean;
}

export interface VerifyResult {
  success: boolean;
  message: string;
  attemptsRemaining?: number;
  redirectTo?: string;
  resetToken?: string;
  purpose?: string;
}

export interface ResendResult {
  success: boolean;
  message: string;
  remainingSeconds?: number;
}

export interface OtpStatus {
  email: string;
  purpose: string;
  canResend: boolean;
  remainingSeconds: number;
}

export interface DataFetchResult<T> {
  success: boolean;
  message: string;
  data?: T;
}
