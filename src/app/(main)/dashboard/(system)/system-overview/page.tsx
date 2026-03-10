// app/(main)/dashboard/(system)/system-overview/page.tsx
import { Suspense } from "react";
import {
  getOverviewStats,
  getRecentOrders,
  getScanActivity,
} from "@/lib/actions/system_overview-actions";
import {
  Users,
  CalendarDays,
  DollarSign,
  Ticket,
  ShieldCheck,
  RotateCcw,
  Wallet,
  ShoppingCart,
  ScanLine,
} from "lucide-react";

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="font-secondary text-xs text-gray-500">{label}</p>
          <p className="font-primary text-xl font-semibold text-gray-900">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function formatCurrency(n: number): string {
  return `LKR ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    PAID: "bg-green-100 text-green-800",
    PENDING: "bg-yellow-100 text-yellow-800",
    FAILED: "bg-red-100 text-red-800",
    REFUNDED: "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-600"}`}
    >
      {status}
    </span>
  );
}

async function OverviewStatsSection() {
  const result = await getOverviewStats();
  if (!result.success || !result.data) {
    return (
      <p className="text-sm text-red-500">Failed to load overview stats.</p>
    );
  }

  const s = result.data;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      <StatCard
        label="Total Users"
        value={s.total_users}
        icon={Users}
        color="bg-blue-500"
      />
      <StatCard
        label="Organizers"
        value={s.total_organizers}
        icon={ShieldCheck}
        color="bg-purple-500"
      />
      <StatCard
        label="Total Events"
        value={s.total_events}
        icon={CalendarDays}
        color="bg-indigo-500"
      />
      <StatCard
        label="Active Events"
        value={s.active_events}
        icon={CalendarDays}
        color="bg-green-500"
      />
      <StatCard
        label="Total Orders"
        value={s.total_orders}
        icon={ShoppingCart}
        color="bg-teal-500"
      />
      <StatCard
        label="Platform Revenue"
        value={formatCurrency(s.total_revenue)}
        icon={DollarSign}
        color="bg-emerald-600"
      />
      <StatCard
        label="Tickets Sold"
        value={s.total_tickets_sold}
        icon={Ticket}
        color="bg-orange-500"
      />
      <StatCard
        label="Pending Verifications"
        value={s.pending_verifications}
        icon={ShieldCheck}
        color="bg-amber-500"
      />
      <StatCard
        label="Pending Payouts"
        value={s.pending_payouts}
        icon={Wallet}
        color="bg-rose-500"
      />
      <StatCard
        label="Pending Refunds"
        value={s.pending_refunds}
        icon={RotateCcw}
        color="bg-red-500"
      />
    </div>
  );
}

async function RecentOrdersSection() {
  const result = await getRecentOrders();
  if (!result.success || !result.data) {
    return (
      <p className="text-sm text-red-500">Failed to load recent orders.</p>
    );
  }

  const orders = result.data;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-primary text-base font-semibold text-gray-900">
          Recent Orders
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-4 py-2 font-secondary font-medium text-gray-500">
                Event
              </th>
              <th className="text-left px-4 py-2 font-secondary font-medium text-gray-500">
                User
              </th>
              <th className="text-right px-4 py-2 font-secondary font-medium text-gray-500">
                Amount
              </th>
              <th className="text-left px-4 py-2 font-secondary font-medium text-gray-500">
                Status
              </th>
              <th className="text-left px-4 py-2 font-secondary font-medium text-gray-500">
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr
                key={o.order_id}
                className="border-b border-gray-50 hover:bg-gray-50/50"
              >
                <td className="px-4 py-3 font-secondary text-gray-900 max-w-[180px] truncate">
                  {o.event_name}
                </td>
                <td className="px-4 py-3 font-secondary text-gray-600">
                  {o.user_name}
                </td>
                <td className="px-4 py-3 font-secondary text-gray-900 text-right tabular-nums">
                  {formatCurrency(o.final_amount)}
                </td>
                <td className="px-4 py-3">
                  {statusBadge(o.payment_status)}
                </td>
                <td className="px-4 py-3 font-secondary text-gray-500 text-xs whitespace-nowrap">
                  {new Date(o.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-sm text-gray-400"
                >
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

async function ScanActivitySection() {
  const result = await getScanActivity();
  if (!result.success || !result.data) {
    return (
      <p className="text-sm text-red-500">Failed to load scan activity.</p>
    );
  }

  const s = result.data;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-primary text-base font-semibold text-gray-900">
          Scan Activity (24h)
        </h2>
      </div>
      <div className="px-5 py-4 flex gap-6">
        <div className="flex items-center gap-2">
          <ScanLine className="h-4 w-4 text-gray-400" />
          <span className="font-secondary text-sm text-gray-600">
            Total: <span className="font-semibold">{s.total_scans}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
          <span className="font-secondary text-sm text-gray-600">
            Allowed: <span className="font-semibold">{s.allowed}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
          <span className="font-secondary text-sm text-gray-600">
            Denied: <span className="font-semibold">{s.denied}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
      <div className="space-y-3">
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-5/6" />
        <div className="h-3 bg-gray-200 rounded w-4/6" />
      </div>
    </div>
  );
}

export default function SystemOverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-primary text-2xl font-semibold text-gray-900">
          System Overview
        </h1>
        <p className="font-secondary text-sm text-gray-500 mt-1">
          Platform-wide statistics and recent activity
        </p>
      </div>

      <Suspense fallback={<LoadingFallback />}>
        <OverviewStatsSection />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<LoadingFallback />}>
          <RecentOrdersSection />
        </Suspense>

        <Suspense fallback={<LoadingFallback />}>
          <ScanActivitySection />
        </Suspense>
      </div>
    </div>
  );
}
