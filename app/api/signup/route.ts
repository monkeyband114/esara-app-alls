import { NextResponse } from "next/server";
import { z } from "zod";
import { runAcademicDiscovery } from "@/lib/discovery";
import { registerAcademicStaff } from "@/lib/repository";

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
  const parsed = signupSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid signup details." }, { status: 400 });
  try {
    const user = await registerAcademicStaff(parsed.data);
    const result = await runAcademicDiscovery(user);
    return NextResponse.json({ userId: user.id, mode: result.status, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Signup failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
