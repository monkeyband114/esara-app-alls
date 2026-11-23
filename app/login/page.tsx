import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { GraduationCap, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { SignedInNotice } from "@/components/signed-in-notice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { roleLabel } from "@/lib/repository";
import { getCurrentUser, homeFor } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[0.95fr_1.05fr]">
      <section className="hidden min-h-screen flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold"><GraduationCap className="h-6 w-6" /> ESARA</Link>
        <div>
          <h1 className="max-w-xl text-4xl font-bold leading-tight">Secure access to institutional research intelligence.</h1>
          <p className="mt-4 max-w-lg text-primary-foreground/75">Admin, ICT, and academic staff dashboards route automatically after login.</p>
        </div>
        <Image src="/esara-hero.png" alt="Academic analytics dashboard" width={900} height={560} className="rounded-lg opacity-95 shadow-soft" />
      </section>
      <section className="flex flex-col items-center justify-center px-4 py-8 sm:py-10">
        <Link href="/" className="mb-6 flex items-center gap-2 text-lg font-bold text-primary lg:hidden"><GraduationCap className="h-6 w-6" /> ESARA</Link>
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <CardTitle>Sign in to ESARA</CardTitle>
            <p className="text-sm text-muted-foreground">Admin, ICT Personnel, and Academic Staff each land on their own dashboard.</p>
          </CardHeader>
          <CardContent>
            {user ? <SignedInNotice name={user.fullName} roleLabel={roleLabel(user.role)} home={homeFor(user.role)} /> : null}
            <Suspense>
              <LoginForm />
            </Suspense>
            <p className="mt-5 text-center text-sm text-muted-foreground">
              New academic staff? <Link className="font-semibold text-primary" href="/signup">Create an account</Link>
            </p>
            <p className="mt-2 text-center text-sm"><Link className="text-muted-foreground hover:text-primary" href="/">Back to home</Link></p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
