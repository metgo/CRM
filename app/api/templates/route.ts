import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getRepository, Template } from "@/lib/db";

export async function GET(request: NextRequest) {
  const auth = await getCurrentUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  const templateRepo = await getRepository(Template);
  const where: Record<string, unknown> = {
    organizationId: auth.payload.organizationId,
  };

  if (type) {
    where.type = type;
  }

  const templates = await templateRepo.find({
    where,
    order: { createdAt: "DESC" },
  });

  const result = templates.map((t) => ({
    id: t.id,
    organization_id: t.organizationId,
    name: t.name,
    type: t.type,
    subject: t.subject,
    body: t.body,
    variables: t.variables,
    created_by: t.createdById,
    created_at: t.createdAt.toISOString(),
    updated_at: t.updatedAt.toISOString(),
  }));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const auth = await getCurrentUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const templateRepo = await getRepository(Template);

  const template = templateRepo.create({
    organizationId: auth.payload.organizationId,
    name: body.name,
    type: body.type,
    subject: body.subject || null,
    body: body.body,
    variables: body.variables || [],
    createdById: auth.payload.userId,
  });

  await templateRepo.save(template);

  return NextResponse.json({ success: true, id: template.id });
}
