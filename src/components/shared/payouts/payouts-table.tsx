"use client";

import React, { memo } from "react";
import { motion } from "framer-motion";
import {
  Banknote,
  TrendingUp,
  ArrowDownRight,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/ui/utils";
import type { Payout, PayoutStatus } from "@/lib/types/payout";

const formatLKR = (n: number) =>
  `LKR ${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const STATUS_MAP: Record<
  PayoutStatus,
  { label: string; icon: React.ReactNode; cls: string }
> = {
  PENDING: {
    label: "Pending",
    icon: <Clock className="w-3.5 h-3.5" />,
    cls: "bg-amber-50 text-amber-700 border-amber-200",
  },
  PROCESSING: {
    label: "Processing",
    icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
    cls: "bg-blue-50 text-blue-700 border-blue-200",
  },
  COMPLETED: {
    label: "Completed",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  FAILED: {
    label: "Failed",
    icon: <AlertCircle className="w-3.5 h-3.5" />,
    cls: "bg-red-50 text-red-700 border-red-200",
  },
};

export interface PayoutsTableProps {
  payouts: Payout[];
}

export const PayoutsTable: React.FC<PayoutsTableProps> = memo(({ payouts }) => {
  if (payouts.length === 0) {
    return (
      <div className="p-8 text-center">
        <Banknote className="w-10 h-10 mx-auto text-gray-300 mb-3" />
        <p className="font-secondary text-sm text-gray-400">
          No payouts yet. Payouts will appear here once events generate revenue.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Banknote className="w-5 h-5 text-[hsl(270,70%,50%)]" />
        <h3 className="font-primary font-bold text-sm uppercase tracking-wide text-[hsl(222.2,47.4%,11.2%)]">
          Payouts
        </h3>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-4 py-3 font-secondary text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 font-secondary text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Gross Revenue
                </span>
              </th>
              <th className="px-4 py-3 font-secondary text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <ArrowDownRight className="w-3 h-3" /> Platform Fee
                </span>
              </th>
              <th className="px-4 py-3 font-secondary text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <Banknote className="w-3 h-3" /> Net Payout
                </span>
              </th>
              <th className="px-4 py-3 font-secondary text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> Bank Ref
                </span>
              </th>
              <th className="px-4 py-3 font-secondary text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Processed At
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {payouts.map((payout, index) => {
              const statusInfo = STATUS_MAP[payout.status];
              return (
                <motion.tr
                  key={payout.payout_id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
                        statusInfo.cls,
                      )}
                    >
                      {statusInfo.icon}
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-secondary text-sm font-semibold text-[hsl(222.2,47.4%,11.2%)]">
                    {formatLKR(payout.gross_revenue)}
                  </td>
                  <td className="px-4 py-3 font-secondary text-sm text-red-600">
                    -{formatLKR(payout.platform_fee_amount)}
                  </td>
                  <td className="px-4 py-3 font-primary text-sm font-bold text-emerald-700">
                    {formatLKR(payout.net_payout_amount)}
                  </td>
                  <td className="px-4 py-3 font-secondary text-xs text-gray-500 font-mono">
                    {payout.bank_transfer_ref || "—"}
                  </td>
                  <td className="px-4 py-3 font-secondary text-xs text-gray-400">
                    {formatDate(payout.processed_at)}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});

PayoutsTable.displayName = "PayoutsTable";
