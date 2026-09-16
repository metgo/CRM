import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("redemptions")
export class Redemption {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "organization_id", type: "uuid", nullable: true })
  organizationId: string | null;

  @Column({ type: "uuid", nullable: true })
  merchant: string | null;

  @Column({ type: "text", nullable: true, default: "offline" })
  channel: string | null;

  @Column({ type: "numeric", precision: 12, scale: 2, default: 0 })
  amount: string;

  @Column({ type: "date", nullable: true })
  date: string | null;

  @Column({ type: "uuid", nullable: true })
  campaign: string | null;

  @Column({ type: "text", nullable: true, default: "manual" })
  source: string | null;

  @Column({ name: "external_ref", type: "text", nullable: true })
  externalRef: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
