// lib/actions/organizer.ts
'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSession } from '@/lib/utils/session';
import {
  uploadOrganizerDocumentToStorage,
  validateOrganizerDetailsInput,
  validateOrganizerDocument,
} from '@/lib/utils/organizer-doc-upload';
import type {
  OrganizerDetails,
  OrganizerDetailsInput,
  OrganizerStateResult,
  SubmitOrganizerDetailsResult,
  UserRole,
} from '@/lib/types/organizer';

// ─── Internal Helpers ────────────────────────────────────────────────────────

interface UserRow {
  user_id: string;
  name: string;
  email: string;
  mobile: string;
  role: UserRole;
  is_active: boolean;
}

interface OrganizerDetailsRow {
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
  status: OrganizerDetails['status'];
  is_submitted: boolean;
  verified_at: string | null;
  created_at: string;
  updated_at: string | null;
}

function getWhatsappNumber(): string {
  return process.env.WHATSAPP_NUMBER ?? '';
}

// ─── Queries (GET) ───────────────────────────────────────────────────────────

export async function getOrganizerOnboardingState(): Promise<OrganizerStateResult> {
  try {
    const session = await getSession();

    if (!session?.sub) {
      return {
        success: true,
        message: 'Guest onboarding state loaded.',
        user: null,
        organizerDetails: null,
        whatsappNumber: getWhatsappNumber(),
      };
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('user_id, name, email, mobile, role, is_active')
      .eq('user_id', session.sub)
      .maybeSingle<UserRow>();

    if (userError || !user) {
      if (userError) console.error('[getOrganizerOnboardingState] User fetch error:', userError.message);
      return {
        success: false,
        message: 'Failed to load user account details.',
        user: null,
        organizerDetails: null,
        whatsappNumber: getWhatsappNumber(),
      };
    }

    const { data: organizerDetails, error: organizerError } = await supabaseAdmin
      .from('organizer_details')
      .select('user_id, nic_number, address, bank_name, bank_branch, account_holder_name, account_number, nic_front_image_url, nic_back_image_url, remarks, status, is_submitted, verified_at, created_at, updated_at')
      .eq('user_id', user.user_id)
      .maybeSingle<OrganizerDetailsRow>();

    // Ignore PGRST116 (No rows found) as it's expected for new organizers
    if (organizerError && organizerError.code !== 'PGRST116') {
      console.error('[getOrganizerOnboardingState] Organizer details fetch error:', organizerError.message);
      return {
        success: false,
        message: 'Failed to load organizer details.',
        user,
        organizerDetails: null,
        whatsappNumber: getWhatsappNumber(),
      };
    }

    return {
      success: true,
      message: 'Organizer onboarding state loaded.',
      user,
      organizerDetails: organizerDetails ?? null,
      whatsappNumber: getWhatsappNumber(),
    };
  } catch (err) {
    console.error('[getOrganizerOnboardingState]', err);
    return {
      success: false,
      message: 'An unexpected error occurred while loading organizer onboarding state.',
      user: null,
      organizerDetails: null,
      whatsappNumber: getWhatsappNumber(),
    };
  }
}

// ─── Mutations (POST/PUT/DELETE) ─────────────────────────────────────────────

export async function submitOrganizerDetails(formData: FormData): Promise<SubmitOrganizerDetailsResult> {
  try {
    const session = await getSession();
    if (!session?.sub) return { success: false, message: 'Unauthorized. Please sign in first.' };

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('user_id, role')
      .eq('user_id', session.sub)
      .maybeSingle<{ user_id: string; role: UserRole }>();

    if (userError || !user) {
      if (userError) console.error('[submitOrganizerDetails] User fetch error:', userError.message);
      return { success: false, message: 'Failed to validate account.' };
    }

    if (user.role !== 'ORGANIZER') {
      return { success: false, message: 'Your account is not yet upgraded to organizer role.' };
    }

    const payload: OrganizerDetailsInput = {
      nic_number: String(formData.get('nic_number') ?? '').trim().toUpperCase(),
      address: String(formData.get('address') ?? '').trim(),
      bank_name: String(formData.get('bank_name') ?? '').trim(),
      bank_branch: String(formData.get('bank_branch') ?? '').trim(),
      account_holder_name: String(formData.get('account_holder_name') ?? '').trim(),
      account_number: String(formData.get('account_number') ?? '').trim(),
    };

    const detailsValidation = validateOrganizerDetailsInput(payload);
    if (!detailsValidation.success) {
      return {
        success: false,
        message: detailsValidation.message,
        fieldErrors: detailsValidation.fieldErrors,
      };
    }

    const nicFrontImageRaw = formData.get('nic_front_image');
    const nicBackImageRaw = formData.get('nic_back_image');
    const nicFrontImage = nicFrontImageRaw instanceof File ? nicFrontImageRaw : null;
    const nicBackImage = nicBackImageRaw instanceof File ? nicBackImageRaw : null;

    const frontValidation = validateOrganizerDocument(nicFrontImage, 'nic_front_image');
    if (!frontValidation.success) {
      return {
        success: false,
        message: frontValidation.message,
        fieldErrors: frontValidation.fieldErrors,
      };
    }

    const backValidation = validateOrganizerDocument(nicBackImage, 'nic_back_image');
    if (!backValidation.success) {
      return {
        success: false,
        message: backValidation.message,
        fieldErrors: backValidation.fieldErrors,
      };
    }

    const frontUpload = await uploadOrganizerDocumentToStorage(nicFrontImage!, user.user_id, 'front');
    if (!frontUpload.success || !frontUpload.imageUrl) {
      return { success: false, message: frontUpload.message || 'Failed to upload NIC front image.' };
    }

    const backUpload = await uploadOrganizerDocumentToStorage(nicBackImage!, user.user_id, 'back');
    if (!backUpload.success || !backUpload.imageUrl) {
      return { success: false, message: backUpload.message || 'Failed to upload NIC back image.' };
    }

    const { error: upsertError } = await supabaseAdmin
      .from('organizer_details')
      .upsert(
        {
          user_id: user.user_id,
          nic_number: payload.nic_number,
          address: payload.address,
          bank_name: payload.bank_name,
          bank_branch: payload.bank_branch,
          account_holder_name: payload.account_holder_name,
          account_number: payload.account_number,
          nic_front_image_url: frontUpload.imageUrl,
          nic_back_image_url: backUpload.imageUrl,
          status: 'PENDING',
          remarks: null,
          verified_by: null,
          verified_at: null,
          is_submitted: true,
        },
        { onConflict: 'user_id' }
      );

    if (upsertError) {
      console.error('[submitOrganizerDetails] Upsert error:', upsertError.message);
      if (upsertError.code === '23505') {
        return { success: false, message: 'The provided NIC or bank account details are already in use.' };
      }
      return { success: false, message: 'Failed to submit organizer details.' };
    }

    return {
      success: true,
      message: 'Organizer details submitted successfully. Your account is now pending review.',
    };
  } catch (err) {
    console.error('[submitOrganizerDetails]', err);
    return { success: false, message: 'An unexpected error occurred while submitting organizer details.' };
  }
}