// app/(main)/dashboard/(system)/system-organizer-verify/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/utils/session";
import { OrganizerVerifyClient } from "./client";

export default async function SystemOrganizerVerifyPage() {
  const session = await getSession();
  if (!session || session.role !== "SYSTEM") redirect("/");

  return <OrganizerVerifyClient />;
}
