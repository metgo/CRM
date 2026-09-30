import { getDb } from "@/lib/db";

/** Whether rule n is switched on for the organization (off when missing). */
export async function isRuleOn(organizationId: string, n: number): Promise<boolean> {
  const db = await getDb();
  const rows: { on: boolean }[] = await db.query(
    `SELECT "on" FROM "automations" WHERE "organization_id" = $1 AND "n" = $2`,
    [organizationId, n]
  );
  return rows[0]?.on === true;
}

/** Reminders after which an unpaid payment counts as open debt. */
export async function debtAfter(): Promise<number> {
  const db = await getDb();
  const rows: { debt_after: number }[] = await db.query(
    `SELECT "debt_after" FROM "mc_settings" WHERE "id" = 'main'`
  );
  return rows[0]?.debt_after ?? 3;
}

export async function orgName(organizationId: string): Promise<string> {
  const db = await getDb();
  const rows: { name: string }[] = await db.query(
    `SELECT "name" FROM "organizations" WHERE "id" = $1`,
    [organizationId]
  );
  return rows[0]?.name ?? "MetGo";
}

export type ClientInfo = { id: string; name: string; owner: string | null };

export async function clientInfo(organizationId: string, clientId: string | null): Promise<ClientInfo | null> {
  if (!clientId) return null;
  const db = await getDb();
  const rows: { id: string; name_he: string | null; name_en: string | null; owner: string | null }[] =
    await db.query(
      `SELECT "id", "name_he", "name_en", "owner" FROM "clients"
       WHERE "id" = $1 AND "organization_id" = $2 AND "deleted_at" IS NULL`,
      [clientId, organizationId]
    );
  const r = rows[0];
  return r ? { id: r.id, name: r.name_he || r.name_en || "—", owner: r.owner } : null;
}

export type Person = { id: string; name: string; email: string };

/** Superadmins of the organization, standing in for "finance" and "manager". */
export async function managers(organizationId: string): Promise<Person[]> {
  const db = await getDb();
  const rows: { id: string; full_name: string; email: string }[] = await db.query(
    `SELECT "id", "full_name", "email" FROM "profiles"
     WHERE "organization_id" = $1 AND "role" = 'superadmin'
     ORDER BY "created_at"`,
    [organizationId]
  );
  return rows.map((r) => ({ id: r.id, name: r.full_name, email: r.email }));
}

export async function profile(organizationId: string, id: string | null): Promise<Person | null> {
  if (!id) return null;
  const db = await getDb();
  const rows: { id: string; full_name: string; email: string }[] = await db.query(
    `SELECT "id", "full_name", "email" FROM "profiles" WHERE "id" = $1 AND "organization_id" = $2`,
    [id, organizationId]
  );
  const r = rows[0];
  return r ? { id: r.id, name: r.full_name, email: r.email } : null;
}

// Link roles that mark a contact as the one who handles invoices.
const BILLING_ROLE = /billing|finance|account|invoice|treasur|כספים|חשבונות|גזבר|חשב/i;

/**
 * The client's billing contact: an active contact linked to the client, with an
 * email, preferring (1) a link role that reads as billing/finance, (2) the
 * primary contact, (3) a decision maker, (4) the oldest.
 */
export async function billingContact(organizationId: string, clientId: string): Promise<Person | null> {
  const db = await getDb();
  const rows: {
    id: string; name_he: string | null; name_en: string | null; email: string;
    is_primary: boolean; links: { client?: string; role?: string; dm?: boolean }[];
  }[] = await db.query(
    `SELECT "id", "name_he", "name_en", "email", "is_primary", "links" FROM "contacts"
     WHERE "organization_id" = $1 AND "active" = true AND "deleted_at" IS NULL
       AND COALESCE("email", '') <> ''
       AND "links" @> jsonb_build_array(jsonb_build_object('client', $2::text))
     ORDER BY "created_at"`,
    [organizationId, clientId]
  );
  const score = (r: (typeof rows)[number]) => {
    const link = (r.links || []).find((l) => l.client === clientId);
    if (link?.role && BILLING_ROLE.test(link.role)) return 3;
    if (r.is_primary) return 2;
    if (link?.dm) return 1;
    return 0;
  };
  const best = rows.slice().sort((a, b) => score(b) - score(a))[0];
  return best ? { id: best.id, name: best.name_he || best.name_en || "", email: best.email } : null;
}
