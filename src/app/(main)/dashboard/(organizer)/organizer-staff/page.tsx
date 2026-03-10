// app/(main)/dashboard/(organizer)/organizer-staff/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toast } from "@/components/ui/toast";
import {
  getStaff,
  addStaffToEvent,
  removeStaffFromEvent,
  getStaffScanActivity,
} from "@/lib/actions/organizer_staff-actions";
import { getEvents } from "@/lib/actions/organizer_events-actions";
import type {
  OrganizerStaffMember,
  OrganizerEvent,
} from "@/lib/types/organizer_dashboard";
import type { StaffScanEntry } from "@/lib/actions/organizer_staff-actions";

export default function OrganizerStaffPage() {
  const [staff, setStaff] = useState<OrganizerStaffMember[]>([]);
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addEventId, setAddEventId] = useState("");
  const [addIdentifier, setAddIdentifier] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [scanActivity, setScanActivity] = useState<StaffScanEntry[]>([]);
  const [scanStaffName, setScanStaffName] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [staffResult, eventsResult] = await Promise.all([
        getStaff(),
        getEvents({ per_page: 100 }),
      ]);
      if (staffResult.success && staffResult.data) setStaff(staffResult.data);
      if (eventsResult.success && eventsResult.data)
        setEvents(eventsResult.data);
      setLoading(false);
    }
    load();
  }, [refreshKey]);

  async function handleAdd() {
    if (!addEventId || !addIdentifier.trim()) {
      Toast("Error", "Select an event and enter staff email/username.", "error");
      return;
    }
    setActionLoading(true);
    const r = await addStaffToEvent(addEventId, addIdentifier.trim());
    if (r.success) {
      Toast("Added", r.message, "success");
      setShowAdd(false);
      setAddEventId("");
      setAddIdentifier("");
      setRefreshKey((k) => k + 1);
    } else {
      Toast("Error", r.message, "error");
    }
    setActionLoading(false);
  }

  async function handleRemove(eventId: string, userId: string) {
    setActionLoading(true);
    const r = await removeStaffFromEvent(eventId, userId);
    if (r.success) {
      Toast("Removed", r.message, "success");
      setRefreshKey((k) => k + 1);
    } else {
      Toast("Error", r.message, "error");
    }
    setActionLoading(false);
  }

  async function handleViewScans(userId: string, name: string) {
    const r = await getStaffScanActivity(userId);
    if (r.success && r.data) {
      setScanActivity(r.data);
      setScanStaffName(name);
    } else {
      Toast("Error", r.message ?? "Failed to load scan activity.", "error");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-primary text-2xl font-semibold text-gray-900">
            Staff Management
          </h1>
          <p className="font-secondary text-sm text-gray-500 mt-1">
            Manage staff assigned to your events
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Staff
        </Button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Name
                </th>
                <th className="text-left px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Username
                </th>
                <th className="text-left px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Event
                </th>
                <th className="text-left px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Assigned
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
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-200 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : staff.map((s) => (
                    <tr
                      key={`${s.event_id}-${s.user_id}`}
                      className="border-b border-gray-50 hover:bg-gray-50/50"
                    >
                      <td className="px-4 py-3 font-secondary text-gray-900">
                        {s.name}
                      </td>
                      <td className="px-4 py-3 font-secondary text-gray-600">
                        {s.username}
                      </td>
                      <td className="px-4 py-3 font-secondary text-gray-600 max-w-[180px] truncate">
                        {s.event_name}
                      </td>
                      <td className="px-4 py-3 font-secondary text-gray-500 text-xs">
                        {new Date(s.assigned_at).toLocaleDateString("en-LK", {
                          timeZone: "Asia/Colombo",
                        })}
                      </td>
                      <td className="px-4 py-3 text-right space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewScans(s.user_id, s.name)}
                        >
                          Scans
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={actionLoading}
                          onClick={() => handleRemove(s.event_id, s.user_id)}
                        >
                          <X className="h-3 w-3 mr-1" /> Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
              {!loading && staff.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-sm text-gray-400"
                  >
                    No staff assigned yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="font-primary text-lg font-semibold text-gray-900">
              Add Staff to Event
            </h3>
            <div className="mt-4 space-y-4">
              <div>
                <Label>Event</Label>
                <select
                  value={addEventId}
                  onChange={(e) => setAddEventId(e.target.value)}
                  className="w-full h-10 mt-1 rounded-md border border-gray-200 px-3 text-sm font-secondary bg-white"
                >
                  <option value="">Select event…</option>
                  {events.map((ev) => (
                    <option key={ev.event_id} value={ev.event_id}>
                      {ev.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Staff Email or Username</Label>
                <Input
                  value={addIdentifier}
                  onChange={(e) => setAddIdentifier(e.target.value)}
                  placeholder="staff@example.com or username"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowAdd(false);
                  setAddEventId("");
                  setAddIdentifier("");
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={actionLoading || !addEventId || !addIdentifier.trim()}
                onClick={handleAdd}
              >
                {actionLoading ? "Adding…" : "Add Staff"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Scan Activity Modal */}
      {scanStaffName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto py-8">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4">
            <h3 className="font-primary text-lg font-semibold text-gray-900">
              Scan Activity — {scanStaffName}
            </h3>
            {scanActivity.length === 0 ? (
              <p className="mt-4 text-sm text-gray-400">No scan activity recorded.</p>
            ) : (
              <div className="mt-4 max-h-80 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 font-secondary font-medium text-gray-500">
                        Event
                      </th>
                      <th className="text-left py-2 font-secondary font-medium text-gray-500">
                        Result
                      </th>
                      <th className="text-left py-2 font-secondary font-medium text-gray-500">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {scanActivity.map((s) => (
                      <tr key={s.scan_id} className="border-b border-gray-50">
                        <td className="py-2 font-secondary text-gray-700 max-w-[150px] truncate">
                          {s.event_name}
                        </td>
                        <td className="py-2">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                              s.result === "ALLOWED"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {s.result}
                          </span>
                        </td>
                        <td className="py-2 font-secondary text-gray-500 text-xs">
                          {new Date(s.scanned_at).toLocaleString("en-LK", {
                            timeZone: "Asia/Colombo",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setScanStaffName(null);
                  setScanActivity([]);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
