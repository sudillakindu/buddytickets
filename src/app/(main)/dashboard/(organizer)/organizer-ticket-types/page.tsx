// app/(main)/dashboard/(organizer)/organizer-ticket-types/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toast } from "@/components/ui/toast";
import {
  getTicketTypes,
  createTicketType,
  deactivateTicketType,
} from "@/lib/actions/organizer_ticket-types-actions";
import { getEvents } from "@/lib/actions/organizer_events-actions";
import type {
  OrganizerTicketType,
  OrganizerEvent,
  CreateTicketTypeInput,
} from "@/lib/types/organizer_dashboard";

function formatCurrency(n: number): string {
  return `LKR ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function OrganizerTicketTypesPage() {
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [ticketTypes, setTicketTypes] = useState<OrganizerTicketType[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function loadEvents() {
      const r = await getEvents({ per_page: 100 });
      if (r.success && r.data) setEvents(r.data);
    }
    loadEvents();
  }, []);

  useEffect(() => {
    if (!selectedEventId) return;
    let cancelled = false;
    async function loadTickets() {
      setLoading(true);
      const r = await getTicketTypes(selectedEventId);
      if (!cancelled && r.success && r.data) setTicketTypes(r.data);
      if (!cancelled) setLoading(false);
    }
    loadTickets();
    return () => { cancelled = true; };
  }, [selectedEventId, refreshKey]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setActionLoading(true);
    const form = e.currentTarget;
    const fd = new FormData(form);

    const inclusionsRaw = (fd.get("inclusions") as string) ?? "";
    const inclusions = inclusionsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const input: CreateTicketTypeInput = {
      event_id: selectedEventId,
      name: fd.get("name") as string,
      description: fd.get("description") as string,
      inclusions,
      price: parseFloat(fd.get("price") as string) || 0,
      capacity: parseInt(fd.get("capacity") as string) || 1,
      sale_start_at: (fd.get("sale_start_at") as string) || undefined,
      sale_end_at: (fd.get("sale_end_at") as string) || undefined,
    };

    const result = await createTicketType(input);
    if (result.success) {
      Toast("Created", result.message, "success");
      setShowCreate(false);
      setRefreshKey((k) => k + 1);
    } else {
      Toast("Error", result.message, "error");
    }
    setActionLoading(false);
  }

  async function handleToggleActive(ttId: string) {
    setActionLoading(true);
    const r = await deactivateTicketType(ttId, selectedEventId);
    if (r.success) {
      Toast("Updated", r.message, "success");
      setRefreshKey((k) => k + 1);
    } else {
      Toast("Error", r.message, "error");
    }
    setActionLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-primary text-2xl font-semibold text-gray-900">
            Ticket Types
          </h1>
          <p className="font-secondary text-sm text-gray-500 mt-1">
            Manage ticket tiers for each event
          </p>
        </div>
      </div>

      {/* Event selector */}
      <div className="flex items-center gap-3">
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="h-10 rounded-md border border-gray-200 px-3 text-sm font-secondary bg-white min-w-[250px]"
        >
          <option value="">Select an event…</option>
          {events.map((ev) => (
            <option key={ev.event_id} value={ev.event_id}>
              {ev.name}
            </option>
          ))}
        </select>
        {selectedEventId && (
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Ticket Type
          </Button>
        )}
      </div>

      {!selectedEventId && (
        <div className="text-center py-12 text-sm text-gray-400">
          Select an event to manage its ticket types.
        </div>
      )}

      {selectedEventId && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-2.5 font-secondary font-medium text-gray-500">
                    Name
                  </th>
                  <th className="text-right px-4 py-2.5 font-secondary font-medium text-gray-500">
                    Price
                  </th>
                  <th className="text-right px-4 py-2.5 font-secondary font-medium text-gray-500">
                    Capacity
                  </th>
                  <th className="text-right px-4 py-2.5 font-secondary font-medium text-gray-500">
                    Sold
                  </th>
                  <th className="text-left px-4 py-2.5 font-secondary font-medium text-gray-500">
                    Availability
                  </th>
                  <th className="text-center px-4 py-2.5 font-secondary font-medium text-gray-500">
                    Active
                  </th>
                  <th className="text-right px-4 py-2.5 font-secondary font-medium text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-4 bg-gray-200 rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : ticketTypes.map((tt) => {
                      const pct =
                        tt.capacity > 0
                          ? Math.round((tt.qty_sold / tt.capacity) * 100)
                          : 0;
                      return (
                        <tr
                          key={tt.ticket_type_id}
                          className="border-b border-gray-50 hover:bg-gray-50/50"
                        >
                          <td className="px-4 py-3 font-secondary text-gray-900">
                            {tt.name}
                          </td>
                          <td className="px-4 py-3 text-right font-secondary text-gray-700 tabular-nums">
                            {formatCurrency(tt.price)}
                          </td>
                          <td className="px-4 py-3 text-right font-secondary text-gray-700 tabular-nums">
                            {tt.capacity}
                          </td>
                          <td className="px-4 py-3 text-right font-secondary text-gray-700 tabular-nums">
                            {tt.qty_sold}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-500 rounded-full"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="font-secondary text-xs text-gray-500 tabular-nums">
                                {pct}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() =>
                                handleToggleActive(tt.ticket_type_id)
                              }
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${tt.is_active ? "bg-green-500" : "bg-gray-300"}`}
                            >
                              <span
                                className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${tt.is_active ? "translate-x-4.5" : "translate-x-0.5"}`}
                              />
                            </button>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={actionLoading}
                              onClick={() =>
                                handleToggleActive(tt.ticket_type_id)
                              }
                            >
                              {tt.is_active ? "Deactivate" : "Activate"}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                {!loading && ticketTypes.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-sm text-gray-400"
                    >
                      No ticket types yet. Add one to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Ticket Type Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto py-8">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4">
            <h3 className="font-primary text-lg font-semibold text-gray-900">
              Add Ticket Type
            </h3>
            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <Label htmlFor="tt-name">Name</Label>
                <Input
                  id="tt-name"
                  name="name"
                  required
                  placeholder="e.g. General Admission"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="tt-desc">Description</Label>
                <textarea
                  id="tt-desc"
                  name="description"
                  required
                  rows={2}
                  className="w-full mt-1 rounded-md border border-gray-200 px-3 py-2 text-sm font-secondary"
                />
              </div>
              <div>
                <Label htmlFor="tt-inclusions">
                  Inclusions (comma-separated)
                </Label>
                <Input
                  id="tt-inclusions"
                  name="inclusions"
                  placeholder="Entry, Food, Drink"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tt-price">Price (LKR)</Label>
                  <Input
                    id="tt-price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="tt-cap">Capacity</Label>
                  <Input
                    id="tt-cap"
                    name="capacity"
                    type="number"
                    min="1"
                    required
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tt-ss">Sale Start (optional)</Label>
                  <Input
                    id="tt-ss"
                    name="sale_start_at"
                    type="datetime-local"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="tt-se">Sale End (optional)</Label>
                  <Input
                    id="tt-se"
                    name="sale_end_at"
                    type="datetime-local"
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
                  {actionLoading ? "Creating…" : "Create"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
