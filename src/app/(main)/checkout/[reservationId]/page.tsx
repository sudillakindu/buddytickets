import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ShieldCheck } from "lucide-react";
import { getSession } from "@/lib/utils/session";
import { getCheckoutData } from "@/lib/actions/checkout";
import { OrderSummary } from "@/components/shared/checkout/order-summary";
import { OrderSummarySkeleton } from "@/components/shared/checkout/order-summary-skeleton";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Checkout — BuddyTicket",
  description: "Complete your ticket purchase securely.",
};

interface PageProps {
  params: Promise<{ reservationId: string }>;
}

export default async function CheckoutPage({ params }: PageProps) {
  const { reservationId } = await params;

  const session = await getSession();

  if (!session) {
    redirect(`/sign-in?redirect=/checkout/${reservationId}`);
  }

  const result = await getCheckoutData(reservationId);

  if (!result.success) {
    if (
      result.message === "RESERVATION_EXPIRED" ||
      result.message === "RESERVATION_ALREADY_CONFIRMED"
    ) {
      redirect("/events?message=reservation_expired");
    }
    redirect("/events?message=checkout_error");
  }

  const data = result.data!;

  return (
    <main className="w-full min-h-screen bg-gradient-to-b from-white to-[hsl(210,40%,96.1%)] pt-24 pb-16">
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6">
        <div className="mb-6">
          <Button
            asChild
            variant="ghost"
            className="mb-4 -ml-2 h-8 px-2 text-gray-500 hover:text-[hsl(222.2,47.4%,11.2%)] rounded-full text-xs font-secondary"
          >
            <Link href={`/events/${data.event_id}/buy-tickets`}>
              <ChevronLeft className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
              Back to Ticket Selection
            </Link>
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-primary text-2xl sm:text-3xl font-semibold text-[hsl(222.2,47.4%,11.2%)]">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]">
                  Checkout
                </span>
              </h1>
              <div className="h-1 w-16 rounded-full mt-1 bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]" />
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-200 bg-emerald-50">
              <ShieldCheck
                className="w-3.5 h-3.5 text-emerald-600"
                aria-hidden="true"
              />
              <span className="font-secondary text-xs font-semibold text-emerald-700">
                Secure
              </span>
            </div>
          </div>

          <p className="mt-2 font-secondary text-xs text-gray-400">
            Checking out as{" "}
            <span className="font-semibold text-gray-600">{session.email}</span>
          </p>
        </div>

        <Suspense fallback={<OrderSummarySkeleton />}>
          <OrderSummary data={data} />
        </Suspense>
      </div>
    </main>
  );
}
