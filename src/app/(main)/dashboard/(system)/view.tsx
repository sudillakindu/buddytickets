import React from "react";
import {
  Shield,
  Users,
  Calendar,
  BarChart3,
} from "lucide-react";
import type { SessionUser } from "@/lib/utils/session";

export function SystemDashboard({ user }: { user: SessionUser }) {
  return (
    <main className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-[hsl(210,40%,96.1%)]">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="font-primary text-2xl sm:text-3xl font-semibold text-[hsl(222.2,47.4%,11.2%)]">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]">
              System
            </span>{" "}
            Dashboard
          </h1>
          <div className="h-1.5 w-20 rounded-full mt-2 bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]" />
          <p className="font-secondary text-[hsl(215.4,16.3%,46.9%)] mt-3">
            Welcome back, {user.name}. You have system-level access.
          </p>
        </div>

        {/* --- Admin Overview Cards --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl border border-[hsl(214.3,31.8%,91.4%)] bg-white p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-[hsl(270,70%,50%)]/20 transition-all duration-300">
            <div className="flex items-center gap-2 mb-2">
              <Shield
                className="w-4 h-4 text-[hsl(270,70%,50%)]"
                aria-hidden="true"
              />
              <span className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)]">
                System Status
              </span>
            </div>
            <p className="font-primary text-lg font-semibold text-emerald-600">
              Online
            </p>
          </div>
          <div className="rounded-xl border border-[hsl(214.3,31.8%,91.4%)] bg-white p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-[hsl(270,70%,50%)]/20 transition-all duration-300">
            <div className="flex items-center gap-2 mb-2">
              <Users
                className="w-4 h-4 text-[hsl(270,70%,50%)]"
                aria-hidden="true"
              />
              <span className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)]">
                User Management
              </span>
            </div>
            <p className="font-primary text-sm font-semibold text-[hsl(222.2,47.4%,11.2%)]">
              Manage Users
            </p>
          </div>
          <div className="rounded-xl border border-[hsl(214.3,31.8%,91.4%)] bg-white p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-[hsl(270,70%,50%)]/20 transition-all duration-300">
            <div className="flex items-center gap-2 mb-2">
              <Calendar
                className="w-4 h-4 text-[hsl(270,70%,50%)]"
                aria-hidden="true"
              />
              <span className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)]">
                Event Management
              </span>
            </div>
            <p className="font-primary text-sm font-semibold text-[hsl(222.2,47.4%,11.2%)]">
              Manage Events
            </p>
          </div>
          <div className="rounded-xl border border-[hsl(214.3,31.8%,91.4%)] bg-white p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-[hsl(270,70%,50%)]/20 transition-all duration-300">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3
                className="w-4 h-4 text-[hsl(270,70%,50%)]"
                aria-hidden="true"
              />
              <span className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)]">
                Platform Analytics
              </span>
            </div>
            <p className="font-primary text-sm font-semibold text-[hsl(222.2,47.4%,11.2%)]">
              View Reports
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
