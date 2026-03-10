// app/(main)/dashboard/(system)/system-promotions/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toast } from "@/components/ui/toast";
import {
  getPromotions,
  createPromotion,
  togglePromotionActive,
} from "@/lib/actions/system_promotions-actions";
import type { SystemPromotion, DiscountType } from "@/lib/types/system";

function formatCurrency(n: number): string {
  return `LKR ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function SystemPromotionsPage() {
  const [promotions, setPromotions] = useState<SystemPromotion[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [activeFilter, setActiveFilter] = useState<string>("");
  const [scopeFilter, setScopeFilter] = useState<string>("");

  // Create modal state
  const [showCreate, setShowCreate] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState<DiscountType>("PERCENTAGE");
  const [newValue, setNewValue] = useState("");
  const [newCap, setNewCap] = useState("");
  const [newMin, setNewMin] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [newGlobalLimit, setNewGlobalLimit] = useState("");
  const [newUserLimit, setNewUserLimit] = useState("1");
  const [refreshKey, setRefreshKey] = useState(0);

  const perPage = 20;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const result = await getPromotions({
        is_active: activeFilter === "" ? undefined : activeFilter === "true",
        scope: (scopeFilter || undefined) as "global" | "event" | undefined,
        page,
        per_page: perPage,
      });
      if (!cancelled) {
        if (result.success && result.data) {
          setPromotions(result.data);
          setTotalCount(result.total_count ?? 0);
        }
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [activeFilter, scopeFilter, page, refreshKey]);

  async function handleToggleActive(promoId: string) {
    setActionLoading(true);
    const result = await togglePromotionActive(promoId);
    if (result.success) {
      Toast("Success", result.message, "success");
      setRefreshKey((k) => k + 1);
    } else {
      Toast("Error", result.message, "error");
    }
    setActionLoading(false);
  }

  async function handleCreate() {
    if (!newCode.trim() || !newValue || !newStart || !newEnd) {
      Toast("Error", "Code, value, start & end dates are required.", "error");
      return;
    }
    setActionLoading(true);
    const result = await createPromotion({
      code: newCode.trim().toUpperCase(),
      description: newDesc.trim() || undefined,
      discount_type: newType,
      discount_value: parseFloat(newValue),
      max_discount_cap: newCap ? parseFloat(newCap) : undefined,
      min_order_amount: newMin ? parseFloat(newMin) : undefined,
      start_at: new Date(newStart).toISOString(),
      end_at: new Date(newEnd).toISOString(),
      usage_limit_global: newGlobalLimit
        ? parseInt(newGlobalLimit, 10)
        : undefined,
      usage_limit_per_user: newUserLimit
        ? parseInt(newUserLimit, 10)
        : undefined,
    });
    if (result.success) {
      Toast("Created", result.message, "success");
      setShowCreate(false);
      resetForm();
      setRefreshKey((k) => k + 1);
    } else {
      Toast("Error", result.message, "error");
    }
    setActionLoading(false);
  }

  function resetForm() {
    setNewCode("");
    setNewDesc("");
    setNewType("PERCENTAGE");
    setNewValue("");
    setNewCap("");
    setNewMin("");
    setNewStart("");
    setNewEnd("");
    setNewGlobalLimit("");
    setNewUserLimit("1");
  }

  const totalPages = Math.ceil(totalCount / perPage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-primary text-2xl font-semibold text-gray-900">
            Promotions Management
          </h1>
          <p className="font-secondary text-sm text-gray-500 mt-1">
            Manage platform-wide and event-specific promotions
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1" />
          New Promotion
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={activeFilter}
          onChange={(e) => {
            setActiveFilter(e.target.value);
            setPage(1);
          }}
          className="h-10 rounded-md border border-gray-200 px-3 text-sm font-secondary bg-white"
        >
          <option value="">All</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <select
          value={scopeFilter}
          onChange={(e) => {
            setScopeFilter(e.target.value);
            setPage(1);
          }}
          className="h-10 rounded-md border border-gray-200 px-3 text-sm font-secondary bg-white"
        >
          <option value="">All Scopes</option>
          <option value="global">Platform-wide</option>
          <option value="event">Event-specific</option>
        </select>
      </div>

      {/* Table */}
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
                  Scope
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
                ? Array.from({ length: 4 }).map((_, i) => (
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
                      <td className="px-4 py-3 font-secondary text-gray-600">
                        {p.scope_event_name ?? "Platform-wide"}
                      </td>
                      <td className="px-4 py-3 text-right font-secondary text-gray-700 tabular-nums">
                        {p.current_global_usage}
                        {p.usage_limit_global
                          ? ` / ${p.usage_limit_global}`
                          : ""}
                      </td>
                      <td className="px-4 py-3 font-secondary text-gray-500 text-xs whitespace-nowrap">
                        {new Date(p.start_at).toLocaleDateString()} –{" "}
                        {new Date(p.end_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleToggleActive(p.promotion_id)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${p.is_active ? "bg-green-500" : "bg-gray-300"}`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${p.is_active ? "translate-x-4.5" : "translate-x-0.5"}`}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={actionLoading}
                          onClick={() => handleToggleActive(p.promotion_id)}
                        >
                          {p.is_active ? "Deactivate" : "Activate"}
                        </Button>
                      </td>
                    </tr>
                  ))}
              {!loading && promotions.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-sm text-gray-400"
                  >
                    No promotions found.
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

      {/* Create Promotion Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto py-8">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4">
            <h3 className="font-primary text-lg font-semibold text-gray-900">
              New Platform Promotion
            </h3>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="promo-code">Code</Label>
                  <Input
                    id="promo-code"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="SAVE10"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="promo-type">Type</Label>
                  <select
                    id="promo-type"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as DiscountType)}
                    className="w-full h-10 mt-1 rounded-md border border-gray-200 px-3 text-sm font-secondary bg-white"
                  >
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FIXED_AMOUNT">Fixed Amount</option>
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="promo-desc">Description</Label>
                <Input
                  id="promo-desc"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Marketing description…"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="promo-value">Value</Label>
                  <Input
                    id="promo-value"
                    type="number"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder={newType === "PERCENTAGE" ? "10" : "500"}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="promo-cap">Max Cap</Label>
                  <Input
                    id="promo-cap"
                    type="number"
                    value={newCap}
                    onChange={(e) => setNewCap(e.target.value)}
                    placeholder="Optional"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="promo-min">Min Order</Label>
                  <Input
                    id="promo-min"
                    type="number"
                    value={newMin}
                    onChange={(e) => setNewMin(e.target.value)}
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
                    type="datetime-local"
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="promo-end">End Date</Label>
                  <Input
                    id="promo-end"
                    type="datetime-local"
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="promo-global">Global Limit (0=∞)</Label>
                  <Input
                    id="promo-global"
                    type="number"
                    value={newGlobalLimit}
                    onChange={(e) => setNewGlobalLimit(e.target.value)}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="promo-user">Per-User Limit</Label>
                  <Input
                    id="promo-user"
                    type="number"
                    value={newUserLimit}
                    onChange={(e) => setNewUserLimit(e.target.value)}
                    placeholder="1"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCreate(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button size="sm" disabled={actionLoading} onClick={handleCreate}>
                {actionLoading ? "Creating…" : "Create"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
