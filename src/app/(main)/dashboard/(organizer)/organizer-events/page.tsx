// app/(main)/dashboard/(organizer)/organizer-events/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Search, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toast } from "@/components/ui/toast";
import {
  getEvents,
  getActiveCategories,
  getOrganizerStatus,
  createEvent,
  publishEvent,
  toggleOnSale,
  cancelEvent,
} from "@/lib/actions/organizer_events-actions";
import type {
  OrganizerEvent,
  EventStatus,
  CategoryOption,
  CreateEventInput,
  OrganizerVerificationStatus,
} from "@/lib/types/organizer_dashboard";

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
      {status.replace("_", " ")}
    </span>
  );
}

function formatCurrency(n: number): string {
  return `LKR ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function OrganizerEventsPage() {
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [statusFilter, setStatusFilter] = useState<EventStatus | "">("");
  const [search, setSearch] = useState("");

  // Organizer status
  const [orgStatus, setOrgStatus] = useState<OrganizerVerificationStatus | null>(null);
  const [orgRemarks, setOrgRemarks] = useState<string | null>(null);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  // Cancel confirmation
  const [cancelTarget, setCancelTarget] = useState<OrganizerEvent | null>(null);

  const [refreshKey, setRefreshKey] = useState(0);
  const perPage = 20;

  useEffect(() => {
    async function loadOrgStatus() {
      const r = await getOrganizerStatus();
      if (r.success && r.data) {
        setOrgStatus(r.data.status);
        setOrgRemarks(r.data.remarks);
      }
    }
    loadOrgStatus();
  }, []);

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

  async function handleOpenCreate() {
    const r = await getActiveCategories();
    if (r.success && r.data) setCategories(r.data);
    setShowCreate(true);
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setActionLoading(true);
    const form = e.currentTarget;
    const fd = new FormData(form);

    const input: CreateEventInput = {
      name: fd.get("name") as string,
      subtitle: fd.get("subtitle") as string,
      description: fd.get("description") as string,
      requirements: (fd.get("requirements") as string) || undefined,
      category_id: fd.get("category_id") as string,
      location: fd.get("location") as string,
      map_link: fd.get("map_link") as string,
      start_at: fd.get("start_at") as string,
      end_at: fd.get("end_at") as string,
    };

    const result = await createEvent(input);
    if (result.success) {
      Toast("Success", result.message, "success");
      setShowCreate(false);
      setRefreshKey((k) => k + 1);
    } else {
      Toast("Error", result.message, "error");
    }
    setActionLoading(false);
  }

  async function handlePublish(eventId: string) {
    setActionLoading(true);
    const r = await publishEvent(eventId);
    if (r.success) {
      Toast("Published", r.message, "success");
      setRefreshKey((k) => k + 1);
    } else {
      Toast("Error", r.message, "error");
    }
    setActionLoading(false);
  }

  async function handleToggleSale(eventId: string) {
    setActionLoading(true);
    const r = await toggleOnSale(eventId);
    if (r.success) {
      Toast("Updated", r.message, "success");
      setRefreshKey((k) => k + 1);
    } else {
      Toast("Error", r.message, "error");
    }
    setActionLoading(false);
  }

  async function handleCancel() {
    if (!cancelTarget) return;
    setActionLoading(true);
    const r = await cancelEvent(cancelTarget.event_id);
    if (r.success) {
      Toast("Cancelled", r.message, "success");
      setCancelTarget(null);
      setRefreshKey((k) => k + 1);
    } else {
      Toast("Error", r.message, "error");
    }
    setActionLoading(false);
  }

  const totalPages = Math.ceil(totalCount / perPage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-primary text-2xl font-semibold text-gray-900">
            My Events
          </h1>
          <p className="font-secondary text-sm text-gray-500 mt-1">
            Create and manage your events
          </p>
        </div>
        {orgStatus === "APPROVED" && (
          <Button size="sm" onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-1" /> New Event
          </Button>
        )}
      </div>

      {/* Organizer status banner */}
      {orgStatus === "PENDING" && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="font-secondary text-sm text-yellow-800">
            Your organizer verification is pending. You cannot create events until approved.
          </p>
        </div>
      )}
      {orgStatus === "REJECTED" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="font-secondary text-sm text-red-800">
            Your verification was rejected{orgRemarks ? `: ${orgRemarks}` : "."}{" "}
            <a href="/become-an-organizer" className="underline font-medium">
              Re-submit verification
            </a>
          </p>
        </div>
      )}
      {orgStatus === "NO_RECORD" && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
          <p className="font-secondary text-sm text-orange-800">
            You haven&apos;t submitted organizer details yet.{" "}
            <a href="/become-an-organizer" className="underline font-medium">
              Complete your organizer onboarding
            </a>{" "}
            to start creating events.
          </p>
        </div>
      )}

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
                  Category
                </th>
                <th className="text-left px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Status
                </th>
                <th className="text-left px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Dates
                </th>
                <th className="text-right px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Tickets
                </th>
                <th className="text-right px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Revenue
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
                      {Array.from({ length: 7 }).map((_, j) => (
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
                        {ev.is_vip && (
                          <span className="ml-1 inline-block rounded bg-amber-100 text-amber-800 px-1 py-0.5 text-[10px] font-medium">
                            VIP
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-secondary text-gray-600">
                        {ev.category_name}
                      </td>
                      <td className="px-4 py-3">{statusBadge(ev.status)}</td>
                      <td className="px-4 py-3 font-secondary text-gray-500 text-xs whitespace-nowrap">
                        {new Date(ev.start_at).toLocaleDateString("en-LK", {
                          timeZone: "Asia/Colombo",
                        })}
                      </td>
                      <td className="px-4 py-3 text-right font-secondary text-gray-700 tabular-nums">
                        {ev.tickets_sold}/{ev.total_capacity}
                      </td>
                      <td className="px-4 py-3 text-right font-secondary text-gray-700 tabular-nums">
                        {formatCurrency(ev.revenue)}
                      </td>
                      <td className="px-4 py-3 text-right space-x-1">
                        {ev.status === "DRAFT" && (
                          <Button
                            size="sm"
                            disabled={actionLoading}
                            onClick={() => handlePublish(ev.event_id)}
                          >
                            Publish
                          </Button>
                        )}
                        {(ev.status === "PUBLISHED" ||
                          ev.status === "ON_SALE") && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={actionLoading}
                            onClick={() => handleToggleSale(ev.event_id)}
                          >
                            {ev.status === "PUBLISHED"
                              ? "Enable Sales"
                              : "Pause Sales"}
                          </Button>
                        )}
                        {(ev.status === "DRAFT" ||
                          ev.status === "PUBLISHED" ||
                          ev.status === "ON_SALE") && (
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
                    colSpan={7}
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

      {/* Create Event Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto py-8">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-xl mx-4">
            <h3 className="font-primary text-lg font-semibold text-gray-900">
              Create New Event
            </h3>
            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <Label htmlFor="name">Event Name</Label>
                <Input id="name" name="name" required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  name="subtitle"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={3}
                  className="w-full mt-1 rounded-md border border-gray-200 px-3 py-2 text-sm font-secondary"
                />
              </div>
              <div>
                <Label htmlFor="requirements">Requirements (optional)</Label>
                <textarea
                  id="requirements"
                  name="requirements"
                  rows={2}
                  className="w-full mt-1 rounded-md border border-gray-200 px-3 py-2 text-sm font-secondary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category_id">Category</Label>
                  <select
                    id="category_id"
                    name="category_id"
                    required
                    className="w-full h-10 mt-1 rounded-md border border-gray-200 px-3 text-sm font-secondary bg-white"
                  >
                    <option value="">Select category…</option>
                    {categories.map((c) => (
                      <option key={c.category_id} value={c.category_id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    required
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="map_link">Map Link</Label>
                <Input
                  id="map_link"
                  name="map_link"
                  required
                  className="mt-1"
                  placeholder="https://maps.google.com/..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_at">Start Date & Time</Label>
                  <Input
                    id="start_at"
                    name="start_at"
                    type="datetime-local"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="end_at">End Date & Time</Label>
                  <Input
                    id="end_at"
                    name="end_at"
                    type="datetime-local"
                    required
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={actionLoading}>
                  {actionLoading ? "Creating…" : "Create Event"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="font-primary text-lg font-semibold text-gray-900">
              Cancel Event
            </h3>
            <p className="font-secondary text-sm text-gray-600 mt-2">
              Are you sure you want to cancel{" "}
              <strong>{cancelTarget.name}</strong>? This action cannot be undone.
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
