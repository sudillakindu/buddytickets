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

export interface ScanLogInsert {
  ticket_id: string;
  scanned_by_user_id: string;
  result: ScanResult;
}

export interface ScanLogResult {
  success: boolean;
  message: string;
  scan_log?: ScanLog;
}

export interface ScanLogListResult {
  success: boolean;
  message: string;
  scan_logs?: ScanLog[];
}
