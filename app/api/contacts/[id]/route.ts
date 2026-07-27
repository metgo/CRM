import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getRepository, Contact } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const auth = await getCurrentUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contactRepo = await getRepository(Contact);
  const contact = await contactRepo.findOne({
    where: {
      id,
      organizationId: auth.payload.organizationId,
    },
  });

  if (!contact) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: contact.id,
    organization_id: contact.organizationId,
    client_id: contact.clientId,
    first_name: contact.firstName,
    last_name: contact.lastName,
    role_title: contact.roleTitle,
    phone: contact.phone,
    email: contact.email,
    whatsapp: contact.whatsapp,
    is_primary: contact.isPrimary,
    notes: contact.notes,
    deleted_at: contact.deletedAt?.toISOString() ?? null,
    created_at: contact.createdAt.toISOString(),
    updated_at: contact.updatedAt.toISOString(),
  });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const auth = await getCurrentUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const contactRepo = await getRepository(Contact);

  const contact = await contactRepo.findOne({
    where: {
      id,
      organizationId: auth.payload.organizationId,
    },
  });

  if (!contact) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  contactRepo.merge(contact, {
    firstName: body.first_name ?? contact.firstName,
    lastName: body.last_name ?? contact.lastName,
    roleTitle: body.role_title !== undefined ? body.role_title : contact.roleTitle,
    phone: body.phone !== undefined ? body.phone : contact.phone,
    email: body.email !== undefined ? body.email : contact.email,
    whatsapp: body.whatsapp !== undefined ? body.whatsapp : contact.whatsapp,
    isPrimary: body.is_primary !== undefined ? body.is_primary : contact.isPrimary,
    notes: body.notes !== undefined ? body.notes : contact.notes,
  });

  await contactRepo.save(contact);

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const auth = await getCurrentUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contactRepo = await getRepository(Contact);

  const contact = await contactRepo.findOne({
    where: {
      id,
      organizationId: auth.payload.organizationId,
    },
  });

  if (!contact) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Soft delete
  contact.deletedAt = new Date();
  await contactRepo.save(contact);

  return NextResponse.json({ success: true });
}
