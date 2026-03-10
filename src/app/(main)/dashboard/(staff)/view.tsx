// app/(main)/dashboard/(staff)/view.tsx
"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  ScanLine,
  CheckCircle,
  XCircle,
  LayoutDashboard,
  CalendarDays,
  History,
  QrCode,
  MapPin,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/ui/utils";
import type { SessionUser } from "@/lib/utils/session";
import type {
  StaffDashboardStats,
  StaffEventRow,
  StaffScanLogRow,
  ScanResult,
} from "@/lib/types/dashboard";
import {
  getStaffDashboardStats,
  getStaffEvents,
  getStaffScanLogs,
} from "@/lib/actions/staff-dashboard";

// ─── Constants ───────────────────────────────────────────────────────────────

const TABS = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "events", label: "Assigned Events", icon: CalendarDays },
  { key: "scans", label: "Scan History", icon: History },
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

// ─── Status / Result Helpers ─────────────────────────────────────────────────

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

const scanResultMap: Record<
  ScanResult,
  { text: string; dot: string; bg: string; fg: string }
> = {
  ALLOWED: {
    text: "Allowed",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
    fg: "text-emerald-700",
  },
  DENIED_SOLD_OUT: {
    text: "Sold Out",
    dot: "bg-amber-500",
    bg: "bg-amber-50",
    fg: "text-amber-700",
  },
  DENIED_ALREADY_USED: {
    text: "Already Used",
    dot: "bg-red-500",
    bg: "bg-red-50",
    fg: "text-red-700",
  },
  DENIED_UNPAID: {
    text: "Unpaid",
    dot: "bg-amber-500",
    bg: "bg-amber-50",
    fg: "text-amber-700",
  },
  DENIED_INVALID: {
    text: "Invalid",
    dot: "bg-red-500",
    bg: "bg-red-50",
    fg: "text-red-700",
  },
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
  emptyMessage,
}: {
  headers: string[];
  children: React.ReactNode;
  loading: boolean;
  empty: boolean;
  emptyMessage?: string;
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
                {emptyMessage ?? "No records found."}
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
  valueClassName?: string;
}

