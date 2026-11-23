"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Trash2, UserCheck, UserX } from "lucide-react";
import { callApi } from "@/lib/client-api";
import type { Role } from "@/lib/types";

const ROLES: { value: Role; label: string }[] = [
  { value: "ACADEMIC_STAFF", label: "Academic Staff" },
  { value: "ICT_PERSONNEL", label: "ICT Personnel" },
  { value: "SUPER_ADMIN", label: "Super Admin" }
];

const actionClass =
  "inline-flex h-8 items-center gap-1 rounded-md border bg-white px-2 text-xs font-semibold text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50";

export function AdminUserControls({ user, isSelf }: { user: { id: string; fullName: string; role: Role; suspended?: boolean }; isSelf: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);

  async function run(request: Promise<{ ok: boolean; body: { error?: string } }>, success: string) {
    setBusy(true);
    setMessage(null);
    const { ok, body } = await request;
    setBusy(false);
    setMessage({ error: !ok, text: ok ? success : body.error ?? "Something went wrong." });
    if (ok) router.refresh();
  }

  const url = `/api/admin/users/${encodeURIComponent(user.id)}`;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label={`Role for ${user.fullName}`}
          className="h-8 rounded-md border bg-white px-2 text-xs"
          value={user.role}
          disabled={busy || isSelf}
          onChange={(event) => run(callApi(url, { method: "PATCH", body: { role: event.target.value } }), "Role updated.")}
        >
          {ROLES.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
        </select>
        <button
          type="button"
          className={actionClass}
          disabled={busy || isSelf}
          onClick={() => run(callApi(url, { method: "PATCH", body: { suspended: !user.suspended } }), user.suspended ? "Account activated." : "Account suspended.")}
        >
          {user.suspended ? <><UserCheck className="h-3.5 w-3.5" /> Activate</> : <><UserX className="h-3.5 w-3.5" /> Suspend</>}
        </button>
        <button
          type="button"
          className={actionClass}
          disabled={busy}
          onClick={() => {
            const password = window.prompt(`New password for ${user.fullName} (at least 8 characters):`);
            if (password) run(callApi(url, { method: "PATCH", body: { password } }), "Password reset. Share the new password with the user securely.");
          }}
        >
          <KeyRound className="h-3.5 w-3.5" /> Reset password
        </button>
        <button
          type="button"
          className={`${actionClass} text-danger`}
          disabled={busy || isSelf}
          onClick={() => {
            if (window.confirm(`Delete ${user.fullName} and all of their publications? This cannot be undone.`)) run(callApi(url, { method: "DELETE" }), "Account deleted.");
          }}
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </button>
      </div>
      {message ? <p className={`text-xs ${message.error ? "text-danger" : "text-success"}`}>{message.text}</p> : null}
      {isSelf ? <p className="text-xs text-muted-foreground">This is your account.</p> : null}
    </div>
  );
}
