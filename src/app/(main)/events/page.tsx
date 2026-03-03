"use client";

// app/(main)/events/page.tsx

import { useEffect, useState, useMemo, memo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { CalendarX } from "lucide-react";

import { EventCard } from "@/components/shared/event/event-card";
import { EventGridSkeleton } from "@/components/shared/event/event-card-skeleton";
import { getAllEvents } from "@/lib/actions/event";
import { Toast } from "@/components/ui/toast";
import { logger } from "@/lib/logger";

import type { Event, EventStatus } from "@/lib/types/event";

// ─── Filter tabs config ───────────────────────────────────────────────────────

interface FilterTab {
  label: string;
  value: string;
  statuses: EventStatus[];
}

const FILTER_TABS: FilterTab[] = [
  {
    label: "All",
    value: "all",
    statuses: ["ONGOING", "ON_SALE", "PUBLISHED", "SOLD_OUT", "COMPLETED", "CANCELLED"],
  },
  {
    label: "Latest",
    value: "latest",
    statuses: ["ON_SALE", "ONGOING"],
  },
  {
    label: "Upcoming",
    value: "upcoming",
    statuses: ["PUBLISHED"],
  },
  {
    label: "Sold Out",
    value: "soldout",
    statuses: ["SOLD_OUT"],
  },
  {
    label: "Past",
    value: "past",
    statuses: ["COMPLETED", "CANCELLED"],
  },
];

// ─── Empty state ──────────────────────────────────────────────────────────────

const EmptyState = memo(() => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-24 text-center"
    role="status"
  >
    <CalendarX
      className="w-16 sm:w-20 h-16 sm:h-20 mb-4 opacity-40 text-[hsl(215.4,16.3%,46.9%)]"
      aria-hidden="true"
    />
    <h3 className="font-primary text-xl sm:text-2xl font-semibold mb-2 text-[hsl(222.2,47.4%,11.2%)]">
      No Events Found
    </h3>
    <p className="font-secondary text-sm sm:text-base max-w-sm mx-auto text-[hsl(215.4,16.3%,46.9%)]">
      There are no events in this category right now.
    </p>
  </motion.div>
));
EmptyState.displayName = "EmptyState";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EventsPage() {
  const router    = useRouter();
  const pathname  = usePathname();
  const params    = useSearchParams();

  const filter    = params.get("filter") ?? "all";
  const activeTab = FILTER_TABS.find((t) => t.value === filter) ?? FILTER_TABS[0];

  const [events, setEvents]     = useState<Event[]>([]);
  const [isLoading, setLoading] = useState(true);

  // ── Fetch all events once ─────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const result = await getAllEvents();
        if (!cancelled) {
          if (result.success) {
            setEvents(result.events ?? []);
          } else {
            Toast("Error", result.message ?? "Failed to load events.", "error");
          }
        }
      } catch (err) {
        logger.error({
          fn: "EventsPage.load",
          message: "Failed to load events",
          meta: err,
        });
        if (!cancelled)
          Toast("Connection Error", "Failed to connect to the server.", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Client-side filter ────────────────────────────────────────────────────
  const filtered = useMemo(
    () => events.filter((e) => activeTab.statuses.includes(e.status as EventStatus)),
    [events, activeTab],
  );

  const setFilter = (value: string) => {
    const sp = new URLSearchParams(params.toString());
    if (value === "all") {
      sp.delete("filter");
    } else {
      sp.set("filter", value);
    }
    router.push(`${pathname}?${sp.toString()}`, { scroll: false });
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <main className="w-full min-h-screen bg-gradient-to-b from-white to-[hsl(210,40%,96.1%)]">
      {/* Decorative blobs */}
      <div
        className="fixed inset-0 overflow-hidden pointer-events-none -z-10"
        aria-hidden="true"
      >
        <div className="absolute top-[10%] left-[-5%] w-[400px] h-[400px] bg-[hsl(222.2,47.4%,11.2%)]/4 rounded-full blur-[100px]" />
        <div className="absolute bottom-[15%] right-[-5%] w-[400px] h-[400px] bg-[hsl(270,70%,50%)]/4 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* ── Page header ──────────────────────────────────────── */}
        <div className="mb-10 sm:mb-14">
          <h1 className="font-primary font-black text-3xl sm:text-4xl lg:text-5xl uppercase text-[hsl(222.2,47.4%,11.2%)]">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]">
              All
            </span>{" "}
            Events
          </h1>
          <div className="h-1.5 w-20 rounded-full mt-3 bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]" />
          <p className="font-secondary text-[hsl(215.4,16.3%,46.9%)] mt-3 text-base sm:text-lg">
            Discover concerts, festivals, workshops and more.
          </p>
        </div>

        {/* ── Filter tabs ──────────────────────────────────────── */}
        <div
          role="tablist"
          aria-label="Filter events"
          className="flex flex-wrap gap-2 mb-8"
        >
          {FILTER_TABS.map((tab) => {
            const isActive = tab.value === activeTab.value;
            return (
              <button
                key={tab.value}
                role="tab"
                aria-selected={isActive}
                onClick={() => setFilter(tab.value)}
                className={`font-secondary text-sm font-semibold px-4 py-1.5 rounded-full border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(270,70%,50%)] ${
                  isActive
                    ? "bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)] text-white border-transparent shadow-sm"
                    : "bg-white text-[hsl(215.4,16.3%,46.9%)] border-gray-200 hover:border-[hsl(270,70%,50%)]/40 hover:text-[hsl(270,70%,50%)]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── Content ──────────────────────────────────────────── */}
        {isLoading ? (
          <EventGridSkeleton count={8} />
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-8">
            {filtered.map((event, index) => (
              <motion.div
                key={event.event_id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.4) }}
              >
                <EventCard
                  event={event}
                  index={index}
                  href={`/events/${event.event_id}`}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}