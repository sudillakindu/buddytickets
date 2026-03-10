// app/(main)/dashboard/(system)/system-payouts/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/utils/session";
import { SystemPayoutsClient } from "./client";

export default async function SystemPayoutsPage() {
  const session = await getSession();
  if (!session || session.role !== "SYSTEM") redirect("/");

  return <SystemPayoutsClient />;
}
