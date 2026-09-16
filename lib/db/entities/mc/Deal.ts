import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("deals")
export class Deal {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "organization_id", type: "uuid", nullable: true })
  organizationId: string | null;

  @Column({ name: "title_he", type: "text" })
  titleHe: string;

  @Column({ name: "title_en", type: "text", nullable: true })
  titleEn: string | null;

  @Column({ type: "uuid", nullable: true })
  client: string | null;

  @Column({ type: "text", nullable: true, default: "voucher" })
  type: string | null;

  @Column({ type: "text", default: "lead" })
  stage: string;

  @Column({ type: "text", nullable: true })
  source: string | null;

  @Column({ type: "uuid", nullable: true })
  partner: string | null;

  @Column({ type: "numeric", precision: 14, scale: 2, nullable: true, default: 0 })
  net: string | null;

  @Column({ name: "commission_pct", type: "numeric", precision: 6, scale: 3, nullable: true })
  commissionPct: string | null;

  @Column({ type: "text", nullable: true })
  terms: string | null;

  @Column({ type: "date", nullable: true })
  expected: string | null;

  @Column({ name: "stage_since", type: "date", nullable: true, default: () => "CURRENT_DATE" })
  stageSince: string | null;

  @Column({ type: "date", nullable: true })
  verbal: string | null;

  @Column({ type: "date", nullable: true })
  po: string | null;

  @Column({ type: "uuid", nullable: true })
  owner: string | null;

  @Column({ type: "text", nullable: true })
  next: string | null;

  @Column({ name: "next_date", type: "date", nullable: true })
  nextDate: string | null;

  @Column({ name: "loss_reason", type: "text", nullable: true })
  lossReason: string | null;

  @Column({ type: "text", nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
