"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const demoAccounts = [
  { label: "Admin", email: "admin@esara.edu", password: "Admin123@", route: "/dashboard/admin" },
  { label: "ICT Personnel", email: "ict@esara.edu", password: "ICT123@", route: "/dashboard/ict" },
  { label: "Academic Staff", email: "arnold.ojugo@esara.edu", password: "Staff123@", route: "/dashboard/staff" },
  { label: "Academic Staff", email: "maureen.akazwe@esara.edu", password: "Staff123@", route: "/dashboard/staff" },
  { label: "Academic Staff", email: "patrick.ejeh@esara.edu", password: "Staff123@", route: "/dashboard/staff" }
];

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@esara.edu");
  const [password, setPassword] = useState("Admin123@");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (!result?.ok) {
      setError("Invalid email or password.");
      return;
    }
    router.push("/dashboard/entry");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="space-y-4">
        <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" aria-label="Email" />
        <Input value={password} onChange={(event) => setPassword(event.target.value)} type="password" aria-label="Password" />
        {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
        <Button className="w-full" disabled={loading}>
          <LogIn className="h-4 w-4" />
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
      {process.env.NODE_ENV !== "production" ? (
        <div className="rounded-lg border bg-muted/35 p-3">
          <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Development demo accounts</p>
          <div className="space-y-2">
            {demoAccounts.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => {
                  setEmail(account.email);
                  setPassword(account.password);
                }}
                className="flex w-full items-center justify-between rounded border bg-white px-3 py-2 text-left text-xs hover:bg-muted"
              >
                <span><span className="font-semibold">{account.label}</span><br />{account.email}</span>
                <span className="font-mono">{account.password}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
