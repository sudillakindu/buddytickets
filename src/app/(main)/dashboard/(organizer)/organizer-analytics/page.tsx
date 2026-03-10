// app/(main)/dashboard/(organizer)/organizer-analytics/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  getRevenueOverTime,
  getTicketSalesByType,
  getPaymentMethodBreakdown,
  getScanActivity,
  getRatingDistribution,
  getTopPerformingEvents,
} from "@/lib/actions/organizer_analytics-actions";
import type {
  RevenueDataPoint,
  TicketSalesBreakdown,
  PaymentMethodBreakdown,
  ScanActivityBreakdown,
  RatingDistribution,
  TopEvent,
} from "@/lib/actions/organizer_analytics-actions";

function formatCurrency(n: number): string {
  return `LKR ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const CHART_COLORS = [
  "bg-indigo-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-blue-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-teal-500",
];

export default function OrganizerAnalyticsPage() {
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
  const [ticketSales, setTicketSales] = useState<TicketSalesBreakdown[]>([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentMethodBreakdown[]>([]);
  const [scanActivity, setScanActivity] = useState<ScanActivityBreakdown[]>([]);
  const [ratingDist, setRatingDist] = useState<RatingDistribution[]>([]);
  const [topEvents, setTopEvents] = useState<TopEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [rev, tickets, payments, scans, ratings, top] = await Promise.all([
        getRevenueOverTime(),
        getTicketSalesByType(),
        getPaymentMethodBreakdown(),
        getScanActivity(),
        getRatingDistribution(),
        getTopPerformingEvents(),
      ]);
      if (rev.success && rev.data) setRevenueData(rev.data);
      if (tickets.success && tickets.data) setTicketSales(tickets.data);
      if (payments.success && payments.data) setPaymentBreakdown(payments.data);
      if (scans.success && scans.data) setScanActivity(scans.data);
      if (ratings.success && ratings.data) setRatingDist(ratings.data);
      if (top.success && top.data) setTopEvents(top.data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-primary text-2xl font-semibold text-gray-900">
            Analytics
          </h1>
          <p className="font-secondary text-sm text-gray-500 mt-1">
            Loading analytics data…
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
              <div className="space-y-3">
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-5/6" />
                <div className="h-3 bg-gray-200 rounded w-4/6" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const totalTicketsSold = ticketSales.reduce((s, t) => s + t.qty_sold, 0);
  const maxRatingCount = Math.max(...ratingDist.map((r) => r.count), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-primary text-2xl font-semibold text-gray-900">
          Analytics
        </h1>
        <p className="font-secondary text-sm text-gray-500 mt-1">
          Insights and metrics for your events
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue Over Time */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="font-primary text-sm font-semibold text-gray-900 mb-4">
            Revenue Over Time
          </h3>
          {revenueData.length === 0 ? (
            <p className="text-sm text-gray-400">No revenue data yet.</p>
          ) : (
            <div className="space-y-2">
              {revenueData.slice(-14).map((d) => {
                const maxRev = Math.max(...revenueData.map((r) => r.revenue), 1);
                const pct = Math.round((d.revenue / maxRev) * 100);
                return (
                  <div key={d.date} className="flex items-center gap-3">
                    <span className="font-secondary text-xs text-gray-500 w-20 shrink-0">
                      {d.date}
                    </span>
                    <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="font-secondary text-xs text-gray-700 tabular-nums w-28 text-right">
                      {formatCurrency(d.revenue)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Ticket Sales by Type */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="font-primary text-sm font-semibold text-gray-900 mb-4">
            Ticket Sales by Type
          </h3>
          {ticketSales.length === 0 ? (
            <p className="text-sm text-gray-400">No ticket sales yet.</p>
          ) : (
            <div className="space-y-3">
              {ticketSales.map((t, i) => {
                const pct =
                  totalTicketsSold > 0
                    ? Math.round((t.qty_sold / totalTicketsSold) * 100)
                    : 0;
                return (
                  <div key={`${t.name}-${t.event_name}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-secondary text-xs text-gray-700">
                        {t.name}{" "}
                        <span className="text-gray-400">({t.event_name})</span>
                      </span>
                      <span className="font-secondary text-xs text-gray-500 tabular-nums">
                        {t.qty_sold} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${CHART_COLORS[i % CHART_COLORS.length]}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Scan Activity */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="font-primary text-sm font-semibold text-gray-900 mb-4">
            Scan Activity per Event
          </h3>
          {scanActivity.length === 0 ? (
            <p className="text-sm text-gray-400">No scan data yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 font-secondary font-medium text-gray-500">
                      Event
                    </th>
                    <th className="text-right py-2 font-secondary font-medium text-green-600">
                      Allowed
                    </th>
                    <th className="text-right py-2 font-secondary font-medium text-red-600">
                      Denied
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {scanActivity.map((s) => (
                    <tr
                      key={s.event_name}
                      className="border-b border-gray-50"
                    >
                      <td className="py-2 font-secondary text-gray-700 max-w-[150px] truncate">
                        {s.event_name}
                      </td>
                      <td className="py-2 text-right font-secondary text-green-700 tabular-nums">
                        {s.allowed}
                      </td>
                      <td className="py-2 text-right font-secondary text-red-700 tabular-nums">
                        {s.denied}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Performing Events */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="font-primary text-sm font-semibold text-gray-900 mb-4">
            Top Performing Events
          </h3>
          {topEvents.length === 0 ? (
            <p className="text-sm text-gray-400">No revenue data yet.</p>
          ) : (
            <div className="space-y-2">
              {topEvents.map((e, i) => (
                <div
                  key={e.event_name}
                  className="flex items-center justify-between py-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-primary text-xs text-gray-400 w-5">
                      #{i + 1}
                    </span>
                    <span className="font-secondary text-sm text-gray-700 max-w-[200px] truncate">
                      {e.event_name}
                    </span>
                  </div>
                  <span className="font-secondary text-sm text-gray-900 font-medium tabular-nums">
                    {formatCurrency(e.revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Method Breakdown */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="font-primary text-sm font-semibold text-gray-900 mb-4">
            Payment Method Breakdown
          </h3>
          {paymentBreakdown.length === 0 ? (
            <p className="text-sm text-gray-400">No payment data yet.</p>
          ) : (
            <div className="space-y-3">
              {paymentBreakdown.map((p, i) => {
                const labels: Record<string, string> = {
                  PAYMENT_GATEWAY: "Payment Gateway",
                  BANK_TRANSFER: "Bank Transfer",
                  ONGATE: "On-Gate",
                };
                return (
                  <div
                    key={p.payment_source}
                    className="flex items-center justify-between py-2 border-b border-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-3 w-3 rounded-full ${CHART_COLORS[i % CHART_COLORS.length]}`}
                      />
                      <span className="font-secondary text-sm text-gray-700">
                        {labels[p.payment_source] ?? p.payment_source}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-secondary text-sm text-gray-900 tabular-nums">
                        {p.count} orders
                      </span>
                      <span className="font-secondary text-xs text-gray-500 ml-2 tabular-nums">
                        ({formatCurrency(p.revenue)})
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Review Ratings Distribution */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="font-primary text-sm font-semibold text-gray-900 mb-4">
            Review Ratings Distribution
          </h3>
          {ratingDist.every((r) => r.count === 0) ? (
            <p className="text-sm text-gray-400">No reviews yet.</p>
          ) : (
            <div className="space-y-2">
              {ratingDist
                .sort((a, b) => b.rating - a.rating)
                .map((r) => {
                  const pct = Math.round((r.count / maxRatingCount) * 100);
                  return (
                    <div key={r.rating} className="flex items-center gap-3">
                      <span className="font-secondary text-sm text-gray-600 w-12">
                        {r.rating} ★
                      </span>
                      <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="font-secondary text-xs text-gray-500 tabular-nums w-8 text-right">
                        {r.count}
                      </span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
