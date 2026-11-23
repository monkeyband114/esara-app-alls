import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse } from "@/lib/api-error";
import { recalculateInstitutionMetrics } from "@/lib/recalculate";
import { deleteUser, getUser, logAudit, roleLabel, updateUser } from "@/lib/repository";
import { requireApiUser } from "@/lib/session";

const patchSchema = z
  .object({
    role: z.enum(["SUPER_ADMIN", "ICT_PERSONNEL", "ACADEMIC_STAFF"]).optional(),
    suspended: z.boolean().optional(),
    password: z.string().min(8, "Password must be at least 8 characters.").optional()
  })
  .refine((data) => data.role !== undefined || data.suspended !== undefined || data.password !== undefined, "Nothing to change.");

/** Admin-only: assign role, suspend/activate, or reset password. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireApiUser(["SUPER_ADMIN"]);
    if (auth.response) return auth.response;
    const { id } = await params;
    const parsed = patchSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid change." }, { status: 400 });
    if (id === auth.user.id && (parsed.data.suspended || (parsed.data.role && parsed.data.role !== "SUPER_ADMIN"))) {
      return NextResponse.json({ error: "You cannot suspend yourself or remove your own admin role." }, { status: 400 });
    }

    const user = await updateUser(id, parsed.data);
    if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });
    if (parsed.data.role !== undefined) await recalculateInstitutionMetrics();
    const changes = [
      parsed.data.role ? `role set to ${roleLabel(parsed.data.role)}` : null,
      parsed.data.suspended === undefined ? null : parsed.data.suspended ? "suspended" : "activated",
      parsed.data.password ? "password reset" : null
    ].filter(Boolean);
    await logAudit(`Updated ${user.fullName}: ${changes.join(", ")}`, auth.user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error, "Could not update the account.");
  }
}

/** Admin-only: delete an account and its publications. */
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireApiUser(["SUPER_ADMIN"]);
    if (auth.response) return auth.response;
    const { id } = await params;
    if (id === auth.user.id) return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
    const user = await getUser(id);
    if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

    const removedPublications = await deleteUser(id);
    await recalculateInstitutionMetrics();
    await logAudit(`Deleted ${roleLabel(user.role)} account ${user.fullName} (${user.email}) and ${removedPublications} publications`, auth.user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error, "Could not delete the account.");
  }
}
