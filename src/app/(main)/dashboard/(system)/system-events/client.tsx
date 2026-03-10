// app/(main)/dashboard/(system)/system-events/client.tsx
"use client";

import { useEffect, useState } from "react";
import {
  getSystemEvents,
  toggleEventActive,
  toggleEventVip,
} from "@/lib/actions/system-events";
import { Toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import type { SystemEvent } from "@/lib/types/system";
import type { EventStatus } from "@/lib/types/event";
import { Loader2, Star } from "lucide-react";

const EVENT_STATUSES: EventStatus[] = [
  "DRAFT",
  "PUBLISHED",
  "ON_SALE",
  "SOLD_OUT",
  "ONGOING",
  "COMPLETED",
  "CANCELLED",
];

export function SystemEventsClient() {
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<EventStatus | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const reload = async () => {
    setLoading(true);
    const result = await getSystemEvents({
      status: statusFilter || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
    if (result.success) {
      setEvents(result.events);
    } else {
      Toast("Error", result.message, "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const result = await getSystemEvents({
        status: statusFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      if (cancelled) return;
      if (result.success) {
        setEvents(result.events);
      } else {
        Toast("Error", result.message, "error");
      }
      setLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, [statusFilter, startDate, endDate]);

  const handleToggleActive = async (eventId: string, current: boolean) => {
    const result = await toggleEventActive(eventId, !current);
    if (result.success) {
      Toast("Success", result.message, "success");
      reload();
    } else {
      Toast("Error", result.message, "error");
    }
  };

  const handleToggleVip = async (eventId: string, current: boolean) => {
    const result = await toggleEventVip(eventId, !current);
    if (result.success) {
      Toast("Success", result.message, "success");
      reload();
    } else {
      Toast("Error", result.message, "error");
    }
  };

  return (
    <main className="min-h-screen pt-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="font-primary text-3xl font-semibold text-gray-900">
          Events Overview
        </h1>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as EventStatus | "")}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All Statuses</option>
            {EVENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            placeholder="Start date"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            placeholder="End date"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Event Name
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Organizer
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Start Date
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Active
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    VIP
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No events found
                    </td>
                  </tr>
                ) : (
                  events.map((event) => (
                    <tr
                      key={event.event_id}
                      className="border-b last:border-0"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {event.name}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {event.organizer_name}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                          {event.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(event.start_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            event.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {event.is_active ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {event.is_vip && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={
                              event.is_active ? "destructive" : "default"
                            }
                            onClick={() =>
                              handleToggleActive(
                                event.event_id,
                                event.is_active,
                              )
                            }
                          >
                            {event.is_active ? "Disable" : "Enable"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleToggleVip(event.event_id, event.is_vip)
                            }
                          >
                            {event.is_vip ? "Remove VIP" : "Make VIP"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
