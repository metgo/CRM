import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  listTeamMembers,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  type TeamMember,
} from "@/lib/auth";
import type { UserRole } from "@/lib/db";

/**
 * HTTP layer for the "users" (team) collection — deliberately separate from
 * the generic mc collection handler (lib/mc/server/handler.ts) because it's
 * backed by `profiles`, which carries passwordHash/tokenVersion that must
 * never round-trip through a generic body-driven read/write. All actual
 * logic (safe projection, password generation, the invite email) lives in
 * lib/auth/index.ts, same as every other profile-touching auth action.
 */

async function requireAuth() {
  const auth = await getCurrentUser();
  if (!auth) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;
  return { auth } as const;
}

async function requireSuperadmin() {
  const result = await requireAuth();
  if (result.error) return result;
  if (result.auth.payload.role !== "superadmin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) } as const;
  }
  return result;
}

const VALID_ROLES = new Set<UserRole>(["superadmin", "agent"]);

// Listing is open to any authenticated org member — deals/tasks/etc. all
// reference teammates as owner/assignee, so everyone needs to resolve names
// and pick from the picker, not just superadmins. Creating/editing/removing
// an actual login stays superadmin-only (see requireSuperadmin below).
export async function listTeam(): Promise<NextResponse> {
  const result = await requireAuth();
  if (result.error) return result.error;

  const members = await listTeamMembers(result.auth.payload.organizationId);
  return NextResponse.json(members);
}

export async function getTeamMember(id: string): Promise<NextResponse> {
  const result = await requireAuth();
  if (result.error) return result.error;

  const members = await listTeamMembers(result.auth.payload.organizationId);
  const member = members.find((m) => m.id === id);
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(member);
}

export async function createTeam(req: NextRequest): Promise<NextResponse> {
  const result = await requireSuperadmin();
  if (result.error) return result.error;

  const { fullName, email, role } = await req.json();
  if (!fullName || !email) {
    return NextResponse.json({ error: "Full name and email are required" }, { status: 400 });
  }
  const resolvedRole: UserRole = VALID_ROLES.has(role) ? role : "agent";

  const created = await createTeamMember(result.auth.payload.organizationId, fullName, email, resolvedRole);
  if (!created.success) {
    const status = created.error === "Email already in use" ? 409 : 500;
    return NextResponse.json({ error: created.error }, { status });
  }
  return NextResponse.json(created.member);
}

export async function updateTeam(req: NextRequest, id: string): Promise<NextResponse> {
  const result = await requireSuperadmin();
  if (result.error) return result.error;

  const body = await req.json();
  const data: { fullName?: string; email?: string; role?: UserRole } = {};
  if (typeof body.fullName === "string") data.fullName = body.fullName;
  if (typeof body.email === "string") data.email = body.email;
  if (VALID_ROLES.has(body.role)) data.role = body.role;

  const updated = await updateTeamMember(result.auth.payload.organizationId, id, data);
  if (!updated.success) {
    const status = updated.error === "Email already in use" ? 409 : 404;
    return NextResponse.json({ error: updated.error }, { status });
  }
  return NextResponse.json(updated.member);
}

export async function deleteTeam(id: string): Promise<NextResponse> {
  const result = await requireSuperadmin();
  if (result.error) return result.error;

  const deleted = await deleteTeamMember(result.auth.payload.organizationId, result.auth.user.id, id);
  if (!deleted.success) {
    const status = deleted.error === "Not found" ? 404 : 400;
    return NextResponse.json({ error: deleted.error }, { status });
  }
  return NextResponse.json({ success: true });
}

export type { TeamMember };
