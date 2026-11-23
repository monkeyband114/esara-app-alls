"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

/** Shown on login/signup when a session already exists, so it is clear which account is active. */
export function SignedInNotice({ name, roleLabel, home }: { name: string; roleLabel: string; home: string }) {
  return (
    <div className="mb-5 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
      <p>
        You are signed in as <span className="font-semibold">{name}</span> ({roleLabel}).
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link href={home} className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">Continue to dashboard</Link>
        <button type="button" onClick={() => signOut({ callbackUrl: "/login" })} className="rounded-md bg-white px-3 py-2 text-xs font-semibold text-primary ring-1 ring-border">
          Sign out to use another account
        </button>
      </div>
    </div>
  );
}
