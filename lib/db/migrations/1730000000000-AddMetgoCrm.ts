import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adds the metgo-crm voucher-programme schema alongside the existing CRM tables,
 * and widens `clients` / `contacts` to the bilingual metgo-crm shape.
 *
 * Translated from metgo-crm/supabase/migrations/0001_init.sql and seed.sql
 * (the Supabase RLS block is intentionally dropped — access is enforced by the
 * CRM JWT layer instead).
 */
export class AddMetgoCrm1730000000000 implements MigrationInterface {
  name = "AddMetgoCrm1730000000000";

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    // ---------------------------------------------------------------- clients (widen)
    await q.query(`
      ALTER TABLE "clients"
        ALTER COLUMN "name" DROP NOT NULL,
        ADD COLUMN IF NOT EXISTS "name_he"     text,
        ADD COLUMN IF NOT EXISTS "name_en"     text,
        ADD COLUMN IF NOT EXISTS "type"        text DEFAULT 'authority',
        ADD COLUMN IF NOT EXISTS "cluster"     uuid,
        ADD COLUMN IF NOT EXISTS "population"  integer,
        ADD COLUMN IF NOT EXISTS "engagement"  text,
        ADD COLUMN IF NOT EXISTS "valid_until" date,
        ADD COLUMN IF NOT EXISTS "owner"       uuid,
        ADD COLUMN IF NOT EXISTS "source"      text,
        ADD COLUMN IF NOT EXISTS "satisfaction" smallint,
        ADD COLUMN IF NOT EXISTS "activated"   date,
        ADD COLUMN IF NOT EXISTS "phone"       text
    `);
    await q.query(`UPDATE "clients" SET "name_he" = COALESCE("name_he", "name") WHERE "name_he" IS NULL`);

    // --------------------------------------------------------------- contacts (widen)
    await q.query(`
      ALTER TABLE "contacts"
        ALTER COLUMN "first_name" DROP NOT NULL,
        ALTER COLUMN "last_name"  DROP NOT NULL,
        ALTER COLUMN "client_id"  DROP NOT NULL,
        ADD COLUMN IF NOT EXISTS "name_he" text,
        ADD COLUMN IF NOT EXISTS "name_en" text,
        ADD COLUMN IF NOT EXISTS "mobile"  text,
        ADD COLUMN IF NOT EXISTS "channel" text,
        ADD COLUMN IF NOT EXISTS "links"   jsonb NOT NULL DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS "active"  boolean NOT NULL DEFAULT true
    `);
    await q.query(`
      UPDATE "contacts"
      SET "name_he" = COALESCE("name_he", NULLIF(TRIM(CONCAT_WS(' ', "first_name", "last_name")), ''))
      WHERE "name_he" IS NULL
    `);

    // ------------------------------------------------------------------ app_users
    await q.query(`
      CREATE TABLE IF NOT EXISTS "app_users" (
        "id"              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "organization_id" uuid,
        "name_he"         text NOT NULL,
        "name_en"         text,
        "role"            text,
        "email"           text,
        "active"          boolean NOT NULL DEFAULT true,
        "created_at"      timestamptz NOT NULL DEFAULT now(),
        "updated_at"      timestamptz NOT NULL DEFAULT now()
      )
    `);

    // ------------------------------------------------------------------- clusters
    await q.query(`
      CREATE TABLE IF NOT EXISTS "clusters" (
        "id"              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "organization_id" uuid,
        "name_he"         text NOT NULL,
        "name_en"         text,
        "region"          text,
        "members"         uuid[] NOT NULL DEFAULT '{}',
        "scope"           text,
        "contact"         uuid,
        "notes"           text,
        "created_at"      timestamptz NOT NULL DEFAULT now(),
        "updated_at"      timestamptz NOT NULL DEFAULT now()
      )
    `);

