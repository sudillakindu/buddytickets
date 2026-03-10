// app/(main)/dashboard/(system)/system-dashboard.tsx
"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Ticket,
  DollarSign,
  Users,
  Calendar,
  UserCheck,
  AlertCircle,
  Clock,
} from "lucide-react";
import { getPlatformStats } from "@/lib/actions/system-dashboard";
import type { PlatformStats } from "@/lib/types/system";

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="font-secondary text-sm text-[hsl(215.4,16.3%,46.9%)]">
            {label}
          </p>
          <p className="font-primary text-2xl font-semibold text-[hsl(222.2,47.4%,11.2%)]">
            {value}
          </p>
          {subtitle && (
            <p className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)]">
              {subtitle}
            </p>
          )}
        </div>
        <div
          className="h-12 w-12 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="h-6 w-6" style={{ color }} />
        </div>
      </div>
    </div>
  );
}

// ─── Loading Skeleton ────────────────────────────────────────────────────────

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-7 w-16 bg-gray-200 rounded" />
            </div>
            <div className="h-12 w-12 bg-gray-100 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SystemDashboardOverview() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await getPlatformStats();
      if (!cancelled && res.stats) {
        setStats(res.stats);
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <StatsSkeleton />;
  if (!stats) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-10 w-10 text-gray-400 mx-auto mb-3" />
        <p className="font-secondary text-[hsl(215.4,16.3%,46.9%)]">
          Failed to load platform statistics.
        </p>
      </div>
    );
  }

  const formatCurrency = (v: number) =>
    `LKR ${v.toLocaleString("en-LK", { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Events"
          value={stats.total_events}
          icon={Calendar}
          color="#6366f1"
        />
        <StatCard
          label="Tickets Sold"
          value={stats.total_tickets_sold}
          icon={Ticket}
          color="#10b981"
        />
        <StatCard
          label="Total Revenue"
          value={formatCurrency(stats.total_revenue)}
          icon={DollarSign}
          color="#f59e0b"
        />
        <StatCard
          label="Active Organizers"
          value={stats.active_organizers}
          icon={UserCheck}
          color="#8b5cf6"
        />
        <StatCard
          label="Active Events"
          value={stats.active_events}
          icon={BarChart3}
          color="#3b82f6"
          subtitle="ON_SALE or ONGOING"
        />
        <StatCard
          label="Total Users"
          value={stats.total_users}
          icon={Users}
          color="#06b6d4"
        />
        <StatCard
          label="Pending Verifications"
          value={stats.pending_organizers}
          icon={Clock}
          color="#f97316"
          subtitle="Awaiting review"
        />
        <StatCard
          label="Pending Refunds"
          value={stats.pending_refunds}
          icon={AlertCircle}
          color="#ef4444"
          subtitle="Awaiting review"
        />
      </div>
    </div>
  );
}
