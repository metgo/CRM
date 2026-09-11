import { NextRequest, NextResponse } from "next/server";
import { IsNull } from "typeorm";
import type { Repository, ObjectLiteral } from "typeorm";
import { getCurrentUser } from "@/lib/auth";
import { getRepository } from "@/lib/db";
import { MC_REGISTRY, isMcCollection } from "./registry";

const READ_ONLY_KEYS = new Set(["id", "createdAt", "updatedAt"]);

async function repoFor(coll: string): Promise<Repository<ObjectLiteral> | null> {
  if (!isMcCollection(coll)) return null;
  return (await getRepository(MC_REGISTRY[coll] as new () => ObjectLiteral)) as Repository<ObjectLiteral>;
}

const columnNames = (repo: Repository<ObjectLiteral>): string[] =>
  repo.metadata.columns.map((c) => c.propertyName);

const hasColumn = (repo: Repository<ObjectLiteral>, prop: string): boolean =>
  repo.metadata.columns.some((c) => c.propertyName === prop);

/** Entity instance -> plain object keyed by camelCase property name. */
function serialize(repo: Repository<ObjectLiteral>, row: ObjectLiteral): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const name of columnNames(repo)) out[name] = (row as Record<string, unknown>)[name];
  return out;
}

/** Request body -> a partial entity: known columns only, "" -> null, no read-only keys. */
function deserialize(repo: Repository<ObjectLiteral>, body: Record<string, unknown>): Record<string, unknown> {
  const allowed = new Set(columnNames(repo));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body ?? {})) {
    if (READ_ONLY_KEYS.has(k) || !allowed.has(k)) continue;
    out[k] = v === "" ? null : v;
  }
  return out;
}

/**
 * Keep the legacy CRM columns populated from the bilingual fields so CRM's own
 * clients/contacts pages keep working against mc-created rows.
 */
function mirrorLegacyFields(coll: string, data: Record<string, unknown>): void {
  const bi = (data.nameHe || data.nameEn) as string | undefined;
  if (coll === "clients") {
    if (bi && !data.name) data.name = bi;
  }
  if (coll === "contacts") {
    if (bi && (data.firstName === undefined || data.firstName === null || data.firstName === "")) {
      const parts = bi.trim().split(/\s+/);
      data.firstName = parts.shift() || bi;
      data.lastName = parts.join(" ") || "";
    }
    const links = Array.isArray(data.links) ? (data.links as Array<Record<string, unknown>>) : [];
    if (!data.clientId && links[0]?.client) data.clientId = links[0].client;
  }
}

function orderFor(repo: Repository<ObjectLiteral>): Record<string, "ASC" | "DESC"> {
  if (hasColumn(repo, "n")) return { n: "ASC" };
  if (hasColumn(repo, "createdAt")) return { createdAt: "DESC" };
  return {};
}

// ------------------------------------------------------------------ collection

export async function listCollection(_req: NextRequest, coll: string) {
  const auth = await getCurrentUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const repo = await repoFor(coll);
  if (!repo) return NextResponse.json({ error: "Unknown collection" }, { status: 404 });

  const where = hasColumn(repo, "deletedAt") ? ({ deletedAt: IsNull() } as ObjectLiteral) : undefined;
  const rows = await repo.find({ where, order: orderFor(repo) });
  return NextResponse.json(rows.map((r) => serialize(repo, r)));
}

export async function createInCollection(req: NextRequest, coll: string) {
  const auth = await getCurrentUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const repo = await repoFor(coll);
  if (!repo) return NextResponse.json({ error: "Unknown collection" }, { status: 404 });

  const data = deserialize(repo, await req.json());
  if (hasColumn(repo, "organizationId")) data.organizationId = auth.payload.organizationId;
  mirrorLegacyFields(coll, data);

  // mc_settings is a singleton keyed by a text id
  if (coll === "settings") data.id = data.id ?? "main";

  const entity = repo.create(data);
  const saved = await repo.save(entity);
  return NextResponse.json(serialize(repo, saved as ObjectLiteral));
}

// ------------------------------------------------------------------- single row

export async function getOne(_req: NextRequest, coll: string, id: string) {
  const auth = await getCurrentUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const repo = await repoFor(coll);
  if (!repo) return NextResponse.json({ error: "Unknown collection" }, { status: 404 });

  const row = await repo.findOne({ where: { id } as ObjectLiteral });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(serialize(repo, row));
}

export async function updateOne(req: NextRequest, coll: string, id: string) {
  const auth = await getCurrentUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const repo = await repoFor(coll);
  if (!repo) return NextResponse.json({ error: "Unknown collection" }, { status: 404 });

  const data = deserialize(repo, await req.json());
  mirrorLegacyFields(coll, data);

  let row = await repo.findOne({ where: { id } as ObjectLiteral });
  if (!row) {
    // settings is an upsert target
    if (coll === "settings") {
      row = repo.create({ ...data, id });
      const created = await repo.save(row);
      return NextResponse.json(serialize(repo, created as ObjectLiteral));
    }
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  repo.merge(row, data);
  const saved = await repo.save(row);
  return NextResponse.json(serialize(repo, saved as ObjectLiteral));
}

export async function deleteOne(_req: NextRequest, coll: string, id: string) {
  const auth = await getCurrentUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const repo = await repoFor(coll);
  if (!repo) return NextResponse.json({ error: "Unknown collection" }, { status: 404 });

  const row = await repo.findOne({ where: { id } as ObjectLiteral });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (hasColumn(repo, "deletedAt")) {
    (row as Record<string, unknown>).deletedAt = new Date();
    await repo.save(row);
  } else {
    await repo.remove(row);
  }
  return NextResponse.json({ success: true });
}
