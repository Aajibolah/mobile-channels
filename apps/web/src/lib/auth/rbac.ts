import type { Role } from "@prisma/client";

const rankByRole: Record<Role, number> = {
  VIEWER: 1,
  ANALYST: 2,
  ADMIN: 3,
  OWNER: 4,
};

export function hasRequiredRole(currentRole: Role, requiredRole: Role): boolean {
  return rankByRole[currentRole] >= rankByRole[requiredRole];
}

