// lib/types/organizer.ts
export type OrganizerStatus = "PENDING" | "APPROVED" | "REJECTED";

export type UserRole =
  | "SYSTEM"
  | "ORGANIZER"
  | "CO_ORGANIZER"
  | "STAFF"
  | "USER";

export interface OrganizerOnboardingUser {
  user_id: string;
  name: string;
  email: string;
  mobile: string;
  role: UserRole;
  is_active: boolean;
}

export interface OrganizerDetails {
  user_id: string;
  nic_number: string;
  address: string;
  bank_name: string;
  bank_branch: string;
  account_holder_name: string;
  account_number: string;
  nic_front_image_url: string;
  nic_back_image_url: string;
  remarks: string | null;
  status: OrganizerStatus;
  is_submitted: boolean;
  verified_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface OrganizerDetailsInput {
  nic_number: string;
  address: string;
  bank_name: string;
  bank_branch: string;
  account_holder_name: string;
  account_number: string;
}

export interface OrganizerDetailsFieldErrors {
  nic_number?: string;
  address?: string;
  bank_name?: string;
  bank_branch?: string;
  account_holder_name?: string;
  account_number?: string;
  nic_front_image?: string;
  nic_back_image?: string;
}

export interface OrganizerValidationResult {
  success: boolean;
  message: string;
  fieldErrors?: OrganizerDetailsFieldErrors;
}

export interface OrganizerBaseResult {
  success: boolean;
  message: string;
}

export interface OrganizerStateResult extends OrganizerBaseResult {
  user: OrganizerOnboardingUser | null;
  organizerDetails: OrganizerDetails | null;
  whatsappNumber: string;
}

export interface SubmitOrganizerDetailsResult extends OrganizerBaseResult {
  fieldErrors?: OrganizerDetailsFieldErrors;
}
