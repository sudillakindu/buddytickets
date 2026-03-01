// components/core/FeaturedEvents.tsx
'use client';

import { useEffect, useState, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronRight, CalendarX } from 'lucide-react';

import { cn } from '@/lib/ui/utils';
import { Button } from '@/components/ui/button';
import { EventCard } from '@/components/shared/event/event-card';
import { EventGridSkeleton } from '@/components/shared/event/event-skeleton';
import { Toast } from '@/components/ui/toast';

import { getFeaturedEvents } from '@/lib/actions/event';
import type { Event } from '@/lib/types/event';

const ACTIVE_STATUSES = new Set(['ON_SALE', 'ONGOING']);

interface SectionHeaderProps {
  highlight: string;
  title: string;
  link: string;
}

const SectionHeader = memo(({ highlight, title, link }: SectionHeaderProps) => {
  const router = useRouter();

  return (
    <div className="flex flex-row items-center justify-between mb-8 sm:mb-10 w-full">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="font-primary font-semibold text-2xl sm:text-[32px] text-[hsl(222.2,47.4%,11.2%)]">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]">
            {highlight}
          </span>{' '}
          {title}
        </h2>
        <div className="h-1.5 w-24 sm:w-28 rounded-full mt-2 bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]" />
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
          className="font-secondary group flex items-center gap-1 text-sm sm:text-base font-semibold text-[hsl(215.4,16.3%,46.9%)] hover:text-[hsl(270,70%,50%)] hover:bg-transparent transition-colors p-0 h-auto"
          aria-label={`View all ${title}`}
        >
          View All
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
        </Button>
      </motion.div>
    </div>
  );
});

SectionHeader.displayName = 'SectionHeader';

const EmptyState = memo(() => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-24 text-center px-4 w-full"
    role="status"
  >
    <CalendarX
      className="w-16 sm:w-20 h-16 sm:h-20 mb-4 opacity-50 text-[hsl(215.4,16.3%,46.9%)]"
      aria-hidden="true"
    />
    <h3 className="font-primary text-2xl sm:text-3xl font-semibold mb-2 text-[hsl(222.2,47.4%,11.2%)]">
      No Events Right Now
    </h3>
    <p className="font-secondary text-base sm:text-lg max-w-md mx-auto text-[hsl(215.4,16.3%,46.9%)]">
      We&apos;re currently planning our next exciting events. Check back soon!
    </p>
  </motion.div>
));

EmptyState.displayName = 'EmptyState';

const EventGrid = memo(({ events }: { events: Event[] }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-8 w-full">
    {events.map((event, index) => (
      <motion.div
        key={event.event_id}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
      >
        <EventCard event={event} />
      </motion.div>
    ))}
  </div>
));

EventGrid.displayName = 'EventGrid';

function useFeaturedEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const result = await getFeaturedEvents();
        if (!cancelled) {
          if (result.success) {
            setEvents(result.events ?? []);
          } else {
            Toast('Error', result.message || 'Failed to load events.', 'error');
          }
        }
      } catch {
        if (!cancelled) Toast('Connection Error', 'Failed to connect to the server.', 'error');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  const activeEvents = useMemo(() => events.filter((e) => ACTIVE_STATUSES.has(e.status)), [events]);
  const upcomingEvents = useMemo(() => events.filter((e) => e.status === 'PUBLISHED'), [events]);

  return { events, isLoading, activeEvents, upcomingEvents };
}

export default function FeaturedEvents() {
  const { events, isLoading, activeEvents, upcomingEvents } = useFeaturedEvents();

  return (
    <section
      id="events"
      className="py-16 sm:py-24 relative overflow-hidden bg-gradient-to-b from-white to-[hsl(210,40%,96.1%)] w-full"
      aria-label="Featured Events"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-[20%] left-[-5%] w-[300px] h-[300px] bg-[hsl(222.2,47.4%,11.2%)]/5 rounded-full blur-[80px]" />
        <div className="absolute bottom-[20%] right-[-5%] w-[300px] h-[300px] bg-[hsl(270,70%,50%)]/5 rounded-full blur-[80px]" />
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16 sm:space-y-20">
        {isLoading ? (
          <EventGridSkeleton />
        ) : events.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {activeEvents.length > 0 && (
              <div className="w-full">
                <SectionHeader highlight="Latest" title="Events" link="/events?filter=latest" />
                <EventGrid events={activeEvents} />
              </div>
            )}
            {upcomingEvents.length > 0 && (
              <div className="w-full">
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