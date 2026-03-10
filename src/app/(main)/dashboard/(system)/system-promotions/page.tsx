// app/(main)/dashboard/(system)/system-promotions/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/utils/session";
import { SystemPromotionsClient } from "./client";

export default async function SystemPromotionsPage() {
  const session = await getSession();
  if (!session || session.role !== "SYSTEM") redirect("/");

  return <SystemPromotionsClient />;
}
