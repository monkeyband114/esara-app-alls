"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const demoAccounts = [
  { label: "Admin", email: "admin@esara.edu", password: "Admin123@" },
  { label: "ICT Personnel", email: "ict@esara.edu", password: "ICT123@" },
  { label: "Academic Staff", email: "arnold.ojugo@esara.edu", password: "Staff123@" },
  { label: "Academic Staff", email: "maureen.akazwe@esara.edu", password: "Staff123@" },
  { label: "Academic Staff", email: "patrick.ejeh@esara.edu", password: "Staff123@" }
];

/** Only follow callback URLs on this site, so a crafted link cannot bounce users elsewhere after login. */
function safeCallback(value: string | null) {
  if (!value) return "/dashboard/entry";
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin || url.pathname.startsWith("/login")) return "/dashboard/entry";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/dashboard/entry";
  }
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(searchParams.get("error") ? "Invalid email or password." : "");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", { email: email.trim(), password, redirect: false });
    if (!result?.ok) {
      setLoading(false);
      setError("Invalid email or password, or the account is suspended.");
      return;
    }
    // Full page load so no page rendered for a previous account survives in the client cache.
    window.location.assign(safeCallback(searchParams.get("callbackUrl")));
  }

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Email</span>
          <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" name="email" autoComplete="username" required />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Password</span>
          <Input value={password} onChange={(event) => setPassword(event.target.value)} type="password" name="password" autoComplete="current-password" required />
        </label>
        {error ? <p role="alert" className="text-sm font-medium text-danger">{error}</p> : null}
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
                className="flex w-full items-center justify-between gap-3 rounded border bg-white px-3 py-2 text-left text-xs hover:bg-muted"
              >
                <span className="min-w-0"><span className="font-semibold">{account.label}</span><br /><span className="break-all">{account.email}</span></span>
                <span className="shrink-0 font-mono">{account.password}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
