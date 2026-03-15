"use client";

import React, { memo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/ui/utils";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { createRefundRequest } from "@/lib/actions/refund";

export interface RefundRequestDialogProps {
  ticketId: string;
  orderId: string;
  ticketPrice: number;
  isOpen: boolean;
  onClose: () => void;
}

const OVERLAY_ANIMATION = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
} as const;

const DIALOG_ANIMATION = {
  initial: { opacity: 0, scale: 0.95, y: 12 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 12 },
} as const;

const DIALOG_TRANSITION = {
  duration: 0.22,
  type: "spring",
  stiffness: 260,
  damping: 24,
} as const;

const MIN_REASON_LENGTH = 10;

export const RefundRequestDialog: React.FC<RefundRequestDialogProps> = memo(
  ({ ticketId, orderId, ticketPrice, isOpen, onClose }) => {
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const isValid = reason.trim().length >= MIN_REASON_LENGTH;

    const handleClose = useCallback(() => {
      if (submitting) return;
      setReason("");
      onClose();
    }, [submitting, onClose]);

    const handleOverlayClick = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) handleClose();
      },
      [handleClose],
    );

    const handleSubmit = useCallback(async () => {
      if (!isValid || submitting) return;

      setSubmitting(true);
      try {
        const result = await createRefundRequest({
          order_id: orderId,
          ticket_id: ticketId,
          reason: reason.trim(),
          refund_amount: ticketPrice,
        });

        if (result.success) {
          Toast("Refund Requested", result.message, "success");
          setReason("");
          onClose();
        } else {
          Toast("Error", result.message, "error");
        }
      } catch {
        Toast("Error", "An unexpected error occurred.", "error");
      } finally {
        setSubmitting(false);
      }
    }, [isValid, submitting, orderId, ticketId, reason, ticketPrice, onClose]);

    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="refund-overlay"
            variants={OVERLAY_ANIMATION}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.18 }}
            onClick={handleOverlayClick}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div
              key="refund-dialog"
              variants={DIALOG_ANIMATION}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={DIALOG_TRANSITION}
              role="dialog"
              aria-modal="true"
              aria-labelledby="refund-dialog-title"
              className="relative w-full max-w-md rounded-2xl border border-[hsl(214.3,31.8%,91.4%)] bg-white shadow-xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[hsl(270,70%,50%)]/10">
                    <RotateCcw
                      className="w-4.5 h-4.5 text-[hsl(270,70%,50%)]"
                      aria-hidden="true"
                    />
                  </div>
                  <h2
                    id="refund-dialog-title"
                    className="font-primary text-lg font-semibold text-[hsl(222.2,47.4%,11.2%)]"
                  >
                    Request Refund
                  </h2>
                </div>
                <button
                  type="button"
                  aria-label="Close dialog"
                  onClick={handleClose}
                  disabled={submitting}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-[hsl(215.4,16.3%,46.9%)] hover:text-[hsl(222.2,47.4%,11.2%)] transition-colors disabled:opacity-50"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <div className="border-t border-[hsl(214.3,31.8%,91.4%)]" />

              {/* Body */}
              <div className="px-6 py-5 space-y-5">
                {/* Refund amount */}
                <div>
                  <label className="font-secondary text-sm text-[hsl(215.4,16.3%,46.9%)] mb-1.5 block">
                    Refund Amount
                  </label>
                  <div className="flex items-center gap-2 rounded-lg border border-[hsl(214.3,31.8%,91.4%)] bg-[hsl(210,40%,96.1%)] px-4 py-2.5">
                    <span className="font-primary text-base font-semibold text-[hsl(222.2,47.4%,11.2%)]">
                      LKR {Number(ticketPrice).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label
                    htmlFor="refund-reason"
                    className="font-secondary text-sm text-[hsl(215.4,16.3%,46.9%)] mb-1.5 block"
                  >
                    Reason for Refund
                  </label>
                  <textarea
                    id="refund-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Please describe why you'd like a refund…"
                    rows={4}
                    disabled={submitting}
                    className={cn(
                      "w-full rounded-lg border px-4 py-3 font-secondary text-sm text-[hsl(222.2,47.4%,11.2%)] placeholder:text-[hsl(215.4,16.3%,46.9%)]/50 resize-none transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(270,70%,50%)]/30 focus:border-[hsl(270,70%,50%)] disabled:opacity-50",
                      reason.length > 0 && !isValid
                        ? "border-red-400"
                        : "border-[hsl(214.3,31.8%,91.4%)]",
                    )}
                  />
                  {reason.length > 0 && !isValid && (
                    <p className="font-secondary text-xs text-red-500 mt-1.5">
                      Reason must be at least {MIN_REASON_LENGTH} characters.
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t border-[hsl(214.3,31.8%,91.4%)]" />

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4">
                <Button
                  variant="outline"
                  size="default"
                  onClick={handleClose}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="default"
                  onClick={handleSubmit}
                  disabled={!isValid || submitting}
                  className="bg-[hsl(270,70%,50%)] hover:bg-[hsl(270,70%,45%)] text-white"
                >
                  {submitting ? "Submitting…" : "Submit Request"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  },
);

RefundRequestDialog.displayName = "RefundRequestDialog";
