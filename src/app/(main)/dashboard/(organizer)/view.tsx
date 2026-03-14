import React from "react";
import type { SessionUser } from "@/lib/utils/session";
import { EventPlatformFeeForm } from "@/components/shared/event-community/event-platform-fee-form";
import { PayoutsTable } from "@/components/shared/payouts/payouts-table";
import { PromotionForm } from "@/components/shared/promotions/promotion-form";
import { EventCommunityList } from "@/components/shared/event-community/event-community-list";
import { VipEventsList } from "@/components/shared/vip-events/vip-events-list";

export function OrganizerDashboard({ user }: { user: SessionUser }) {
  return (
    <main className="min-h-screen pt-24 px-4 sm:px-6 lg:px-8 pb-16">
      <div className="max-w-7xl mx-auto space-y-10">
        <div>
          <h1 className="font-primary text-3xl font-semibold text-[hsl(222.2,47.4%,11.2%)]">
            Organizer Dashboard
          </h1>
          <p className="font-secondary text-[hsl(215.4,16.3%,46.9%)] mt-2">
            Welcome back, {user.name}. Manage your events here.
          </p>
        </div>

        {/* --- Event Platform Fee Settings --- */}
        <section>
          <EventPlatformFeeForm />
        </section>

        {/* --- Payouts (TODO: Fetch from backend) --- */}
        <section>
          <PayoutsTable payouts={[]} />
        </section>

        {/* --- Promotions --- */}
        <section>
          <PromotionForm
            createdBy={user.name}
            // TODO: Replace with actual promotion server action
            onSubmit={async () => ({
              success: true,
              message: "Promotion saved.",
            })}
          />
        </section>

        {/* --- VIP Events (TODO: Fetch from backend) --- */}
        <section>
          <VipEventsList vipEvents={[]} />
        </section>

        {/* --- Event Team (TODO: Fetch from backend) --- */}
        <section>
          <EventCommunityList members={[]} />
        </section>
      </div>
    </main>
  );
}
