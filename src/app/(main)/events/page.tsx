'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Loader2, CalendarX } from 'lucide-react';

import { EventCard } from '@/components/shared/event/event-card';
import { EventGridSkeleton } from '@/components/shared/event/event-skeleton';
import { Toast } from '@/components/ui/toast';
import { MOCK_EVENTS, type Event } from '@/lib/meta/event';

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

function EventsLoading() {
  return (
    <div
      className={`flex flex-col items-center justify-center py-24 ${cn.textMuted}`}
      aria-label="Loading events"
      role="status"
    >
      <Loader2
        className="w-10 h-10 animate-spin text-[hsl(270,70%,50%)]"
        aria-hidden="true"
      />
      <span className="sr-only">Loading events...</span>
    </div>
  );
}

// ─── Empty state ────────────────────────────────────────────────────────────

function EventsEmpty() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 text-center px-4"
      role="status"
    >
      <CalendarX
        className={`w-16 sm:w-20 h-16 sm:h-20 mb-4 ${cn.textMuted} opacity-50`}
        aria-hidden="true"
      />
      <h3
        className={`font-primary text-2xl sm:text-3xl font-semibold ${cn.textPrimary} mb-2`}
      >
        No Events Right Now
      </h3>
      <p
        className={`font-secondary text-base sm:text-lg ${cn.textMuted} max-w-md mx-auto`}
      >
        We&apos;re currently planning our next exciting events. Check back soon!
      </p>
    </motion.div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchEvents = async () => {
      setLoading(true);
      try {
        // TODO: Replace with real API call when ready
        await new Promise<void>((resolve) => setTimeout(resolve, 400));
        if (!cancelled) setEvents(MOCK_EVENTS);
      } catch {
        if (!cancelled) {
          Toast('Error', 'Something went wrong while loading events.', 'error');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchEvents();
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
                All <span className={cn.textGradient}>Events</span>
              </h1>
              <div
                className={`h-1.5 w-20 rounded-full mt-2 ${cn.bgGradient}`}
              />
            </div>

            {!loading && events.length > 0 && (
              <div className="flex items-center gap-2">
                <Calendar
                  className="w-4 h-4 text-[hsl(270,70%,50%)]"
                  aria-hidden="true"
                />
                <span className={`font-secondary text-sm ${cn.textMuted}`}>
                  {events.length} event{events.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <EventGridSkeleton />
        ) : events.length === 0 ? (
          <EventsEmpty />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-8">
            {events.map((event, index) => (
              <motion.div
                key={event.event_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
              >
                <EventCard event={event} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
