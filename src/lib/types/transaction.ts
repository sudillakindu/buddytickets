import type { GatewayType } from "./payment";

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

export interface TransactionListResult {
  success: boolean;
  message: string;
  transactions?: Transaction[];
}
