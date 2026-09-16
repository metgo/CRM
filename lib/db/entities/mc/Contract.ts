import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("contracts")
export class Contract {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "organization_id", type: "uuid", nullable: true })
  organizationId: string | null;

  @Column({ type: "uuid", nullable: true })
  client: string | null;

  @Column({ type: "uuid", nullable: true })
  deal: string | null;

  @Column({ name: "doc_type", type: "text", default: "po" })
  docType: string;

  @Column({ type: "text", nullable: true })
  po: string | null;

  @Column({ type: "text", default: "awaiting" })
  status: string;

  @Column({ type: "date", nullable: true })
  signed: string | null;

  @Column({ type: "date", nullable: true })
  start: string | null;

  @Column({ name: "end", type: "date", nullable: true })
  end: string | null;

  @Column({ name: "auto_renew", type: "boolean", nullable: true, default: false })
  autoRenew: boolean | null;

  @Column({ name: "notice_days", type: "integer", nullable: true })
  noticeDays: number | null;

  @Column({ type: "numeric", precision: 14, scale: 2, nullable: true })
  net: string | null;

  @Column({ type: "text", nullable: true })
  signatories: string | null;

  @Column({ type: "uuid", nullable: true })
  owner: string | null;

  @Column({ type: "jsonb", default: () => "'[]'" })
  schedule: unknown;

  @Column({ type: "text", nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
