// app/(main)/dashboard/(system)/system-events.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldOff,
  Shield,
  Loader2,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSystemEvents, toggleEventActive } from "@/lib/actions/system-events";
import type { SystemEventRow } from "@/lib/types/system";
import type { EventStatus } from "@/lib/types/event";
import { Toast } from "@/components/ui/toast";

const EVENT_STATUSES: { label: string; value: "ALL" | EventStatus }[] = [
  { label: "All", value: "ALL" },
  { label: "Draft", value: "DRAFT" },
  { label: "Published", value: "PUBLISHED" },
  { label: "On Sale", value: "ON_SALE" },
  { label: "Sold Out", value: "SOLD_OUT" },
  { label: "Ongoing", value: "ONGOING" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const STATUS_COLORS: Record<EventStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  PUBLISHED: "bg-blue-100 text-blue-700",
  ON_SALE: "bg-green-100 text-green-700",
  SOLD_OUT: "bg-yellow-100 text-yellow-700",
  ONGOING: "bg-purple-100 text-purple-700",
  COMPLETED: "bg-teal-100 text-teal-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const PAGE_SIZE = 10;

export function SystemEvents() {
  const [events, setEvents] = useState<SystemEventRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | EventStatus>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [toggling, setToggling] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      const res = await getSystemEvents(filter, search, page, PAGE_SIZE);
      if (!cancelled) {
        setEvents(res.data);
        setTotal(res.total);
        setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [filter, search, page]);

  async function handleToggle(eventId: string, current: boolean) {
    setToggling(eventId);
    const res = await toggleEventActive(eventId, !current);
    Toast(res.success ? "Success" : "Error", res.message, res.success ? "success" : "error");
    if (res.success) {
      setEvents((prev) =>
        prev.map((e) => (e.event_id === eventId ? { ...e, is_active: !current } : e)),
      );
    }
    setToggling(null);
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-LK", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search events..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {EVENT_STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => {
                setFilter(s.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === s.value
                  ? "bg-[hsl(222.2,47.4%,11.2%)] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-[hsl(215.4,16.3%,46.9%)]">
                  Event
                </th>
                <th className="text-left px-4 py-3 font-medium text-[hsl(215.4,16.3%,46.9%)]">
                  Organizer
                </th>
                <th className="text-left px-4 py-3 font-medium text-[hsl(215.4,16.3%,46.9%)]">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-medium text-[hsl(215.4,16.3%,46.9%)]">
                  Date
                </th>
                <th className="text-right px-4 py-3 font-medium text-[hsl(215.4,16.3%,46.9%)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-4 py-3">
                      <div className="h-5 bg-gray-100 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="font-secondary text-[hsl(215.4,16.3%,46.9%)]">
                      No events found.
                    </p>
                  </td>
                </tr>
              ) : (
                events.map((ev) => (
                  <tr key={ev.event_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-primary font-medium">{ev.name}</p>
                        <p className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)] flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" /> {ev.location}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-secondary text-[hsl(215.4,16.3%,46.9%)]">
                      {ev.organizer?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[ev.status] ?? "bg-gray-100 text-gray-800"}`}
                      >
                        {ev.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-secondary text-[hsl(215.4,16.3%,46.9%)]">
                      {formatDate(ev.start_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={toggling === ev.event_id}
                        onClick={() => handleToggle(ev.event_id, ev.is_active)}
                        className={
                          ev.is_active
                            ? "text-red-600 hover:text-red-700"
                            : "text-green-600 hover:text-green-700"
                        }
                      >
                        {toggling === ev.event_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : ev.is_active ? (
                          <ShieldOff className="h-4 w-4" />
                        ) : (
                          <Shield className="h-4 w-4" />
                        )}
                        {ev.is_active ? "Disable" : "Enable"}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="font-secondary text-sm text-[hsl(215.4,16.3%,46.9%)]">
              Page {page} of {totalPages} ({total} total)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
