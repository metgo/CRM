import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("payments")
export class Payment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "organization_id", type: "uuid", nullable: true })
  organizationId: string | null;

  @Column({ type: "uuid", nullable: true })
  client: string | null;

  @Column({ type: "uuid", nullable: true })
  contract: string | null;

  @Column({ type: "text", default: "once" })
  type: string;

  @Column({ type: "numeric", precision: 14, scale: 2, default: 0 })
  net: string;

  @Column({ type: "date" })
  due: string;

  @Column({ type: "text", default: "planned" })
  status: string;

  @Column({ type: "text", nullable: true })
  invoice: string | null;

  @Column({ name: "paid_at", type: "date", nullable: true })
  paidAt: string | null;

  @Column({ name: "paid_amount", type: "numeric", precision: 14, scale: 2, nullable: true })
  paidAmount: string | null;

  @Column({ type: "integer", default: 0 })
  reminders: number;

  @Column({ type: "text", nullable: true })
  recurrence: string | null;

  @Column({ type: "text", nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
