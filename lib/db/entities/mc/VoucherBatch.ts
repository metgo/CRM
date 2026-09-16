import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("voucher_batches")
export class VoucherBatch {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "organization_id", type: "uuid", nullable: true })
  organizationId: string | null;

  @Column({ type: "uuid", nullable: true })
  campaign: string | null;

  @Column({ type: "integer", nullable: true, default: 0 })
  issued: number | null;

  @Column({ type: "numeric", precision: 12, scale: 2, nullable: true, default: 0 })
  face: string | null;

  @Column({ type: "numeric", precision: 14, scale: 2, nullable: true })
  cost: string | null;

  @Column({ name: "issue_date", type: "date", nullable: true })
  issueDate: string | null;

  @Column({ type: "date", nullable: true })
  expiry: string | null;

  @Column({ name: "c_issued", type: "integer", nullable: true, default: 0 })
  cIssued: number | null;

  @Column({ name: "c_active", type: "integer", nullable: true, default: 0 })
  cActive: number | null;

  @Column({ name: "c_partial", type: "integer", nullable: true, default: 0 })
  cPartial: number | null;

  @Column({ name: "c_redeemed", type: "integer", nullable: true, default: 0 })
  cRedeemed: number | null;

  @Column({ name: "c_expired", type: "integer", nullable: true, default: 0 })
  cExpired: number | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