    // ---------------------------------------------------------------------- deals
    await q.query(`
      CREATE TABLE IF NOT EXISTS "deals" (
        "id"              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "organization_id" uuid,
        "title_he"        text NOT NULL,
        "title_en"        text,
        "client"          uuid,
        "type"            text DEFAULT 'voucher',
        "stage"           text NOT NULL DEFAULT 'lead',
        "source"          text,
        "partner"         uuid,
        "net"             numeric(14,2) DEFAULT 0,
        "commission_pct"  numeric(6,3),
        "terms"           text,
        "expected"        date,
        "stage_since"     date DEFAULT CURRENT_DATE,
        "verbal"          date,
        "po"              date,
        "owner"           uuid,
        "next"            text,
        "next_date"       date,
        "loss_reason"     text,
        "notes"           text,
        "created_at"      timestamptz NOT NULL DEFAULT now(),
        "updated_at"      timestamptz NOT NULL DEFAULT now()
      )
    `);
    await q.query(`CREATE INDEX IF NOT EXISTS "deals_stage_idx" ON "deals" ("stage")`);
    await q.query(`CREATE INDEX IF NOT EXISTS "deals_client_idx" ON "deals" ("client")`);

    // -------------------------------------------------------------------- tenders
    await q.query(`
      CREATE TABLE IF NOT EXISTS "tenders" (
        "id"               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "organization_id"  uuid,
        "num"              text NOT NULL,
        "client"           uuid,
        "title_he"         text,
        "title_en"         text,
        "status"           text NOT NULL DEFAULT 'spotted',
        "published"        date,
        "questions"        date,
        "submission"       date,
        "decision"         date,
        "value"            numeric(14,2),
        "guarantee"        numeric(14,2),
        "guarantee_expiry" date,
        "deal"             uuid,
        "owner"            uuid,
        "docs"             jsonb NOT NULL DEFAULT '[]'::jsonb,
        "notes"            text,
        "created_at"       timestamptz NOT NULL DEFAULT now(),
        "updated_at"       timestamptz NOT NULL DEFAULT now()
      )
    `);

    // --------------------------------------------------------------------- quotes
    await q.query(`
      CREATE TABLE IF NOT EXISTS "quotes" (
        "id"              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "organization_id" uuid,
        "deal"            uuid,
        "ver"             integer NOT NULL DEFAULT 1,
        "date"            date,
        "valid"           date,
        "status"          text NOT NULL DEFAULT 'draft',
        "contact"         uuid,
        "owner"           uuid,
        "lines"           jsonb NOT NULL DEFAULT '[]'::jsonb,
        "notes"           text,
        "created_at"      timestamptz NOT NULL DEFAULT now(),
        "updated_at"      timestamptz NOT NULL DEFAULT now()
      )
    `);

    // ------------------------------------------------------------------ contracts
    await q.query(`
      CREATE TABLE IF NOT EXISTS "contracts" (
        "id"              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "organization_id" uuid,
        "client"          uuid,
        "deal"            uuid,
        "doc_type"        text NOT NULL DEFAULT 'po',
        "po"              text,
        "status"          text NOT NULL DEFAULT 'awaiting',
        "signed"          date,
        "start"           date,
        "end"             date,
        "auto_renew"      boolean DEFAULT false,
        "notice_days"     integer,
        "net"             numeric(14,2),
        "signatories"     text,
        "owner"           uuid,
        "schedule"        jsonb NOT NULL DEFAULT '[]'::jsonb,
        "notes"           text,
        "created_at"      timestamptz NOT NULL DEFAULT now(),
        "updated_at"      timestamptz NOT NULL DEFAULT now()
      )
    `);

