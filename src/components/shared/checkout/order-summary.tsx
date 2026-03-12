// components/shared/checkout/order-summary.tsx
"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  Calendar,
  MapPin,
  Tag,
  CreditCard,
  Building2,
  Ticket,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  X,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/ui/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validatePromoCode } from "@/lib/actions/checkout";
import { createPendingOrder } from "@/lib/actions/payment";
import type { CheckoutData, ValidatedPromotion } from "@/lib/types/checkout";
import type { PaymentMethod, PaymentGatewayFormData, BankTransferDetails } from "@/lib/types/payment";

// --- Helpers ---

const formatLKR = (n: number) =>
  n === 0 ? "Free" : `LKR ${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// --- Countdown Timer ---

function useCountdown(expiresAt: string) {
  const calc = useCallback(
    () => Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)),
    [expiresAt]
  );

  const [secondsLeft, setSecondsLeft] = useState(calc);

  useEffect(() => {
    const id = setInterval(() => setSecondsLeft(calc()), 1000);
    return () => clearInterval(id);
  }, [calc]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const isUrgent = secondsLeft < 120; // < 2 minutes
  const isExpired = secondsLeft === 0;

  return { mins, secs, isUrgent, isExpired, secondsLeft };
}

// --- Payment Gateway Auto-Submit Form ---
// Renders a hidden form and auto-submits to the payment gateway checkout URL.
// Currently configured for gateway can be swapped without changing this component.

function PaymentGatewayAutoForm({ formData }: { formData: PaymentGatewayFormData }) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // Auto-submit on mount
    const t = setTimeout(() => formRef.current?.submit(), 500);
    return () => clearTimeout(t);
  }, []);

  const fields = [
    "merchant_id", "return_url", "cancel_url", "notify_url",
    "order_id", "items", "currency", "amount",
    "first_name", "last_name", "email", "phone",
    "address", "city", "country", "hash",
  ] as const;

  return (
    <form ref={formRef} method="POST" action={formData.checkout_url} className="hidden">
      {fields.map((field) => (
        <input key={field} type="hidden" name={field} value={formData[field]} />
      ))}
    </form>
  );
}

// --- Bank Transfer Instructions ---

function BankTransferPanel({ details }: { details: BankTransferDetails }) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (val: string, key: string) => {
    await navigator.clipboard.writeText(val);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 p-5 rounded-2xl border border-blue-100 bg-blue-50/60 space-y-4"
    >
      <div className="flex items-center gap-2">
        <Building2 className="w-5 h-5 text-blue-600" />
        <h4 className="font-primary font-bold text-sm uppercase tracking-wide text-blue-900">
          Bank Transfer Details
        </h4>
      </div>

      <div className="space-y-2">
        {[
          { label: "Bank", value: details.bank_name },
          { label: "Account Holder", value: details.account_holder },
          { label: "Account Number", value: details.account_number, copyable: true },
          { label: "Reference", value: details.reference, copyable: true },
          { label: "Amount", value: formatLKR(details.amount), copyable: true },
        ].map(({ label, value, copyable }) => (
          <div key={label} className="flex items-center justify-between">
            <span className="font-secondary text-xs text-blue-600 w-32 shrink-0">{label}</span>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-secondary text-sm font-semibold text-blue-900 truncate">
                {value}
              </span>
              {copyable && (
                <button
                  onClick={() => copy(value, label)}
                  className="text-blue-500 hover:text-blue-700 shrink-0"
                  aria-label={`Copy ${label}`}
                >
                  {copied === label ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-100/70">
        <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="font-secondary text-xs text-blue-800 leading-relaxed">
          {details.instructions}
        </p>
      </div>

      <p className="font-secondary text-xs text-blue-600 font-semibold">
        Order ID: {details.order_id}
      </p>
    </motion.div>
  );
}

// --- Main OrderSummary Component ---

interface OrderSummaryProps {
  data: CheckoutData;
}

const PAYMENT_METHODS: {
  id: PaymentMethod;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "PAYMENT_GATEWAY",
    label: "Pay Online",
    description: "Pay securely with Card, Mobile Banking, or eZ Cash",
    icon: <CreditCard className="w-5 h-5" />,
  },
  {
    id: "BANK_TRANSFER",
    label: "Bank Transfer",
    description: "Direct bank deposit — tickets confirmed after verification",
    icon: <Building2 className="w-5 h-5" />,
  },
  {
    id: "ONGATE",
    label: "Pay at Gate",
    description: "Pay cash at the event entrance",
    icon: <Ticket className="w-5 h-5" />,
  },
];

export function OrderSummary({ data }: OrderSummaryProps) {
  const router = useRouter();
  const { mins, secs, isUrgent, isExpired } = useCountdown(data.expires_at);

  // Filter payment methods to only those allowed for this event
  const availableMethods = PAYMENT_METHODS.filter((m) =>
    data.allowed_payment_methods.includes(m.id),
  );

  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<ValidatedPromotion | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    availableMethods[0]?.id ?? "PAYMENT_GATEWAY",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Payment gateway form state
  const [gatewayForm, setGatewayForm] = useState<PaymentGatewayFormData | null>(null);
  const [bankDetails, setBankDetails] = useState<BankTransferDetails | null>(null);
  const [orderCreated, setOrderCreated] = useState<string | null>(null);

  // Pricing
  const discountAmount = appliedPromo?.discount_amount ?? 0;
  const finalTotal = Math.max(0, data.subtotal - discountAmount);

  // Auto-redirect if expired
  useEffect(() => {
    if (isExpired) {
      toast.error("Your reservation has expired", {
        description: "Please select tickets again.",
      });
      router.push(`/events/${data.event_id}/buy-tickets`);
    }
  }, [isExpired, router, data.event_id]);

  // --- Promo handlers ---

  const handleApplyPromo = useCallback(async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError(null);
    setPromoSuccess(null);

    const ticketTypeIds = data.line_items.map((li) => li.ticket_type_id);
    const result = await validatePromoCode(
      promoCode,
      data.event_id,
      ticketTypeIds,
      data.subtotal,
    );

    setPromoLoading(false);

    if (!result.success) {
      setPromoError(result.message);
      setAppliedPromo(null);
      return;
    }
    setAppliedPromo(result.promo!);
    setPromoSuccess(result.message);
    setPromoCode("");
  }, [promoCode, data]);

  const handleRemovePromo = useCallback(() => {
    setAppliedPromo(null);
    setPromoSuccess(null);
    setPromoError(null);
  }, []);

  // --- Payment submission ---

  const handlePayNow = useCallback(async () => {
    if (isExpired) {
      toast.error("Reservation expired. Please start over.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const result = await createPendingOrder({
      reservation_id: data.primary_reservation_id,
      promotion_id: appliedPromo?.promotion_id ?? null,
      discount_amount: discountAmount,
      subtotal: data.subtotal,
      final_amount: finalTotal,
      payment_method: paymentMethod,
      remarks: null,
    });

    if (!result.success) {
      setSubmitError(result.message);
      setIsSubmitting(false);
      return;
    }

    setOrderCreated(result.order!.order_id);

    if (result.gateway_form) {
      // Payment gateway: render hidden form and auto-submit
      setGatewayForm(result.gateway_form);
      // Keep isSubmitting=true — user is being redirected
      return;
    }

    if (result.bank_details) {
      setBankDetails(result.bank_details);
      setIsSubmitting(false);
      return;
    }

    // ONGATE or unknown
    router.push(`/checkout/success?order_id=${result.order!.order_id}`);
  }, [isExpired, data, appliedPromo, discountAmount, finalTotal, paymentMethod, router]);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-5">
      {/* --- Payment gateway auto-submit form (rendered invisible, auto-submits) --- */}
      {gatewayForm && <PaymentGatewayAutoForm formData={gatewayForm} />}

      {/* --- Countdown Timer --- */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex items-center gap-3 p-3.5 rounded-2xl border",
          isUrgent
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-amber-200 bg-amber-50 text-amber-700",
        )}
      >
        <Clock className="w-4 h-4 shrink-0" />
        <p className="font-secondary text-sm font-semibold">
          {isUrgent ? "⚡ Hurry! " : ""}
          Reservation expires in{" "}
          <span className="font-primary font-black tabular-nums">
            {mins}:{secs.toString().padStart(2, "0")}
          </span>
        </p>
      </motion.div>

      {/* --- Event Info --- */}
      <div className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm space-y-3">
        <h3 className="font-primary font-black text-base uppercase tracking-wide text-[hsl(222.2,47.4%,11.2%)]">
          {data.event_name}
        </h3>
        <div className="flex items-center gap-2 text-sm font-secondary text-gray-500">
          <Calendar className="w-4 h-4 shrink-0 text-[hsl(270,70%,50%)]" />
          {formatDate(data.event_start_at)}
        </div>
        <div className="flex items-center gap-2 text-sm font-secondary text-gray-500">
          <MapPin className="w-4 h-4 shrink-0 text-[hsl(270,70%,50%)]" />
          {data.event_location}
        </div>
      </div>

      {/* --- Order Items --- */}
      <div className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingBag className="w-4 h-4 text-[hsl(270,70%,50%)]" />
          <h4 className="font-primary font-bold text-sm uppercase tracking-wide text-[hsl(222.2,47.4%,11.2%)]">
            Order Items
          </h4>
        </div>

        <div className="space-y-3">
          {data.line_items.map((item) => (
            <div
              key={item.reservation_id}
              className="flex items-start justify-between gap-3 py-2.5 border-b border-gray-50 last:border-0"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Ticket className="w-3.5 h-3.5 text-[hsl(270,70%,50%)] shrink-0" />
                  <p className="font-secondary text-sm font-semibold text-[hsl(222.2,47.4%,11.2%)] truncate">
                    {item.ticket_type_name}
                  </p>
                </div>
                <p className="font-secondary text-xs text-gray-400 mt-0.5 ml-5.5">
                  {formatLKR(item.price_each)} × {item.quantity}
                </p>
              </div>
              <p className="font-primary font-bold text-sm text-[hsl(222.2,47.4%,11.2%)] shrink-0">
                {formatLKR(item.line_total)}
              </p>
            </div>
          ))}
        </div>

        {/* Pricing breakdown */}
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
          <div className="flex justify-between text-sm font-secondary text-gray-500">
            <span>Subtotal</span>
            <span>{formatLKR(data.subtotal)}</span>
          </div>

          <AnimatePresence>
            {appliedPromo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex justify-between text-sm font-secondary text-emerald-600"
              >
                <span className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  Promo ({appliedPromo.code})
                </span>
                <span>-{formatLKR(discountAmount)}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
            <span className="font-primary font-bold text-base text-[hsl(222.2,47.4%,11.2%)]">
              Total
            </span>
            <AnimatePresence mode="wait">
              <motion.span
                key={finalTotal}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="font-primary font-black text-xl text-[hsl(270,70%,50%)]"
              >
                {formatLKR(finalTotal)}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* --- Promo Code --- */}
      <div className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Tag className="w-4 h-4 text-[hsl(270,70%,50%)]" />
          <h4 className="font-primary font-bold text-sm uppercase tracking-wide text-[hsl(222.2,47.4%,11.2%)]">
            Promo Code
          </h4>
        </div>

        <AnimatePresence mode="wait">
          {appliedPromo ? (
            <motion.div
              key="applied"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-secondary text-sm font-bold text-emerald-800">
                    {appliedPromo.code}
                  </p>
                  {appliedPromo.description && (
                    <p className="font-secondary text-xs text-emerald-600">
                      {appliedPromo.description}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={handleRemovePromo}
                className="text-emerald-500 hover:text-emerald-700 transition-colors"
                aria-label="Remove promo"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex gap-2"
            >
              <Input
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value.toUpperCase());
                  setPromoError(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                placeholder="Enter promo code"
                className="flex-1 font-secondary uppercase tracking-wider rounded-xl border-gray-200 focus:border-[hsl(270,70%,50%)] focus:ring-[hsl(270,70%,50%)]"
                maxLength={50}
                disabled={promoLoading}
              />
              <Button
                onClick={handleApplyPromo}
                disabled={!promoCode.trim() || promoLoading}
                variant="outline"
                className="rounded-xl border-[hsl(270,70%,50%)] text-[hsl(270,70%,50%)] hover:bg-[hsl(270,70%,50%)] hover:text-white font-secondary font-semibold"
              >
                {promoLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Apply"
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {promoError && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-2 text-xs font-secondary text-red-600 flex items-center gap-1.5"
            >
              <AlertCircle className="w-3 h-3" />
              {promoError}
            </motion.p>
          )}
          {promoSuccess && !appliedPromo && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-2 text-xs font-secondary text-emerald-600"
            >
              {promoSuccess}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* --- Payment Method --- */}
      {!bankDetails && !gatewayForm && (
        <div className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-4 h-4 text-[hsl(270,70%,50%)]" />
            <h4 className="font-primary font-bold text-sm uppercase tracking-wide text-[hsl(222.2,47.4%,11.2%)]">
              Payment Method
            </h4>
          </div>
          <div className="space-y-2">
            {availableMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-150",
                  paymentMethod === method.id
                    ? "border-[hsl(270,70%,50%)] bg-[hsl(270,70%,50%)]/5 ring-1 ring-[hsl(270,70%,50%)]/30"
                    : "border-gray-200 hover:border-gray-300 bg-white",
                )}
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                    paymentMethod === method.id
                      ? "border-[hsl(270,70%,50%)]"
                      : "border-gray-300",
                  )}
                >
                  {paymentMethod === method.id && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[hsl(270,70%,50%)]" />
                  )}
                </div>
                <span
                  className={cn(
                    "shrink-0 transition-colors",
                    paymentMethod === method.id
                      ? "text-[hsl(270,70%,50%)]"
                      : "text-gray-400",
                  )}
                >
                  {method.icon}
                </span>
                <div className="min-w-0">
                  <p
                    className={cn(
                      "font-secondary text-sm font-semibold",
                      paymentMethod === method.id
                        ? "text-[hsl(222.2,47.4%,11.2%)]"
                        : "text-gray-600",
                    )}
                  >
                    {method.label}
                  </p>
                  <p className="font-secondary text-xs text-gray-400 leading-snug">
                    {method.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* --- Bank Transfer Panel --- */}
      <AnimatePresence>
        {bankDetails && <BankTransferPanel details={bankDetails} />}
      </AnimatePresence>

      {/* --- Payment Gateway Redirecting State --- */}
      <AnimatePresence>
        {gatewayForm && !bankDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-3 py-8 text-center"
          >
            <Loader2 className="w-8 h-8 animate-spin text-[hsl(270,70%,50%)]" />
            <p className="font-secondary text-sm text-gray-600">
              Redirecting to secure payment gateway...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Submit Error --- */}
      <AnimatePresence>
        {submitError && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-3 p-4 rounded-2xl border border-red-200 bg-red-50"
          >
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-secondary text-sm font-semibold text-red-800">
                Payment Failed
              </p>
              <p className="font-secondary text-sm text-red-700 mt-0.5">{submitError}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Pay Now CTA --- */}
      {!bankDetails && !gatewayForm && (
        <Button
          onClick={handlePayNow}
          disabled={isSubmitting || isExpired}
          className={cn(
            "w-full font-primary font-bold text-sm py-4 h-auto rounded-xl text-white shadow-md transition-all duration-300",
            !isSubmitting && !isExpired
              ? "bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] via-[hsl(270,70%,50%)] to-[hsl(222.2,47.4%,11.2%)] bg-[length:200%_auto] hover:bg-[position:100%_0] hover:shadow-xl hover:-translate-y-0.5"
              : "bg-gray-300",
          )}
        >
          <span className="flex items-center justify-center gap-2">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                Pay {formatLKR(finalTotal)}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </span>
        </Button>
      )}

      {bankDetails && (
        <Button
          onClick={() => router.push(`/checkout/success?order_id=${orderCreated}`)}
          className="w-full font-primary font-bold text-sm py-4 h-auto rounded-xl text-white bg-[hsl(222.2,47.4%,11.2%)] hover:bg-[hsl(222.2,47.4%,20%)] shadow-md"
        >
          I&apos;ve Made the Transfer
          <ArrowRight className="w-4 h-4" />
        </Button>
      )}

      {/* --- Security badge --- */}
      {!bankDetails && !gatewayForm && (
        <p className="text-center font-secondary text-xs text-gray-400 flex items-center justify-center gap-1.5">
          <span className="text-emerald-500">🔒</span>
          Secured by 256-bit SSL encryption. Your payment details are never stored.
        </p>
      )}
    </div>
  );
}