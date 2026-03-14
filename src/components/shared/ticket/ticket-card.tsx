"use client";

import React, { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  QrCode,
  Tag,
  User,
  Star,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/ui/utils";
import { Button } from "@/components/ui/button";
import { ReviewForm } from "@/components/shared/reviews/review-form";
import { RefundRequestForm } from "@/components/shared/refunds/refund-request-form";
import type { Ticket } from "@/lib/types/ticket";

export interface TicketCardProps {
  ticket: Ticket;
  index?: number;
}

const formatDate = (iso: string): string => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const formatTime = (iso: string): string => {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const TicketCard: React.FC<TicketCardProps> = memo(
  ({ ticket, index = 0 }) => {
    const [showReview, setShowReview] = useState(false);
    const [showRefund, setShowRefund] = useState(false);

    const getStatusUI = () => {
      switch (ticket.status) {
        case "ACTIVE":
          return {
            text: "Active",
            dotClass: "bg-emerald-500",
            bgClass: "bg-emerald-50",
            textClass: "text-emerald-700",
          };
        case "PENDING":
          return {
            text: "Pending",
            dotClass: "bg-amber-500",
            bgClass: "bg-amber-50",
            textClass: "text-amber-700",
          };
        case "USED":
          return {
            text: "Used",
            dotClass: "bg-gray-400",
            bgClass: "bg-gray-100",
            textClass: "text-gray-600",
          };
        case "CANCELLED":
          return {
            text: "Cancelled",
            dotClass: "bg-red-500",
            bgClass: "bg-red-50",
            textClass: "text-red-700",
          };
        default:
          return {
            text: "Active",
            dotClass: "bg-emerald-500",
            bgClass: "bg-emerald-50",
            textClass: "text-emerald-700",
          };
      }
    };

    const status = getStatusUI();
    const qrShort = ticket.qr_hash
      ? `${ticket.qr_hash.slice(0, 8)}…${ticket.qr_hash.slice(-4)}`
      : "—";

    const isEventCompleted = ticket.event.status === "COMPLETED";
    const canRequestRefund =
      ticket.status === "ACTIVE" || ticket.status === "PENDING";
    const hasAttendeeInfo =
      ticket.attendee_name ||
      ticket.attendee_nic ||
      ticket.attendee_email ||
      ticket.attendee_mobile;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.06 }}
        className="group relative w-full rounded-2xl border border-[hsl(214.3,31.8%,91.4%)] bg-white shadow-sm hover:shadow-md hover:border-[hsl(270,70%,50%)]/20 transition-all duration-300"
      >
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-[hsl(210,40%,96.1%)] border border-[hsl(214.3,31.8%,91.4%)]" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-5 h-5 rounded-full bg-[hsl(210,40%,96.1%)] border border-[hsl(214.3,31.8%,91.4%)]" />

        <div className="px-5 sm:px-6 py-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="min-w-0 flex-1">
              <h3 className="font-primary text-base sm:text-lg font-semibold text-[hsl(222.2,47.4%,11.2%)] truncate">
                {ticket.event.name}
              </h3>
              <p className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)] mt-0.5">
                {ticket.ticket_type.name}
              </p>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0",
                status.bgClass,
                status.textClass,
              )}
            >
              <span
                className={cn("w-1.5 h-1.5 rounded-full", status.dotClass)}
              />
              {status.text}
            </span>
          </div>

          <div className="border-t border-dashed border-[hsl(214.3,31.8%,91.4%)] my-3" />

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Calendar
                className="w-3.5 h-3.5 text-[hsl(270,70%,50%)] shrink-0"
                aria-hidden="true"
              />
              <span className="font-secondary text-xs text-[hsl(222.2,47.4%,11.2%)]">
                {formatDate(ticket.event.start_at)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock
                className="w-3.5 h-3.5 text-[hsl(270,70%,50%)] shrink-0"
                aria-hidden="true"
              />
              <span className="font-secondary text-xs text-[hsl(222.2,47.4%,11.2%)]">
                {formatTime(ticket.event.start_at)}
              </span>
            </div>
            <div className="flex items-center gap-2 col-span-2">
              <MapPin
                className="w-3.5 h-3.5 text-[hsl(270,70%,50%)] shrink-0"
                aria-hidden="true"
              />
              <span className="font-secondary text-xs text-[hsl(222.2,47.4%,11.2%)] truncate">
                {ticket.event.location || "—"}
              </span>
            </div>
          </div>

          {/* --- Attendee Info --- */}
          {hasAttendeeInfo && (
            <>
              <div className="border-t border-dashed border-[hsl(214.3,31.8%,91.4%)] my-3" />
              <div className="space-y-1.5">
                <p className="font-secondary text-[10px] uppercase tracking-wider text-gray-400 flex items-center gap-1">
                  <User className="w-3 h-3" /> Attendee
                </p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  {ticket.attendee_name && (
                    <span className="font-secondary text-xs text-[hsl(222.2,47.4%,11.2%)]">
                      {ticket.attendee_name}
                    </span>
                  )}
                  {ticket.attendee_nic && (
                    <span className="font-secondary text-xs text-gray-500 font-mono">
                      {ticket.attendee_nic}
                    </span>
                  )}
                  {ticket.attendee_email && (
                    <span className="font-secondary text-xs text-gray-500 truncate">
                      {ticket.attendee_email}
                    </span>
                  )}
                  {ticket.attendee_mobile && (
                    <span className="font-secondary text-xs text-gray-500">
                      {ticket.attendee_mobile}
                    </span>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="border-t border-dashed border-[hsl(214.3,31.8%,91.4%)] my-3" />

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <QrCode
                className="w-3.5 h-3.5 text-[hsl(215.4,16.3%,46.9%)] shrink-0"
                aria-hidden="true"
              />
              <span className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)] truncate font-mono">
                {qrShort}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Tag
                className="w-3.5 h-3.5 text-[hsl(270,70%,50%)]"
                aria-hidden="true"
              />
              <span className="font-primary text-sm font-semibold text-[hsl(222.2,47.4%,11.2%)]">
                LKR {Number(ticket.price_purchased).toLocaleString()}
              </span>
            </div>
          </div>

          {/* --- Action Buttons --- */}
          {(isEventCompleted || canRequestRefund) && (
            <>
              <div className="border-t border-dashed border-[hsl(214.3,31.8%,91.4%)] my-3" />
              <div className="flex items-center gap-2 flex-wrap">
                {isEventCompleted && (
                  <Button
                    variant="ghost"
                    onClick={() => setShowReview((v) => !v)}
                    className="h-7 px-3 text-xs font-secondary text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg"
                  >
                    <Star className="w-3 h-3 mr-1" />
                    {showReview ? "Hide Review" : "Leave Review"}
                  </Button>
                )}
                {canRequestRefund && (
                  <Button
                    variant="ghost"
                    onClick={() => setShowRefund((v) => !v)}
                    className="h-7 px-3 text-xs font-secondary text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    {showRefund ? "Cancel" : "Request Refund"}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>

        {/* --- Expandable Sections --- */}
        <AnimatePresence>
          {showReview && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden px-5 sm:px-6"
            >
              <div className="pb-5">
                <ReviewForm
                  eventId={ticket.event.event_id}
                  ticketId={ticket.ticket_id}
                  // TODO: Replace with actual review server action
                  onSubmit={async () => ({
                    success: true,
                    message:
                      "Thank you! Your review has been submitted.",
                  })}
                />
              </div>
            </motion.div>
          )}
          {showRefund && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden px-5 sm:px-6"
            >
              <div className="pb-5">
                <RefundRequestForm
                  orderId={ticket.order_id}
                  ticketId={ticket.ticket_id}
                  maxRefundAmount={Number(ticket.price_purchased)}
                  // TODO: Replace with actual refund server action
                  onSubmit={async () => ({
                    success: true,
                    message:
                      "Your refund request has been submitted. We will review it shortly.",
                  })}
                  onClose={() => setShowRefund(false)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  },
);

TicketCard.displayName = "TicketCard";
