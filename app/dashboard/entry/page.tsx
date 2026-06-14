import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function DashboardEntryPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role === "SUPER_ADMIN") redirect("/dashboard/admin");
  if (session.user.role === "ICT_PERSONNEL") redirect("/dashboard/ict");
  redirect("/dashboard/staff");
}
