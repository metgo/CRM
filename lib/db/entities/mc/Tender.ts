import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("tenders")
export class Tender {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "organization_id", type: "uuid", nullable: true })
  organizationId: string | null;

  @Column({ type: "text" })
  num: string;

  @Column({ type: "uuid", nullable: true })
  client: string | null;

  @Column({ name: "title_he", type: "text", nullable: true })
  titleHe: string | null;

  @Column({ name: "title_en", type: "text", nullable: true })
  titleEn: string | null;

  @Column({ type: "text", default: "spotted" })
  status: string;

  @Column({ type: "date", nullable: true })
  published: string | null;

  @Column({ type: "date", nullable: true })
  questions: string | null;

  @Column({ type: "date", nullable: true })
  submission: string | null;

  @Column({ type: "date", nullable: true })
  decision: string | null;

  @Column({ type: "numeric", precision: 14, scale: 2, nullable: true })
  value: string | null;

  @Column({ type: "numeric", precision: 14, scale: 2, nullable: true })
  guarantee: string | null;

  @Column({ name: "guarantee_expiry", type: "date", nullable: true })
  guaranteeExpiry: string | null;

  @Column({ type: "uuid", nullable: true })
  deal: string | null;

  @Column({ type: "uuid", nullable: true })
  owner: string | null;

  @Column({ type: "jsonb", default: () => "'[]'" })
  docs: unknown;

  @Column({ type: "text", nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
