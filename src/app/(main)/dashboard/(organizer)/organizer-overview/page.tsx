// app/(main)/dashboard/(organizer)/organizer-overview/page.tsx
import { Suspense } from "react";
import {
  getOverviewStats,
  getRecentOrders,
} from "@/lib/actions/organizer_overview-actions";
import {
  CalendarDays,
  DollarSign,
  Ticket,
  Wallet,
  Clock,
  UsersRound,
  Star,
} from "lucide-react";
import type { PaymentStatus } from "@/lib/types/organizer_dashboard";

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

function statusBadge(status: PaymentStatus) {
  const map: Record<PaymentStatus, string> = {
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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      <StatCard
        label="Total Events"
        value={s.total_events}
        icon={CalendarDays}
        color="bg-indigo-500"
      />
      <StatCard
        label="On Sale"
        value={s.on_sale_events}
        icon={CalendarDays}
        color="bg-green-500"
      />
      <StatCard
        label="Tickets Sold"
        value={s.total_tickets_sold}
        icon={Ticket}
        color="bg-orange-500"
      />
      <StatCard
        label="Gross Revenue"
        value={formatCurrency(s.total_gross_revenue)}
        icon={DollarSign}
        color="bg-emerald-600"
      />
      <StatCard
        label="Pending Payouts"
        value={formatCurrency(s.pending_payout_amount)}
        icon={Wallet}
        color="bg-rose-500"
      />
      <StatCard
        label="Upcoming Events"
        value={s.upcoming_events_count}
        icon={Clock}
        color="bg-blue-500"
      />
      <StatCard
        label="Staff Members"
        value={s.staff_count}
        icon={UsersRound}
        color="bg-purple-500"
      />
      <StatCard
        label="Avg Rating"
        value={s.average_rating !== null ? `${s.average_rating} / 5` : "N/A"}
        icon={Star}
        color="bg-amber-500"
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
                Buyer
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
                  {new Date(o.created_at).toLocaleDateString("en-LK", {
                    timeZone: "Asia/Colombo",
                  })}
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

export default function OrganizerOverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-primary text-2xl font-semibold text-gray-900">
          Organizer Overview
        </h1>
        <p className="font-secondary text-sm text-gray-500 mt-1">
          Your events, sales, and activity at a glance
        </p>
      </div>

      <Suspense fallback={<LoadingFallback />}>
        <OverviewStatsSection />
      </Suspense>

      <Suspense fallback={<LoadingFallback />}>
        <RecentOrdersSection />
      </Suspense>
    </div>
  );
}
