import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Drops the classic-dashboard-only tables: communications (messaging log),
 * templates (message templates) and reminders. None of the mc/ops
 * collections (see lib/mc/server/registry.ts) reference these tables, and
 * the classic dashboard UI/API routes that used them have been removed.
 */
export class DropMessagingAndReminders1789102077000 implements MigrationInterface {
  name = "DropMessagingAndReminders1789102077000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "communications"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "templates"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reminders"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "communications" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "organization_id" uuid NOT NULL,
        "client_id" uuid NOT NULL,
        "contact_id" uuid,
        "user_id" uuid NOT NULL,
        "type" character varying(20) NOT NULL,
        "direction" character varying(20) NOT NULL DEFAULT 'outbound',
        "subject" character varying(500),
        "body" text NOT NULL,
        "status" character varying(50),
        "inforu_message_id" character varying(100),
        "sent_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_communications" PRIMARY KEY ("id"),
        CONSTRAINT "FK_communications_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_communications_client" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_communications_contact" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_communications_user" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_communications_client" ON "communications" ("client_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_communications_organization" ON "communications" ("organization_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_communications_created" ON "communications" ("created_at" DESC)`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "templates" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "organization_id" uuid NOT NULL,
        "name" character varying(255) NOT NULL,
        "type" character varying(20) NOT NULL,
        "subject" character varying(500),
        "body" text NOT NULL,
        "variables" text[] NOT NULL DEFAULT '{}',
        "created_by" uuid,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_templates" PRIMARY KEY ("id"),
        CONSTRAINT "FK_templates_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_templates_created_by" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "reminders" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "organization_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "client_id" uuid,
        "title" character varying(255) NOT NULL,
        "notes" text,
        "due_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "is_done" boolean NOT NULL DEFAULT false,
        "done_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reminders" PRIMARY KEY ("id"),
        CONSTRAINT "FK_reminders_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_reminders_user" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_reminders_client" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_reminders_user_due_done" ON "reminders" ("user_id", "due_at" ASC, "is_done")`);
  }
}
