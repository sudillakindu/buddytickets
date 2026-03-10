// app/(main)/dashboard/(system)/system-categories/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/utils/session";
import { SystemCategoriesClient } from "./client";

export default async function SystemCategoriesPage() {
  const session = await getSession();
  if (!session || session.role !== "SYSTEM") redirect("/");

  return <SystemCategoriesClient />;
}
