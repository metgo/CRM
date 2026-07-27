import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getRepository, Communication } from "@/lib/db";

export async function GET(request: NextRequest) {
  const auth = await getCurrentUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("client_id");
  const limit = parseInt(searchParams.get("limit") || "100");

  const commRepo = await getRepository(Communication);
  const where: Record<string, unknown> = {
    organizationId: auth.payload.organizationId,
  };

  if (clientId) {
    where.clientId = clientId;
  }

  const communications = await commRepo.find({
    where,
    relations: { contact: true, user: true, client: true },
    order: { createdAt: "DESC" },
    take: limit,
  });

  const result = communications.map((c) => ({
    id: c.id,
    organization_id: c.organizationId,
    client_id: c.clientId,
    contact_id: c.contactId,
    user_id: c.userId,
    type: c.type,
    direction: c.direction,
    subject: c.subject,
    body: c.body,
    status: c.status,
    inforu_message_id: c.inforuMessageId,
    sent_at: c.sentAt?.toISOString() ?? null,
    created_at: c.createdAt.toISOString(),
    contacts: c.contact
      ? { id: c.contact.id, first_name: c.contact.firstName, last_name: c.contact.lastName }
      : null,
    profiles: c.user ? { id: c.user.id, full_name: c.user.fullName } : null,
    clients: c.client ? { id: c.client.id, name: c.client.name } : null,
  }));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const auth = await getCurrentUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const commRepo = await getRepository(Communication);

  const communication = commRepo.create({
    organizationId: auth.payload.organizationId,
    clientId: body.client_id,
    contactId: body.contact_id || null,
    userId: auth.payload.userId,
    type: body.type,
    direction: body.direction || "outbound",
    subject: body.subject || null,
    body: body.body,
    status: body.status || "logged",
    sentAt: body.sent_at ? new Date(body.sent_at) : new Date(),
  });

  await commRepo.save(communication);

  return NextResponse.json({ success: true, id: communication.id });
}
