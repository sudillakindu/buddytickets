export type GatewayType = "PAYMENT_GATEWAY" | "BANK_TRANSFER" | "ONGATE";
export type TransactionStatus = "SUCCESS" | "FAILED";

export interface Transaction {
  transaction_id: string;
  order_id: string;
  gateway: GatewayType;
  gateway_ref_id: string | null;
  amount: number;
  status: TransactionStatus;
  meta_data: Record<string, unknown> | null;
  created_at: string;
}

export interface TransactionResult {
  success: boolean;
  message: string;
  transactions?: Transaction[];
}
