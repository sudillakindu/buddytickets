// app/(main)/dashboard/(system)/system-events/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import {
  getEvents,
  toggleEventActive,
  toggleEventVip,
  cancelEvent,
} from "@/lib/actions/system_events-actions";
import type { SystemEvent, EventStatus } from "@/lib/types/system";

const STATUSES: EventStatus[] = [
  "DRAFT",
  "PUBLISHED",
  "ON_SALE",
  "SOLD_OUT",
  "ONGOING",
  "COMPLETED",
  "CANCELLED",
];

function statusBadge(status: EventStatus) {
  const map: Record<EventStatus, string> = {
    DRAFT: "bg-gray-100 text-gray-700",
    PUBLISHED: "bg-blue-100 text-blue-800",
    ON_SALE: "bg-green-100 text-green-800",
    SOLD_OUT: "bg-yellow-100 text-yellow-800",
    ONGOING: "bg-purple-100 text-purple-800",
    COMPLETED: "bg-emerald-100 text-emerald-800",
    CANCELLED: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${map[status]}`}
    >
      {status}
    </span>
  );
}

export default function SystemEventsPage() {
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [statusFilter, setStatusFilter] = useState<EventStatus | "">("");
  const [search, setSearch] = useState("");

  // Cancel confirmation
  const [cancelTarget, setCancelTarget] = useState<SystemEvent | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const perPage = 20;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const result = await getEvents({
        status: statusFilter || undefined,
        search: search || undefined,
        page,
        per_page: perPage,
      });
      if (!cancelled) {
        if (result.success && result.data) {
          setEvents(result.data);
          setTotalCount(result.total_count ?? 0);
        }
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [statusFilter, search, page, refreshKey]);

  async function handleToggleActive(eventId: string) {
    setActionLoading(true);
    const result = await toggleEventActive(eventId);
    if (result.success) {
      Toast("Success", result.message, "success");
      setRefreshKey((k) => k + 1);
    } else {
      Toast("Error", result.message, "error");
    }
    setActionLoading(false);
  }

  async function handleToggleVip(eventId: string) {
    setActionLoading(true);
    const result = await toggleEventVip(eventId);
    if (result.success) {
      Toast("Success", result.message, "success");
      setRefreshKey((k) => k + 1);
    } else {
      Toast("Error", result.message, "error");
    }
    setActionLoading(false);
  }

  async function handleCancel() {
    if (!cancelTarget) return;
    setActionLoading(true);
    const result = await cancelEvent(cancelTarget.event_id);
    if (result.success) {
      Toast("Cancelled", result.message, "success");
      setCancelTarget(null);
      setRefreshKey((k) => k + 1);
    } else {
      Toast("Error", result.message, "error");
    }
    setActionLoading(false);
  }

  const totalPages = Math.ceil(totalCount / perPage);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-primary text-2xl font-semibold text-gray-900">
          Event Management
        </h1>
        <p className="font-secondary text-sm text-gray-500 mt-1">
          Manage all events across organizers
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search event name…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 w-64"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as EventStatus | "");
            setPage(1);
          }}
          className="h-10 rounded-md border border-gray-200 px-3 text-sm font-secondary bg-white"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Event
                </th>
                <th className="text-left px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Organizer
                </th>
                <th className="text-left px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Category
                </th>
                <th className="text-left px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Status
                </th>
                <th className="text-center px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Active
                </th>
                <th className="text-center px-4 py-2.5 font-secondary font-medium text-gray-500">
                  VIP
                </th>
                <th className="text-right px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Sold
                </th>
                <th className="text-right px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-200 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : events.map((ev) => (
                    <tr
                      key={ev.event_id}
                      className="border-b border-gray-50 hover:bg-gray-50/50"
                    >
                      <td className="px-4 py-3 font-secondary text-gray-900 max-w-[180px] truncate">
                        {ev.name}
                      </td>
                      <td className="px-4 py-3 font-secondary text-gray-600">
                        {ev.organizer_name}
                      </td>
                      <td className="px-4 py-3 font-secondary text-gray-600">
                        {ev.category_name}
                      </td>
                      <td className="px-4 py-3">{statusBadge(ev.status)}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleToggleActive(ev.event_id)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${ev.is_active ? "bg-green-500" : "bg-gray-300"}`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${ev.is_active ? "translate-x-4.5" : "translate-x-0.5"}`}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleToggleVip(ev.event_id)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${ev.is_vip ? "bg-amber-500" : "bg-gray-300"}`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${ev.is_vip ? "translate-x-4.5" : "translate-x-0.5"}`}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right font-secondary text-gray-700 tabular-nums">
                        {ev.tickets_sold}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {ev.status !== "CANCELLED" &&
                          ev.status !== "COMPLETED" && (
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={actionLoading}
                              onClick={() => setCancelTarget(ev)}
                            >
                              Cancel
                            </Button>
                          )}
                      </td>
                    </tr>
                  ))}
              {!loading && events.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-sm text-gray-400"
                  >
                    No events found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs font-secondary text-gray-500">
              Showing {(page - 1) * perPage + 1}–
              {Math.min(page * perPage, totalCount)} of {totalCount}
            </span>
            <div className="flex gap-1">
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

      {/* Cancel Confirmation Modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="font-primary text-lg font-semibold text-gray-900">
              Cancel Event
            </h3>
            <p className="font-secondary text-sm text-gray-600 mt-2">
              Are you sure you want to cancel{" "}
              <strong>{cancelTarget.name}</strong>? This action cannot be
              undone.
            </p>
            <div className="flex gap-3 mt-6 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCancelTarget(null)}
              >
                Go Back
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={actionLoading}
                onClick={handleCancel}
              >
                {actionLoading ? "Cancelling…" : "Cancel Event"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