    // ------------------------------------------------------------------- payments
    await q.query(`
      CREATE TABLE IF NOT EXISTS "payments" (
        "id"              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "organization_id" uuid,
        "client"          uuid,
        "contract"        uuid,
        "type"            text NOT NULL DEFAULT 'once',
        "net"             numeric(14,2) NOT NULL DEFAULT 0,
        "due"             date NOT NULL,
        "status"          text NOT NULL DEFAULT 'planned',
        "invoice"         text,
        "paid_at"         date,
        "paid_amount"     numeric(14,2),
        "reminders"       integer NOT NULL DEFAULT 0,
        "recurrence"      text,
        "notes"           text,
        "created_at"      timestamptz NOT NULL DEFAULT now(),
        "updated_at"      timestamptz NOT NULL DEFAULT now()
      )
    `);
    await q.query(`CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments" ("status")`);
    await q.query(`CREATE INDEX IF NOT EXISTS "payments_due_idx" ON "payments" ("due")`);

    // ------------------------------------------------------------------ campaigns
    await q.query(`
      CREATE TABLE IF NOT EXISTS "campaigns" (
        "id"              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "organization_id" uuid,
        "name_he"         text NOT NULL,
        "name_en"         text,
        "client"          uuid,
        "deal"            uuid,
        "type"            text DEFAULT 'voucher',
        "status"          text NOT NULL DEFAULT 'prep',
        "metric"          text DEFAULT 'redemptions',
        "goal"            numeric(14,2),
        "current_value"   numeric(14,2) DEFAULT 0,
        "budget"          numeric(14,2),
        "cost"            numeric(14,2),
        "start"           date,
        "end"             date,
        "scope"           uuid[] NOT NULL DEFAULT '{}',
        "owner"           uuid,
        "notes"           text,
        "created_at"      timestamptz NOT NULL DEFAULT now(),
        "updated_at"      timestamptz NOT NULL DEFAULT now()
      )
    `);

    // ------------------------------------------------------------ voucher_batches
    await q.query(`
      CREATE TABLE IF NOT EXISTS "voucher_batches" (
        "id"              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "organization_id" uuid,
        "campaign"        uuid,
        "issued"          integer DEFAULT 0,
        "face"            numeric(12,2) DEFAULT 0,
        "cost"            numeric(14,2),
        "issue_date"      date,
        "expiry"          date,
        "c_issued"        integer DEFAULT 0,
        "c_active"        integer DEFAULT 0,
        "c_partial"       integer DEFAULT 0,
        "c_redeemed"      integer DEFAULT 0,
        "c_expired"       integer DEFAULT 0,
        "created_at"      timestamptz NOT NULL DEFAULT now(),
        "updated_at"      timestamptz NOT NULL DEFAULT now()
      )
    `);

    // ------------------------------------------------------------------ merchants
    await q.query(`
      CREATE TABLE IF NOT EXISTS "merchants" (
        "id"              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "organization_id" uuid,
        "name_he"         text NOT NULL,
        "name_en"         text,
        "bn"              text,
        "cat"             text,
        "client"          uuid,
        "status"          text NOT NULL DEFAULT 'candidate',
        "joined"          date,
        "address"         text,
        "phone"           text,
        "owner_name"      text,
        "redemptions"     integer DEFAULT 0,
        "revenue"         numeric(14,2) DEFAULT 0,
        "last"            date,
        "notes"           text,
        "created_at"      timestamptz NOT NULL DEFAULT now(),
        "updated_at"      timestamptz NOT NULL DEFAULT now()
      )
    `);
    await q.query(`CREATE INDEX IF NOT EXISTS "merchants_client_idx" ON "merchants" ("client")`);

    // ---------------------------------------------------------------- redemptions
    await q.query(`
      CREATE TABLE IF NOT EXISTS "redemptions" (
        "id"              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "organization_id" uuid,
        "merchant"        uuid,
        "channel"         text DEFAULT 'offline',
        "amount"          numeric(12,2) NOT NULL DEFAULT 0,
        "date"            date,
        "campaign"        uuid,
        "source"          text DEFAULT 'manual',
        "external_ref"    text,
        "created_at"      timestamptz NOT NULL DEFAULT now(),
        "updated_at"      timestamptz NOT NULL DEFAULT now()
      )
    `);
    await q.query(`CREATE INDEX IF NOT EXISTS "redemptions_date_idx" ON "redemptions" ("date")`);

