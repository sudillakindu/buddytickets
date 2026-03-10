// app/(main)/dashboard/(organizer)/organizer-sales/page.tsx
"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getOrders,
  getSalesSummary,
  getEventBreakdown,
} from "@/lib/actions/organizer_sales-actions";
import { getEvents } from "@/lib/actions/organizer_events-actions";
import type {
  OrganizerOrder,
  OrganizerEvent,
  OrganizerSalesSummary,
  PaymentStatus,
  PaymentSource,
} from "@/lib/types/organizer_dashboard";
import type { EventBreakdown } from "@/lib/actions/organizer_sales-actions";

const PAYMENT_STATUSES: PaymentStatus[] = ["PENDING", "PAID", "FAILED", "REFUNDED"];
const PAYMENT_SOURCES: PaymentSource[] = [
  "PAYMENT_GATEWAY",
  "BANK_TRANSFER",
  "ONGATE",
];

function formatCurrency(n: number): string {
  return `LKR ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function paymentStatusBadge(status: PaymentStatus) {
  const map: Record<PaymentStatus, string> = {
    PAID: "bg-green-100 text-green-800",
    PENDING: "bg-yellow-100 text-yellow-800",
    FAILED: "bg-red-100 text-red-800",
    REFUNDED: "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${map[status]}`}
    >
      {status}
    </span>
  );
}

