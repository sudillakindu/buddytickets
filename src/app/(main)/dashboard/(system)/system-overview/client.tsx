// app/(main)/dashboard/(system)/system-overview/client.tsx
"use client";

import { useEffect, useState } from "react";
import { getOverviewData } from "@/lib/actions/system-overview";
import type { OverviewData } from "@/lib/types/system";
import {
  Users,
  Building2,
  Calendar,
  DollarSign,
  ShieldCheck,
  CreditCard,
  RotateCcw,
  Loader2,
} from "lucide-react";

function StatCard({
  title,
  value,
  icon: Icon,
  format,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  format?: "currency";
}) {
  const display =
    format === "currency"
      ? `LKR ${value.toLocaleString("en-LK", { minimumFractionDigits: 2 })}`
      : value.toLocaleString();

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-gray-100 p-2">
          <Icon className="h-5 w-5 text-gray-600" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{display}</p>
        </div>
      </div>
    </div>
  );
}

function RevenueChart({ data }: { data: { month: string; revenue: number }[] }) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-8 text-center">
        No revenue data available
      </p>
    );
  }

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Monthly Platform Revenue (Last 12 Months)
      </h2>
      <div className="flex items-end gap-2 h-48">
        {data.map((item) => (
          <div
            key={item.month}
            className="flex-1 flex flex-col items-center gap-1"
          >
            <span className="text-xs text-gray-500">
              {item.revenue > 0
                ? `${(item.revenue / 1000).toFixed(0)}k`
                : "0"}
            </span>
            <div
              className="w-full bg-blue-500 rounded-t min-h-[2px]"
              style={{
                height: `${(item.revenue / maxRevenue) * 100}%`,
              }}
            />
            <span className="text-xs text-gray-400 -rotate-45 origin-top-left whitespace-nowrap">
              {item.month.slice(5)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SystemOverviewClient() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const result = await getOverviewData();
      if (cancelled) return;
      if (result.success && result.data) {
        setData(result.data);
      }
      setLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen pt-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen pt-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-500">Failed to load overview data.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="font-primary text-3xl font-semibold text-gray-900">
          Platform Overview
        </h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Users"
            value={data.stats.totalUsers}
            icon={Users}
          />
          <StatCard
            title="Approved Organizers"
            value={data.stats.totalApprovedOrganizers}
            icon={Building2}
          />
          <StatCard
            title="Total Events"
            value={data.stats.totalEvents}
            icon={Calendar}
          />
          <StatCard
            title="Platform Revenue"
            value={data.stats.platformRevenue}
            icon={DollarSign}
            format="currency"
          />
        </div>

        {/* Revenue Chart */}
        <RevenueChart data={data.monthlyRevenue} />

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Verifications */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Verifications
              </h2>
            </div>
            {data.recentVerifications.length === 0 ? (
              <p className="text-sm text-gray-500">No recent verifications</p>
            ) : (
              <ul className="space-y-3">
                {data.recentVerifications.map((v) => (
                  <li
                    key={v.user_id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{v.name}</p>
                      <p className="text-gray-500">{v.email}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        v.status === "APPROVED"
                          ? "bg-green-100 text-green-700"
                          : v.status === "REJECTED"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {v.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Recent Payouts */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Payouts
              </h2>
            </div>
            {data.recentPayouts.length === 0 ? (
              <p className="text-sm text-gray-500">No recent payouts</p>
            ) : (
              <ul className="space-y-3">
                {data.recentPayouts.map((p) => (
                  <li
                    key={p.payout_id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {p.event_name}
                      </p>
                      <p className="text-gray-500">
                        LKR {p.net_payout_amount.toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        p.status === "COMPLETED"
                          ? "bg-green-100 text-green-700"
                          : p.status === "FAILED"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {p.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Recent Refunds */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <RotateCcw className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Refunds
              </h2>
            </div>
            {data.recentRefunds.length === 0 ? (
              <p className="text-sm text-gray-500">No recent refunds</p>
            ) : (
              <ul className="space-y-3">
                {data.recentRefunds.map((r) => (
                  <li
                    key={r.refund_id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {r.user_name}
                      </p>
                      <p className="text-gray-500">
                        LKR {r.refund_amount.toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        r.status === "REFUNDED"
                          ? "bg-green-100 text-green-700"
                          : r.status === "REJECTED"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {r.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
