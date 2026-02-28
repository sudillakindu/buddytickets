'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Ticket, Loader2, TicketX } from 'lucide-react';

import { TicketCard } from '@/components/shared/ticket/ticket-card';
import { TicketGridSkeleton } from '@/components/shared/ticket/ticket-skeleton';
import { Toast } from '@/components/ui/toast';
import { MOCK_TICKETS, type UserTicket } from '@/lib/meta/ticket';

// ─── Shared color tokens ────────────────────────────────────────────────────

const cn = {
  textPrimary: 'text-[hsl(222.2,47.4%,11.2%)]',
  textMuted: 'text-[hsl(215.4,16.3%,46.9%)]',
  textGradient:
    'bg-clip-text text-transparent bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]',
  bgGradient:
    'bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]',
} as const;

// ─── Loading state ──────────────────────────────────────────────────────────

function TicketsLoading() {
  return (
    <div
      className={`flex flex-col items-center justify-center py-24 ${cn.textMuted}`}
      aria-label="Loading tickets"
      role="status"
    >
      <Loader2
        className="w-10 h-10 animate-spin text-[hsl(270,70%,50%)]"
        aria-hidden="true"
      />
      <span className="sr-only">Loading tickets...</span>
    </div>
  );
}

// ─── Empty state ────────────────────────────────────────────────────────────

function TicketsEmpty() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 text-center px-4"
      role="status"
    >
      <TicketX
        className={`w-16 sm:w-20 h-16 sm:h-20 mb-4 ${cn.textMuted} opacity-50`}
        aria-hidden="true"
      />
      <h3
        className={`font-primary text-2xl sm:text-3xl font-semibold ${cn.textPrimary} mb-2`}
      >
        No Tickets Yet
      </h3>
      <p
        className={`font-secondary text-base sm:text-lg ${cn.textMuted} max-w-md mx-auto`}
      >
        Your purchased tickets will appear here. Browse events and grab your
        first ticket!
      </p>
    </motion.div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────

export default function TicketsPage() {
  const [tickets, setTickets] = useState<UserTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchTickets = async () => {
      setLoading(true);
      try {
        // TODO: Replace with getUserTickets() when real data is ready
        await new Promise<void>((resolve) => setTimeout(resolve, 400));
        if (!cancelled) setTickets(MOCK_TICKETS);
      } catch {
        if (!cancelled) {
          Toast('Error', 'Something went wrong while loading tickets.', 'error');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchTickets();
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="w-full min-h-[80dvh] bg-gradient-to-b from-white to-[hsl(210,40%,96.1%)] pt-28 sm:pt-32 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-8 sm:mb-10">
          <div className="flex items-center justify-between">
            <div>
              <h1
                className={`font-primary text-2xl sm:text-3xl font-semibold ${cn.textPrimary}`}
              >
                My <span className={cn.textGradient}>Tickets</span>
              </h1>
              <div
                className={`h-1.5 w-20 rounded-full mt-2 ${cn.bgGradient}`}
              />
            </div>

            {!loading && tickets.length > 0 && (
              <div className="flex items-center gap-2">
                <Ticket
                  className="w-4 h-4 text-[hsl(270,70%,50%)]"
                  aria-hidden="true"
                />
                <span className={`font-secondary text-sm ${cn.textMuted}`}>
                  {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <TicketGridSkeleton />
        ) : tickets.length === 0 ? (
          <TicketsEmpty />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {tickets.map((ticket, index) => (
              <TicketCard
                key={ticket.ticket_id}
                ticket={ticket}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
