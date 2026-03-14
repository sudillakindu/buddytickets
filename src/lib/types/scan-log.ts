export type ScanResult =
  | "ALLOWED"
  | "DENIED_SOLD_OUT"
  | "DENIED_ALREADY_USED"
  | "DENIED_UNPAID"
  | "DENIED_INVALID";

export interface ScanLog {
  scan_id: number;
  ticket_id: string;
  scanned_by_user_id: string;
  result: ScanResult;
  scanned_at: string;
}

export interface ScanTicketResult {
  success: boolean;
  message: string;
  result?: ScanResult;
  scan_id?: number;
}

export interface ScanLogListResult {
  success: boolean;
  message: string;
  logs?: ScanLog[];
}
