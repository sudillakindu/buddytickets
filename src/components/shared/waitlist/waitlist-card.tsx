"use client";

import React, { memo } from "react";
import { Clock, Bell, ShoppingCart, XCircle, Hash, Mail } from "lucide-react";
import { cn } from "@/lib/ui/utils";
import type { WaitlistEntry } from "@/lib/types/waitlist";

export interface WaitlistCardProps {
  entry: WaitlistEntry;
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
  WaitlistEntry["status"],
  { text: string; dotClass: string; bgClass: string; textClass: string }
> = {
  WAITING: {
    text: "Waiting",
    dotClass: "bg-amber-500",
    bgClass: "bg-amber-50",
    textClass: "text-amber-700",
  },
  NOTIFIED: {
    text: "Notified",
    dotClass: "bg-blue-500",
    bgClass: "bg-blue-50",
    textClass: "text-blue-700",
  },
  CONVERTED: {
    text: "Converted",
    dotClass: "bg-emerald-500",
    bgClass: "bg-emerald-50",
    textClass: "text-emerald-700",
  },
  EXPIRED: {
    text: "Expired",
    dotClass: "bg-gray-400",
    bgClass: "bg-gray-100",
    textClass: "text-gray-600",
  },
};

const STATUS_ICONS: Record<WaitlistEntry["status"], React.ReactNode> = {
  WAITING: <Clock className="w-4 h-4 text-amber-500" aria-hidden="true" />,
  NOTIFIED: <Bell className="w-4 h-4 text-blue-500" aria-hidden="true" />,
  CONVERTED: (
    <ShoppingCart className="w-4 h-4 text-emerald-500" aria-hidden="true" />
  ),
  EXPIRED: <XCircle className="w-4 h-4 text-gray-400" aria-hidden="true" />,
};

export const WaitlistCard: React.FC<WaitlistCardProps> = memo(({ entry }) => {
  const status = STATUS_UI[entry.status];

  return (
    <div className="rounded-xl border border-[hsl(214.3,31.8%,91.4%)] bg-white p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-[hsl(270,70%,50%)]/20 transition-all duration-300">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {STATUS_ICONS[entry.status]}
          <h3 className="font-primary text-sm font-semibold text-[hsl(222.2,47.4%,11.2%)] truncate">
            Waitlist Entry
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

      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <Hash
            className="w-3.5 h-3.5 text-[hsl(270,70%,50%)] shrink-0"
            aria-hidden="true"
          />
          <span className="font-secondary text-xs text-[hsl(222.2,47.4%,11.2%)]">
            Position #{entry.position_order}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Mail
            className="w-3.5 h-3.5 text-[hsl(270,70%,50%)] shrink-0"
            aria-hidden="true"
          />
          <span className="font-secondary text-xs text-[hsl(222.2,47.4%,11.2%)] truncate">
            {entry.notify_email}
          </span>
        </div>
      </div>

      <div className="border-t border-dashed border-[hsl(214.3,31.8%,91.4%)] my-3" />

      <div className="flex items-center justify-between">
        <span className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)]">
          Joined {formatDate(entry.created_at)}
        </span>
        {entry.notified_at && (
          <span className="font-secondary text-xs text-blue-600">
            Notified {formatDate(entry.notified_at)}
          </span>
        )}
      </div>
    </div>
  );
});

WaitlistCard.displayName = "WaitlistCard";
