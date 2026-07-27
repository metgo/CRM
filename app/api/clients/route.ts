import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getRepository, Client, Profile } from "@/lib/db";
import { IsNull } from "typeorm";

export async function GET() {
  const auth = await getCurrentUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientRepo = await getRepository(Client);
  const clients = await clientRepo.find({
    where: {
      organizationId: auth.payload.organizationId,
      deletedAt: IsNull(),
    },
    relations: { assignedTo: true },
    order: { createdAt: "DESC" },
  });

  // Transform to match expected format
  const result = clients.map((c) => ({
    id: c.id,
    organization_id: c.organizationId,
    name: c.name,
    status: c.status,
    region: c.region,
    address: c.address,
    website: c.website,
    notes: c.notes,
    assigned_to: c.assignedToId,
    deleted_at: c.deletedAt?.toISOString() ?? null,
    created_at: c.createdAt.toISOString(),
    updated_at: c.updatedAt.toISOString(),
    profiles: c.assignedTo ? { full_name: c.assignedTo.fullName } : null,
  }));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const auth = await getCurrentUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const clientRepo = await getRepository(Client);

  const client = clientRepo.create({
    organizationId: auth.payload.organizationId,
    name: body.name,
    status: body.status || "lead",
    region: body.region || null,
    address: body.address || null,
    website: body.website || null,
    notes: body.notes || null,
    assignedToId: body.assigned_to || null,
  });

  await clientRepo.save(client);

  return NextResponse.json({ success: true, id: client.id });
}
