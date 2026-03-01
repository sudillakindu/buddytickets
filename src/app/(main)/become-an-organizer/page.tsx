// app/(main)/become-an-organizer/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState, memo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  MessageCircle,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import { cn } from "@/lib/ui/utils";
import { logger } from "@/lib/logger";

import {
  getOrganizerOnboardingState,
  submitOrganizerDetails,
} from "@/lib/actions/organizer";
import type {
  OrganizerDetails,
  OrganizerDetailsFieldErrors,
  OrganizerOnboardingUser,
} from "@/lib/types/organizer";

// ─── Internal Types & State ───────────────────────────────────────────────────

interface OrganizerFormState {
  nic_number: string;
  address: string;
  bank_name: string;
  bank_branch: string;
  account_holder_name: string;
  account_number: string;
  nic_front_image: File | null;
  nic_back_image: File | null;
}

const INITIAL_FORM_STATE: OrganizerFormState = {
  nic_number: "",
  address: "",
  bank_name: "",
  bank_branch: "",
  account_holder_name: "",
  account_number: "",
  nic_front_image: null,
  nic_back_image: null,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidSriLankanNic(value: string): boolean {
  const nic = value.trim().toUpperCase();
  return /^\d{9}[VX]$/.test(nic) || /^\d{12}$/.test(nic);
}

function buildWhatsAppLink(
  user: OrganizerOnboardingUser,
  whatsappNumber: string,
): string {
  const sanitizedNumber = whatsappNumber.replace(/[^\d]/g, "");
  const message = [
    "Hello BuddyTickets Team,",
    "",
    "I would like to request organizer role activation.",
    `user_id: ${user.user_id}`,
    `name: ${user.name}`,
    `email: ${user.email}`,
    `mobile: ${user.mobile}`,
  ].join("\n");

  return `https://wa.me/${sanitizedNumber}?text=${encodeURIComponent(message)}`;
}

function validateForm(
  form: OrganizerFormState,
): { message: string; fieldErrors: OrganizerDetailsFieldErrors } | null {
  const fieldErrors: OrganizerDetailsFieldErrors = {};

  if (!isValidSriLankanNic(form.nic_number)) {
    fieldErrors.nic_number =
      "Enter a valid Sri Lankan NIC (old or new format).";
  }
  if (form.address.trim().length < 8) {
    fieldErrors.address = "Address must be at least 8 characters.";
  }
  if (!form.bank_name.trim()) {
    fieldErrors.bank_name = "Bank name is required.";
  }
  if (!form.bank_branch.trim()) {
    fieldErrors.bank_branch = "Bank branch is required.";
  }
  if (!form.account_holder_name.trim()) {
    fieldErrors.account_holder_name = "Account holder name is required.";
  }
  if (!form.account_number.trim()) {
    fieldErrors.account_number = "Account number is required.";
  }
  if (!(form.nic_front_image instanceof File)) {
    fieldErrors.nic_front_image = "NIC front image is required.";
  }
  if (!(form.nic_back_image instanceof File)) {
    fieldErrors.nic_back_image = "NIC back image is required.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      message: "Please correct the highlighted fields before submitting.",
      fieldErrors,
    };
  }

  return null;
}

// ─── Components ───────────────────────────────────────────────────────────────

