import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("quotes")
export class Quote {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "organization_id", type: "uuid", nullable: true })
  organizationId: string | null;

  @Column({ type: "uuid", nullable: true })
  deal: string | null;

  @Column({ type: "integer", default: 1 })
  ver: number;

  @Column({ type: "date", nullable: true })
  date: string | null;

  @Column({ type: "date", nullable: true })
  valid: string | null;

  @Column({ type: "text", default: "draft" })
  status: string;

  @Column({ type: "uuid", nullable: true })
  contact: string | null;

  @Column({ type: "uuid", nullable: true })
  owner: string | null;

  @Column({ type: "jsonb", default: () => "'[]'" })
  lines: unknown;

  @Column({ type: "text", nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
