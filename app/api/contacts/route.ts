import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getRepository, Contact } from "@/lib/db";
import { IsNull } from "typeorm";

export async function GET(request: NextRequest) {
  const auth = await getCurrentUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("client_id");

  const contactRepo = await getRepository(Contact);
  const where: Record<string, unknown> = {
    organizationId: auth.payload.organizationId,
    deletedAt: IsNull(),
  };

  if (clientId) {
    where.clientId = clientId;
  }

  const contacts = await contactRepo.find({
    where,
    order: { isPrimary: "DESC", createdAt: "DESC" },
  });

  const result = contacts.map((c) => ({
    id: c.id,
    organization_id: c.organizationId,
    client_id: c.clientId,
    first_name: c.firstName,
    last_name: c.lastName,
    role_title: c.roleTitle,
    phone: c.phone,
    email: c.email,
    whatsapp: c.whatsapp,
    is_primary: c.isPrimary,
    notes: c.notes,
    deleted_at: c.deletedAt?.toISOString() ?? null,
    created_at: c.createdAt.toISOString(),
    updated_at: c.updatedAt.toISOString(),
  }));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const auth = await getCurrentUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const contactRepo = await getRepository(Contact);

  const contact = contactRepo.create({
    organizationId: auth.payload.organizationId,
    clientId: body.client_id,
    firstName: body.first_name,
    lastName: body.last_name,
    roleTitle: body.role_title || null,
    phone: body.phone || null,
    email: body.email || null,
    whatsapp: body.whatsapp || null,
    isPrimary: body.is_primary || false,
    notes: body.notes || null,
  });

  await contactRepo.save(contact);

  return NextResponse.json({ success: true, id: contact.id });
}
