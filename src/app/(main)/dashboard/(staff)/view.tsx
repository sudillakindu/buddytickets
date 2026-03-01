// app/(main)/dashboard/_components/StaffDashboard.tsx
import type { SessionUser } from "@/lib/utils/session";

export function StaffDashboard({ user }: { user: SessionUser }) {
  return (
    <main className="min-h-screen pt-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-primary text-3xl font-semibold text-[hsl(222.2,47.4%,11.2%)]">
          Staff Dashboard
        </h1>
        <p className="font-secondary text-[hsl(215.4,16.3%,46.9%)] mt-2">
          Welcome back, {user.name}. Here are your staff tools.
        </p>
      </div>
    </main>
  );
}
