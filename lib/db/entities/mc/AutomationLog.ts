import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

/**
 * One action taken by the automation worker (a message sent, a counter bumped,
 * a task created). `dedupeKey` is unique per organization, so inserting the
 * same key twice is how the worker knows an action already happened.
 */
@Entity("automation_log")
export class AutomationLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "organization_id", type: "uuid" })
  organizationId: string;

  @Column({ type: "integer" })
  rule: number;

  @Column({ type: "text" })
  coll: string;

  @Column({ name: "record_id", type: "uuid" })
  recordId: string;

  /** internal | email | whatsapp | task | status */
  @Column({ type: "text" })
  channel: string;

  @Column({ name: "dedupe_key", type: "text" })
  dedupeKey: string;

  /** sent | failed | skipped */
  @Column({ type: "text", default: "sent" })
  status: string;

  @Column({ type: "jsonb", nullable: true })
  detail: unknown;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
