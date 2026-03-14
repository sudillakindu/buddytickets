"use client";

import React, { memo } from "react";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  ShieldX,
} from "lucide-react";
import { cn } from "@/lib/ui/utils";
import type { ScanLog, ScanResult } from "@/lib/types/scan-log";

export interface ScanLogTableProps {
  logs: ScanLog[];
}

const formatDateTime = (iso: string): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-US", { month: "short", day: "2-digit" })} ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
};

const RESULT_UI: Record<
  ScanResult,
  { text: string; icon: React.ReactNode; className: string }
> = {
  ALLOWED: {
    text: "Allowed",
    icon: (
      <CheckCircle className="w-4 h-4 text-emerald-500" aria-hidden="true" />
    ),
    className: "text-emerald-700 bg-emerald-50",
  },
  DENIED_SOLD_OUT: {
    text: "Sold Out",
    icon: (
      <AlertTriangle className="w-4 h-4 text-amber-500" aria-hidden="true" />
    ),
    className: "text-amber-700 bg-amber-50",
  },
  DENIED_ALREADY_USED: {
    text: "Already Used",
    icon: <XCircle className="w-4 h-4 text-red-500" aria-hidden="true" />,
    className: "text-red-700 bg-red-50",
  },
  DENIED_UNPAID: {
    text: "Unpaid",
    icon: <Clock className="w-4 h-4 text-amber-500" aria-hidden="true" />,
    className: "text-amber-700 bg-amber-50",
  },
  DENIED_INVALID: {
    text: "Invalid",
    icon: <ShieldX className="w-4 h-4 text-red-500" aria-hidden="true" />,
    className: "text-red-700 bg-red-50",
  },
};

export const ScanLogTable: React.FC<ScanLogTableProps> = memo(({ logs }) => {
  if (logs.length === 0) {
    return (
      <p className="font-secondary text-sm text-[hsl(215.4,16.3%,46.9%)] py-8 text-center">
        No scan logs yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[hsl(214.3,31.8%,91.4%)]">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-[hsl(210,40%,96.1%)]">
            <th className="font-primary text-xs font-semibold text-[hsl(222.2,47.4%,11.2%)] px-4 py-3">
              Result
            </th>
            <th className="font-primary text-xs font-semibold text-[hsl(222.2,47.4%,11.2%)] px-4 py-3">
              Ticket ID
            </th>
            <th className="font-primary text-xs font-semibold text-[hsl(222.2,47.4%,11.2%)] px-4 py-3">
              Scanned At
            </th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => {
            const result = RESULT_UI[log.result];
            return (
              <tr
                key={log.scan_id}
                className="border-t border-[hsl(214.3,31.8%,91.4%)] bg-white hover:bg-[hsl(210,40%,98%)] transition-colors"
              >
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
                      result.className,
                    )}
                  >
                    {result.icon}
                    {result.text}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-secondary text-xs text-[hsl(222.2,47.4%,11.2%)] font-mono">
                    {log.ticket_id.slice(0, 8)}…
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)]">
                    {formatDateTime(log.scanned_at)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});

ScanLogTable.displayName = "ScanLogTable";
