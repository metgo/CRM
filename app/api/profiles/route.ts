import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getRepository, Profile } from "@/lib/db";

export async function GET() {
  const auth = await getCurrentUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profileRepo = await getRepository(Profile);
  const profiles = await profileRepo.find({
    where: {
      organizationId: auth.payload.organizationId,
    },
    order: { fullName: "ASC" },
  });

  const result = profiles.map((p) => ({
    id: p.id,
    organization_id: p.organizationId,
    full_name: p.fullName,
    email: p.email,
    role: p.role,
    created_at: p.createdAt.toISOString(),
    updated_at: p.updatedAt.toISOString(),
  }));

  return NextResponse.json(result);
}