const StatCard = memo(function StatCard({
  icon: Icon,
  label,
  value,
  index,
  valueClassName,
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
          <p
            className={cn(
              "font-primary text-2xl font-bold truncate",
              valueClassName ?? "text-[hsl(222.2,47.4%,11.2%)]",
            )}
          >
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
  scanLogs,
  eventsLoading,
  scanLogsLoading,
}: {
  stats: StaffDashboardStats | null;
  events: StaffEventRow[];
  scanLogs: StaffScanLogRow[];
  eventsLoading: boolean;
  scanLogsLoading: boolean;
}) {
  const recent5Logs = scanLogs.slice(0, 5);
  const recent5Events = events.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* QR Scanner + Today's Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl border border-[hsl(214.3,31.8%,91.4%)] bg-white shadow-sm p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <QrCode className="h-5 w-5 text-[hsl(270,70%,50%)]" />
            <h3 className="font-primary text-sm font-semibold text-[hsl(222.2,47.4%,11.2%)]">
              QR Scanner
            </h3>
          </div>
          <div className="border-t border-dashed border-[hsl(214.3,31.8%,91.4%)] my-3" />
          <p className="font-secondary text-sm text-[hsl(215.4,16.3%,46.9%)]">
            Ready to scan tickets. Use the QR scanner tool to validate event
            entries.
          </p>
        </motion.div>

        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.06 }}
            className="rounded-2xl border border-[hsl(214.3,31.8%,91.4%)] bg-white shadow-sm p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <ScanLine className="h-5 w-5 text-[hsl(270,70%,50%)]" />
              <h3 className="font-primary text-sm font-semibold text-[hsl(222.2,47.4%,11.2%)]">
                Today&apos;s Scan Summary
              </h3>
            </div>
            <div className="border-t border-dashed border-[hsl(214.3,31.8%,91.4%)] my-3" />
            <div className="flex items-center gap-6">
              <div>
                <p className="font-primary text-2xl font-bold text-emerald-600">
                  {stats.successful_scans_today.toLocaleString()}
                </p>
                <p className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)] mt-1">
                  Successful
                </p>
              </div>
              <div className="h-8 w-px bg-[hsl(214.3,31.8%,91.4%)]" />
              <div>
                <p className="font-primary text-2xl font-bold text-red-600">
                  {stats.denied_scans_today.toLocaleString()}
                </p>
                <p className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)] mt-1">
                  Denied
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Recent Scan Logs */}
      <div>
        <SectionHeading
          title="Recent Scan Logs"
          subtitle="Latest 5 scans"
        />
        <TableShell
          headers={["Ticket ID", "Event", "Result", "Scanned At"]}
          loading={scanLogsLoading}
          empty={recent5Logs.length === 0}
          emptyMessage="No scan history yet. Start scanning tickets to see your history."
        >
          {recent5Logs.map((s) => (
            <tr
              key={s.scan_log_id}
              className="hover:bg-[hsl(210,40%,96.1%)]/50 transition-colors"
            >
              <td className="px-4 py-3 font-mono text-xs text-[hsl(215.4,16.3%,46.9%)] whitespace-nowrap">
                {s.ticket_id.slice(0, 8)}…
              </td>
              <td className="px-4 py-3 text-[hsl(215.4,16.3%,46.9%)] whitespace-nowrap max-w-[180px] truncate">
                {s.event_name}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={s.result} map={scanResultMap} />
              </td>
              <td className="px-4 py-3 text-[hsl(215.4,16.3%,46.9%)] whitespace-nowrap">
                {formatDate(s.scanned_at)}
              </td>
            </tr>
          ))}
        </TableShell>
      </div>

      {/* Quick Links – Assigned Events */}
      <div>
        <SectionHeading
          title="Your Events"
          subtitle="Quick links to assigned events"
        />
        {eventsLoading ? (
          <div className="flex items-center gap-2 text-[hsl(215.4,16.3%,46.9%)] text-sm">
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
        ) : recent5Events.length === 0 ? (
          <p className="font-secondary text-sm text-[hsl(215.4,16.3%,46.9%)]">
            No assigned events yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recent5Events.map((e, i) => (
              <motion.div
                key={e.event_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="rounded-2xl border border-[hsl(214.3,31.8%,91.4%)] bg-white shadow-sm hover:shadow-md hover:border-[hsl(270,70%,50%)]/20 transition-all duration-300 p-4 flex items-center justify-between"
              >
                <div className="min-w-0">
                  <p className="font-primary text-sm font-medium text-[hsl(222.2,47.4%,11.2%)] truncate">
                    {e.name}
                  </p>
                  <p className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)] flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" />
                    {e.location}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-[hsl(215.4,16.3%,46.9%)]" />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
OverviewTab.displayName = "OverviewTab";

// ─── Tab Content: Assigned Events ────────────────────────────────────────────

const AssignedEventsTab = memo(function AssignedEventsTab({
  events,
  loading,
}: {
  events: StaffEventRow[];
  loading: boolean;
}) {
  return (
    <div>
      <SectionHeading
        title="Assigned Events"
        subtitle={
          loading
            ? "Loading…"
            : `${events.length.toLocaleString()} assigned event${events.length === 1 ? "" : "s"}`
        }
      />
      <TableShell
        headers={["Event", "Status", "Start Date", "End Date", "Location", "Organizer"]}
        loading={loading}
        empty={events.length === 0}
        emptyMessage="No assigned events yet. Events you scan at will appear here."
      >
        {events.map((e) => (
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
            <td className="px-4 py-3 text-[hsl(215.4,16.3%,46.9%)] whitespace-nowrap">
              {e.organizer_name}
            </td>
          </tr>
        ))}
      </TableShell>
    </div>
  );
});
AssignedEventsTab.displayName = "AssignedEventsTab";

// ─── Tab Content: Scan History ───────────────────────────────────────────────

const ScanHistoryTab = memo(function ScanHistoryTab({
  scanLogs,
  loading,
}: {
  scanLogs: StaffScanLogRow[];
  loading: boolean;
}) {
  return (
    <div>
      <SectionHeading
        title="Scan History"
        subtitle={
          loading
            ? "Loading…"
            : `${scanLogs.length.toLocaleString()} scan record${scanLogs.length === 1 ? "" : "s"}`
        }
      />
      <TableShell
        headers={["Ticket ID", "Event", "Result", "Scanned At"]}
        loading={loading}
        empty={scanLogs.length === 0}
        emptyMessage="No scan history yet. Start scanning tickets to see your history."
      >
        {scanLogs.map((s) => (
          <tr
            key={s.scan_log_id}
            className="hover:bg-[hsl(210,40%,96.1%)]/50 transition-colors"
          >
            <td className="px-4 py-3 font-mono text-xs text-[hsl(215.4,16.3%,46.9%)] whitespace-nowrap">
              {s.ticket_id.slice(0, 8)}…
            </td>
            <td className="px-4 py-3 text-[hsl(215.4,16.3%,46.9%)] whitespace-nowrap max-w-[180px] truncate">
              {s.event_name}
            </td>
            <td className="px-4 py-3">
              <StatusBadge status={s.result} map={scanResultMap} />
            </td>
            <td className="px-4 py-3 text-[hsl(215.4,16.3%,46.9%)] whitespace-nowrap">
              {formatDate(s.scanned_at)}
            </td>
          </tr>
        ))}
      </TableShell>
    </div>
  );
});
ScanHistoryTab.displayName = "ScanHistoryTab";

// ═════════════════════════════════════════════════════════════════════════════
// Main Component
// ═════════════════════════════════════════════════════════════════════════════

export function StaffDashboard({ user }: { user: SessionUser }) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  // ── Data state ──
  const [stats, setStats] = useState<StaffDashboardStats | null>(null);
  const [events, setEvents] = useState<StaffEventRow[]>([]);
  const [scanLogs, setScanLogs] = useState<StaffScanLogRow[]>([]);

  // ── Loading state ──
  const [statsLoading, setStatsLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [scanLogsLoading, setScanLogsLoading] = useState(true);

  // Track whether scan logs have been fetched at least once
  const [scanLogsLoaded, setScanLogsLoaded] = useState(false);

  // ── Fetch helpers ──
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    const res = await getStaffDashboardStats();
    if (res.success && res.stats) setStats(res.stats);
    setStatsLoading(false);
  }, []);

  const loadEvents = useCallback(async () => {
    setEventsLoading(true);
    const res = await getStaffEvents();
    if (res.success && res.data) setEvents(res.data);
    setEventsLoading(false);
  }, []);

  const loadScanLogs = useCallback(async () => {
    setScanLogsLoading(true);
    const res = await getStaffScanLogs();
    if (res.success && res.data) setScanLogs(res.data);
    setScanLogsLoading(false);
    setScanLogsLoaded(true);
  }, []);

  // ── Initial load: stats + events (used in overview) ──
  useEffect(() => {
    loadStats();
    loadEvents();
  }, [loadStats, loadEvents]);

  // ── Lazy-load scan logs on first visit to scans or overview tab ──
  useEffect(() => {
    if ((activeTab === "scans" || activeTab === "overview") && !scanLogsLoaded) {
      loadScanLogs();
    }
  }, [activeTab, scanLogsLoaded, loadScanLogs]);

  // ── Stat cards config ──
  const statCards: {
    icon: React.ElementType;
    label: string;
    value: string;
    valueClassName?: string;
  }[] = stats
    ? [
        {
          icon: Calendar,
          label: "Assigned Events",
          value: stats.assigned_events.toLocaleString(),
        },
        {
          icon: ScanLine,
          label: "Total Scans Today",
          value: stats.total_scans_today.toLocaleString(),
        },
        {
          icon: CheckCircle,
          label: "Successful Scans",
          value: stats.successful_scans_today.toLocaleString(),
          valueClassName: "text-emerald-600",
        },
        {
          icon: XCircle,
          label: "Denied Scans",
          value: stats.denied_scans_today.toLocaleString(),
          valueClassName: "text-red-600",
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
            Staff Dashboard
          </h1>
          <p className="font-secondary text-[hsl(215.4,16.3%,46.9%)] mt-2">
            Welcome back, {user.name}. Here are your scanning tools.
          </p>
        </motion.div>

        {/* ── Stats Grid ── */}
        {statsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-[88px] rounded-2xl border border-[hsl(214.3,31.8%,91.4%)] bg-white shadow-sm animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card, i) => (
              <StatCard
                key={card.label}
                icon={card.icon}
                label={card.label}
                value={card.value}
                index={i}
                valueClassName={card.valueClassName}
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
                      layoutId="staff-tab-underline"
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
              scanLogs={scanLogs}
              eventsLoading={eventsLoading}
              scanLogsLoading={scanLogsLoading}
            />
          )}
          {activeTab === "events" && (
            <AssignedEventsTab events={events} loading={eventsLoading} />
          )}
          {activeTab === "scans" && (
            <ScanHistoryTab scanLogs={scanLogs} loading={scanLogsLoading} />
          )}
        </motion.div>
      </div>
    </main>
  );
}
