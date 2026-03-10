// app/(main)/dashboard/(system)/system-overview/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/utils/session";
import { SystemOverviewClient } from "./client";

export default async function SystemOverviewPage() {
  const session = await getSession();
  if (!session || session.role !== "SYSTEM") redirect("/");

  return <SystemOverviewClient />;
}
