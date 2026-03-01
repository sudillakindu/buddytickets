// app/(main)/dashboard/layout.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/utils/session";

const DASHBOARD_ROLES = new Set(["SYSTEM", "ORGANIZER", "STAFF"]);

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  if (!DASHBOARD_ROLES.has(session.role)) {
    redirect("/");
  }

  return <>{children}</>;
}
