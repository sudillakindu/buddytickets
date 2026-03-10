// app/(main)/dashboard/(system)/view.tsx
"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Building2,
  Calendar,
  Banknote,
  Clock,
  Activity,
  LayoutDashboard,
  UserCog,
  Landmark,
  CalendarDays,
  Wallet,
  RotateCcw,
  ChevronRight,
  MapPin,
  Mail,
  Shield,
  CreditCard,
  FileText,
  Ticket,
} from "lucide-react";
import { cn } from "@/lib/ui/utils";
import type { SessionUser } from "@/lib/utils/session";
import type {
  SystemDashboardStats,
  SystemUserRow,
  SystemOrganizerRow,
  SystemEventRow,
  SystemPayoutRow,
  SystemRefundRow,
} from "@/lib/types/dashboard";
import {
  getSystemDashboardStats,
  getSystemUsers,
  getSystemOrganizers,
  getSystemEvents,
  getSystemPayouts,
  getSystemRefunds,
} from "@/lib/actions/system-dashboard";

// ─── Constants ───────────────────────────────────────────────────────────────

const TABS = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "users", label: "Users", icon: UserCog },
  { key: "organizers", label: "Organizers", icon: Building2 },
  { key: "events", label: "Events", icon: CalendarDays },
  { key: "payouts", label: "Payouts", icon: Wallet },
  { key: "refunds", label: "Refunds", icon: RotateCcw },
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

const organizerStatusMap: Record<
  string,
  { text: string; dot: string; bg: string; fg: string }
> = {
  PENDING: {
    text: "Pending",
    dot: "bg-amber-500",
    bg: "bg-amber-50",
    fg: "text-amber-700",
  },
  APPROVED: {
    text: "Approved",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
    fg: "text-emerald-700",
  },
  REJECTED: {
    text: "Rejected",
    dot: "bg-red-500",
    bg: "bg-red-50",
    fg: "text-red-700",
  },
};

const payoutStatusMap: Record<
  string,
  { text: string; dot: string; bg: string; fg: string }
> = {
  PENDING: {
    text: "Pending",
    dot: "bg-amber-500",
    bg: "bg-amber-50",
    fg: "text-amber-700",
  },
  PROCESSING: {
    text: "Processing",
    dot: "bg-blue-500",
    bg: "bg-blue-50",
    fg: "text-blue-700",
  },
  COMPLETED: {
    text: "Completed",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
    fg: "text-emerald-700",
  },
  FAILED: {
    text: "Failed",
    dot: "bg-red-500",
    bg: "bg-red-50",
    fg: "text-red-700",
  },
};

const refundStatusMap: Record<
  string,
  { text: string; dot: string; bg: string; fg: string }
> = {
  PENDING: {
    text: "Pending",
    dot: "bg-amber-500",
    bg: "bg-amber-50",
    fg: "text-amber-700",
  },
  APPROVED: {
    text: "Approved",
    dot: "bg-blue-500",
    bg: "bg-blue-50",
    fg: "text-blue-700",
  },
  REJECTED: {
    text: "Rejected",
    dot: "bg-red-500",
    bg: "bg-red-50",
    fg: "text-red-700",
  },
  REFUNDED: {
    text: "Refunded",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
    fg: "text-emerald-700",
  },
};