const StepItem = memo(
  ({
    step,
    title,
    description,
    completed,
    active,
  }: {
    step: number;
    title: string;
    description: string;
    completed: boolean;
    active: boolean;
  }) => (
    <div
      className={cn(
        "rounded-2xl border p-4 sm:p-5 bg-white/90 backdrop-blur-sm transition-colors",
        completed && "border-[hsl(142,71%,45%)]/30 bg-[hsl(142,71%,96%)]",
        !completed &&
          active &&
          "border-[hsl(270,70%,50%)]/30 bg-[hsl(270,70%,97%)]",
        !completed && !active && "border-[hsl(214.3,31.8%,91.4%)]",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-primary font-semibold shrink-0",
            completed && "bg-[hsl(142,71%,45%)] text-white",
            !completed && active && "bg-[hsl(270,70%,50%)] text-white",
            !completed &&
              !active &&
              "bg-[hsl(210,40%,96.1%)] text-[hsl(215.4,16.3%,46.9%)]",
          )}
        >
          {completed ? (
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
          ) : (
            step
          )}
        </div>
        <div>
          <h3 className="font-primary text-sm sm:text-base font-semibold text-[hsl(222.2,47.4%,11.2%)]">
            {title}
          </h3>
          <p className="font-secondary text-xs sm:text-sm text-[hsl(215.4,16.3%,46.9%)] mt-1">
            {description}
          </p>
        </div>
      </div>
    </div>
  ),
);

