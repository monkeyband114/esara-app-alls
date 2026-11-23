import { after, NextResponse } from "next/server";
import { z } from "zod";
import { runAcademicDiscovery } from "@/lib/discovery";
import { logAudit, registerAcademicStaff } from "@/lib/repository";

// OpenAlex discovery keeps running after the response is sent, up to this limit.
export const maxDuration = 60;

const signupSchema = z.object({
  fullName: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
  faculty: z.string().min(2),
  department: z.string().min(2),
  institution: z.string().min(2),
  orcidId: z.string().optional(),
  googleScholarUrl: z.string().optional(),
  researchArea: z.string().min(2),
  profilePhoto: z.string().optional()
})
  .refine((data) => data.password === data.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match." })
  .refine((data) => data.faculty === "Faculty of Computing", { path: ["faculty"], message: "Faculty must be Faculty of Computing." })
  .refine((data) => ["Computer Science", "Information Technology", "Cybersecurity"].includes(data.department), {
    path: ["department"],
    message: "Department must be Computer Science, Information Technology, or Cybersecurity."
  });

export async function POST(request: Request) {
  const parsed = signupSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid signup details." }, { status: 400 });
  try {
    const user = await registerAcademicStaff(parsed.data);
    // Discovery makes several OpenAlex calls; run it after responding so signup is instant and cannot time out.
    after(async () => {
      try {
        await runAcademicDiscovery(user);
      } catch (error) {
        console.error("[signup] OpenAlex discovery failed", error);
        await logAudit(`Signup discovery for ${user.fullName} failed; publications can be imported from the dashboard`, "system").catch(() => {});
      }
    });
    return NextResponse.json({ userId: user.id }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Signup failed.";
    return NextResponse.json({ error: message }, { status: message.includes("already exists") ? 409 : 400 });
  }
}
