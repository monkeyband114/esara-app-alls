import Link from "next/link";
import { SignupForm } from "@/components/signup-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm font-semibold text-primary">ESARA</Link>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Academic Staff Registration</CardTitle>
            <p className="text-sm text-muted-foreground">Public registration creates Academic Staff accounts only. ESARA starts automatic research profile discovery after signup.</p>
          </CardHeader>
          <CardContent>
            <SignupForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
