"use client";

import React, { memo } from "react";
import {
  Clock,
  Loader2,
  CheckCircle,
  XCircle,
  DollarSign,
  TrendingUp,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/ui/utils";
import type { Payout } from "@/lib/types/payout";

export interface PayoutCardProps {
  payout: Payout;
}

const formatDate = (iso: string): string => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const STATUS_UI: Record<
  Payout["status"],
  { text: string; dotClass: string; bgClass: string; textClass: string }
> = {
  PENDING: {
    text: "Pending",
    dotClass: "bg-amber-500",
    bgClass: "bg-amber-50",
    textClass: "text-amber-700",
  },
  PROCESSING: {
    text: "Processing",
    dotClass: "bg-blue-500",
    bgClass: "bg-blue-50",
    textClass: "text-blue-700",
  },
  COMPLETED: {
    text: "Completed",
    dotClass: "bg-emerald-500",
    bgClass: "bg-emerald-50",
    textClass: "text-emerald-700",
  },
  FAILED: {
    text: "Failed",
    dotClass: "bg-red-500",
    bgClass: "bg-red-50",
    textClass: "text-red-700",
  },
};

const STATUS_ICONS: Record<Payout["status"], React.ReactNode> = {
  PENDING: <Clock className="w-4 h-4 text-amber-500" aria-hidden="true" />,
  PROCESSING: (
    <Loader2
      className="w-4 h-4 text-blue-500 animate-spin"
      aria-hidden="true"
    />
  ),
  COMPLETED: (
    <CheckCircle className="w-4 h-4 text-emerald-500" aria-hidden="true" />
  ),
  FAILED: <XCircle className="w-4 h-4 text-red-500" aria-hidden="true" />,
};

export const PayoutCard: React.FC<PayoutCardProps> = memo(({ payout }) => {
  const status = STATUS_UI[payout.status];

  return (
    <div className="rounded-xl border border-[hsl(214.3,31.8%,91.4%)] bg-white p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-[hsl(270,70%,50%)]/20 transition-all duration-300">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {STATUS_ICONS[payout.status]}
          <h3 className="font-primary text-sm font-semibold text-[hsl(222.2,47.4%,11.2%)] truncate">
            Payout
          </h3>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0",
            status.bgClass,
            status.textClass,
          )}
        >
          <span className={cn("w-1.5 h-1.5 rounded-full", status.dotClass)} />
          {status.text}
        </span>
      </div>

      <div className="border-t border-dashed border-[hsl(214.3,31.8%,91.4%)] my-3" />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TrendingUp
              className="w-3.5 h-3.5 text-[hsl(215.4,16.3%,46.9%)]"
              aria-hidden="true"
            />
            <span className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)]">
              Gross Revenue
            </span>
          </div>
          <span className="font-secondary text-sm text-[hsl(222.2,47.4%,11.2%)]">
            LKR {Number(payout.gross_revenue).toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Minus
              className="w-3.5 h-3.5 text-red-400"
              aria-hidden="true"
            />
            <span className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)]">
              Platform Fee
            </span>
          </div>
          <span className="font-secondary text-sm text-red-500">
            -LKR {Number(payout.platform_fee_amount).toLocaleString()}
          </span>
        </div>
        <div className="border-t border-[hsl(214.3,31.8%,91.4%)] my-1" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <DollarSign
              className="w-3.5 h-3.5 text-[hsl(270,70%,50%)]"
              aria-hidden="true"
            />
            <span className="font-primary text-sm font-semibold text-[hsl(222.2,47.4%,11.2%)]">
              Net Payout
            </span>
          </div>
          <span className="font-primary text-sm font-semibold text-emerald-600">
            LKR {Number(payout.net_payout_amount).toLocaleString()}
          </span>
        </div>
      </div>

      <div className="border-t border-dashed border-[hsl(214.3,31.8%,91.4%)] my-3" />

      <div className="flex items-center justify-between">
        <span className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)]">
          {formatDate(payout.created_at)}
        </span>
        {payout.bank_transfer_ref && (
          <span className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)] font-mono">
            Ref: {payout.bank_transfer_ref}
          </span>
        )}
      </div>

      {payout.remarks && (
        <>
          <div className="border-t border-dashed border-[hsl(214.3,31.8%,91.4%)] my-3" />
          <p className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)]">
            {payout.remarks}
          </p>
        </>
      )}
    </div>
  );
});

PayoutCard.displayName = "PayoutCard";
