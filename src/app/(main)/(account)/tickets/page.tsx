"use client";

import React, { useEffect, useState, memo } from "react";
import { motion } from "framer-motion";
import { Ticket, TicketX } from "lucide-react";
import { TicketCard } from "@/components/shared/ticket/ticket-card";
import { TicketGridSkeleton } from "@/components/shared/ticket/ticket-skeleton";
import { Toast } from "@/components/ui/toast";
import { logger } from "@/lib/logger";
import { getUserTickets } from "@/lib/actions/ticket";
import type { Ticket as TicketType } from "@/lib/types/ticket";

const EmptyState: React.FC = memo(() => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-24 text-center px-4 col-span-full"
    role="status"
  >
    <TicketX
      className="w-16 sm:w-20 h-16 sm:h-20 mb-4 opacity-50 text-[hsl(215.4,16.3%,46.9%)]"
      aria-hidden="true"
    />
    <h3 className="font-primary text-2xl sm:text-3xl font-semibold text-[hsl(222.2,47.4%,11.2%)] mb-2">
      No Tickets Yet
    </h3>
    <p className="font-secondary text-base sm:text-lg text-[hsl(215.4,16.3%,46.9%)] max-w-md mx-auto">
      Your purchased tickets will appear here. Browse events and grab your first
      ticket!
    </p>
  </motion.div>
));

EmptyState.displayName = "EmptyState";

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const result = await getUserTickets();
        if (!cancelled) {
          if (result.success) {
            setTickets(result.tickets ?? []);
          } else {
            Toast("Error", result.message, "error");
          }
        }
      } catch (error) {
        logger.error({
          fn: "TicketsPage.load",
          message: "Failed to load tickets",
          meta: error,
        });
        if (!cancelled)
          Toast(
            "Connection Error",
            "Failed to load tickets. Please check your connection.",
            "error",
          );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="w-full min-h-[80dvh] bg-gradient-to-b from-white to-[hsl(210,40%,96.1%)] pt-24 pb-16">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 sm:mb-10">
          <div className="flex items-center justify-between w-full">
            <div>
              <h1 className="font-primary text-2xl sm:text-3xl font-semibold text-[hsl(222.2,47.4%,11.2%)]">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]">
                  My
                </span>{" "}
                Tickets
              </h1>
              <div className="h-1.5 w-20 rounded-full mt-2 bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]" />
            </div>

            {!isLoading && tickets.length > 0 && (
              <div className="flex items-center gap-2">
                <Ticket
                  className="w-4 h-4 text-[hsl(270,70%,50%)]"
                  aria-hidden="true"
                />
                <span className="font-secondary text-sm text-[hsl(215.4,16.3%,46.9%)]">
                  {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <TicketGridSkeleton />
        ) : tickets.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 w-full">
            {tickets.map((ticket, index) => (
              <motion.div
                key={ticket.ticket_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
              >
                <TicketCard ticket={ticket} index={index} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