    // ------------------------------------------------------------------- partners
    await q.query(`
      CREATE TABLE IF NOT EXISTS "partners" (
        "id"              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "organization_id" uuid,
        "name_he"         text NOT NULL,
        "name_en"         text,
        "type"            text DEFAULT 'agent',
        "contact"         text,
        "mobile"          text,
        "email"           text,
        "areas"           text,
        "model"           text,
        "pct"             numeric(6,3),
        "accrued"         numeric(14,2) DEFAULT 0,
        "paid"            numeric(14,2) DEFAULT 0,
        "cadence"         integer DEFAULT 14,
        "last_report"     date,
        "status"          text DEFAULT 'active',
        "notes"           text,
        "created_at"      timestamptz NOT NULL DEFAULT now(),
        "updated_at"      timestamptz NOT NULL DEFAULT now()
      )
    `);

    // --------------------------------------------------------------- interactions
    await q.query(`
      CREATE TABLE IF NOT EXISTS "interactions" (
        "id"              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "organization_id" uuid,
        "type"            text NOT NULL DEFAULT 'meeting',
        "client"          uuid,
        "deal"            uuid,
        "contacts"        uuid[] NOT NULL DEFAULT '{}',
        "date"            date NOT NULL,
        "dur"             integer,
        "owner"           uuid,
        "source"          text DEFAULT 'manual',
        "documented"      boolean NOT NULL DEFAULT false,
        "summary"         text,
        "decisions"       text,
        "created_at"      timestamptz NOT NULL DEFAULT now(),
        "updated_at"      timestamptz NOT NULL DEFAULT now()
      )
    `);
    await q.query(`CREATE INDEX IF NOT EXISTS "interactions_client_idx" ON "interactions" ("client")`);
    await q.query(`CREATE INDEX IF NOT EXISTS "interactions_date_idx" ON "interactions" ("date" DESC)`);

    // ---------------------------------------------------------------------- tasks
    await q.query(`
      CREATE TABLE IF NOT EXISTS "tasks" (
        "id"              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "organization_id" uuid,
        "title_he"        text NOT NULL,
        "title_en"        text,
        "domain"          text DEFAULT 'sales',
        "client"          uuid,
        "deal"            uuid,
        "tender"          uuid,
        "assignee"        uuid,
        "priority"        text DEFAULT 'med',
        "due"             date NOT NULL,
        "status"          text NOT NULL DEFAULT 'todo',
        "src"             text DEFAULT 'manual',
        "notes"           text,
        "created_at"      timestamptz NOT NULL DEFAULT now(),
        "updated_at"      timestamptz NOT NULL DEFAULT now()
      )
    `);
    await q.query(`CREATE INDEX IF NOT EXISTS "tasks_status_due_idx" ON "tasks" ("status", "due")`);

    // --------------------------------------------------------------------- events
    await q.query(`
      CREATE TABLE IF NOT EXISTS "events" (
        "id"              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "organization_id" uuid,
        "name_he"         text NOT NULL,
        "name_en"         text,
        "type"            text DEFAULT 'fair',
        "client"          uuid,
        "campaign"        uuid,
        "date"            date,
        "location"        text,
        "est"             integer,
        "actual"          integer,
        "merchants"       uuid[] NOT NULL DEFAULT '{}',
        "budget"          numeric(14,2),
        "cost"            numeric(14,2),
        "owner"           uuid,
        "status"          text DEFAULT 'prep',
        "goals"           text,
        "summary"         text,
        "created_at"      timestamptz NOT NULL DEFAULT now(),
        "updated_at"      timestamptz NOT NULL DEFAULT now()
      )
    `);

