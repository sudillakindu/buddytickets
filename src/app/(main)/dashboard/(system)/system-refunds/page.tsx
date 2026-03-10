// app/(main)/dashboard/(system)/system-refunds/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/utils/session";
import { SystemRefundsClient } from "./client";

export default async function SystemRefundsPage() {
  const session = await getSession();
  if (!session || session.role !== "SYSTEM") redirect("/");

  return <SystemRefundsClient />;
}
