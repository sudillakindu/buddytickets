// app/(main)/dashboard/(organizer)/organizer-promotions/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toast } from "@/components/ui/toast";
import {
  getPromotions,
  createPromotion,
  deactivatePromotion,
  getPromotionUsages,
} from "@/lib/actions/organizer_promotions-actions";
import { getEvents } from "@/lib/actions/organizer_events-actions";
import type {
  OrganizerPromotion,
  OrganizerEvent,
  CreatePromotionInput,
  DiscountType,
} from "@/lib/types/organizer_dashboard";
import type { PromotionUsage } from "@/lib/actions/organizer_promotions-actions";

function formatCurrency(n: number): string {
  return `LKR ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function OrganizerPromotionsPage() {
  const [promotions, setPromotions] = useState<OrganizerPromotion[]>([]);
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [usages, setUsages] = useState<PromotionUsage[]>([]);
  const [usagesPromoCode, setUsagesPromoCode] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [promoResult, eventsResult] = await Promise.all([
        getPromotions(),
        getEvents({ per_page: 100 }),
      ]);
      if (promoResult.success && promoResult.data)
        setPromotions(promoResult.data);
      if (eventsResult.success && eventsResult.data)
        setEvents(eventsResult.data);
      setLoading(false);
    }
    load();
  }, [refreshKey]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setActionLoading(true);
    const fd = new FormData(e.currentTarget);

    const input: CreatePromotionInput = {
      code: fd.get("code") as string,
      description: (fd.get("description") as string) || undefined,
      discount_type: fd.get("discount_type") as DiscountType,
      discount_value: parseFloat(fd.get("discount_value") as string) || 0,
      max_discount_cap: parseFloat(fd.get("max_discount_cap") as string) || undefined,
      min_order_amount: parseFloat(fd.get("min_order_amount") as string) || undefined,
      start_at: fd.get("start_at") as string,
      end_at: fd.get("end_at") as string,
      usage_limit_global: parseInt(fd.get("usage_limit_global") as string) || undefined,
      usage_limit_per_user: parseInt(fd.get("usage_limit_per_user") as string) || undefined,
      scope_event_id: fd.get("scope_event_id") as string,
    };

    const result = await createPromotion(input);
    if (result.success) {
      Toast("Created", result.message, "success");
      setShowCreate(false);
      setRefreshKey((k) => k + 1);
    } else {
      Toast("Error", result.message, "error");
    }
    setActionLoading(false);
  }

  async function handleDeactivate(promoId: string) {
    setActionLoading(true);
    const r = await deactivatePromotion(promoId);
    if (r.success) {
      Toast("Deactivated", r.message, "success");
      setRefreshKey((k) => k + 1);
    } else {
      Toast("Error", r.message, "error");
    }
    setActionLoading(false);
  }

  async function handleViewUsages(promoId: string, code: string) {
    const r = await getPromotionUsages(promoId);
    if (r.success && r.data) {
      setUsages(r.data);
      setUsagesPromoCode(code);
    } else {
      Toast("Error", r.message ?? "Failed to load usages.", "error");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-primary text-2xl font-semibold text-gray-900">
            Promotions
          </h1>
          <p className="font-secondary text-sm text-gray-500 mt-1">
            Create and manage discount codes for your events
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1" /> New Promotion
        </Button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Code
                </th>
                <th className="text-left px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Discount
                </th>
                <th className="text-left px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Event
                </th>
                <th className="text-right px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Usage
                </th>
                <th className="text-left px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Validity
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
                : promotions.map((p) => (
                    <tr
                      key={p.promotion_id}
                      className="border-b border-gray-50 hover:bg-gray-50/50"
                    >
                      <td className="px-4 py-3 font-secondary text-gray-900 font-medium">
                        {p.code}
                      </td>
                      <td className="px-4 py-3 font-secondary text-gray-700">
                        {p.discount_type === "PERCENTAGE"
                          ? `${p.discount_value}%`
                          : formatCurrency(p.discount_value)}
                        {p.max_discount_cap
                          ? ` (cap: ${formatCurrency(p.max_discount_cap)})`
                          : ""}
                      </td>
                      <td className="px-4 py-3 font-secondary text-gray-600 max-w-[150px] truncate">
                        {p.scope_event_name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-secondary text-gray-700 tabular-nums">
                        {p.current_global_usage}
                        {p.usage_limit_global
                          ? ` / ${p.usage_limit_global}`
                          : ""}
                      </td>
                      <td className="px-4 py-3 font-secondary text-gray-500 text-xs whitespace-nowrap">
                        {new Date(p.start_at).toLocaleDateString("en-LK", {
                          timeZone: "Asia/Colombo",
                        })}{" "}
                        –{" "}
                        {new Date(p.end_at).toLocaleDateString("en-LK", {
                          timeZone: "Asia/Colombo",
                        })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${p.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}
                        >
                          {p.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1">
                        {p.current_global_usage > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewUsages(p.promotion_id, p.code)}
                          >
                            Usages
                          </Button>
                        )}
                        {p.is_active && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={actionLoading}
                            onClick={() => handleDeactivate(p.promotion_id)}
                          >
                            Deactivate
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
              {!loading && promotions.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-sm text-gray-400"
                  >
                    No promotions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Promotion Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto py-8">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4">
            <h3 className="font-primary text-lg font-semibold text-gray-900">
              New Promotion
            </h3>
            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="promo-code">Code</Label>
                  <Input
                    id="promo-code"
                    name="code"
                    required
                    placeholder="SAVE10"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="promo-type">Discount Type</Label>
                  <select
                    id="promo-type"
                    name="discount_type"
                    className="w-full h-10 mt-1 rounded-md border border-gray-200 px-3 text-sm font-secondary bg-white"
                  >
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FIXED_AMOUNT">Fixed Amount</option>
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="promo-desc">Description (optional)</Label>
                <Input
                  id="promo-desc"
                  name="description"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="promo-event">Event</Label>
                <select
                  id="promo-event"
                  name="scope_event_id"
                  required
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
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="promo-val">Value</Label>
                  <Input
                    id="promo-val"
                    name="discount_value"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="promo-cap">Max Cap</Label>
                  <Input
                    id="promo-cap"
                    name="max_discount_cap"
                    type="number"
                    step="0.01"
                    placeholder="Optional"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="promo-min">Min Order</Label>
                  <Input
                    id="promo-min"
                    name="min_order_amount"
                    type="number"
                    step="0.01"
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="promo-start">Start Date</Label>
                  <Input
                    id="promo-start"
                    name="start_at"
                    type="datetime-local"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="promo-end">End Date</Label>
                  <Input
                    id="promo-end"
                    name="end_at"
                    type="datetime-local"
                    required
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="promo-gl">Global Limit (0=∞)</Label>
                  <Input
                    id="promo-gl"
                    name="usage_limit_global"
                    type="number"
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="promo-ul">Per-User Limit</Label>
                  <Input
                    id="promo-ul"
                    name="usage_limit_per_user"
                    type="number"
                    placeholder="1"
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

      {/* Promotion Usages Modal */}
      {usagesPromoCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto py-8">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4">
            <h3 className="font-primary text-lg font-semibold text-gray-900">
              Usages for {usagesPromoCode}
            </h3>
            {usages.length === 0 ? (
              <p className="mt-4 text-sm text-gray-400">No usages recorded.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 font-secondary font-medium text-gray-500">
                        User
                      </th>
                      <th className="text-right py-2 font-secondary font-medium text-gray-500">
                        Discount
                      </th>
                      <th className="text-left py-2 font-secondary font-medium text-gray-500">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {usages.map((u) => (
                      <tr key={u.usage_id} className="border-b border-gray-50">
                        <td className="py-2 font-secondary text-gray-900">
                          {u.user_name}
                        </td>
                        <td className="py-2 text-right font-secondary text-gray-700 tabular-nums">
                          {formatCurrency(u.discount_received)}
                        </td>
                        <td className="py-2 font-secondary text-gray-500 text-xs">
                          {new Date(u.used_at).toLocaleDateString("en-LK", {
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
                  setUsagesPromoCode(null);
                  setUsages([]);
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
