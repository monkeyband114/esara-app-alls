import "server-only";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getUser } from "@/lib/repository";
import type { Role, User } from "@/lib/types";

export const ROLE_HOME: Record<Role, string> = {
  SUPER_ADMIN: "/dashboard/admin",
  ICT_PERSONNEL: "/dashboard/ict",
  ACADEMIC_STAFF: "/dashboard/staff"
};

export function homeFor(role: Role | undefined) {
  return role ? ROLE_HOME[role] : "/login";
}

/**
 * The signed-in user, loaded fresh from the database so deleted or suspended accounts lose access
 * immediately and role changes apply without waiting for the session token to expire.
 */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const user = await getUser(session.user.id);
  if (!user || user.suspended) return null;
  return user;
}

/** For pages: sends signed-out users to /login and users without the right role to their own dashboard. */
export async function requirePageUser(roles?: Role[]) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (roles && !roles.includes(user.role)) redirect(homeFor(user.role));
  return user;
}

type ApiAuth = { user: User; response?: undefined } | { user?: undefined; response: NextResponse };

/** For API routes: returns the user, or a 401/403 JSON response to send back. */
export async function requireApiUser(roles?: Role[]): Promise<ApiAuth> {
  const user = await getCurrentUser();
  if (!user) return { response: NextResponse.json({ error: "Please sign in again." }, { status: 401 }) };
  if (roles && !roles.includes(user.role)) return { response: NextResponse.json({ error: "You do not have permission to do that." }, { status: 403 }) };
  return { user };
}

/**
 * Resolves which staff member an OpenAlex action applies to. Academic staff can only act on their own profile;
 * ICT personnel and admins can act on any academic staff member.
 */
export async function resolveTargetStaff(actor: User, requestedUserId?: string) {
  if (actor.role === "ACADEMIC_STAFF") {
    if (requestedUserId && requestedUserId !== actor.id) return { error: "You can only manage your own publications.", status: 403 } as const;
    return { target: actor } as const;
  }
  if (!requestedUserId) return { error: "Choose an academic staff member.", status: 400 } as const;
  const target = await getUser(requestedUserId);
  if (!target || target.role !== "ACADEMIC_STAFF") return { error: "Academic staff member not found.", status: 404 } as const;
  return { target } as const;
}