const roleColorMap: Record<string, { bg: string; fg: string }> = {
  SYSTEM: { bg: "bg-purple-50", fg: "text-purple-700" },
  ORGANIZER: { bg: "bg-blue-50", fg: "text-blue-700" },
  STAFF: { bg: "bg-teal-50", fg: "text-teal-700" },
  USER: { bg: "bg-gray-50", fg: "text-gray-700" },
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

const RoleBadge = memo(function RoleBadge({ role }: { role: string }) {
  const c = roleColorMap[role] ?? roleColorMap.USER;
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
        c.bg,
        c.fg,
      )}
    >
      {role}
    </span>
  );
});
RoleBadge.displayName = "RoleBadge";

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
  users,
  eventsLoading,
  usersLoading,
}: {
  stats: SystemDashboardStats | null;
  events: SystemEventRow[];
  users: SystemUserRow[];
  eventsLoading: boolean;
  usersLoading: boolean;
}) {
  const recent5Events = events.slice(0, 5);
  const recent5Users = users.slice(0, 5);

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
              Total platform revenue
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.06 }}
            className="rounded-2xl border border-[hsl(214.3,31.8%,91.4%)] bg-white shadow-sm p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <Clock className="h-5 w-5 text-[hsl(270,70%,50%)]" />
              <h3 className="font-primary text-sm font-semibold text-[hsl(222.2,47.4%,11.2%)]">
                Pending Approvals
              </h3>
            </div>
            <div className="border-t border-dashed border-[hsl(214.3,31.8%,91.4%)] my-3" />
            <p className="font-primary text-2xl font-bold text-[hsl(222.2,47.4%,11.2%)]">
              {stats.pending_organizers.toLocaleString()}
            </p>
            <p className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)] mt-1">
              Organizers awaiting review
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
                Live Events
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
          subtitle="Latest 5 events on the platform"
        />
        <TableShell
          headers={["Event", "Organizer", "Status", "Date", "Tickets"]}
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
              <td className="px-4 py-3 text-[hsl(215.4,16.3%,46.9%)]">
                {e.organizer_name}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={e.status} map={eventStatusMap} />
              </td>
              <td className="px-4 py-3 text-[hsl(215.4,16.3%,46.9%)]">
                {formatDate(e.start_at)}
              </td>
              <td className="px-4 py-3 text-[hsl(215.4,16.3%,46.9%)]">
                {e.tickets_sold.toLocaleString()} /{" "}
                {e.total_capacity.toLocaleString()}
              </td>
            </tr>
          ))}
        </TableShell>
      </div>

      {/* Recent Users */}
      <div>
        <SectionHeading
          title="Recent Users"
          subtitle="Latest 5 registered users"
        />
        <TableShell
          headers={["Name", "Email", "Role", "Status", "Joined"]}
          loading={usersLoading}
          empty={recent5Users.length === 0}
        >
          {recent5Users.map((u) => (
            <tr
              key={u.user_id}
              className="hover:bg-[hsl(210,40%,96.1%)]/50 transition-colors"
            >
              <td className="px-4 py-3 font-medium text-[hsl(222.2,47.4%,11.2%)]">
                {u.name}
              </td>
              <td className="px-4 py-3 text-[hsl(215.4,16.3%,46.9%)]">
                {u.email}
              </td>
              <td className="px-4 py-3">
                <RoleBadge role={u.role} />
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                    u.is_active
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-gray-50 text-gray-600",
                  )}
                >
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      u.is_active ? "bg-emerald-500" : "bg-gray-400",
                    )}
                  />
                  {u.is_active ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="px-4 py-3 text-[hsl(215.4,16.3%,46.9%)]">
                {formatDate(u.created_at)}
              </td>
            </tr>
          ))}
        </TableShell>
      </div>
    </div>
  );
});
OverviewTab.displayName = "OverviewTab";

// ─── Tab Content: Users ──────────────────────────────────────────────────────

const UsersTab = memo(function UsersTab({
  users,
  loading,
}: {
  users: SystemUserRow[];
  loading: boolean;
}) {
  return (
    <div>
      <SectionHeading
        title="All Users"
        subtitle={
          loading ? "Loading…" : `${users.length.toLocaleString()} total users`
        }
      />
      <TableShell
        headers={["Name", "Email", "Role", "Status", "Joined", "Last Login"]}
        loading={loading}
        empty={users.length === 0}
      >
        {users.map((u) => (
          <tr
            key={u.user_id}
            className="hover:bg-[hsl(210,40%,96.1%)]/50 transition-colors"
          >
            <td className="px-4 py-3 font-medium text-[hsl(222.2,47.4%,11.2%)] whitespace-nowrap">
              {u.name}
            </td>
            <td className="px-4 py-3 text-[hsl(215.4,16.3%,46.9%)] whitespace-nowrap">
              {u.email}
            </td>
            <td className="px-4 py-3">
              <RoleBadge role={u.role} />
            </td>
            <td className="px-4 py-3">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                  u.is_active
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-gray-50 text-gray-600",
                )}
              >
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    u.is_active ? "bg-emerald-500" : "bg-gray-400",
                  )}
                />
                {u.is_active ? "Active" : "Inactive"}
              </span>
            </td>
            <td className="px-4 py-3 text-[hsl(215.4,16.3%,46.9%)] whitespace-nowrap">
              {formatDate(u.created_at)}
            </td>
            <td className="px-4 py-3 text-[hsl(215.4,16.3%,46.9%)] whitespace-nowrap">
              {formatDate(u.last_login_at)}
            </td>
          </tr>
        ))}
      </TableShell>
    </div>
  );
});
UsersTab.displayName = "UsersTab";

