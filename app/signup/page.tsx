import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { SignedInNotice } from "@/components/signed-in-notice";
import { SignupForm } from "@/components/signup-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { roleLabel } from "@/lib/repository";
import { getCurrentUser, homeFor } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const user = await getCurrentUser();

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold text-primary"><GraduationCap className="h-6 w-6" /> ESARA</Link>
          <p className="text-sm text-muted-foreground">Already registered? <Link href="/login" className="font-semibold text-primary">Sign in</Link></p>
        </div>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Academic Staff Registration</CardTitle>
            <p className="text-sm text-muted-foreground">Public registration creates Academic Staff accounts only. ESARA starts automatic research profile discovery after signup.</p>
          </CardHeader>
          <CardContent>
            {user ? <SignedInNotice name={user.fullName} roleLabel={roleLabel(user.role)} home={homeFor(user.role)} /> : null}
            <SignupForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
