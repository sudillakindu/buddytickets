"use client";

import React, { memo } from "react";
import { motion } from "framer-motion";
import {
  Receipt,
  Hash,
  CreditCard,
  Tag,
  Calendar,
} from "lucide-react";
import type { Transaction } from "@/lib/types/transaction";
import type { PromotionUsage } from "@/lib/types/promotion-usage";

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

export interface OrderTransactionDisplayProps {
  transactions: Transaction[];
  promotionUsages?: PromotionUsage[];
}

export const OrderTransactionDisplay: React.FC<OrderTransactionDisplayProps> =
  memo(({ transactions, promotionUsages }) => {
    return (
      <div className="space-y-4">
        {/* --- Transaction Details --- */}
        {transactions.length > 0 && (
          <div className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Receipt className="w-4 h-4 text-[hsl(270,70%,50%)]" />
              <h4 className="font-primary font-bold text-sm uppercase tracking-wide text-[hsl(222.2,47.4%,11.2%)]">
                Transaction Details
              </h4>
            </div>

            <div className="space-y-3">
              {transactions.map((tx, index) => (
                <motion.div
                  key={tx.transaction_id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="p-3 rounded-xl border border-gray-50 bg-gray-50/50 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 font-secondary text-xs text-gray-500">
                      <Hash className="w-3 h-3" />
                      Transaction ID
                    </span>
                    <span className="font-secondary text-xs font-semibold text-[hsl(222.2,47.4%,11.2%)] font-mono">
                      {tx.transaction_id.slice(0, 8)}…
                    </span>
                  </div>

                  {tx.gateway_ref_id && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 font-secondary text-xs text-gray-500">
                        <CreditCard className="w-3 h-3" />
                        Gateway Ref
                      </span>
                      <span className="font-secondary text-xs font-semibold text-gray-600 font-mono">
                        {tx.gateway_ref_id}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <span className="font-secondary text-xs text-gray-500">
                      Amount
                    </span>
                    <span className="font-primary text-sm font-bold text-[hsl(222.2,47.4%,11.2%)]">
                      {formatLKR(tx.amount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="font-secondary text-xs text-gray-500">
                      Status
                    </span>
                    <span
                      className={`font-secondary text-xs font-semibold ${
                        tx.status === "SUCCESS"
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}
                    >
                      {tx.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="font-secondary text-xs text-gray-500">
                      Gateway
                    </span>
                    <span className="font-secondary text-xs text-gray-600">
                      {tx.gateway}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* --- Promotion Usages --- */}
        {promotionUsages && promotionUsages.length > 0 && (
          <div className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-4 h-4 text-emerald-600" />
              <h4 className="font-primary font-bold text-sm uppercase tracking-wide text-[hsl(222.2,47.4%,11.2%)]">
                Promo Discount Applied
              </h4>
            </div>

            <div className="space-y-3">
              {promotionUsages.map((usage, index) => (
                <motion.div
                  key={usage.usage_id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/40 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 font-secondary text-xs text-emerald-600">
                      <Tag className="w-3 h-3" />
                      Discount Received
                    </span>
                    <span className="font-primary text-sm font-bold text-emerald-700">
                      -{formatLKR(usage.discount_received)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 font-secondary text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      Used At
                    </span>
                    <span className="font-secondary text-xs text-gray-600">
                      {formatDate(usage.used_at)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  });

OrderTransactionDisplay.displayName = "OrderTransactionDisplay";