// ─── Tab Content: Organizers ─────────────────────────────────────────────────

const OrganizersTab = memo(function OrganizersTab({
  organizers,
  loading,
}: {
  organizers: SystemOrganizerRow[];
  loading: boolean;
}) {
  return (
    <div>
      <SectionHeading
        title="All Organizers"
        subtitle={
          loading
            ? "Loading…"
            : `${organizers.length.toLocaleString()} total organizers`
        }
      />
      <TableShell
        headers={[
          "Name",
          "Email",
          "NIC",
          "Status",
          "Applied Date",
          "Verified Date",
        ]}
        loading={loading}
        empty={organizers.length === 0}
      >
        {organizers.map((o) => (
          <tr
            key={o.user_id}
            className="hover:bg-[hsl(210,40%,96.1%)]/50 transition-colors"
          >
            <td className="px-4 py-3 font-medium text-[hsl(222.2,47.4%,11.2%)] whitespace-nowrap">
              {o.name}
            </td>
            <td className="px-4 py-3 text-[hsl(215.4,16.3%,46.9%)] whitespace-nowrap">
              {o.email}
            </td>
            <td className="px-4 py-3 font-mono text-xs text-[hsl(215.4,16.3%,46.9%)]">
              {o.nic_number}
            </td>
            <td className="px-4 py-3">
              <StatusBadge status={o.status} map={organizerStatusMap} />
            </td>
            <td className="px-4 py-3 text-[hsl(215.4,16.3%,46.9%)] whitespace-nowrap">
              {formatDate(o.created_at)}
            </td>
            <td className="px-4 py-3 text-[hsl(215.4,16.3%,46.9%)] whitespace-nowrap">
              {formatDate(o.verified_at)}
            </td>
          </tr>
        ))}
      </TableShell>
    </div>
  );
});
OrganizersTab.displayName = "OrganizersTab";

// ─── Tab Content: Events ─────────────────────────────────────────────────────

const EventsTab = memo(function EventsTab({
  events,
  loading,
}: {
  events: SystemEventRow[];
  loading: boolean;
}) {
  return (
    <div>
      <SectionHeading
        title="All Events"
        subtitle={
          loading
            ? "Loading…"
            : `${events.length.toLocaleString()} total events`
        }
      />
      <TableShell
        headers={[
          "Event",
          "Organizer",
          "Status",
          "Date",
          "Location",
          "Tickets",
        ]}
        loading={loading}
        empty={events.length === 0}
      >
        {events.map((e) => (
          <tr
            key={e.event_id}
            className="hover:bg-[hsl(210,40%,96.1%)]/50 transition-colors"
          >
            <td className="px-4 py-3 font-medium text-[hsl(222.2,47.4%,11.2%)] whitespace-nowrap max-w-[200px] truncate">
              {e.name}
            </td>
            <td className="px-4 py-3 text-[hsl(215.4,16.3%,46.9%)] whitespace-nowrap">
              {e.organizer_name}
            </td>
            <td className="px-4 py-3">
              <StatusBadge status={e.status} map={eventStatusMap} />
            </td>
            <td className="px-4 py-3 text-[hsl(215.4,16.3%,46.9%)] whitespace-nowrap">
              {formatDate(e.start_at)}
            </td>
            <td className="px-4 py-3 text-[hsl(215.4,16.3%,46.9%)] whitespace-nowrap max-w-[180px] truncate">
              {e.location}
            </td>
            <td className="px-4 py-3 text-[hsl(215.4,16.3%,46.9%)] whitespace-nowrap">
              <span className="font-medium text-[hsl(222.2,47.4%,11.2%)]">
                {e.tickets_sold.toLocaleString()}
              </span>{" "}
              / {e.total_capacity.toLocaleString()}
            </td>
          </tr>
        ))}
      </TableShell>
    </div>
  );
});
EventsTab.displayName = "EventsTab";

// ─── Tab Content: Payouts ────────────────────────────────────────────────────

