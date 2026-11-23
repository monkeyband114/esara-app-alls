import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminCreateUserForm } from "@/components/admin-create-user-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSettings } from "@/lib/repository";
import { requirePageUser } from "@/lib/session";

export default async function NewUserPage() {
  const admin = await requirePageUser(["SUPER_ADMIN"]);
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href="/dashboard/admin" className="inline-flex items-center gap-1 text-sm font-semibold text-primary"><ArrowLeft className="h-4 w-4" /> Back to Admin</Link>
      <Card>
        <CardHeader>
          <CardTitle>Create Account</CardTitle>
          <p className="text-sm text-muted-foreground">Create Admin, ICT Personnel, or Academic Staff accounts. The new user signs in with the temporary password you set here.</p>
        </CardHeader>
        <CardContent>
          <AdminCreateUserForm institution={admin.institution ?? settings.institutionName} />
        </CardContent>
      </Card>
    </div>
  );
}
