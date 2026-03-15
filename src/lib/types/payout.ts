export type PayoutStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface Payout {
  payout_id: string;
  event_id: string;
  organizer_id: string;
  gross_revenue: number;
  platform_fee_amount: number;
  net_payout_amount: number;
  status: PayoutStatus;
  bank_transfer_ref: string | null;
  processed_by: string | null;
  processed_at: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface PayoutResult {
  success: boolean;
  message: string;
  payout?: Payout;
}

export interface PayoutListResult {
  success: boolean;
  message: string;
  payouts?: Payout[];
}
