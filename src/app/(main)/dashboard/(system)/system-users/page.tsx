// app/(main)/dashboard/(system)/system-users/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/utils/session";
import { SystemUsersClient } from "./client";

export default async function SystemUsersPage() {
  const session = await getSession();
  if (!session || session.role !== "SYSTEM") redirect("/");

  return <SystemUsersClient />;
}
