"use client";

import React, { useEffect, useState, useMemo, memo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  CalendarX,
  ChevronDown,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { EventCard } from "@/components/shared/event/event-card";
import { EventGridSkeleton } from "@/components/shared/event/event-card-skeleton";
import { getAllEvents } from "@/lib/actions/event";
import { Toast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { logger } from "@/lib/logger";
import type { Event, EventStatus } from "@/lib/types";

interface FilterTab {
  label: string;
  value: string;
  statuses: EventStatus[];
}

type SortValue = "date-desc" | "date-asc" | "price-asc" | "price-desc";

const FILTER_TABS: FilterTab[] = [
  {
    label: "All",
    value: "all",
    statuses: [
      "ONGOING",
      "ON_SALE",
      "PUBLISHED",
      "SOLD_OUT",
      "COMPLETED",
      "CANCELLED",
    ],
  },
  { label: "Latest", value: "latest", statuses: ["ON_SALE", "ONGOING"] },
  { label: "Upcoming", value: "upcoming", statuses: ["PUBLISHED"] },
  { label: "Sold Out", value: "soldout", statuses: ["SOLD_OUT"] },
  { label: "Past", value: "past", statuses: ["COMPLETED", "CANCELLED"] },
];

const SORT_OPTIONS: { label: string; value: SortValue }[] = [
  { label: "Date: Newest", value: "date-desc" },
  { label: "Date: Oldest", value: "date-asc" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
];

const EmptyState: React.FC = memo(() => (
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

export default function EventsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const filter = params.get("filter") ?? "all";
  const category = params.get("category") ?? "all";
  const sort = (params.get("sort") ?? "date-desc") as SortValue;

  const activeTab = useMemo(
    () => FILTER_TABS.find((t) => t.value === filter) ?? FILTER_TABS[0],
    [filter],
  );
  const activeSort = useMemo(
    () =>
      SORT_OPTIONS.find((option) => option.value === sort)?.value ??
      "date-desc",
    [sort],
  );

  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const result = await getAllEvents();
        if (cancelled) return;

        if (result.success) {
          setEvents(
            (result.events ?? []).filter(
              (e) => e.is_active && e.status !== "DRAFT",
            ),
          );
        } else {
          Toast("Error", result.message ?? "Failed to load events.", "error");
        }
      } catch (err) {
        logger.error({
          fn: "EventsPage.load",
          message: "Failed to load",
          meta: err,
        });
        if (!cancelled)
          Toast(
            "Connection Error",
            "Failed to connect to the server.",
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

  useEffect(() => {
    setSearchTerm(params.get("q") ?? "");
  }, [params]);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          events
            .map((event) => event.category)
            .filter((name): name is string => Boolean(name?.trim())),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [events],
  );

  const filteredEvents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filtered = events
      .filter((e) => activeTab.statuses.includes(e.status as EventStatus))
      .filter((e) => category === "all" || e.category === category)
      .filter((e) => {
        if (!normalizedSearch) return true;
        const haystack = [e.name, e.subtitle, e.location, e.category]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalizedSearch);
      });

    return filtered.sort((a, b) => {
      const aDate = new Date(a.start_at).getTime();
      const bDate = new Date(b.start_at).getTime();

      if (activeSort === "date-asc") return aDate - bDate;
      if (activeSort === "date-desc") return bDate - aDate;

      const aPrice = a.start_ticket_price;
      const bPrice = b.start_ticket_price;

      if (activeSort === "price-asc") {
        if (aPrice === null && bPrice === null) return 0;
        if (aPrice === null) return 1;
        if (bPrice === null) return -1;
        return aPrice - bPrice;
      }

      if (aPrice === null && bPrice === null) return 0;
      if (aPrice === null) return 1;
      if (bPrice === null) return -1;
      return (bPrice ?? 0) - (aPrice ?? 0);
    });
  }, [events, activeTab, category, searchTerm, activeSort]);

  const updateQueryParams = (key: string, value: string | null) => {
    const sp = new URLSearchParams(params.toString());
    if (
      value === null ||
      value === "all" ||
      value === "date-desc" ||
      value.trim() === ""
    ) {
      sp.delete(key);
    } else {
      sp.set(key, value.trim());
    }
    router.push(sp.toString() ? `${pathname}?${sp.toString()}` : pathname, {
      scroll: false,
    });
  };

  const hasActiveDropdownFilters =
    activeTab.value !== "all" ||
    category !== "all" ||
    activeSort !== "date-desc";

  const clearDropdownFilters = () => {
    const sp = new URLSearchParams(params.toString());
    sp.delete("filter");
    sp.delete("category");
    sp.delete("sort");
    router.push(sp.toString() ? `${pathname}?${sp.toString()}` : pathname, {
      scroll: false,
    });
  };

  return (
    <main className="w-full min-h-[80dvh] bg-gradient-to-b from-white to-[hsl(210,40%,96.1%)] pt-24 pb-16">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between w-full gap-4 sm:gap-5">
            <div className="shrink-0">
              <h1 className="font-primary text-2xl sm:text-3xl font-semibold text-[hsl(222.2,47.4%,11.2%)]">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]">
                  All
                </span>{" "}
                Events
              </h1>
              <div className="h-1.5 w-20 rounded-full mt-2 bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]" />
            </div>

            <div className="w-full xl:max-w-[860px]">
              <form
                className="relative"
                onSubmit={(e) => {
                  e.preventDefault();
                  updateQueryParams("q", searchTerm);
                }}
              >
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(215.4,16.3%,46.9%)] transition-colors duration-200 pointer-events-none peer-focus:text-[hsl(270,70%,50%)]"
                  aria-hidden="true"
                />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name"
                  className="peer font-secondary pl-11 py-2.5 h-auto rounded-xl border-2 bg-[hsl(210,40%,98%)] text-sm text-[hsl(222.2,47.4%,11.2%)] placeholder:text-[hsl(215.4,16.3%,46.9%)] focus-visible:ring-0 focus-visible:border-[hsl(270,70%,50%)] border-[hsl(214.3,31.8%,91.4%)]"
                  aria-label="Search events"
                />
              </form>

              <div className="mt-2.5 flex gap-2.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-2 lg:grid-cols-12 sm:mt-2.5 sm:pb-0 w-full">
                <div className="relative min-w-[150px] flex-none sm:min-w-0 lg:col-span-4">
                  <label className="sr-only" htmlFor="event-filter">
                    Filter events
                  </label>
                  <select
                    id="event-filter"
                    value={activeTab.value}
                    onChange={(e) =>
                      updateQueryParams("filter", e.target.value)
                    }
                    className="appearance-none w-full font-secondary py-2.5 h-auto rounded-xl border-2 bg-[hsl(210,40%,98%)] text-[hsl(222.2,47.4%,11.2%)] border-[hsl(214.3,31.8%,91.4%)] px-3 pr-9 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-0 focus-visible:border-[hsl(270,70%,50%)]"
                    aria-label="Filter events"
                  >
                    {FILTER_TABS.map((tab) => (
                      <option key={tab.value} value={tab.value}>
                        {tab.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(215.4,16.3%,46.9%)]"
                    aria-hidden="true"
                  />
                </div>

                <div className="relative min-w-[170px] flex-none sm:min-w-0 lg:col-span-4">
                  <label className="sr-only" htmlFor="event-category-filter">
                    Filter by category
                  </label>
                  <select
                    id="event-category-filter"
                    value={category}
                    onChange={(e) =>
                      updateQueryParams("category", e.target.value)
                    }
                    className="appearance-none w-full font-secondary py-2.5 h-auto rounded-xl border-2 bg-[hsl(210,40%,98%)] text-[hsl(222.2,47.4%,11.2%)] border-[hsl(214.3,31.8%,91.4%)] px-3 pr-9 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-0 focus-visible:border-[hsl(270,70%,50%)]"
                    aria-label="Filter by category"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((categoryName) => (
                      <option key={categoryName} value={categoryName}>
                        {categoryName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(215.4,16.3%,46.9%)]"
                    aria-hidden="true"
                  />
                </div>

                <div className="relative min-w-[170px] flex-none sm:min-w-0 lg:col-span-3">
                  <label className="sr-only" htmlFor="event-sort-filter">
                    Sort events
                  </label>
                  <select
                    id="event-sort-filter"
                    value={activeSort}
                    onChange={(e) =>
                      updateQueryParams("sort", e.target.value as SortValue)
                    }
                    className="appearance-none w-full font-secondary py-2.5 h-auto rounded-xl border-2 bg-[hsl(210,40%,98%)] text-[hsl(222.2,47.4%,11.2%)] border-[hsl(214.3,31.8%,91.4%)] px-3 pr-9 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-0 focus-visible:border-[hsl(270,70%,50%)]"
                    aria-label="Sort events"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(215.4,16.3%,46.9%)]"
                    aria-hidden="true"
                  />
                </div>

                <button
                  type="button"
                  onClick={clearDropdownFilters}
                  disabled={!hasActiveDropdownFilters}
                  className="h-full min-h-[42px] min-w-[42px] flex-none sm:min-w-0 lg:col-span-1 rounded-xl border-2 border-[hsl(214.3,31.8%,91.4%)] bg-[hsl(210,40%,98%)] text-[hsl(215.4,16.3%,46.9%)] hover:text-[hsl(270,70%,50%)] hover:border-[hsl(270,70%,50%)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-0 focus-visible:border-[hsl(270,70%,50%)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  aria-label="Clear dropdown filters"
                  title="Clear filters"
                >
                  <span className="sr-only">Clear filters</span>
                  {hasActiveDropdownFilters ? (
                    <X className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <EventGridSkeleton count={8} />
        ) : filteredEvents.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6 md:gap-7 lg:gap-8">
            {filteredEvents.map((event, index) => (
              <motion.div
                key={event.event_id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: Math.min(index * 0.05, 0.4),
                }}
              >
                <EventCard event={event} index={index} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
