import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Drops the pre-AddMetgoCrm columns on clients/contacts that nothing in the
 * app reads or writes anymore: the mc UI is schema-driven off nameHe/nameEn,
 * status/region/address/notes/phone (columns the mc schema reuses directly),
 * and contacts' `links` jsonb — never `name`, `website`, `assignedTo`,
 * `firstName`, `lastName` or `clientId`. The old `/api/clients` and
 * `/api/authorities` REST routes that read those columns have been removed.
 */
export class DropLegacyClientContactFields1789500000000 implements MigrationInterface {
  name = "DropLegacyClientContactFields1789500000000";

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE "clients" DROP CONSTRAINT IF EXISTS "FK_clients_assigned_to"`);
    await q.query(`ALTER TABLE "clients" DROP COLUMN IF EXISTS "assigned_to"`);
    await q.query(`ALTER TABLE "clients" DROP COLUMN IF EXISTS "website"`);
    await q.query(`ALTER TABLE "clients" DROP COLUMN IF EXISTS "name"`);

    await q.query(`DROP INDEX IF EXISTS "IDX_contacts_client"`);
    await q.query(`ALTER TABLE "contacts" DROP CONSTRAINT IF EXISTS "FK_contacts_client"`);
    await q.query(`ALTER TABLE "contacts" DROP COLUMN IF EXISTS "client_id"`);
    await q.query(`ALTER TABLE "contacts" DROP COLUMN IF EXISTS "first_name"`);
    await q.query(`ALTER TABLE "contacts" DROP COLUMN IF EXISTS "last_name"`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "last_name" character varying(100)`);
    await q.query(`ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "first_name" character varying(100)`);
    await q.query(`ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "client_id" uuid`);
    await q.query(`
      ALTER TABLE "contacts" ADD CONSTRAINT "FK_contacts_client"
        FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await q.query(`CREATE INDEX IF NOT EXISTS "IDX_contacts_client" ON "contacts" ("client_id")`);

    await q.query(`ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "name" character varying(255)`);
    await q.query(`ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "website" character varying(500)`);
    await q.query(`ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "assigned_to" uuid`);
    await q.query(`
      ALTER TABLE "clients" ADD CONSTRAINT "FK_clients_assigned_to"
        FOREIGN KEY ("assigned_to") REFERENCES "profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }
}
