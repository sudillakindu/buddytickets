// app/(main)/dashboard/_components/SystemDashboard.tsx
import Link from "next/link";
import type { SessionUser } from "@/lib/utils/session";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  FolderTree,
  Calendar,
  Tag,
  CreditCard,
  RotateCcw,
} from "lucide-react";

const SYSTEM_NAV = [
  { href: "/dashboard/system-overview", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/system-users", label: "Users", icon: Users },
  { href: "/dashboard/system-organizer-verify", label: "Organizer Verify", icon: ShieldCheck },
  { href: "/dashboard/system-categories", label: "Categories", icon: FolderTree },
  { href: "/dashboard/system-events", label: "Events", icon: Calendar },
  { href: "/dashboard/system-promotions", label: "Promotions", icon: Tag },
  { href: "/dashboard/system-payouts", label: "Payouts", icon: CreditCard },
  { href: "/dashboard/system-refunds", label: "Refunds", icon: RotateCcw },
] as const;

export function SystemDashboard({ user }: { user: SessionUser }) {
  return (
    <main className="min-h-screen pt-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="font-primary text-3xl font-semibold text-[hsl(222.2,47.4%,11.2%)]">
            System Dashboard
          </h1>
          <p className="font-secondary text-[hsl(215.4,16.3%,46.9%)] mt-2">
            Welcome back, {user.name}. You have system-level access.
          </p>
        </div>

        <nav className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SYSTEM_NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="rounded-lg bg-gray-100 p-2">
                <Icon className="h-5 w-5 text-gray-600" />
              </div>
              <span className="font-medium text-gray-900">{label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}
