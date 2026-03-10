// app/(main)/dashboard/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/utils/session";

import { OrganizerDashboard } from "./(organizer)/view";
import { StaffDashboard } from "./(staff)/view";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  switch (session.role) {
    case "SYSTEM":
      redirect("/dashboard/system-overview");
    case "ORGANIZER":
      return <OrganizerDashboard user={session} />;
    case "STAFF":
      return <StaffDashboard user={session} />;
    default:
      redirect("/");
  }
}
