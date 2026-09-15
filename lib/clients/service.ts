import { NextRequest, NextResponse } from "next/server";
import { IsNull } from "typeorm";
import { getCurrentUser } from "@/lib/auth";
import { getRepository, Client } from "@/lib/db";

/**
 * Shared CRUD for the `clients` table. `Client.type` already distinguishes
 * authorities from other client types, so /api/authorities is a thin wrapper
 * over the same rows (defaulting `type` to "authority") rather than a
 * separate entity/table.
 */

async function repo() {
  return getRepository(Client);
}

const READ_ONLY_KEYS = ["id", "organizationId", "createdAt", "updatedAt", "deletedAt"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function omitReadOnly(body: Record<string, any>): Record<string, any> {
  const out = { ...body };
  for (const key of READ_ONLY_KEYS) delete out[key];
  return out;
}

export async function listClients(req: NextRequest, defaultType?: string) {
  const auth = await getCurrentUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? defaultType;
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const qb = (await repo())
    .createQueryBuilder("client")
    .where("client.organizationId = :organizationId", {
      organizationId: auth.payload.organizationId,
    })
    .andWhere("client.deletedAt IS NULL");

  if (type) qb.andWhere("client.type = :type", { type });
  if (status) qb.andWhere("client.status = :status", { status });
  if (search) {
    qb.andWhere(
      "(client.name ILIKE :search OR client.nameHe ILIKE :search OR client.nameEn ILIKE :search)",
      { search: `%${search}%` }
    );
  }

  const rows = await qb.orderBy("client.createdAt", "DESC").getMany();
  return NextResponse.json(rows);
}

export async function createClient(req: NextRequest, defaultType?: string) {
  const auth = await getCurrentUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const rest = omitReadOnly(body ?? {});

  const nameHe = rest.nameHe ?? null;
  const nameEn = rest.nameEn ?? null;
  const name = rest.name ?? nameHe ?? nameEn;

  if (!name) {
    return NextResponse.json({ error: "A name is required" }, { status: 400 });
  }

  const clientRepo = await repo();
  const entity = clientRepo.create({
    ...rest,
    name,
    nameHe,
    nameEn,
    type: rest.type ?? defaultType,
    status: rest.status ?? "lead",
    organizationId: auth.payload.organizationId,
  });

  const saved = await clientRepo.save(entity);
  return NextResponse.json(saved, { status: 201 });
}

export async function getClient(_req: NextRequest, id: string) {
  const auth = await getCurrentUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const row = await (await repo()).findOne({
    where: { id, organizationId: auth.payload.organizationId, deletedAt: IsNull() },
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function updateClient(req: NextRequest, id: string) {
  const auth = await getCurrentUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientRepo = await repo();
  const row = await clientRepo.findOne({
    where: { id, organizationId: auth.payload.organizationId, deletedAt: IsNull() },
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const patch = omitReadOnly(body ?? {});

  clientRepo.merge(row, patch);
  const saved = await clientRepo.save(row);
  return NextResponse.json(saved);
}

export async function deleteClient(_req: NextRequest, id: string) {
  const auth = await getCurrentUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientRepo = await repo();
  const row = await clientRepo.findOne({
    where: { id, organizationId: auth.payload.organizationId, deletedAt: IsNull() },
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  row.deletedAt = new Date();
  await clientRepo.save(row);
  return NextResponse.json({ success: true });
}