const PayoutsTab = memo(function PayoutsTab({
  payouts,
  loading,
}: {
  payouts: SystemPayoutRow[];
  loading: boolean;
}) {
  return (
    <div>
      <SectionHeading
        title="All Payouts"
        subtitle={
          loading
            ? "Loading…"
            : `${payouts.length.toLocaleString()} total payouts`
        }
      />
      <TableShell
        headers={[
          "Event",
          "Organizer",
          "Gross Revenue",
          "Platform Fee",
          "Net Payout",
          "Status",
          "Date",
        ]}
        loading={loading}
        empty={payouts.length === 0}
      >
        {payouts.map((p) => (
          <tr
            key={p.payout_id}
            className="hover:bg-[hsl(210,40%,96.1%)]/50 transition-colors"
          >
            <td className="px-4 py-3 font-medium text-[hsl(222.2,47.4%,11.2%)] whitespace-nowrap max-w-[180px] truncate">
              {p.event_name}
            </td>
            <td className="px-4 py-3 text-[hsl(215.4,16.3%,46.9%)] whitespace-nowrap">
              {p.organizer_name}
            </td>
            <td className="px-4 py-3 text-[hsl(222.2,47.4%,11.2%)] whitespace-nowrap font-medium">
              {formatCurrency(p.gross_revenue)}
            </td>
            <td className="px-4 py-3 text-[hsl(215.4,16.3%,46.9%)] whitespace-nowrap">
              {formatCurrency(p.platform_fee_amount)}
            </td>
            <td className="px-4 py-3 text-[hsl(222.2,47.4%,11.2%)] whitespace-nowrap font-medium">
              {formatCurrency(p.net_payout_amount)}
            </td>
            <td className="px-4 py-3">
              <StatusBadge status={p.status} map={payoutStatusMap} />
            </td>
            <td className="px-4 py-3 text-[hsl(215.4,16.3%,46.9%)] whitespace-nowrap">
              {formatDate(p.created_at)}
            </td>
          </tr>
        ))}
      </TableShell>
    </div>
  );
});
PayoutsTab.displayName = "PayoutsTab";

// ─── Tab Content: Refunds ────────────────────────────────────────────────────

const RefundsTab = memo(function RefundsTab({
  refunds,
  loading,
}: {
  refunds: SystemRefundRow[];
  loading: boolean;
}) {
  return (
    <div>
      <SectionHeading
        title="All Refunds"
        subtitle={
          loading
            ? "Loading…"
            : `${refunds.length.toLocaleString()} total refunds`
        }
      />
      <TableShell
        headers={[
          "Order ID",
          "User",
          "Event",
          "Amount",
          "Reason",
          "Status",
          "Date",
        ]}
        loading={loading}
        empty={refunds.length === 0}
      >
        {refunds.map((r) => (
          <tr
            key={r.refund_id}
            className="hover:bg-[hsl(210,40%,96.1%)]/50 transition-colors"
          >
            <td className="px-4 py-3 font-mono text-xs text-[hsl(215.4,16.3%,46.9%)] whitespace-nowrap">
              {r.order_id.slice(0, 8)}…
            </td>
            <td className="px-4 py-3 text-[hsl(222.2,47.4%,11.2%)] whitespace-nowrap">
              {r.user_name}
            </td>
            <td className="px-4 py-3 text-[hsl(215.4,16.3%,46.9%)] whitespace-nowrap max-w-[180px] truncate">
              {r.event_name}
            </td>
            <td className="px-4 py-3 text-[hsl(222.2,47.4%,11.2%)] whitespace-nowrap font-medium">
              {formatCurrency(r.refund_amount)}
            </td>
            <td className="px-4 py-3 text-[hsl(215.4,16.3%,46.9%)] max-w-[200px] truncate">
              {r.reason || "—"}
            </td>
            <td className="px-4 py-3">
              <StatusBadge status={r.status} map={refundStatusMap} />
            </td>
            <td className="px-4 py-3 text-[hsl(215.4,16.3%,46.9%)] whitespace-nowrap">
              {formatDate(r.created_at)}
            </td>
          </tr>
        ))}
      </TableShell>
    </div>
  );
});
RefundsTab.displayName = "RefundsTab";

// ═════════════════════════════════════════════════════════════════════════════
// Main Component
// ═════════════════════════════════════════════════════════════════════════════

