// app/(main)/dashboard/(system)/system-events/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/utils/session";
import { SystemEventsClient } from "./client";

export default async function SystemEventsPage() {
  const session = await getSession();
  if (!session || session.role !== "SYSTEM") redirect("/");

  return <SystemEventsClient />;
}