StepItem.displayName = "StepItem";

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BecomeAnOrganizerPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const [user, setUser] = useState<OrganizerOnboardingUser | null>(null);
  const [organizerDetails, setOrganizerDetails] =
    useState<OrganizerDetails | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState("");

  const [form, setForm] = useState<OrganizerFormState>(INITIAL_FORM_STATE);
  const [fieldErrors, setFieldErrors] = useState<OrganizerDetailsFieldErrors>(
    {},
  );

  const loadState = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getOrganizerOnboardingState();
      if (result.success) {
        setUser(result.user);
        setOrganizerDetails(result.organizerDetails);
        setWhatsappNumber(result.whatsappNumber);
      } else {
        Toast("Error", result.message, "error");
      }
    } catch (error) {
      logger.error({
        fn: "BecomeAnOrganizerPage.loadState",
        message: "Failed to load organizer onboarding state",
        meta: error,
      });
      Toast("Error", "Failed to load organizer onboarding state.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      await loadState();
      if (cancelled) return;
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [loadState]);

  const isSignedIn = Boolean(user);
  const isOrganizer = user?.role === "ORGANIZER";
  const hasSubmittedDetails = organizerDetails?.is_submitted === true;
  const shouldShowStep3Button =
    !hasSubmittedDetails || organizerDetails?.status === "REJECTED";

  const stepState = useMemo(
    () => ({
      step1: isSignedIn,
      step2: isOrganizer,
      step3: hasSubmittedDetails,
      step4: hasSubmittedDetails,
    }),
    [isOrganizer, isSignedIn, hasSubmittedDetails],
  );

  const whatsappLink = useMemo(() => {
    if (!user || !whatsappNumber) return null;
    return buildWhatsAppLink(user, whatsappNumber);
  }, [user, whatsappNumber]);

  const openDetailsModal = useCallback(() => {
    if (!isOrganizer) return;

    setFieldErrors({});
    setForm({
      nic_number: organizerDetails?.nic_number ?? "",
      address: organizerDetails?.address ?? "",
      bank_name: organizerDetails?.bank_name ?? "",
      bank_branch: organizerDetails?.bank_branch ?? "",
      account_holder_name: organizerDetails?.account_holder_name ?? "",
      account_number: organizerDetails?.account_number ?? "",
      nic_front_image: null,
      nic_back_image: null,
    });
    setModalOpen(true);
  }, [isOrganizer, organizerDetails]);

  const closeDetailsModal = useCallback(() => {
    if (submitting) return;
    setModalOpen(false);
  }, [submitting]);

  const handleChange = useCallback(
    (field: keyof OrganizerFormState, value: string | File | null) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    [],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const validation = validateForm(form);
      if (validation) {
        setFieldErrors(validation.fieldErrors);
        Toast("Validation Error", validation.message, "warning");
        return;
      }

      setSubmitting(true);
      try {
        const payload = new FormData();
        payload.append("nic_number", form.nic_number.trim().toUpperCase());
        payload.append("address", form.address.trim());
        payload.append("bank_name", form.bank_name.trim());
        payload.append("bank_branch", form.bank_branch.trim());
        payload.append("account_holder_name", form.account_holder_name.trim());
        payload.append("account_number", form.account_number.trim());
        payload.append("nic_front_image", form.nic_front_image as File);
        payload.append("nic_back_image", form.nic_back_image as File);

        const result = await submitOrganizerDetails(payload);
        if (!result.success) {
          if (result.fieldErrors) setFieldErrors(result.fieldErrors);
          Toast("Error", result.message, "error");
          return;
        }

        Toast("Success", result.message, "success");
        setModalOpen(false);
        setForm(INITIAL_FORM_STATE);
        setFieldErrors({});
        await loadState();
      } catch (error) {
        logger.error({
          fn: "BecomeAnOrganizerPage.handleSubmit",
          message: "Failed to submit organizer details",
          meta: error,
        });
        Toast("Error", "Failed to submit organizer details.", "error");
      } finally {
        setSubmitting(false);
      }
    },
    [form, loadState],
  );

  return (
    <section className="w-full min-h-[80dvh] bg-gradient-to-b from-white to-[hsl(210,40%,96.1%)] pt-24 pb-16">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-primary text-2xl sm:text-3xl font-semibold text-[hsl(222.2,47.4%,11.2%)]">
            Become an{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]">
              Organizer
            </span>
          </h1>
          <div className="h-1.5 w-24 rounded-full mt-2 bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]" />
          <p className="font-secondary text-sm sm:text-base text-[hsl(215.4,16.3%,46.9%)] mt-3 max-w-2xl">
            Complete the 4-step onboarding process to activate organizer
            features and publish your first event.
          </p>
        </div>

        {loading ? (
          <div className="py-24 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[hsl(270,70%,50%)]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-5 space-y-4"
            >
              <StepItem
                step={1}
                title="Authentication"
                description="Sign in or create an account to start onboarding."
                completed={stepState.step1}
                active={!stepState.step1}
              />
              <StepItem
                step={2}
                title="Role Upgrade"
                description="Request organizer role activation through WhatsApp."
                completed={stepState.step2}
                active={stepState.step1 && !stepState.step2}
              />
              <StepItem
                step={3}
                title="Organizer Details"
                description="Submit NIC and payout information for review."
                completed={stepState.step3}
                active={stepState.step2 && !stepState.step3}
              />
              <StepItem
                step={4}
                title="Status Review"
                description="Track approval status and next actions."
                completed={stepState.step4}
                active={stepState.step3}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="lg:col-span-7"
            >
              <div className="rounded-2xl border border-[hsl(214.3,31.8%,91.4%)] bg-white shadow-sm p-5 sm:p-6 space-y-6">
                {!isSignedIn && (
                  <div className="rounded-xl border border-[hsl(214.3,31.8%,91.4%)] bg-[hsl(210,40%,98%)] p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      <UserCheck
                        className="w-5 h-5 text-[hsl(270,70%,50%)] mt-0.5"
                        aria-hidden="true"
                      />
                      <div>
                        <h2 className="font-primary text-base sm:text-lg font-semibold text-[hsl(222.2,47.4%,11.2%)]">
                          Step 1: Sign In to Continue
                        </h2>
                        <p className="font-secondary text-sm text-[hsl(215.4,16.3%,46.9%)] mt-1 mb-4">
                          You need an authenticated account before requesting
                          organizer access.
                        </p>
                        <div className="flex flex-wrap items-center gap-3">
                          <Button
                            asChild
                            className="h-auto py-2.5 px-5 rounded-xl font-primary text-sm text-white border-none bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] via-[hsl(270,70%,50%)] to-[hsl(222.2,47.4%,11.2%)] bg-[length:200%_auto] bg-[position:0_0] hover:bg-[position:100%_0] transition-all duration-300"
                          >
                            <Link href="/sign-in">Sign In</Link>
                          </Button>
                          <Button
                            asChild
                            variant="outline"
                            className="h-auto py-2.5 px-5 rounded-xl border-[hsl(214.3,31.8%,91.4%)] font-primary text-sm"
                          >
                            <Link href="/sign-up">Sign Up</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {isSignedIn && !isOrganizer && (
                  <div className="rounded-xl border border-[hsl(214.3,31.8%,91.4%)] bg-[hsl(210,40%,98%)] p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      <MessageCircle
                        className="w-5 h-5 text-[hsl(270,70%,50%)] mt-0.5"
                        aria-hidden="true"
                      />
                      <div className="w-full">
                        <h2 className="font-primary text-base sm:text-lg font-semibold text-[hsl(222.2,47.4%,11.2%)]">
                          Step 2: Request Role Upgrade
                        </h2>
                        <p className="font-secondary text-sm text-[hsl(215.4,16.3%,46.9%)] mt-1 mb-4">
                          Send your account details directly via WhatsApp for
                          organizer role activation.
                        </p>
                        <Button
                          asChild
                          disabled={!whatsappLink}
                          className="h-auto py-2.5 px-5 rounded-xl font-primary text-sm text-white border-none bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] via-[hsl(270,70%,50%)] to-[hsl(222.2,47.4%,11.2%)] bg-[length:200%_auto] bg-[position:0_0] hover:bg-[position:100%_0] transition-all duration-300"
                        >
                          <a
                            href={whatsappLink ?? "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Open WhatsApp Request
                          </a>
                        </Button>
                        {!whatsappLink && (
                          <p className="font-secondary text-xs text-red-500 mt-2">
                            WhatsApp support number is currently unavailable.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {isOrganizer && (
                  <div className="rounded-xl border border-[hsl(214.3,31.8%,91.4%)] bg-[hsl(210,40%,98%)] p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      <FileText
                        className="w-5 h-5 text-[hsl(270,70%,50%)] mt-0.5"
                        aria-hidden="true"
                      />
                      <div className="w-full">
                        <h2 className="font-primary text-base sm:text-lg font-semibold text-[hsl(222.2,47.4%,11.2%)]">
                          Step 3: Submit Organizer Details
                        </h2>
                        <p
                          className={cn(
                            "font-secondary text-sm text-[hsl(215.4,16.3%,46.9%)] mt-1",
                            shouldShowStep3Button ? "mb-4" : "mb-0",
                          )}
                        >
                          Provide identity and bank payout details to complete
                          organizer onboarding.
                        </p>

                        {shouldShowStep3Button && (
                          <Button
                            onClick={openDetailsModal}
                            className="h-auto py-2.5 px-5 rounded-xl font-primary text-sm text-white border-none bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] via-[hsl(270,70%,50%)] to-[hsl(222.2,47.4%,11.2%)] bg-[length:200%_auto] bg-[position:0_0] hover:bg-[position:100%_0] transition-all duration-300"
                          >
                            {organizerDetails?.status === "REJECTED"
                              ? "Resubmit Details"
                              : "Submit Details"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {hasSubmittedDetails && organizerDetails && (
                  <div className="rounded-xl border border-[hsl(214.3,31.8%,91.4%)] bg-white p-4 sm:p-5">
                    {organizerDetails.status === "PENDING" && (
                      <div className="flex items-start gap-3">
                        <Clock3
                          className="w-5 h-5 text-[hsl(32,95%,44%)] mt-0.5"
                          aria-hidden="true"
                        />
                        <div>
                          <h3 className="font-primary text-base font-semibold text-[hsl(32,95%,44%)]">
                            Waiting for Approval
                          </h3>
                          <p className="font-secondary text-sm text-[hsl(215.4,16.3%,46.9%)] mt-1">
                            Your organizer details are submitted and currently
                            under review.
                          </p>
                        </div>
                      </div>
                    )}

                    {organizerDetails.status === "REJECTED" && (
                      <div className="flex items-start gap-3">
                        <XCircle
                          className="w-5 h-5 text-red-500 mt-0.5"
                          aria-hidden="true"
                        />
                        <div className="w-full">
                          <h3 className="font-primary text-base font-semibold text-red-600">
                            Submission Rejected
                          </h3>
                          <p className="font-secondary text-sm text-[hsl(215.4,16.3%,46.9%)] mt-1">
                            {organizerDetails.remarks?.trim() ||
                              "Your previous submission was rejected. Please correct and resubmit."}
                          </p>
                        </div>
                      </div>
                    )}

                    {organizerDetails.status === "APPROVED" && (
                      <div className="flex items-start gap-3">
                        {user?.is_active ? (
                          <ShieldCheck
                            className="w-5 h-5 text-[hsl(142,71%,45%)] mt-0.5"
                            aria-hidden="true"
                          />
                        ) : (
                          <ShieldAlert
                            className="w-5 h-5 text-red-500 mt-0.5"
                            aria-hidden="true"
                          />
                        )}

                        <div className="w-full">
                          <h3 className="font-primary text-base font-semibold text-[hsl(142,71%,45%)]">
                            {user?.is_active
                              ? "Organizer Approved"
                              : "Account Suspended"}
                          </h3>
                          <p className="font-secondary text-sm text-[hsl(215.4,16.3%,46.9%)] mt-1">
                            {user?.is_active
                              ? "Your organizer account is active. You can now create your first event."
                              : "Your organizer profile is approved, but your account is currently suspended."}
                          </p>

                          {user?.is_active && (
                            <Button
                              asChild
                              className="mt-3 h-auto py-2.5 px-5 rounded-xl font-primary text-sm text-white border-none bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] via-[hsl(270,70%,50%)] to-[hsl(222.2,47.4%,11.2%)] bg-[length:200%_auto] bg-[position:0_0] hover:bg-[position:100%_0] transition-all duration-300"
                            >
                              <Link href="/create-event">
                                Create First Event
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-[hsl(222.2,47.4%,11.2%)]/45 backdrop-blur-[2px]"
            onClick={closeDetailsModal}
            aria-label="Close organizer details dialog"
          />

          <div className="relative w-full max-w-2xl rounded-2xl border border-[hsl(214.3,31.8%,91.4%)] bg-white shadow-2xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="mb-5">
              <h3 className="font-primary text-xl font-semibold text-[hsl(222.2,47.4%,11.2%)]">
                Organizer Details Form
              </h3>
              <p className="font-secondary text-sm text-[hsl(215.4,16.3%,46.9%)] mt-1">
                Fill all required fields and upload both NIC images.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Input
                    value={form.nic_number}
                    onChange={(e) =>
                      handleChange("nic_number", e.target.value.toUpperCase())
                    }
                    placeholder="NIC Number"
                    className="font-secondary rounded-xl border-2 bg-[hsl(210,40%,98%)] border-[hsl(214.3,31.8%,91.4%)] focus-visible:ring-0 focus-visible:border-[hsl(270,70%,50%)]"
                  />
                  {fieldErrors.nic_number && (
                    <p className="font-secondary text-xs text-red-500 mt-1">
                      {fieldErrors.nic_number}
                    </p>
                  )}
                </div>
                <div>
                  <Input
                    value={form.account_number}
                    onChange={(e) =>
                      handleChange("account_number", e.target.value)
                    }
                    placeholder="Account Number"
                    className="font-secondary rounded-xl border-2 bg-[hsl(210,40%,98%)] border-[hsl(214.3,31.8%,91.4%)] focus-visible:ring-0 focus-visible:border-[hsl(270,70%,50%)]"
                  />
                  {fieldErrors.account_number && (
                    <p className="font-secondary text-xs text-red-500 mt-1">
                      {fieldErrors.account_number}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Input
                  value={form.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="Address"
                  className="font-secondary rounded-xl border-2 bg-[hsl(210,40%,98%)] border-[hsl(214.3,31.8%,91.4%)] focus-visible:ring-0 focus-visible:border-[hsl(270,70%,50%)]"
                />
                {fieldErrors.address && (
                  <p className="font-secondary text-xs text-red-500 mt-1">
                    {fieldErrors.address}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Input
                    value={form.bank_name}
                    onChange={(e) => handleChange("bank_name", e.target.value)}
                    placeholder="Bank Name"
                    className="font-secondary rounded-xl border-2 bg-[hsl(210,40%,98%)] border-[hsl(214.3,31.8%,91.4%)] focus-visible:ring-0 focus-visible:border-[hsl(270,70%,50%)]"
                  />
                  {fieldErrors.bank_name && (
                    <p className="font-secondary text-xs text-red-500 mt-1">
                      {fieldErrors.bank_name}
                    </p>
                  )}
                </div>
                <div>
                  <Input
                    value={form.bank_branch}
                    onChange={(e) =>
                      handleChange("bank_branch", e.target.value)
                    }
                    placeholder="Bank Branch"
                    className="font-secondary rounded-xl border-2 bg-[hsl(210,40%,98%)] border-[hsl(214.3,31.8%,91.4%)] focus-visible:ring-0 focus-visible:border-[hsl(270,70%,50%)]"
                  />
                  {fieldErrors.bank_branch && (
                    <p className="font-secondary text-xs text-red-500 mt-1">
                      {fieldErrors.bank_branch}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Input
                  value={form.account_holder_name}
                  onChange={(e) =>
                    handleChange("account_holder_name", e.target.value)
                  }
                  placeholder="Account Holder Name"
                  className="font-secondary rounded-xl border-2 bg-[hsl(210,40%,98%)] border-[hsl(214.3,31.8%,91.4%)] focus-visible:ring-0 focus-visible:border-[hsl(270,70%,50%)]"
                />
                {fieldErrors.account_holder_name && (
                  <p className="font-secondary text-xs text-red-500 mt-1">
                    {fieldErrors.account_holder_name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) =>
                      handleChange(
                        "nic_front_image",
                        e.target.files?.[0] ?? null,
                      )
                    }
                    className="font-secondary rounded-xl border-2 bg-[hsl(210,40%,98%)] border-[hsl(214.3,31.8%,91.4%)] focus-visible:ring-0 focus-visible:border-[hsl(270,70%,50%)]"
                  />
                  <p className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)] mt-1">
                    NIC Front Image
                  </p>
                  {fieldErrors.nic_front_image && (
                    <p className="font-secondary text-xs text-red-500 mt-1">
                      {fieldErrors.nic_front_image}
                    </p>
                  )}
                </div>

                <div>
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) =>
                      handleChange(
                        "nic_back_image",
                        e.target.files?.[0] ?? null,
                      )
                    }
                    className="font-secondary rounded-xl border-2 bg-[hsl(210,40%,98%)] border-[hsl(214.3,31.8%,91.4%)] focus-visible:ring-0 focus-visible:border-[hsl(270,70%,50%)]"
                  />
                  <p className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)] mt-1">
                    NIC Back Image
                  </p>
                  {fieldErrors.nic_back_image && (
                    <p className="font-secondary text-xs text-red-500 mt-1">
                      {fieldErrors.nic_back_image}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeDetailsModal}
                  disabled={submitting}
                  className="rounded-xl font-primary"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="h-auto min-w-[130px] py-2.5 px-5 rounded-xl font-primary text-sm text-white border-none bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] via-[hsl(270,70%,50%)] to-[hsl(222.2,47.4%,11.2%)] bg-[length:200%_auto] bg-[position:0_0] hover:bg-[position:100%_0] transition-all duration-300"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Submit Details"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
