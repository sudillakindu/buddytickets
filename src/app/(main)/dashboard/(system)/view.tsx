// app/(main)/dashboard/_components/SystemDashboard.tsx
"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  UserCheck,
  Calendar,
  Users,
  BarChart3,
} from "lucide-react";
import type { SessionUser } from "@/lib/utils/session";
import { SystemDashboardOverview } from "./system-dashboard";
import { SystemOrganizers } from "./system-organizers";
import { SystemEvents } from "./system-events";
import { SystemUsers } from "./system-users";
import { SystemReports } from "./system-reports";

type Tab = "overview" | "organizers" | "events" | "users" | "reports";

const TABS: { label: string; value: Tab; icon: React.ElementType }[] = [
  { label: "Overview", value: "overview", icon: LayoutDashboard },
  { label: "Organizers", value: "organizers", icon: UserCheck },
  { label: "Events", value: "events", icon: Calendar },
  { label: "Users", value: "users", icon: Users },
  { label: "Reports", value: "reports", icon: BarChart3 },
];

export function SystemDashboard({ user }: { user: SessionUser }) {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <main className="min-h-screen pt-24 px-4 sm:px-6 lg:px-8 pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-primary text-3xl font-semibold text-[hsl(222.2,47.4%,11.2%)]">
            System Dashboard
          </h1>
          <p className="font-secondary text-[hsl(215.4,16.3%,46.9%)] mt-2">
            Welcome back, {user.name}. You have system-level access.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-4">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === t.value
                    ? "bg-[hsl(222.2,47.4%,11.2%)] text-white shadow-sm"
                    : "text-[hsl(215.4,16.3%,46.9%)] hover:bg-gray-100"
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {tab === "overview" && <SystemDashboardOverview />}
        {tab === "organizers" && <SystemOrganizers />}
        {tab === "events" && <SystemEvents />}
        {tab === "users" && <SystemUsers />}
        {tab === "reports" && <SystemReports />}
      </div>
    </main>
  );
}
