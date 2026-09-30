import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("campaigns")
export class Campaign {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "organization_id", type: "uuid", nullable: true })
  organizationId: string | null;

  @Column({ name: "name_he", type: "text" })
  nameHe: string;

  @Column({ name: "name_en", type: "text", nullable: true })
  nameEn: string | null;

  @Column({ type: "uuid", nullable: true })
  client: string | null;

  @Column({ type: "uuid", nullable: true })
  deal: string | null;

  @Column({ type: "text", nullable: true, default: "voucher" })
  type: string | null;

  @Column({ type: "text", default: "prep" })
  status: string;

  @Column({ type: "text", nullable: true, default: "redemptions" })
  metric: string | null;

  @Column({ type: "numeric", precision: 14, scale: 2, nullable: true })
  goal: string | null;

  @Column({ name: "current_value", type: "numeric", precision: 14, scale: 2, nullable: true, default: 0 })
  currentValue: string | null;

  @Column({ type: "numeric", precision: 14, scale: 2, nullable: true })
  budget: string | null;

  @Column({ type: "numeric", precision: 14, scale: 2, nullable: true })
  cost: string | null;

  @Column({ type: "date", nullable: true })
  start: string | null;

  @Column({ name: "end", type: "date", nullable: true })
  end: string | null;

  @Column({ type: "uuid", array: true, default: () => "'{}'" })
  scope: string[];

  @Column({ type: "uuid", nullable: true })
  owner: string | null;

  @Column({ type: "text", nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
