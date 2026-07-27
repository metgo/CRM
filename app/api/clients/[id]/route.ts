import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getRepository, Client } from "@/lib/db";
import { IsNull } from "typeorm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const auth = await getCurrentUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientRepo = await getRepository(Client);
  const client = await clientRepo.findOne({
    where: {
      id,
      organizationId: auth.payload.organizationId,
      deletedAt: IsNull(),
    },
    relations: { assignedTo: true },
  });

  if (!client) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: client.id,
    organization_id: client.organizationId,
    name: client.name,
    status: client.status,
    region: client.region,
    address: client.address,
    website: client.website,
    notes: client.notes,
    assigned_to: client.assignedToId,
    deleted_at: client.deletedAt?.toISOString() ?? null,
    created_at: client.createdAt.toISOString(),
    updated_at: client.updatedAt.toISOString(),
    profiles: client.assignedTo ? { full_name: client.assignedTo.fullName } : null,
  });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const auth = await getCurrentUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const clientRepo = await getRepository(Client);

  const client = await clientRepo.findOne({
    where: {
      id,
      organizationId: auth.payload.organizationId,
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  clientRepo.merge(client, {
    name: body.name ?? client.name,
    status: body.status ?? client.status,
    region: body.region !== undefined ? body.region : client.region,
    address: body.address !== undefined ? body.address : client.address,
    website: body.website !== undefined ? body.website : client.website,
    notes: body.notes !== undefined ? body.notes : client.notes,
    assignedToId: body.assigned_to !== undefined ? body.assigned_to : client.assignedToId,
  });

  await clientRepo.save(client);

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const auth = await getCurrentUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientRepo = await getRepository(Client);

  const client = await clientRepo.findOne({
    where: {
      id,
      organizationId: auth.payload.organizationId,
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Soft delete
  client.deletedAt = new Date();
  await clientRepo.save(client);

  return NextResponse.json({ success: true });
}
