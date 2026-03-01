// app/(main)/events/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, CalendarX } from "lucide-react";

import { EventCard } from "@/components/shared/event/event-card";
import { EventGridSkeleton } from "@/components/shared/event/event-skeleton";
import { Toast } from "@/components/ui/toast";
import { logger } from "@/lib/logger";

import { getEvents } from "@/lib/actions/event";
import type { Event } from "@/lib/types/event";

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const result = await getEvents();
        if (!cancelled) {
          if (result.success) {
            setEvents(result.events ?? []);
          } else {
            Toast("Error", result.message, "error");
          }
        }
      } catch (error) {
        logger.error({
          fn: "EventsPage.load",
          message: "Failed to load events",
          meta: error,
        });
        if (!cancelled) {
          Toast(
            "Error",
            "Failed to load events. Please check your connection.",
            "error",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
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
                All{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]">
                  Events
                </span>
              </h1>
              <div className="h-1.5 w-20 rounded-full mt-2 bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]" />
            </div>

            {!loading && events.length > 0 && (
              <div className="flex items-center gap-2">
                <Calendar
                  className="w-4 h-4 text-[hsl(270,70%,50%)]"
                  aria-hidden="true"
                />
                <span className="font-secondary text-sm text-[hsl(215.4,16.3%,46.9%)]">
                  {events.length} event{events.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <EventGridSkeleton />
        ) : events.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center px-4 w-full"
            role="status"
          >
            <CalendarX
              className="w-16 sm:w-20 h-16 sm:h-20 mb-4 text-[hsl(215.4,16.3%,46.9%)] opacity-50"
              aria-hidden="true"
            />
            <h3 className="font-primary text-2xl sm:text-3xl font-semibold text-[hsl(222.2,47.4%,11.2%)] mb-2">
              No Events Right Now
            </h3>
            <p className="font-secondary text-base sm:text-lg text-[hsl(215.4,16.3%,46.9%)] max-w-md mx-auto">
              We&apos;re currently planning our next exciting events. Check back
              soon!
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-8 w-full">
            {events.map((event, index) => (
              <motion.div
                key={event.event_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
              >
                <EventCard event={event} index={index} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
