import { headers } from "next/headers";
import { auth, type Session, type User } from "@/lib/auth";

export interface AuthContext {
  session: Session["session"] | null;
  user: User | null;
}

/**
 * Resolves the authenticated session and user from Next.js request headers.
 */
export async function getServerAuth(): Promise<AuthContext> {
  try {
    const requestHeaders = await headers();
    const session = await auth.api.getSession({
      headers: requestHeaders,
    });

    if (!session) {
      return { session: null, user: null };
    }

    return {
      session: session.session,
      user: session.user as User,
    };
  } catch (error) {
    console.error("Error resolving server auth session:", error);
    return { session: null, user: null };
  }
}

/**
 * Requires an authenticated user session.
 * Optionally checks if the user has one of the required roles.
 */
export async function requireAuth(allowedRoles?: string[]): Promise<{
  session: Session["session"];
  user: User;
}> {
  const { session, user } = await getServerAuth();

  if (!session || !user) {
    throw new Error("Unauthorized: Active session required.");
  }

  const userRole = (user.role || "maker").toLowerCase();

  if (allowedRoles && allowedRoles.length > 0) {
    const isAllowed = allowedRoles.some(
      (role) => role.toLowerCase() === userRole || userRole === "admin"
    );
    if (!isAllowed) {
      throw new Error(
        `Forbidden: Role '${userRole}' does not have permission for this action.`
      );
    }
  }

  return { session, user };
}

/**
 * Checks if the user is authorized to create or draft vouchers.
 */
export function canCreateVoucher(role?: string): boolean {
  const r = (role || "maker").toLowerCase();
  return r === "maker" || r === "admin";
}

/**
 * Checks if the user is authorized to approve or reject vouchers.
 */
export function canApproveVoucher(role?: string): boolean {
  const r = (role || "").toLowerCase();
  return r === "approver" || r === "admin";
}

/**
 * Checks if the user is authorized to mark vouchers as paid.
 */
export function canMarkPaid(role?: string): boolean {
  const r = (role || "").toLowerCase();
  return r === "approver" || r === "admin" || r === "maker";
}
