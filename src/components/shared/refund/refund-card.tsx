"use client";

import React, { memo } from "react";
import {
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/ui/utils";
import type { RefundRequest } from "@/lib/types/refund";

export interface RefundCardProps {
  refund: RefundRequest;
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
  RefundRequest["status"],
  { text: string; dotClass: string; bgClass: string; textClass: string }
> = {
  PENDING: {
    text: "Pending",
    dotClass: "bg-amber-500",
    bgClass: "bg-amber-50",
    textClass: "text-amber-700",
  },
  APPROVED: {
    text: "Approved",
    dotClass: "bg-blue-500",
    bgClass: "bg-blue-50",
    textClass: "text-blue-700",
  },
  REJECTED: {
    text: "Rejected",
    dotClass: "bg-red-500",
    bgClass: "bg-red-50",
    textClass: "text-red-700",
  },
  REFUNDED: {
    text: "Refunded",
    dotClass: "bg-emerald-500",
    bgClass: "bg-emerald-50",
    textClass: "text-emerald-700",
  },
};

const STATUS_ICONS: Record<RefundRequest["status"], React.ReactNode> = {
  PENDING: <Clock className="w-4 h-4 text-amber-500" aria-hidden="true" />,
  APPROVED: (
    <CheckCircle className="w-4 h-4 text-blue-500" aria-hidden="true" />
  ),
  REJECTED: <XCircle className="w-4 h-4 text-red-500" aria-hidden="true" />,
  REFUNDED: (
    <RefreshCw className="w-4 h-4 text-emerald-500" aria-hidden="true" />
  ),
};

export const RefundCard: React.FC<RefundCardProps> = memo(({ refund }) => {
  const status = STATUS_UI[refund.status];

  return (
    <div className="rounded-xl border border-[hsl(214.3,31.8%,91.4%)] bg-white p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-[hsl(270,70%,50%)]/20 transition-all duration-300">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {STATUS_ICONS[refund.status]}
          <h3 className="font-primary text-sm font-semibold text-[hsl(222.2,47.4%,11.2%)] truncate">
            Refund Request
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
        <p className="font-secondary text-sm text-[hsl(222.2,47.4%,11.2%)] leading-relaxed">
          {refund.reason}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <DollarSign
              className="w-3.5 h-3.5 text-[hsl(270,70%,50%)]"
              aria-hidden="true"
            />
            <span className="font-primary text-sm font-semibold text-[hsl(222.2,47.4%,11.2%)]">
              LKR {Number(refund.refund_amount).toLocaleString()}
            </span>
          </div>
          <span className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)]">
            {formatDate(refund.created_at)}
          </span>
        </div>
      </div>

      {refund.admin_note && (
        <>
          <div className="border-t border-dashed border-[hsl(214.3,31.8%,91.4%)] my-3" />
          <div className="bg-[hsl(210,40%,96.1%)] rounded-lg p-3">
            <p className="font-secondary text-xs font-medium text-[hsl(215.4,16.3%,46.9%)] mb-1">
              Admin Note
            </p>
            <p className="font-secondary text-sm text-[hsl(222.2,47.4%,11.2%)]">
              {refund.admin_note}
            </p>
          </div>
        </>
      )}
    </div>
  );
});

RefundCard.displayName = "RefundCard";
