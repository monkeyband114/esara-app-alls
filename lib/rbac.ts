import type { Role } from "@/lib/types";

const permissions: Record<Role, string[]> = {
  SUPER_ADMIN: ["users:manage", "publications:delete", "settings:manage", "reports:export", "all:read"],
  ICT_PERSONNEL: ["publications:verify", "publications:import", "reports:export", "repository:manage"],
  ACADEMIC_STAFF: ["profile:read", "review:request", "portfolio:download"]
};

export function can(role: Role | undefined, permission: string) {
  if (!role) return false;
  return permissions[role].includes(permission) || permissions[role].includes("all:read");
}
