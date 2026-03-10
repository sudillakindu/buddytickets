// app/(main)/dashboard/(organizer)/view.tsx
"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Activity,
  Ticket,
  Banknote,
  Clock,
  LayoutDashboard,
  CalendarDays,
  ShoppingCart,
  Users,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/ui/utils";
import type { SessionUser } from "@/lib/utils/session";
import type {
  OrganizerDashboardStats,
  OrganizerEventRow,
  OrganizerOrderRow,
  OrganizerPromotionRow,
} from "@/lib/types/dashboard";
import {
  getOrganizerDashboardStats,
  getOrganizerEvents,
  getOrganizerOrders,
  getOrganizerPromotions,
} from "@/lib/actions/organizer-dashboard";

// ─── Constants ───────────────────────────────────────────────────────────────

const TABS = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "events", label: "My Events", icon: CalendarDays },
  { key: "orders", label: "Orders", icon: ShoppingCart },
  { key: "staff", label: "Staff", icon: Users },
  { key: "promotions", label: "Promotions", icon: Megaphone },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDate = (iso: string | null): string => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const formatCurrency = (amount: number): string =>
  `LKR ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ─── Status Helpers ──────────────────────────────────────────────────────────

const eventStatusMap: Record<
  string,
  { text: string; dot: string; bg: string; fg: string }
> = {
  DRAFT: {
    text: "Draft",
    dot: "bg-gray-400",
    bg: "bg-gray-50",
    fg: "text-gray-600",
  },
  PUBLISHED: {
    text: "Published",
    dot: "bg-blue-500",
    bg: "bg-blue-50",
    fg: "text-blue-700",
  },
  ON_SALE: {
    text: "On Sale",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
    fg: "text-emerald-700",
  },
  ONGOING: {
    text: "Ongoing",
    dot: "bg-purple-500",
    bg: "bg-purple-50",
    fg: "text-purple-700",
  },
  COMPLETED: {
    text: "Completed",
    dot: "bg-gray-500",
    bg: "bg-gray-100",
    fg: "text-gray-700",
  },
  SOLD_OUT: {
    text: "Sold Out",
    dot: "bg-amber-500",
    bg: "bg-amber-50",
    fg: "text-amber-700",
  },
  CANCELLED: {
    text: "Cancelled",
    dot: "bg-red-500",
    bg: "bg-red-50",
    fg: "text-red-700",
  },
};

const paymentStatusMap: Record<
  string,
  { text: string; dot: string; bg: string; fg: string }
> = {
  PAID: {
    text: "Paid",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
    fg: "text-emerald-700",
  },
  PENDING: {
    text: "Pending",
    dot: "bg-amber-500",
    bg: "bg-amber-50",
    fg: "text-amber-700",
  },
  FAILED: {
    text: "Failed",
    dot: "bg-red-500",
    bg: "bg-red-50",
    fg: "text-red-700",
  },
  REFUNDED: {
    text: "Refunded",
    dot: "bg-gray-500",
    bg: "bg-gray-100",
    fg: "text-gray-700",
  },
};

const paymentSourceMap: Record<string, string> = {
  PAYMENT_GATEWAY: "Gateway",
  ONGATE: "On-gate",
  BANK_TRANSFER: "Bank Transfer",
};

// ─── Shared Sub-Components ───────────────────────────────────────────────────

const StatusBadge = memo(function StatusBadge({
  status,
  map,
}: {
  status: string;
  map: Record<string, { text: string; dot: string; bg: string; fg: string }>;
}) {
  const s = map[status] ?? {
    text: status,
    dot: "bg-gray-400",
    bg: "bg-gray-50",
    fg: "text-gray-600",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
        s.bg,
        s.fg,
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
      {s.text}
    </span>
  );
});
StatusBadge.displayName = "StatusBadge";

const TableShell = memo(function TableShell({
  headers,
  children,
  loading,
  empty,
}: {
  headers: string[];
  children: React.ReactNode;
  loading: boolean;
  empty: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[hsl(214.3,31.8%,91.4%)] bg-white shadow-sm">
      <table className="w-full text-left font-secondary text-sm">
        <thead>
          <tr className="border-b border-[hsl(214.3,31.8%,91.4%)] bg-[hsl(210,40%,96.1%)]">
            {headers.map((h) => (
              <th
                key={h}
                className="px-4 py-3 font-primary text-xs font-semibold uppercase tracking-wider text-[hsl(215.4,16.3%,46.9%)]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[hsl(214.3,31.8%,91.4%)]">
          {loading ? (
            <tr>
              <td
                colSpan={headers.length}
                className="px-4 py-12 text-center text-[hsl(215.4,16.3%,46.9%)]"
              >
                <div className="flex items-center justify-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      repeat: Infinity,
                      duration: 1,
                      ease: "linear",
                    }}
                    className="h-4 w-4 rounded-full border-2 border-[hsl(270,70%,50%)] border-t-transparent"
                  />
                  Loading…
                </div>
              </td>
            </tr>
          ) : empty ? (
            <tr>
              <td
                colSpan={headers.length}
                className="px-4 py-12 text-center text-[hsl(215.4,16.3%,46.9%)]"
              >
                No records found.
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
});
TableShell.displayName = "TableShell";

const SectionHeading = memo(function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="font-primary text-lg font-semibold text-[hsl(222.2,47.4%,11.2%)]">
        {title}
      </h2>
      {subtitle && (
        <p className="font-secondary text-sm text-[hsl(215.4,16.3%,46.9%)] mt-0.5">
          {subtitle}
        </p>
      )}
    </div>
  );
});
SectionHeading.displayName = "SectionHeading";

// ─── Stat Card ───────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  index: number;
}

const StatCard = memo(function StatCard({
  icon: Icon,
  label,
  value,
  index,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className="rounded-2xl border border-[hsl(214.3,31.8%,91.4%)] bg-white shadow-sm hover:shadow-md hover:border-[hsl(270,70%,50%)]/20 transition-all duration-300 p-5"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[hsl(270,70%,50%)]/10">
          <Icon className="h-5 w-5 text-[hsl(270,70%,50%)]" />
        </div>
        <div className="min-w-0">
          <p className="font-primary text-2xl font-bold text-[hsl(222.2,47.4%,11.2%)] truncate">
            {value}
          </p>
          <p className="font-secondary text-sm text-[hsl(215.4,16.3%,46.9%)]">
            {label}
          </p>
        </div>
      </div>
    </motion.div>
  );
});
StatCard.displayName = "StatCard";

// ─── Tab Content: Overview ───────────────────────────────────────────────────

const OverviewTab = memo(function OverviewTab({
  stats,
  events,
  orders,
  eventsLoading,
  ordersLoading,
}: {
  stats: OrganizerDashboardStats | null;
  events: OrganizerEventRow[];
  orders: OrganizerOrderRow[];
  eventsLoading: boolean;
  ordersLoading: boolean;
}) {
  const recent5Events = events.slice(0, 5);
  const recent5Orders = orders.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Quick Summary */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl border border-[hsl(214.3,31.8%,91.4%)] bg-white shadow-sm p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <Banknote className="h-5 w-5 text-[hsl(270,70%,50%)]" />
              <h3 className="font-primary text-sm font-semibold text-[hsl(222.2,47.4%,11.2%)]">
                Revenue Overview
              </h3>
            </div>
            <div className="border-t border-dashed border-[hsl(214.3,31.8%,91.4%)] my-3" />
            <p className="font-primary text-2xl font-bold text-[hsl(222.2,47.4%,11.2%)]">
              {formatCurrency(stats.total_revenue)}
            </p>
            <p className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)] mt-1">
              Total revenue from your events
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.06 }}
            className="rounded-2xl border border-[hsl(214.3,31.8%,91.4%)] bg-white shadow-sm p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <Ticket className="h-5 w-5 text-[hsl(270,70%,50%)]" />
              <h3 className="font-primary text-sm font-semibold text-[hsl(222.2,47.4%,11.2%)]">
                Tickets Sold
              </h3>
            </div>
            <div className="border-t border-dashed border-[hsl(214.3,31.8%,91.4%)] my-3" />
            <p className="font-primary text-2xl font-bold text-[hsl(222.2,47.4%,11.2%)]">
              {stats.total_tickets_sold.toLocaleString()}
            </p>
            <p className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)] mt-1">
              Total tickets sold across all events
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.12 }}
            className="rounded-2xl border border-[hsl(214.3,31.8%,91.4%)] bg-white shadow-sm p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <Activity className="h-5 w-5 text-[hsl(270,70%,50%)]" />
              <h3 className="font-primary text-sm font-semibold text-[hsl(222.2,47.4%,11.2%)]">
                Active Events
              </h3>
            </div>
            <div className="border-t border-dashed border-[hsl(214.3,31.8%,91.4%)] my-3" />
            <p className="font-primary text-2xl font-bold text-[hsl(222.2,47.4%,11.2%)]">
              {stats.active_events.toLocaleString()}
            </p>
            <p className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)] mt-1">
              Currently active events
            </p>
          </motion.div>
        </div>
      )}

      {/* Recent Events */}
      <div>
        <SectionHeading
          title="Recent Events"
          subtitle="Latest 5 events you manage"
        />
        <TableShell
          headers={["Event", "Status", "Date", "Location", "Tickets"]}
          loading={eventsLoading}
          empty={recent5Events.length === 0}
        >
          {recent5Events.map((e) => (
            <tr
              key={e.event_id}
              className="hover:bg-[hsl(210,40%,96.1%)]/50 transition-colors"
            >
              <td className="px-4 py-3 font-medium text-[hsl(222.2,47.4%,11.2%)]">
                {e.name}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={e.status} map={eventStatusMap} />
              </td>
              <td className="px-4 py-3 text-[hsl(215.4,16.3%,46.9%)]">
                {formatDate(e.start_at)}
              </td>
              <td className="px-4 py-3 text-[hsl(215.4,16.3%,46.9%)]">
                {e.location}
              </td>
              <td className="px-4 py-3 text-[hsl(215.4,16.3%,46.9%)]">
                {e.tickets_sold.toLocaleString()} /{" "}
                {e.total_capacity.toLocaleString()}
              </td>
            </tr>
          ))}
        </TableShell>
      </div>

      {/* Recent Orders */}
      <div>
        <SectionHeading
          title="Recent Orders"
          subtitle="Latest 5 orders for your events"
        />
        <TableShell
          headers={["Order ID", "Buyer", "Event", "Amount", "Status", "Date"]}
          loading={ordersLoading}
          empty={recent5Orders.length === 0}
        >
          {recent5Orders.map((o) => (
            <tr
              key={o.order_id}
              className="hover:bg-[hsl(210,40%,96.1%)]/50 transition-colors"
            >
              <td className="px-4 py-3 font-mono text-xs text-[hsl(215.4,16.3%,46.9%)] whitespace-nowrap">
                {o.order_id.slice(0, 8)}…
              </td>
              <td className="px-4 py-3 text-[hsl(222.2,47.4%,11.2%)] whitespace-nowrap">
                {o.buyer_name}
              </td>
              <td className="px-4 py-3 text-[hsl(215.4,16.3%,46.9%)] whitespace-nowrap max-w-[180px] truncate">
                {o.event_name}
              </td>
              <td className="px-4 py-3 text-[hsl(222.2,47.4%,11.2%)] whitespace-nowrap font-medium">
                {formatCurrency(o.final_amount)}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={o.payment_status} map={paymentStatusMap} />
              </td>
              <td className="px-4 py-3 text-[hsl(215.4,16.3%,46.9%)] whitespace-nowrap">
                {formatDate(o.created_at)}
              </td>
            </tr>
          ))}
        </TableShell>
      </div>
    </div>
  );
});
OverviewTab.displayName = "OverviewTab";

// ─── Tab Content: My Events ──────────────────────────────────────────────────

const EventsTab = memo(function EventsTab({
  events,
  loading,
}: {
  events: OrganizerEventRow[];
  loading: boolean;
}) {
  return (
    <div>
      <SectionHeading
        title="My Events"
        subtitle={
          loading
            ? "Loading…"
            : `${events.length.toLocaleString()} total events`
        }
      />
      <TableShell
        headers={[
          "Name",
          "Status",
          "Start Date",
          "End Date",
          "Location",
          "Tickets",
          "Revenue",
        ]}
        loading={loading}
        empty={events.length === 0}
      >
        {events.map((e) => {
          const pct =
            e.total_capacity > 0
              ? Math.round((e.tickets_sold / e.total_capacity) * 100)
              : 0;

          return (
            <tr
              key={e.event_id}
              className="hover:bg-[hsl(210,40%,96.1%)]/50 transition-colors"
            >
              <td className="px-4 py-3 font-medium text-[hsl(222.2,47.4%,11.2%)] whitespace-nowrap max-w-[200px] truncate">
                {e.name}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={e.status} map={eventStatusMap} />
              </td>
              <td className="px-4 py-3 text-[hsl(215.4,16.3%,46.9%)] whitespace-nowrap">
                {formatDate(e.start_at)}
              </td>
              <td className="px-4 py-3 text-[hsl(215.4,16.3%,46.9%)] whitespace-nowrap">
                {formatDate(e.end_at)}
              </td>
              <td className="px-4 py-3 text-[hsl(215.4,16.3%,46.9%)] whitespace-nowrap max-w-[180px] truncate">
                {e.location}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex flex-col gap-1.5 min-w-[120px]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[hsl(215.4,16.3%,46.9%)]">
                      <span className="font-medium text-[hsl(222.2,47.4%,11.2%)]">
                        {e.tickets_sold.toLocaleString()}
                      </span>{" "}
                      / {e.total_capacity.toLocaleString()}
                    </span>
                    <span className="text-[hsl(215.4,16.3%,46.9%)]">
                      {pct}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[hsl(210,40%,96.1%)]">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        pct >= 90
                          ? "bg-emerald-500"
                          : pct >= 50
                            ? "bg-[hsl(270,70%,50%)]"
                            : "bg-amber-500",
                      )}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-[hsl(222.2,47.4%,11.2%)] whitespace-nowrap font-medium">
                {formatCurrency(e.total_revenue)}
              </td>
            </tr>
          );
        })}
      </TableShell>
    </div>
  );
});
EventsTab.displayName = "EventsTab";

// ─── Tab Content: Orders ─────────────────────────────────────────────────────

const OrdersTab = memo(function OrdersTab({
  orders,
  loading,
}: {
  orders: OrganizerOrderRow[];
  loading: boolean;
}) {
  return (
    <div>
      <SectionHeading
        title="All Orders"
        subtitle={
          loading
            ? "Loading…"
            : `${orders.length.toLocaleString()} total orders`
        }
      />
      <TableShell
        headers={[
          "Order ID",
          "Buyer",
          "Event",
          "Amount",
          "Payment Status",
          "Source",
          "Date",
        ]}
        loading={loading}
        empty={orders.length === 0}
      >
        {orders.map((o) => (
          <tr
            key={o.order_id}
            className="hover:bg-[hsl(210,40%,96.1%)]/50 transition-colors"
          >
            <td className="px-4 py-3 font-mono text-xs text-[hsl(215.4,16.3%,46.9%)] whitespace-nowrap">
              {o.order_id.slice(0, 8)}…
            </td>
            <td className="px-4 py-3 text-[hsl(222.2,47.4%,11.2%)] whitespace-nowrap">
              {o.buyer_name}
            </td>
            <td className="px-4 py-3 text-[hsl(215.4,16.3%,46.9%)] whitespace-nowrap max-w-[180px] truncate">
              {o.event_name}
            </td>
            <td className="px-4 py-3 text-[hsl(222.2,47.4%,11.2%)] whitespace-nowrap font-medium">
              {formatCurrency(o.final_amount)}
            </td>
            <td className="px-4 py-3">
              <StatusBadge
                status={o.payment_status}
                map={paymentStatusMap}
              />
            </td>
            <td className="px-4 py-3 text-[hsl(215.4,16.3%,46.9%)] whitespace-nowrap">
              {paymentSourceMap[o.payment_source] ?? o.payment_source}
            </td>
            <td className="px-4 py-3 text-[hsl(215.4,16.3%,46.9%)] whitespace-nowrap">
              {formatDate(o.created_at)}
            </td>
          </tr>
        ))}
      </TableShell>
    </div>
  );
});
OrdersTab.displayName = "OrdersTab";

// ─── Tab Content: Staff ──────────────────────────────────────────────────────

const StaffTab = memo(function StaffTab() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(270,70%,50%)]/10 mb-6">
        <Users className="h-8 w-8 text-[hsl(270,70%,50%)]" />
      </div>
      <h3 className="font-primary text-lg font-semibold text-[hsl(222.2,47.4%,11.2%)] mb-2">
        Staff Management Coming Soon
      </h3>
      <p className="font-secondary text-sm text-[hsl(215.4,16.3%,46.9%)] text-center max-w-md">
        Staff assignment features will be available in a future update.
      </p>
    </div>
  );
});
StaffTab.displayName = "StaffTab";

// ─── Tab Content: Promotions ─────────────────────────────────────────────────

const PromotionsTab = memo(function PromotionsTab({
  promotions,
  loading,
}: {
  promotions: OrganizerPromotionRow[];
  loading: boolean;
}) {
  return (
    <div>
      <SectionHeading
        title="All Promotions"
        subtitle={
          loading
            ? "Loading…"
            : `${promotions.length.toLocaleString()} total promotions`
        }
      />
      <TableShell
        headers={["Event", "Code", "Type", "Value", "Usage", "Status"]}
        loading={loading}
        empty={promotions.length === 0}
      >
        {promotions.map((p) => (
          <tr
            key={p.promotion_id}
            className="hover:bg-[hsl(210,40%,96.1%)]/50 transition-colors"
          >
            <td className="px-4 py-3 font-medium text-[hsl(222.2,47.4%,11.2%)] whitespace-nowrap max-w-[200px] truncate">
              {p.event_name}
            </td>
            <td className="px-4 py-3 font-mono text-xs text-[hsl(215.4,16.3%,46.9%)]">
              {p.code}
            </td>
            <td className="px-4 py-3 text-[hsl(215.4,16.3%,46.9%)] whitespace-nowrap">
              {p.discount_type === "PERCENTAGE" ? "Percentage" : "Fixed Amount"}
            </td>
            <td className="px-4 py-3 text-[hsl(222.2,47.4%,11.2%)] whitespace-nowrap font-medium">
              {p.discount_type === "PERCENTAGE"
                ? `${p.discount_value}%`
                : formatCurrency(p.discount_value)}
            </td>
            <td className="px-4 py-3 text-[hsl(215.4,16.3%,46.9%)] whitespace-nowrap">
              {p.current_global_usage.toLocaleString()}
            </td>
            <td className="px-4 py-3">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                  p.is_active
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-gray-50 text-gray-600",
                )}
              >
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    p.is_active ? "bg-emerald-500" : "bg-gray-400",
                  )}
                />
                {p.is_active ? "Active" : "Inactive"}
              </span>
            </td>
          </tr>
        ))}
      </TableShell>
    </div>
  );
});
PromotionsTab.displayName = "PromotionsTab";

// ═════════════════════════════════════════════════════════════════════════════
// Main Component
// ═════════════════════════════════════════════════════════════════════════════

export function OrganizerDashboard({ user }: { user: SessionUser }) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  // ── Data state ──
  const [stats, setStats] = useState<OrganizerDashboardStats | null>(null);
  const [events, setEvents] = useState<OrganizerEventRow[]>([]);
  const [orders, setOrders] = useState<OrganizerOrderRow[]>([]);
  const [promotions, setPromotions] = useState<OrganizerPromotionRow[]>([]);

  // ── Loading state ──
  const [statsLoading, setStatsLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [promotionsLoading, setPromotionsLoading] = useState(true);

  // Track whether each lazy tab has been fetched at least once
  const [ordersLoaded, setOrdersLoaded] = useState(false);
  const [promotionsLoaded, setPromotionsLoaded] = useState(false);

  // ── Fetch helpers ──
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    const res = await getOrganizerDashboardStats();
    if (res.success && res.stats) setStats(res.stats);
    setStatsLoading(false);
  }, []);

  const loadEvents = useCallback(async () => {
    setEventsLoading(true);
    const res = await getOrganizerEvents();
    if (res.success && res.data) setEvents(res.data);
    setEventsLoading(false);
  }, []);

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    const res = await getOrganizerOrders();
    if (res.success && res.data) setOrders(res.data);
    setOrdersLoading(false);
    setOrdersLoaded(true);
  }, []);

  const loadPromotions = useCallback(async () => {
    setPromotionsLoading(true);
    const res = await getOrganizerPromotions();
    if (res.success && res.data) setPromotions(res.data);
    setPromotionsLoading(false);
    setPromotionsLoaded(true);
  }, []);

  // ── Initial load: stats + overview data ──
  useEffect(() => {
    loadStats();
    loadEvents();
  }, [loadStats, loadEvents]);

  // ── Lazy-load tab data on first visit ──
  const tabNeedsOrders = activeTab === "orders" || activeTab === "overview";

  useEffect(() => {
    if (tabNeedsOrders && !ordersLoaded) {
      loadOrders();
    }
    if (activeTab === "promotions" && !promotionsLoaded) {
      loadPromotions();
    }
  }, [
    activeTab,
    tabNeedsOrders,
    ordersLoaded,
    promotionsLoaded,
    loadOrders,
    loadPromotions,
  ]);

  // ── Stat cards config ──
  const statCards: { icon: React.ElementType; label: string; value: string }[] =
    stats
      ? [
          {
            icon: Calendar,
            label: "Total Events",
            value: stats.total_events.toLocaleString(),
          },
          {
            icon: Activity,
            label: "Active Events",
            value: stats.active_events.toLocaleString(),
          },
          {
            icon: Ticket,
            label: "Tickets Sold",
            value: stats.total_tickets_sold.toLocaleString(),
          },
          {
            icon: Banknote,
            label: "Total Revenue",
            value: formatCurrency(stats.total_revenue),
          },
          {
            icon: Clock,
            label: "Pending Orders",
            value: stats.pending_orders.toLocaleString(),
          },
        ]
      : [];

  return (
    <main className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="font-primary text-3xl font-semibold text-[hsl(222.2,47.4%,11.2%)]">
            Organizer Dashboard
          </h1>
          <p className="font-secondary text-[hsl(215.4,16.3%,46.9%)] mt-2">
            Welcome back, {user.name}. Manage your events here.
          </p>
        </motion.div>

        {/* ── Stats Grid ── */}
        {statsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-[88px] rounded-2xl border border-[hsl(214.3,31.8%,91.4%)] bg-white shadow-sm animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {statCards.map((card, i) => (
              <StatCard
                key={card.label}
                icon={card.icon}
                label={card.label}
                value={card.value}
                index={i}
              />
            ))}
          </div>
        )}

        {/* ── Tab Navigation ── */}
        <div className="overflow-x-auto">
          <nav className="flex gap-1 border-b border-[hsl(214.3,31.8%,91.4%)]">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap",
                    isActive
                      ? "text-[hsl(270,70%,50%)]"
                      : "text-[hsl(215.4,16.3%,46.9%)] hover:text-[hsl(222.2,47.4%,11.2%)]",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-secondary">{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="organizer-tab-underline"
                      className="absolute inset-x-0 -bottom-px h-0.5 bg-[hsl(270,70%,50%)]"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* ── Tab Content ── */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {activeTab === "overview" && (
            <OverviewTab
              stats={stats}
              events={events}
              orders={orders}
              eventsLoading={eventsLoading}
              ordersLoading={ordersLoading}
            />
          )}
          {activeTab === "events" && (
            <EventsTab events={events} loading={eventsLoading} />
          )}
          {activeTab === "orders" && (
            <OrdersTab orders={orders} loading={ordersLoading} />
          )}
          {activeTab === "staff" && <StaffTab />}
          {activeTab === "promotions" && (
            <PromotionsTab
              promotions={promotions}
              loading={promotionsLoading}
            />
          )}
        </motion.div>
      </div>
    </main>
  );
}
