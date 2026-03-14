export type RefundStatus = "PENDING" | "APPROVED" | "REJECTED" | "REFUNDED";

export interface RefundRequest {
  refund_id: string;
  order_id: string;
  ticket_id: string | null;
  user_id: string;
  reason: string;
  refund_amount: number;
  status: RefundStatus;
  admin_note: string | null;
  gateway_refund_ref: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface CreateRefundInput {
  order_id: string;
  ticket_id?: string;
  reason: string;
  refund_amount: number;
}

export interface CreateRefundResult {
  success: boolean;
  message: string;
  refund?: RefundRequest;
}

export interface ReviewRefundInput {
  refund_id: string;
  status: "APPROVED" | "REJECTED";
  admin_note?: string;
  gateway_refund_ref?: string;
}

export interface ReviewRefundResult {
  success: boolean;
  message: string;
}

export interface GetRefundRequestsResult {
  success: boolean;
  message: string;
  refunds?: RefundRequest[];
}
