'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronRight, CalendarX, Loader2 } from 'lucide-react';

import { MOCK_EVENTS } from '@/lib/api/event';
import { Button } from '@/components/ui/button';
import EventCard, { type Event } from '@/components/ui/event-card';
import { Toast } from '@/components/ui/toast';

// --- Constants & Styles ---
const STYLES = {
  textGradient: 'bg-clip-text text-transparent bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]',
  bgGradient: 'bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]',
  textPrimary: 'text-[hsl(222.2,47.4%,11.2%)]',
  textMuted: 'text-[hsl(215.4,16.3%,46.9%)]',
  gridContainer: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-6 lg:gap-8 xl:gap-8 2xl:gap-10',
};

// --- Subcomponents ---
interface SectionHeaderProps {
  highlight: string;
  title: string;
  link: string;
}

const SectionHeader = ({ highlight, title, link }: SectionHeaderProps) => {
  const router = useRouter();

  return (
    <div className="flex flex-row items-center justify-between mb-6 sm:mb-8 md:mb-8 lg:mb-10">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className={`font-primary font-semibold text-xl sm:text-2xl md:text-[30px] lg:text-[32px] xl:text-[36px] 2xl:text-[40px] ${STYLES.textPrimary}`}>
          <span className={STYLES.textGradient}>{highlight}</span> {title}
        </h2>
        <div className={`h-1 sm:h-1.5 w-16 sm:w-24 md:w-24 lg:w-28 xl:w-28 2xl:w-32 rounded-full mt-1.5 sm:mt-2 ${STYLES.bgGradient}`} />
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
          className={`font-secondary group flex items-center gap-1 text-xs sm:text-sm md:text-sm lg:text-base font-semibold ${STYLES.textMuted} hover:text-[hsl(270,70%,50%)] hover:bg-transparent transition-colors p-0 h-auto`}
        >
          View All
          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      </motion.div>
    </div>
  );
};

const LoadingState = () => (
  <div className={`flex flex-col items-center justify-center py-12 sm:py-16 md:py-20 lg:py-24 ${STYLES.textMuted}`}>
    <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 animate-spin relative z-10 text-[hsl(270,70%,50%)]" />
  </div>
);

const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-12 sm:py-16 md:py-20 lg:py-24 text-center px-4"
  >
    <CalendarX className={`w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 mb-3 sm:mb-4 ${STYLES.textMuted} opacity-50`} />
    <h3 className={`font-primary text-xl sm:text-2xl md:text-3xl font-semibold ${STYLES.textPrimary} mb-2`}>
      No Events Right Now
    </h3>
    <p className={`font-secondary text-sm sm:text-base md:text-lg ${STYLES.textMuted} max-w-xs sm:max-w-sm md:max-w-md mx-auto`}>
      We&apos;re currently planning our next exciting events. Check back soon!
    </p>
  </motion.div>
);

const EventGrid = ({ events }: { events: Event[] }) => (
  <div className={STYLES.gridContainer}>
    {events.map((event, index) => (
      <motion.div
        key={event.event_id || index}
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

// --- Main Component ---
export default function FeaturedEvents() {
  const [eventsList, setEventsList] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHighlights = async () => {
      setIsLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 400));
        setEventsList(MOCK_EVENTS);
      } catch {
        Toast('Connection Error', 'Something went wrong while connecting to the server.', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHighlights();
  }, []);

  const activeEvents = useMemo(
    () => eventsList.filter((e) => ['ON_SALE', 'PUBLISHED', 'ONGOING'].includes(e.status)),
    [eventsList]
  );
  
  const upcomingEvents = useMemo(
    () => eventsList.filter((e) => e.status === 'DRAFT'),
    [eventsList]
  );

  return (
    <section 
      id="events" 
      className="py-12 sm:py-16 md:py-20 lg:py-24 xl:py-28 2xl:py-32 relative overflow-hidden bg-gradient-to-b from-white to-[hsl(210,40%,96.1%)]"
    >
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[-5%] w-[200px] sm:w-[250px] md:w-[300px] h-[200px] sm:h-[250px] md:h-[300px] bg-[hsl(222.2,47.4%,11.2%)]/5 rounded-full blur-[60px] sm:blur-[80px]" />
        <div className="absolute bottom-[20%] right-[-5%] w-[200px] sm:w-[250px] md:w-[300px] h-[200px] sm:h-[250px] md:h-[300px] bg-[hsl(270,70%,50%)]/5 rounded-full blur-[60px] sm:blur-[80px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-8 xl:px-10 2xl:px-10 relative z-10 space-y-12 sm:space-y-16 md:space-y-20 xl:space-y-20 2xl:space-y-24 [&_.event-title]:font-primary [&_.event-category]:font-primary [&_.event-price]:font-primary [&_.event-button]:font-primary [&_.event-meta]:font-secondary [&_.event-overlay]:font-secondary [&_.event-location]:font-secondary [&_.event-label]:font-secondary">
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