import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1718500000000 implements MigrationInterface {
  name = "InitialSchema1718500000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Organizations table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "organizations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(255) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_organizations" PRIMARY KEY ("id")
      )
    `);

    // Profiles table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "profiles" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "organization_id" uuid NOT NULL,
        "full_name" character varying(255) NOT NULL,
        "email" character varying(255) NOT NULL,
        "password_hash" character varying(255) NOT NULL,
        "role" character varying(20) NOT NULL DEFAULT 'agent',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_profiles" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_profiles_email" UNIQUE ("email"),
        CONSTRAINT "FK_profiles_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    // Clients table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "clients" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "organization_id" uuid NOT NULL,
        "name" character varying(255) NOT NULL,
        "status" character varying(50) NOT NULL DEFAULT 'lead',
        "region" character varying(100),
        "address" text,
        "website" character varying(500),
        "notes" text,
        "assigned_to" uuid,
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_clients" PRIMARY KEY ("id"),
        CONSTRAINT "FK_clients_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_clients_assigned_to" FOREIGN KEY ("assigned_to") REFERENCES "profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_clients_organization" ON "clients" ("organization_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_clients_status" ON "clients" ("status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_clients_deleted" ON "clients" ("deleted_at")`);

    // Contacts table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "contacts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "organization_id" uuid NOT NULL,
        "client_id" uuid NOT NULL,
        "first_name" character varying(100) NOT NULL,
        "last_name" character varying(100) NOT NULL,
        "role_title" character varying(150),
        "phone" character varying(50),
        "email" character varying(255),
        "whatsapp" character varying(50),
        "is_primary" boolean NOT NULL DEFAULT false,
        "notes" text,
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_contacts" PRIMARY KEY ("id"),
        CONSTRAINT "FK_contacts_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_contacts_client" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_contacts_client" ON "contacts" ("client_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_contacts_organization" ON "contacts" ("organization_id")`);

    // Communications table
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

    // Templates table
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

    // Reminders table
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

    // Insert sample organization and admin user
    // Password: "admin123" (hashed with bcrypt, 12 rounds)
    await queryRunner.query(`
      INSERT INTO "organizations" ("id", "name")
      VALUES ('00000000-0000-0000-0000-000000000001', 'MetGo Demo')
      ON CONFLICT ("id") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "profiles" ("id", "organization_id", "full_name", "email", "password_hash", "role")
      VALUES (
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000001',
        'Admin User',
        'admin@metgo.com',
        '$2b$12$mpPnpJkmii1MnAlpYZaxoOjWaknp7/eK8XvkxIDtQ5Ci3PRJi4aQq',
        'admin'
      )
      ON CONFLICT ("id") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "reminders"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "templates"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "communications"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "contacts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "clients"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "profiles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "organizations"`);
  }
}
