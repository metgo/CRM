import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getRepository, Reminder } from "@/lib/db";
import { LessThan, MoreThanOrEqual, LessThanOrEqual, And } from "typeorm";

export async function GET(request: NextRequest) {
  const auth = await getCurrentUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("client_id");
  const filter = searchParams.get("filter"); // 'overdue', 'upcoming', 'all'

  const reminderRepo = await getRepository(Reminder);
  const now = new Date();
  const in48h = new Date(Date.now() + 48 * 60 * 60 * 1000);

  let where: Record<string, unknown> = {
    organizationId: auth.payload.organizationId,
    isDone: false,
  };

  if (clientId) {
    where.clientId = clientId;
  }

  if (filter === "overdue") {
    where.dueAt = LessThan(now);
  } else if (filter === "upcoming") {
    where.dueAt = And(MoreThanOrEqual(now), LessThanOrEqual(in48h));
  }

  const reminders = await reminderRepo.find({
    where,
    relations: { client: true },
    order: { dueAt: "ASC" },
  });

  const result = reminders.map((r) => ({
    id: r.id,
    organization_id: r.organizationId,
    user_id: r.userId,
    client_id: r.clientId,
    title: r.title,
    notes: r.notes,
    due_at: r.dueAt.toISOString(),
    is_done: r.isDone,
    done_at: r.doneAt?.toISOString() ?? null,
    created_at: r.createdAt.toISOString(),
    updated_at: r.updatedAt.toISOString(),
    clients: r.client ? { id: r.client.id, name: r.client.name } : null,
  }));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const auth = await getCurrentUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const reminderRepo = await getRepository(Reminder);

  const reminder = reminderRepo.create({
    organizationId: auth.payload.organizationId,
    userId: auth.payload.userId,
    clientId: body.client_id || null,
    title: body.title,
    notes: body.notes || null,
    dueAt: new Date(body.due_at),
  });

  await reminderRepo.save(reminder);

  return NextResponse.json({ success: true, id: reminder.id });
}
