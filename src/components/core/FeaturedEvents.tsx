'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronRight, CalendarX, Loader2 } from 'lucide-react';

import { MOCK_EVENTS } from '@/lib/api/event';
import { Button } from '@/components/ui/button';
import EventCard, { type Event } from '@/components/ui/event-card';
import { Toast } from '@/components/ui/toast';

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTIVE_STATUSES = ['ON_SALE', 'PUBLISHED', 'ONGOING'] as const;
type ActiveStatus = typeof ACTIVE_STATUSES[number];

const cn = {
  textGradient:
    'bg-clip-text text-transparent bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]',
  bgGradient: 'bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]',
  textPrimary: 'text-[hsl(222.2,47.4%,11.2%)]',
  textMuted: 'text-[hsl(215.4,16.3%,46.9%)]',
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

interface SectionHeaderProps {
  highlight: string;
  title: string;
  link: string;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionHeader = ({ highlight, title, link }: SectionHeaderProps) => {
  const router = useRouter();

  return (
    <div className="flex flex-row items-center justify-between mb-8 sm:mb-10">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className={`font-primary font-semibold text-2xl sm:text-[32px] ${cn.textPrimary}`}>
          <span className={cn.textGradient}>{highlight}</span> {title}
        </h2>
        <div className={`h-1.5 w-24 sm:w-28 rounded-full mt-2 ${cn.bgGradient}`} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="self-center"
      >
        <Button
          variant="ghost"
          onClick={() => router.push(link)}
          className={`font-secondary group flex items-center gap-1 text-sm sm:text-base font-semibold
            ${cn.textMuted} hover:text-[hsl(270,70%,50%)] hover:bg-transparent
            transition-colors p-0 h-auto`}
          aria-label={`View all ${title}`}
        >
          View All
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
        </Button>
      </motion.div>
    </div>
  );
};

const LoadingState = () => (
  <div className={`flex flex-col items-center justify-center py-24 ${cn.textMuted}`} aria-label="Loading events" role="status">
    <Loader2 className="w-10 h-10 animate-spin text-[hsl(270,70%,50%)]" aria-hidden="true" />
    <span className="sr-only">Loading events...</span>
  </div>
);

const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-24 text-center px-4"
    role="status"
  >
    <CalendarX className={`w-16 sm:w-20 h-16 sm:h-20 mb-4 ${cn.textMuted} opacity-50`} aria-hidden="true" />
    <h3 className={`font-primary text-2xl sm:text-3xl font-semibold ${cn.textPrimary} mb-2`}>
      No Events Right Now
    </h3>
    <p className={`font-secondary text-base sm:text-lg ${cn.textMuted} max-w-md mx-auto`}>
      We&apos;re currently planning our next exciting events. Check back soon!
    </p>
  </motion.div>
);

const EventGrid = ({ events }: { events: Event[] }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-8">
    {events.map((event, index) => (
      <motion.div
        key={event.event_id ?? index}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
      >
        <EventCard event={event} />
      </motion.div>
    ))}
  </div>
);

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useEvents() {
  const [eventsList, setEventsList] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        await new Promise<void>((resolve) => setTimeout(resolve, 400));
        if (!cancelled) setEventsList(MOCK_EVENTS);
      } catch {
        if (!cancelled) {
          Toast('Connection Error', 'Something went wrong while connecting to the server.', 'error');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchEvents();
    return () => { cancelled = true; };
  }, []);

  const activeEvents = useMemo(
    () => eventsList.filter((e) => (ACTIVE_STATUSES as readonly string[]).includes(e.status)),
    [eventsList]
  );

  const upcomingEvents = useMemo(
    () => eventsList.filter((e) => e.status === 'DRAFT'),
    [eventsList]
  );

  return { eventsList, isLoading, activeEvents, upcomingEvents };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FeaturedEvents() {
  const { eventsList, isLoading, activeEvents, upcomingEvents } = useEvents();

  return (
    <section
      id="events"
      className="py-16 sm:py-24 relative overflow-hidden bg-gradient-to-b from-white to-[hsl(210,40%,96.1%)]"
      aria-label="Featured Events"
    >
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-[20%] left-[-5%] w-[300px] h-[300px] bg-[hsl(222.2,47.4%,11.2%)]/5 rounded-full blur-[80px]" />
        <div className="absolute bottom-[20%] right-[-5%] w-[300px] h-[300px] bg-[hsl(270,70%,50%)]/5 rounded-full blur-[80px]" />
      </div>

      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16 sm:space-y-20
          [&_.event-title]:font-primary [&_.event-category]:font-primary
          [&_.event-price]:font-primary [&_.event-button]:font-primary
          [&_.event-meta]:font-secondary [&_.event-overlay]:font-secondary
          [&_.event-location]:font-secondary [&_.event-label]:font-secondary"
      >
        {isLoading ? (
          <LoadingState />
        ) : eventsList.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {activeEvents.length > 0 && (
              <div>
                <SectionHeader highlight="Latest" title="Events" link="/events?filter=latest" />
                <EventGrid events={activeEvents} />
              </div>
            )}
            {upcomingEvents.length > 0 && (
              <div>
                <SectionHeader highlight="Upcoming" title="Events" link="/events?filter=upcoming" />
                <EventGrid events={upcomingEvents} />
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}