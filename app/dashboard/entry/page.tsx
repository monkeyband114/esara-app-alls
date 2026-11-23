import { redirect } from "next/navigation";
import { getCurrentUser, homeFor } from "@/lib/session";

/** Post-login landing: sends each user to their own dashboard, using their current role from the database. */
export default async function DashboardEntryPage() {
  const user = await getCurrentUser();
  redirect(user ? homeFor(user.role) : "/login");
}