export function SystemDashboard({ user }: { user: SessionUser }) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  // ── Data state ──
  const [stats, setStats] = useState<SystemDashboardStats | null>(null);
  const [users, setUsers] = useState<SystemUserRow[]>([]);
  const [organizers, setOrganizers] = useState<SystemOrganizerRow[]>([]);
  const [events, setEvents] = useState<SystemEventRow[]>([]);
  const [payouts, setPayouts] = useState<SystemPayoutRow[]>([]);
  const [refunds, setRefunds] = useState<SystemRefundRow[]>([]);

  // ── Loading state ──
  const [statsLoading, setStatsLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [organizersLoading, setOrganizersLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [payoutsLoading, setPayoutsLoading] = useState(true);
  const [refundsLoading, setRefundsLoading] = useState(true);

  // Track whether each lazy tab has been fetched at least once
  const [organizersLoaded, setOrganizersLoaded] = useState(false);
  const [payoutsLoaded, setPayoutsLoaded] = useState(false);
  const [refundsLoaded, setRefundsLoaded] = useState(false);

  // ── Fetch helpers ──
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    const res = await getSystemDashboardStats();
    if (res.success && res.stats) setStats(res.stats);
    setStatsLoading(false);
  }, []);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    const res = await getSystemUsers();
    if (res.success && res.data) setUsers(res.data);
    setUsersLoading(false);
  }, []);

  const loadOrganizers = useCallback(async () => {
    setOrganizersLoading(true);
    const res = await getSystemOrganizers();
    if (res.success && res.data) setOrganizers(res.data);
    setOrganizersLoading(false);
    setOrganizersLoaded(true);
  }, []);

  const loadEvents = useCallback(async () => {
    setEventsLoading(true);
    const res = await getSystemEvents();
    if (res.success && res.data) setEvents(res.data);
    setEventsLoading(false);
  }, []);

  const loadPayouts = useCallback(async () => {
    setPayoutsLoading(true);
    const res = await getSystemPayouts();
    if (res.success && res.data) setPayouts(res.data);
    setPayoutsLoading(false);
    setPayoutsLoaded(true);
  }, []);

  const loadRefunds = useCallback(async () => {
    setRefundsLoading(true);
    const res = await getSystemRefunds();
    if (res.success && res.data) setRefunds(res.data);
    setRefundsLoading(false);
    setRefundsLoaded(true);
  }, []);

  // ── Initial load: stats + overview data ──
  useEffect(() => {
    loadStats();
    loadUsers();
    loadEvents();
  }, [loadStats, loadUsers, loadEvents]);

  // ── Lazy-load tab data on first visit ──
  useEffect(() => {
    if (activeTab === "organizers" && !organizersLoaded) {
      loadOrganizers();
    }
    if (activeTab === "payouts" && !payoutsLoaded) {
      loadPayouts();
    }
    if (activeTab === "refunds" && !refundsLoaded) {
      loadRefunds();
    }
  }, [
    activeTab,
    organizersLoaded,
    payoutsLoaded,
    refundsLoaded,
    loadOrganizers,
    loadPayouts,
    loadRefunds,
  ]);

  // ── Stat cards config ──
  const statCards: { icon: React.ElementType; label: string; value: string }[] =
    stats
      ? [
          {
            icon: Users,
            label: "Total Users",
            value: stats.total_users.toLocaleString(),
          },
          {
            icon: Building2,
            label: "Total Organizers",
            value: stats.total_organizers.toLocaleString(),
          },
          {
            icon: Calendar,
            label: "Total Events",
            value: stats.total_events.toLocaleString(),
          },
          {
            icon: Banknote,
            label: "Total Revenue",
            value: formatCurrency(stats.total_revenue),
          },
          {
            icon: Clock,
            label: "Pending Organizers",
            value: stats.pending_organizers.toLocaleString(),
          },
          {
            icon: Activity,
            label: "Active Events",
            value: stats.active_events.toLocaleString(),
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
            System Dashboard
          </h1>
          <p className="font-secondary text-[hsl(215.4,16.3%,46.9%)] mt-2">
            Welcome back, {user.name}
          </p>
        </motion.div>

        {/* ── Stats Grid ── */}
        {statsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-[88px] rounded-2xl border border-[hsl(214.3,31.8%,91.4%)] bg-white shadow-sm animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      layoutId="tab-underline"
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
              users={users}
              eventsLoading={eventsLoading}
              usersLoading={usersLoading}
            />
          )}
          {activeTab === "users" && (
            <UsersTab users={users} loading={usersLoading} />
          )}
          {activeTab === "organizers" && (
            <OrganizersTab
              organizers={organizers}
              loading={organizersLoading}
            />
          )}
          {activeTab === "events" && (
            <EventsTab events={events} loading={eventsLoading} />
          )}
          {activeTab === "payouts" && (
            <PayoutsTab payouts={payouts} loading={payoutsLoading} />
          )}
          {activeTab === "refunds" && (
            <RefundsTab refunds={refunds} loading={refundsLoading} />
          )}
        </motion.div>
      </div>
    </main>
  );
}
