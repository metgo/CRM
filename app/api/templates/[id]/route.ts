import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getRepository, Template } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const auth = await getCurrentUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const templateRepo = await getRepository(Template);
  const template = await templateRepo.findOne({
    where: {
      id,
      organizationId: auth.payload.organizationId,
    },
  });

  if (!template) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: template.id,
    organization_id: template.organizationId,
    name: template.name,
    type: template.type,
    subject: template.subject,
    body: template.body,
    variables: template.variables,
    created_by: template.createdById,
    created_at: template.createdAt.toISOString(),
    updated_at: template.updatedAt.toISOString(),
  });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const auth = await getCurrentUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const templateRepo = await getRepository(Template);

  const template = await templateRepo.findOne({
    where: {
      id,
      organizationId: auth.payload.organizationId,
    },
  });

  if (!template) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  templateRepo.merge(template, {
    name: body.name ?? template.name,
    type: body.type ?? template.type,
    subject: body.subject !== undefined ? body.subject : template.subject,
    body: body.body ?? template.body,
    variables: body.variables ?? template.variables,
  });

  await templateRepo.save(template);

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const auth = await getCurrentUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const templateRepo = await getRepository(Template);

  const template = await templateRepo.findOne({
    where: {
      id,
      organizationId: auth.payload.organizationId,
    },
  });

  if (!template) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await templateRepo.remove(template);

  return NextResponse.json({ success: true });
}
