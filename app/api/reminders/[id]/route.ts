import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getRepository, Reminder } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const auth = await getCurrentUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const reminderRepo = await getRepository(Reminder);

  const reminder = await reminderRepo.findOne({
    where: {
      id,
      organizationId: auth.payload.organizationId,
    },
  });

  if (!reminder) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  reminderRepo.merge(reminder, {
    title: body.title ?? reminder.title,
    notes: body.notes !== undefined ? body.notes : reminder.notes,
    dueAt: body.due_at ? new Date(body.due_at) : reminder.dueAt,
    isDone: body.is_done !== undefined ? body.is_done : reminder.isDone,
    doneAt: body.is_done ? new Date() : reminder.doneAt,
  });

  await reminderRepo.save(reminder);

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const auth = await getCurrentUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reminderRepo = await getRepository(Reminder);

  const reminder = await reminderRepo.findOne({
    where: {
      id,
      organizationId: auth.payload.organizationId,
    },
  });

  if (!reminder) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await reminderRepo.remove(reminder);

  return NextResponse.json({ success: true });
}