function paymentSourceBadge(source: PaymentSource) {
  const map: Record<PaymentSource, string> = {
    PAYMENT_GATEWAY: "bg-blue-100 text-blue-800",
    BANK_TRANSFER: "bg-purple-100 text-purple-800",
    ONGATE: "bg-orange-100 text-orange-800",
  };
  const labels: Record<PaymentSource, string> = {
    PAYMENT_GATEWAY: "Gateway",
    BANK_TRANSFER: "Bank",
    ONGATE: "On-Gate",
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${map[source]}`}
    >
      {labels[source]}
    </span>
  );
}

export default function OrganizerSalesPage() {
  const [orders, setOrders] = useState<OrganizerOrder[]>([]);
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [summary, setSummary] = useState<OrganizerSalesSummary | null>(null);
  const [breakdown, setBreakdown] = useState<EventBreakdown[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [eventFilter, setEventFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "">("");
  const [sourceFilter, setSourceFilter] = useState<PaymentSource | "">("");

  const perPage = 20;

  useEffect(() => {
    async function loadInitial() {
      const [evResult, sumResult, bdResult] = await Promise.all([
        getEvents({ per_page: 100 }),
        getSalesSummary(),
        getEventBreakdown(),
      ]);
      if (evResult.success && evResult.data) setEvents(evResult.data);
      if (sumResult.success && sumResult.data) setSummary(sumResult.data);
      if (bdResult.success && bdResult.data) setBreakdown(bdResult.data);
    }
    loadInitial();
  }, []);

  useEffect(() => {
    async function loadOrders() {
      setLoading(true);
      const result = await getOrders({
        event_id: eventFilter || undefined,
        payment_status: statusFilter || undefined,
        payment_source: sourceFilter || undefined,
        page,
        per_page: perPage,
      });
      if (result.success && result.data) {
        setOrders(result.data);
        setTotalCount(result.total_count ?? 0);
      }
      setLoading(false);
    }
    loadOrders();
  }, [eventFilter, statusFilter, sourceFilter, page]);

  const totalPages = Math.ceil(totalCount / perPage);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-primary text-2xl font-semibold text-gray-900">
          Sales & Orders
        </h1>
        <p className="font-secondary text-sm text-gray-500 mt-1">
          Track orders and revenue for your events
        </p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="font-secondary text-xs text-gray-500">
              Paid Orders
            </p>
            <p className="font-primary text-xl font-semibold text-gray-900">
              {summary.total_orders}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="font-secondary text-xs text-gray-500">
              Total Revenue
            </p>
            <p className="font-primary text-xl font-semibold text-gray-900">
              {formatCurrency(summary.total_revenue)}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="font-secondary text-xs text-gray-500">
              Total Discounts Given
            </p>
            <p className="font-primary text-xl font-semibold text-gray-900">
              {formatCurrency(summary.total_discount_given)}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={eventFilter}
          onChange={(e) => {
            setEventFilter(e.target.value);
            setPage(1);
          }}
          className="h-10 rounded-md border border-gray-200 px-3 text-sm font-secondary bg-white"
        >
          <option value="">All Events</option>
          {events.map((ev) => (
            <option key={ev.event_id} value={ev.event_id}>
              {ev.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as PaymentStatus | "");
            setPage(1);
          }}
          className="h-10 rounded-md border border-gray-200 px-3 text-sm font-secondary bg-white"
        >
          <option value="">All Statuses</option>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => {
            setSourceFilter(e.target.value as PaymentSource | "");
            setPage(1);
          }}
          className="h-10 rounded-md border border-gray-200 px-3 text-sm font-secondary bg-white"
        >
          <option value="">All Sources</option>
          {PAYMENT_SOURCES.map((s) => (
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
                  Order
                </th>
                <th className="text-left px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Buyer
                </th>
                <th className="text-left px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Event
                </th>
                <th className="text-right px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Tickets
                </th>
                <th className="text-right px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Amount
                </th>
                <th className="text-left px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Source
                </th>
                <th className="text-left px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Status
                </th>
                <th className="text-left px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Date
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
                : orders.map((o) => (
                    <tr
                      key={o.order_id}
                      className="border-b border-gray-50 hover:bg-gray-50/50"
                    >
                      <td className="px-4 py-3 font-secondary text-gray-600 text-xs font-mono">
                        {o.order_id.slice(0, 8)}…
                      </td>
                      <td className="px-4 py-3 font-secondary text-gray-900">
                        {o.user_name}
                      </td>
                      <td className="px-4 py-3 font-secondary text-gray-600 max-w-[150px] truncate">
                        {o.event_name}
                      </td>
                      <td className="px-4 py-3 text-right font-secondary text-gray-700 tabular-nums">
                        {o.ticket_count}
                      </td>
                      <td className="px-4 py-3 text-right font-secondary text-gray-900 tabular-nums">
                        {formatCurrency(o.final_amount)}
                      </td>
                      <td className="px-4 py-3">
                        {paymentSourceBadge(o.payment_source)}
                      </td>
                      <td className="px-4 py-3">
                        {paymentStatusBadge(o.payment_status)}
                      </td>
                      <td className="px-4 py-3 font-secondary text-gray-500 text-xs whitespace-nowrap">
                        {new Date(o.created_at).toLocaleDateString("en-LK", {
                          timeZone: "Asia/Colombo",
                        })}
                      </td>
                    </tr>
                  ))}
              {!loading && orders.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-sm text-gray-400"
                  >
                    No orders found.
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

      {/* Per-Event Revenue Breakdown */}
      {breakdown.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-primary text-base font-semibold text-gray-900">
              Per-Event Revenue Breakdown
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-2.5 font-secondary font-medium text-gray-500">
                    Event
                  </th>
                  <th className="text-right px-4 py-2.5 font-secondary font-medium text-gray-500">
                    Tickets Sold
                  </th>
                  <th className="text-right px-4 py-2.5 font-secondary font-medium text-gray-500">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map((b) => (
                  <tr
                    key={b.event_id}
                    className="border-b border-gray-50 hover:bg-gray-50/50"
                  >
                    <td className="px-4 py-3 font-secondary text-gray-900 max-w-[200px] truncate">
                      {b.event_name}
                    </td>
                    <td className="px-4 py-3 text-right font-secondary text-gray-700 tabular-nums">
                      {b.tickets_sold}
                    </td>
                    <td className="px-4 py-3 text-right font-secondary text-gray-900 tabular-nums">
                      {formatCurrency(b.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
