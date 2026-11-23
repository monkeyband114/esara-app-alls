import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse } from "@/lib/api-error";
import { recalculateInstitutionMetrics } from "@/lib/recalculate";
import { logAudit, registerAcademicStaff, roleLabel } from "@/lib/repository";
import { requireApiUser } from "@/lib/session";

const createSchema = z.object({
  fullName: z.string().trim().min(3, "Enter the full name."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  role: z.enum(["SUPER_ADMIN", "ICT_PERSONNEL", "ACADEMIC_STAFF"]),
  department: z.string().trim().min(2, "Choose a department."),
  faculty: z.string().trim().min(2).default("Faculty of Computing"),
  institution: z.string().trim().min(2, "Enter the institution."),
  researchArea: z.string().trim().optional()
});

/** Admin-only: create an account with any role (public signup only creates academic staff). */
export async function POST(request: Request) {
  try {
    const auth = await requireApiUser(["SUPER_ADMIN"]);
    if (auth.response) return auth.response;
    const parsed = createSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid account details." }, { status: 400 });

    const user = await registerAcademicStaff({ ...parsed.data, researchArea: parsed.data.researchArea || "Not specified" });
    if (user.role === "ACADEMIC_STAFF") await recalculateInstitutionMetrics();
    await logAudit(`Created ${roleLabel(user.role)} account for ${user.fullName} (${user.email})`, auth.user.id);
    return NextResponse.json({ userId: user.id }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("already exists")) return NextResponse.json({ error: error.message }, { status: 409 });
    return apiErrorResponse(error, "Could not create the account.");
  }
}
