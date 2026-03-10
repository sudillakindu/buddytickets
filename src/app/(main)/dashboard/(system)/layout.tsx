// app/(main)/dashboard/(system)/layout.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/utils/session";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  CalendarDays,
  Tags,
  Megaphone,
  Wallet,
  RotateCcw,
  Star,
} from "lucide-react";

const NAV_ITEMS = [
  {
    label: "Overview",
    href: "/dashboard/system-overview",
    icon: LayoutDashboard,
  },
  { label: "Users", href: "/dashboard/system-users", icon: Users },
  {
    label: "Organizer Verification",
    href: "/dashboard/system-organizer-verification",
    icon: ShieldCheck,
  },
  { label: "Events", href: "/dashboard/system-events", icon: CalendarDays },
  { label: "Categories", href: "/dashboard/system-categories", icon: Tags },
  {
    label: "Promotions",
    href: "/dashboard/system-promotions",
    icon: Megaphone,
  },
  { label: "Payouts", href: "/dashboard/system-payouts", icon: Wallet },
  { label: "Refunds", href: "/dashboard/system-refunds", icon: RotateCcw },
  { label: "Reviews", href: "/dashboard/system-reviews", icon: Star },
] as const;

export default async function SystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || session.role !== "SYSTEM") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex pt-16">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-gray-200 bg-white hidden lg:block">
        <div className="sticky top-16 p-4 space-y-1">
          <p className="font-primary text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
            System Admin
          </p>
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-secondary text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 overflow-x-auto">
        <div className="flex px-2 py-2 gap-1">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center min-w-[64px] px-2 py-1 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Icon className="h-4 w-4" />
              <span className="text-[10px] font-secondary mt-0.5 whitespace-nowrap">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
