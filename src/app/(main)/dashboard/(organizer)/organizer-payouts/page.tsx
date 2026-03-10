// app/(main)/dashboard/(organizer)/organizer-payouts/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getPayouts } from "@/lib/actions/organizer_payouts-actions";
import type { OrganizerPayout, PayoutStatus } from "@/lib/types/organizer_dashboard";

function formatCurrency(n: number): string {
  return `LKR ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function statusBadge(status: PayoutStatus) {
  const map: Record<PayoutStatus, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    PROCESSING: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
    FAILED: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${map[status]}`}
    >
      {status}
    </span>
  );
}

export default function OrganizerPayoutsPage() {
  const [payouts, setPayouts] = useState<OrganizerPayout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const r = await getPayouts();
      if (r.success && r.data) {
        setPayouts(r.data);
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-primary text-2xl font-semibold text-gray-900">
          Payouts
        </h1>
        <p className="font-secondary text-sm text-gray-500 mt-1">
          Track your event payouts from the platform
        </p>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="font-secondary text-sm text-blue-800">
          Payouts are processed by the BuddyTicket team after your event
          completes. Funds will be transferred to your registered bank account.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Event
                </th>
                <th className="text-right px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Gross Revenue
                </th>
                <th className="text-right px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Platform Fee
                </th>
                <th className="text-right px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Net Payout
                </th>
                <th className="text-left px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Status
                </th>
                <th className="text-left px-4 py-2.5 font-secondary font-medium text-gray-500">
                  Processed
                </th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-200 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : payouts.map((p) => (
                    <tr
                      key={p.payout_id}
                      className="border-b border-gray-50 hover:bg-gray-50/50"
                    >
                      <td className="px-4 py-3 font-secondary text-gray-900 max-w-[180px] truncate">
                        {p.event_name}
                      </td>
                      <td className="px-4 py-3 text-right font-secondary text-gray-700 tabular-nums">
                        {formatCurrency(p.gross_revenue)}
                      </td>
                      <td className="px-4 py-3 text-right font-secondary text-gray-500 tabular-nums">
                        {formatCurrency(p.platform_fee_amount)}
                      </td>
                      <td className="px-4 py-3 text-right font-secondary text-gray-900 font-medium tabular-nums">
                        {formatCurrency(p.net_payout_amount)}
                      </td>
                      <td className="px-4 py-3">{statusBadge(p.status)}</td>
                      <td className="px-4 py-3 font-secondary text-gray-500 text-xs whitespace-nowrap">
                        {p.processed_at
                          ? new Date(p.processed_at).toLocaleDateString(
                              "en-LK",
                              { timeZone: "Asia/Colombo" },
                            )
                          : "—"}
                      </td>
                    </tr>
                  ))}
              {!loading && payouts.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-sm text-gray-400"
                  >
                    No payouts yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