    // ---------------------------------------------------------------- automations
    await q.query(`
      CREATE TABLE IF NOT EXISTS "automations" (
        "id"   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "n"    integer NOT NULL UNIQUE,
        "on"   boolean NOT NULL DEFAULT true,
        "trig" jsonb NOT NULL,
        "cond" jsonb NOT NULL,
        "act"  jsonb NOT NULL,
        "to"   jsonb NOT NULL
      )
    `);

    // ----------------------------------------------------------------- mc_settings
    await q.query(`
      CREATE TABLE IF NOT EXISTS "mc_settings" (
        "id"          text PRIMARY KEY DEFAULT 'main',
        "vat"         numeric(5,2) NOT NULL DEFAULT 18,
        "target_year" numeric(14,2) NOT NULL DEFAULT 2900000,
        "sla_lead"    integer NOT NULL DEFAULT 7,
        "sla_meeting" integer NOT NULL DEFAULT 14,
        "sla_quote"   integer NOT NULL DEFAULT 21,
        "sla_verbal"  integer NOT NULL DEFAULT 14,
        "sla_po"      integer NOT NULL DEFAULT 30,
        "gap_ok"      integer NOT NULL DEFAULT 14,
        "gap_warn"    integer NOT NULL DEFAULT 30,
        "debt_after"  integer NOT NULL DEFAULT 3,
        "doc_hours"   integer NOT NULL DEFAULT 24
      )
    `);
    await q.query(`INSERT INTO "mc_settings" ("id") VALUES ('main') ON CONFLICT ("id") DO NOTHING`);

