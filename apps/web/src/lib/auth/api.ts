import type { Role } from "@prisma/client";
import { getActiveMembership, getSessionContext } from "@/lib/auth/session";
import { hasRequiredRole } from "@/lib/auth/rbac";

export async function getApiAuthContext(requiredRole: Role = "VIEWER") {
  const session = await getSessionContext();
  if (!session) return null;

  const membership = await getActiveMembership(session.user.id);
  if (!membership) return null;

  if (!hasRequiredRole(membership.role, requiredRole)) return null;

  return {
    session,
    membership,
  };
}

