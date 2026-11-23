"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { callApi } from "@/lib/client-api";

const selectClass = "h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/25";

export function AdminCreateUserForm({ institution }: { institution: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    setLoading(true);
    const { ok, body } = await callApi("/api/admin/users", { body: payload });
    setLoading(false);
    if (!ok) return setError(body.error ?? "Could not create the account.");
    router.push("/dashboard/admin?created=1");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
      <label>
        <span className="mb-1 block text-sm font-medium">Full Name</span>
        <Input name="fullName" required minLength={3} />
      </label>
      <label>
        <span className="mb-1 block text-sm font-medium">Email</span>
        <Input name="email" type="email" required autoComplete="off" />
      </label>
      <label>
        <span className="mb-1 block text-sm font-medium">Temporary Password</span>
        <Input name="password" type="password" required minLength={8} autoComplete="new-password" />
      </label>
      <label>
        <span className="mb-1 block text-sm font-medium">Role</span>
        <select name="role" className={selectClass} defaultValue="ACADEMIC_STAFF">
          <option value="ACADEMIC_STAFF">Academic Staff</option>
          <option value="ICT_PERSONNEL">ICT Personnel</option>
          <option value="SUPER_ADMIN">Super Admin</option>
        </select>
      </label>
      <label>
        <span className="mb-1 block text-sm font-medium">Department</span>
        <select name="department" className={selectClass} required>
          <option>Computer Science</option>
          <option>Information Technology</option>
          <option>Cybersecurity</option>
        </select>
      </label>
      <label>
        <span className="mb-1 block text-sm font-medium">Institution</span>
        <Input name="institution" defaultValue={institution} required />
      </label>
      <label className="md:col-span-2">
        <span className="mb-1 block text-sm font-medium">Research Area (academic staff)</span>
        <Input name="researchArea" placeholder="e.g. Machine Learning" />
      </label>
      <input type="hidden" name="faculty" value="Faculty of Computing" />
      {error ? <p role="alert" className="text-sm font-medium text-danger md:col-span-2">{error}</p> : null}
      <div className="flex flex-col gap-2 sm:flex-row md:col-span-2">
        <Button disabled={loading}>
          <UserPlus className="h-4 w-4" />
          {loading ? "Creating account..." : "Create Account"}
        </Button>
        <Button type="button" className="bg-white text-primary ring-1 ring-border" onClick={() => router.push("/dashboard/admin")}>Cancel</Button>
      </div>
    </form>
  );
}
