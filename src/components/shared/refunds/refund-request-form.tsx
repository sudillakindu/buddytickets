"use client";

import React, { useState, useCallback, memo } from "react";
import { motion } from "framer-motion";
import {
  RotateCcw,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/ui/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export interface RefundRequestFormProps {
  orderId: string;
  ticketId?: string;
  maxRefundAmount: number;
  onSubmit: (data: {
    order_id: string;
    ticket_id: string | null;
    reason: string;
    refund_amount: number;
  }) => Promise<{ success: boolean; message: string }>;
  onClose?: () => void;
}

export const RefundRequestForm: React.FC<RefundRequestFormProps> = memo(
  ({ orderId, ticketId, maxRefundAmount, onSubmit, onClose }) => {
    const [reason, setReason] = useState("");
    const [amount, setAmount] = useState(maxRefundAmount.toString());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<{
      success: boolean;
      message: string;
    } | null>(null);

    const parsedAmount = parseFloat(amount) || 0;
    const isValidAmount = parsedAmount > 0 && parsedAmount <= maxRefundAmount;

    const handleSubmit = useCallback(
      async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim() || !isValidAmount) return;

        setIsSubmitting(true);
        setResult(null);

        const response = await onSubmit({
          order_id: orderId,
          ticket_id: ticketId ?? null,
          reason: reason.trim(),
          refund_amount: parsedAmount,
        });

        setResult(response);
        setIsSubmitting(false);
      },
      [reason, parsedAmount, isValidAmount, orderId, ticketId, onSubmit],
    );

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className="p-5 rounded-2xl border border-gray-100 bg-white shadow-lg space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-[hsl(270,70%,50%)]" />
            <h4 className="font-primary font-bold text-sm uppercase tracking-wide text-[hsl(222.2,47.4%,11.2%)]">
              Request Refund
            </h4>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors text-sm font-secondary"
            >
              Cancel
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="refund-reason"
              className="font-secondary text-xs text-gray-500"
            >
              Reason for Refund <span className="text-red-400">*</span>
            </Label>
            <Textarea
              id="refund-reason"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please explain why you would like a refund..."
              className="text-sm rounded-xl border-gray-200 focus:border-[hsl(270,70%,50%)] focus:ring-[hsl(270,70%,50%)] min-h-[80px]"
              maxLength={1000}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="refund-amount"
              className="font-secondary text-xs text-gray-500"
            >
              Refund Amount (LKR) <span className="text-red-400">*</span>
            </Label>
            <Input
              id="refund-amount"
              type="number"
              required
              min={1}
              max={maxRefundAmount}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-9 text-sm rounded-xl border-gray-200 focus:border-[hsl(270,70%,50%)] focus:ring-[hsl(270,70%,50%)]"
              disabled={isSubmitting}
            />
            <p className="font-secondary text-xs text-gray-400">
              Maximum refund: LKR{" "}
              {maxRefundAmount.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>

          <Button
            type="submit"
            disabled={!reason.trim() || !isValidAmount || isSubmitting}
            className={cn(
              "w-full font-primary font-bold text-sm py-2.5 h-auto rounded-xl text-white shadow-sm transition-all",
              reason.trim() && isValidAmount
                ? "bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)] hover:shadow-md"
                : "bg-gray-300",
            )}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                Submit Refund Request
              </span>
            )}
          </Button>
        </form>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-start gap-2 p-3 rounded-xl ${
              result.success
                ? "bg-emerald-50 border border-emerald-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            {result.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            )}
            <p
              className={`font-secondary text-sm ${result.success ? "text-emerald-800" : "text-red-800"}`}
            >
              {result.message}
            </p>
          </motion.div>
        )}
      </motion.div>
    );
  },
);

RefundRequestForm.displayName = "RefundRequestForm";
