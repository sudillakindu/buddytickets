// app/(main)/dashboard/(system)/event-payment-methods.tsx
"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, CreditCard, Building2, Ticket, CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/ui/utils";
import { Button } from "@/components/ui/button";
import { ALL_PAYMENT_METHODS } from "@/lib/types/payment";
import type { PaymentMethod } from "@/lib/types/payment";
import {
  getAdminEvents,
  updateEventPaymentMethods,
} from "@/lib/actions/admin-event";
import type { AdminEventSummary } from "@/lib/actions/admin-event";

// ─── Payment method display config ──────────────────────────────────────────

const METHOD_LABELS: Record<PaymentMethod, { label: string; icon: React.ReactNode }> = {
  PAYMENT_GATEWAY: {
    label: "Pay Online",
    icon: <CreditCard className="w-4 h-4" />,
  },
  BANK_TRANSFER: {
    label: "Bank Transfer",
    icon: <Building2 className="w-4 h-4" />,
  },
  ONGATE: {
    label: "Pay at Gate",
    icon: <Ticket className="w-4 h-4" />,
  },
};

// ─── Status badge styling ───────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  PUBLISHED: "bg-orange-100 text-orange-700",
  ON_SALE: "bg-emerald-100 text-emerald-700",
  ONGOING: "bg-blue-100 text-blue-700",
  SOLD_OUT: "bg-red-100 text-red-700",
  COMPLETED: "bg-gray-100 text-gray-500",
  CANCELLED: "bg-red-100 text-red-500",
};

// ─── Component ──────────────────────────────────────────────────────────────

export function EventPaymentMethodsManager() {
  const [events, setEvents] = useState<AdminEventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingEventId, setSavingEventId] = useState<string | null>(null);
  // Track local edits per event: key = event_id, value = set of selected methods
  const [edits, setEdits] = useState<Record<string, Set<PaymentMethod>>>({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const result = await getAdminEvents();
      if (cancelled) return;
      if (result.success && result.events) {
        setEvents(result.events);
        const initial: Record<string, Set<PaymentMethod>> = {};
        for (const ev of result.events) {
          initial[ev.event_id] = new Set(
            ev.allowed_payment_methods ?? ALL_PAYMENT_METHODS,
          );
        }
        setEdits(initial);
      } else {
        toast.error(result.message);
      }
      setLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleMethod = (eventId: string, method: PaymentMethod) => {
    setEdits((prev) => {
      const ev = events.find((e) => e.event_id === eventId);
      const fallback = ev?.allowed_payment_methods ?? ALL_PAYMENT_METHODS;
      const current = new Set(prev[eventId] ?? fallback);
      if (current.has(method)) {
        // Don't allow deselecting if it's the only one left
        if (current.size <= 1) {
          toast.error("At least one payment method must be selected.");
          return prev;
        }
        current.delete(method);
      } else {
        current.add(method);
      }
      return { ...prev, [eventId]: current };
    });
  };

  const handleSave = async (eventId: string) => {
    const selected = edits[eventId];
    if (!selected || selected.size === 0) {
      toast.error("At least one payment method must be selected.");
      return;
    }

    setSavingEventId(eventId);

    // If all selected, pass null (DB default = all)
    const methods: PaymentMethod[] | null =
      selected.size === ALL_PAYMENT_METHODS.length
        ? null
        : Array.from(selected);

    const result = await updateEventPaymentMethods(eventId, methods);

    if (result.success) {
      toast.success(result.message);
      // Update local state to reflect save
      setEvents((prev) =>
        prev.map((ev) =>
          ev.event_id === eventId
            ? { ...ev, allowed_payment_methods: methods }
            : ev,
        ),
      );
    } else {
      toast.error(result.message);
    }

    setSavingEventId(null);
  };

  const hasChanges = (eventId: string): boolean => {
    const ev = events.find((e) => e.event_id === eventId);
    if (!ev) return false;
    const original = new Set(ev.allowed_payment_methods ?? ALL_PAYMENT_METHODS);
    const current = edits[eventId];
    if (!current) return false;
    if (original.size !== current.size) return true;
    for (const m of original) {
      if (!current.has(m)) return true;
    }
    return false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-[hsl(270,70%,50%)]" />
        <span className="ml-2 font-secondary text-sm text-gray-500">Loading events...</span>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <p className="font-secondary text-sm text-gray-500 py-8 text-center">
        No events found.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((ev) => {
        const selected = edits[ev.event_id] ?? new Set(ALL_PAYMENT_METHODS);
        const changed = hasChanges(ev.event_id);
        const isSaving = savingEventId === ev.event_id;

        return (
          <div
            key={ev.event_id}
            className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm"
          >
            {/* Event Header */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0">
                <h3 className="font-primary font-bold text-sm text-[hsl(222.2,47.4%,11.2%)] truncate">
                  {ev.name}
                </h3>
                <p className="font-secondary text-xs text-gray-400 mt-0.5">
                  {new Date(ev.start_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-semibold font-secondary",
                    STATUS_STYLES[ev.status] ?? "bg-gray-100 text-gray-600",
                  )}
                >
                  {ev.status.replace(/_/g, " ")}
                </span>
                {!ev.is_active && (
                  <span className="px-2 py-1 rounded-full text-xs font-semibold font-secondary bg-yellow-100 text-yellow-700">
                    Inactive
                  </span>
                )}
              </div>
            </div>

            {/* Payment Methods Toggle */}
            <div className="space-y-2">
              <p className="font-secondary text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Allowed Payment Methods
              </p>
              <div className="flex flex-wrap gap-2">
                {ALL_PAYMENT_METHODS.map((method) => {
                  const isSelected = selected.has(method);
                  const config = METHOD_LABELS[method];
                  return (
                    <button
                      key={method}
                      onClick={() => toggleMethod(ev.event_id, method)}
                      disabled={isSaving}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-secondary transition-all duration-150",
                        isSelected
                          ? "border-[hsl(270,70%,50%)] bg-[hsl(270,70%,50%)]/5 text-[hsl(270,70%,50%)] font-semibold"
                          : "border-gray-200 bg-gray-50 text-gray-400 hover:border-gray-300",
                        isSaving && "opacity-50 cursor-not-allowed",
                      )}
                    >
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <span className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0" />
                      )}
                      {config.icon}
                      {config.label}
                    </button>
                  );
                })}
              </div>

              {/* All methods indicator */}
              {selected.size === ALL_PAYMENT_METHODS.length && (
                <p className="font-secondary text-xs text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  All payment methods enabled (default)
                </p>
              )}
            </div>

            {/* Save Button */}
            {changed && (
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={() => handleSave(ev.event_id)}
                  disabled={isSaving}
                  className="font-primary font-bold text-xs px-4 py-2 h-auto rounded-xl text-white bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)] hover:opacity-90"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