    // -------------------------------------------------- seed the 24 automation rules
    await q.query(`
      INSERT INTO "automations" ("n", "on", "trig", "cond", "act", "to") VALUES
      (1, true, '{"he":"7 ימים לפני תאריך יעד תשלום","en":"7 days before payment due"}', '{"he":"סטטוס ≠ שולם","en":"Status ≠ paid"}', '{"he":"תזכורת פנימית להכנת חשבונית","en":"Internal reminder to issue invoice"}', '{"he":"איש כספים","en":"Finance"}'),
      (2, true, '{"he":"ביום היעד","en":"On due date"}', '{"he":"חשבונית הופקה, לא שולם","en":"Invoiced, unpaid"}', '{"he":"מייל/וואטסאפ ללקוח + מונה +1","en":"Email/WhatsApp to client + counter +1"}', '{"he":"איש קשר לחיוב","en":"Billing contact"}'),
      (3, true, '{"he":"+7 / +14 / +21 ימים","en":"+7 / +14 / +21 days"}', '{"he":"עדיין לא שולם","en":"Still unpaid"}', '{"he":"תזכורת נוספת, מונה +1","en":"Further reminder, counter +1"}', '{"he":"איש קשר + מנהל תיק","en":"Contact + owner"}'),
      (4, true, '{"he":"מונה תזכורות = 3","en":"Reminder counter = 3"}', '{"he":"—","en":"—"}', '{"he":"סימון חוב פתוח + משימה דחופה + הבלטה בדשבורד","en":"Flag open debt + urgent task + dashboard highlight"}', '{"he":"מנהל","en":"Manager"}'),
      (5, true, '{"he":"אישור בע״פ + 14 יום","en":"Verbal approval + 14 days"}', '{"he":"אין הזמנת עבודה","en":"No PO received"}', '{"he":"התראת פער + משימת מעקב","en":"Gap alert + follow-up task"}', '{"he":"מנהל תיק","en":"Deal owner"}'),
      (6, true, '{"he":"ימים בשלב > SLA","en":"Days in stage > SLA"}', '{"he":"עסקה פעילה","en":"Active deal"}', '{"he":"סימון צוואר בקבוק + הצפה בדשבורד","en":"Flag bottleneck + surface on dashboard"}', '{"he":"מנהל תיק + מנהל","en":"Owner + manager"}'),
      (7, true, '{"he":"עסקה ללא פעולה הבאה 7 ימים","en":"Deal with no next action for 7 days"}', '{"he":"שלב פעיל","en":"Active stage"}', '{"he":"משימת ״קבע צעד הבא״","en":"Task: set next action"}', '{"he":"מנהל תיק","en":"Deal owner"}'),
      (8, true, '{"he":"14 / 7 / 3 / 1 יום לפני הגשת מכרז","en":"14 / 7 / 3 / 1 days before submission"}', '{"he":"סטטוס ≠ הוגש","en":"Status ≠ submitted"}', '{"he":"תזכורת + רשימת מסמכים חסרים","en":"Reminder + missing documents list"}', '{"he":"אחראי מכרז + מנהל","en":"Tender owner + manager"}'),
      (9, true, '{"he":"7 ימים לפני מועד פרסום צפוי","en":"7 days before expected publication"}', '{"he":"מכרז חוזר מזוהה","en":"Recurring tender identified"}', '{"he":"תזכורת לבדוק פרסום","en":"Reminder to check publication"}', '{"he":"אחראי מכרז","en":"Tender owner"}'),
      (10, true, '{"he":"30 יום לפני פקיעת ערבות","en":"30 days before guarantee expiry"}', '{"he":"מכרז פעיל","en":"Active tender"}', '{"he":"תזכורת הארכה","en":"Extension reminder"}', '{"he":"איש כספים","en":"Finance"}'),
      (11, true, '{"he":"60 / 30 יום לפני פקיעת ספק יחיד","en":"60 / 30 days before sole-supplier expiry"}', '{"he":"לקוח פעיל","en":"Active client"}', '{"he":"משימת חידוש התקשרות","en":"Engagement renewal task"}', '{"he":"מנהל תיק","en":"Account owner"}'),
      (12, true, '{"he":"90 / 60 / 30 יום לפני סיום חוזה","en":"90 / 60 / 30 days before contract end"}', '{"he":"חוזה פעיל","en":"Active contract"}', '{"he":"משימת חידוש + התראת הודעה מוקדמת","en":"Renewal task + notice-period alert"}', '{"he":"מנהל תיק","en":"Account owner"}'),
      (13, true, '{"he":"24 שעות אחרי פגישה","en":"24 hours after a meeting"}', '{"he":"לא תועדה","en":"Not documented"}', '{"he":"תזכורת השלמת תיעוד","en":"Documentation reminder"}', '{"he":"המשתתף מהצוות","en":"Team attendee"}'),
      (14, true, '{"he":"נשמר סיכום פגישה","en":"Meeting summary saved"}', '{"he":"מכיל שורות פעולה","en":"Contains action items"}', '{"he":"הצעת משימות לאישור","en":"Suggest tasks for approval"}', '{"he":"יוצר הסיכום","en":"Summary author"}'),
      (15, true, '{"he":"הצעת מחיר נשלחה + 5 ימים","en":"Quote sent + 5 days"}', '{"he":"אין תגובה","en":"No response"}', '{"he":"משימת ״חזור ללקוח״","en":"Task: follow up"}', '{"he":"מנהל תיק","en":"Deal owner"}'),
      (16, true, '{"he":"הצעת מחיר מגיעה לתוקף","en":"Quote reaches validity date"}', '{"he":"לא אושרה","en":"Not approved"}', '{"he":"סטטוס → פג תוקף + התראה","en":"Status → expired + alert"}', '{"he":"מנהל תיק","en":"Deal owner"}'),
      (17, true, '{"he":"חוזה נחתם","en":"Contract signed"}', '{"he":"—","en":"—"}', '{"he":"לקוח → פעיל, יצירת שורות תשלום, משימות קליטה","en":"Client → active, create payment rows, onboarding tasks"}', '{"he":"אוטומטי","en":"System"}'),
      (18, true, '{"he":"משימה הוקצתה","en":"Task assigned"}', '{"he":"—","en":"—"}', '{"he":"התראה מיידית","en":"Immediate notification"}', '{"he":"האחראי החדש","en":"New assignee"}'),
      (19, true, '{"he":"יום לפני יעד / ביום היעד / באיחור","en":"Day before / on / past due"}', '{"he":"לא הושלמה","en":"Not completed"}', '{"he":"תזכורת; באיחור — יומית","en":"Reminder; daily once overdue"}', '{"he":"האחראי","en":"Assignee"}'),
      (20, true, '{"he":"כל 14 יום","en":"Every 14 days"}', '{"he":"שותף פעיל","en":"Active partner"}', '{"he":"מייל דיווח מרוכז עם נתוני השותף בלבד","en":"Consolidated report, that partner''s data only"}', '{"he":"השותף","en":"Partner"}'),
      (21, true, '{"he":"30 יום לפני פקיעת מנת תווים","en":"30 days before batch expiry"}', '{"he":"אחוז מימוש < 70%","en":"Redemption < 70%"}', '{"he":"התראה + הצעה לקמפיין מימוש","en":"Alert + suggest redemption push"}', '{"he":"מנהל קמפיין","en":"Campaign owner"}'),
      (22, true, '{"he":"קצב קמפיין מול זמן < 0.7","en":"Campaign pace vs schedule < 0.7"}', '{"he":"קמפיין פעיל","en":"Live campaign"}', '{"he":"התראת פיגור ביעד","en":"Behind-target alert"}', '{"he":"מנהל קמפיין","en":"Campaign owner"}'),
      (23, true, '{"he":"90 יום ללא אינטראקציה","en":"90 days without interaction"}', '{"he":"לקוח פעיל","en":"Active client"}', '{"he":"משימת ״צור קשר״","en":"Task: reach out"}', '{"he":"מנהל תיק","en":"Account owner"}'),
      (24, false, '{"he":"60 יום ללא מימוש","en":"60 days without redemption"}', '{"he":"עסק בסטטוס פעיל","en":"Merchant marked active"}', '{"he":"משימת בדיקת פעילות","en":"Activity check task"}', '{"he":"מנהל תפעול","en":"Ops manager"}')
      ON CONFLICT ("n") DO NOTHING
    `);
  }

  public async down(q: QueryRunner): Promise<void> {
    for (const t of [
      "automations", "mc_settings", "events", "tasks", "interactions", "partners",
      "redemptions", "merchants", "voucher_batches", "campaigns", "payments",
      "contracts", "quotes", "tenders", "deals", "clusters", "app_users",
    ]) {
      await q.query(`DROP TABLE IF EXISTS "${t}" CASCADE`);
    }

    await q.query(`
      ALTER TABLE "contacts"
        DROP COLUMN IF EXISTS "name_he",
        DROP COLUMN IF EXISTS "name_en",
        DROP COLUMN IF EXISTS "mobile",
        DROP COLUMN IF EXISTS "channel",
        DROP COLUMN IF EXISTS "links",
        DROP COLUMN IF EXISTS "active"
    `);
    await q.query(`
      ALTER TABLE "clients"
        DROP COLUMN IF EXISTS "name_he",
        DROP COLUMN IF EXISTS "name_en",
        DROP COLUMN IF EXISTS "type",
        DROP COLUMN IF EXISTS "cluster",
        DROP COLUMN IF EXISTS "population",
        DROP COLUMN IF EXISTS "engagement",
        DROP COLUMN IF EXISTS "valid_until",
        DROP COLUMN IF EXISTS "owner",
        DROP COLUMN IF EXISTS "source",
        DROP COLUMN IF EXISTS "satisfaction",
        DROP COLUMN IF EXISTS "activated",
        DROP COLUMN IF EXISTS "phone"
    `);
  }
}
