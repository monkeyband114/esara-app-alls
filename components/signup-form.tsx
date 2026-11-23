"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { callApi } from "@/lib/client-api";

const fields = [
  ["fullName", "Full Name", "text"],
  ["email", "Email", "email"],
  ["password", "Password", "password"],
  ["confirmPassword", "Confirm Password", "password"],
  ["institution", "Institution", "text"],
  ["orcidId", "ORCID ID (Optional)", "text"],
  ["googleScholarUrl", "Google Scholar Profile URL (Optional)", "url"],
  ["researchArea", "Research Area", "text"],
  ["profilePhoto", "Profile Photo URL or Initials (Optional)", "text"]
];

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    if (payload.password !== payload.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { ok, body } = await callApi("/api/signup", { body: payload });
    if (!ok) {
      setLoading(false);
      setError(body.error ?? "Could not create account.");
      return;
    }
    // Sign the new account in (replacing any previous session) so the dashboard opens straight away.
    const result = await signIn("credentials", { email: String(payload.email).trim(), password: String(payload.password), redirect: false });
    if (!result?.ok) {
      setLoading(false);
      router.push("/login");
      return;
    }
    window.location.assign("/onboarding");
  }

  return (
    <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
      {fields.map(([name, label, type]) => (
        <label key={name} className={name === "profilePhoto" || name === "researchArea" ? "md:col-span-2" : ""}>
          <span className="mb-1 block text-sm font-medium">{label}</span>
          <Input name={name} type={type} required={!label.includes("Optional")} />
        </label>
      ))}
      <label>
        <span className="mb-1 block text-sm font-medium">Faculty</span>
        <Input name="faculty" value="Faculty of Computing" readOnly />
      </label>
      <label>
        <span className="mb-1 block text-sm font-medium">Department</span>
        <select name="department" required className="h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/25">
          <option>Computer Science</option>
          <option>Information Technology</option>
          <option>Cybersecurity</option>
        </select>
      </label>
      <label className="md:col-span-2">
        <span className="mb-1 block text-sm font-medium">Role</span>
        <Input value="Academic Staff" disabled />
      </label>
      {error ? <p className="text-sm font-medium text-danger md:col-span-2">{error}</p> : null}
      <div className="md:col-span-2">
        <Button className="w-full" disabled={loading}>
          <UserPlus className="h-4 w-4" />
          {loading ? "Creating profile..." : "Create Academic Profile"}
        </Button>
      </div>
    </form>
  );
}
