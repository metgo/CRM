import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

/**
 * One automation rule. Rows with `organizationId = null` are the template
 * copied to each new organization (see lib/automations/seed.ts); `n` is
 * unique per organization.
 */
@Entity("automations")
export class Automation {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "organization_id", type: "uuid", nullable: true })
  organizationId: string | null;

  @Column({ type: "integer" })
  n: number;

  @Column({ name: "on", type: "boolean", default: true })
  on: boolean;

  @Column({ type: "jsonb" })
  trig: unknown;

  @Column({ type: "jsonb" })
  cond: unknown;

  @Column({ type: "jsonb" })
  act: unknown;

  @Column({ name: "to", type: "jsonb" })
  to: unknown;
}
