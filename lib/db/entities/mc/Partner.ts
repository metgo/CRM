import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("partners")
export class Partner {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "organization_id", type: "uuid", nullable: true })
  organizationId: string | null;

  @Column({ name: "name_he", type: "text" })
  nameHe: string;

  @Column({ name: "name_en", type: "text", nullable: true })
  nameEn: string | null;

  @Column({ type: "text", nullable: true, default: "agent" })
  type: string | null;

  @Column({ type: "text", nullable: true })
  contact: string | null;

  @Column({ type: "text", nullable: true })
  mobile: string | null;

  @Column({ type: "text", nullable: true })
  email: string | null;

  @Column({ type: "text", nullable: true })
  areas: string | null;

  @Column({ type: "text", nullable: true })
  model: string | null;

  @Column({ type: "numeric", precision: 6, scale: 3, nullable: true })
  pct: string | null;

  @Column({ type: "numeric", precision: 14, scale: 2, nullable: true, default: 0 })
  accrued: string | null;

  @Column({ type: "numeric", precision: 14, scale: 2, nullable: true, default: 0 })
  paid: string | null;

  @Column({ type: "integer", nullable: true, default: 14 })
  cadence: number | null;

  @Column({ name: "last_report", type: "date", nullable: true })
  lastReport: string | null;

  @Column({ type: "text", nullable: true, default: "active" })
  status: string | null;

  @Column({ type: "text", nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
