import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("events")
export class CrmEvent {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "organization_id", type: "uuid", nullable: true })
  organizationId: string | null;

  @Column({ name: "name_he", type: "text" })
  nameHe: string;

  @Column({ name: "name_en", type: "text", nullable: true })
  nameEn: string | null;

  @Column({ type: "text", nullable: true, default: "fair" })
  type: string | null;

  @Column({ type: "uuid", nullable: true })
  client: string | null;

  @Column({ type: "uuid", nullable: true })
  campaign: string | null;

  @Column({ type: "date", nullable: true })
  date: string | null;

  @Column({ type: "text", nullable: true })
  location: string | null;

  @Column({ type: "integer", nullable: true })
  est: number | null;

  @Column({ type: "integer", nullable: true })
  actual: number | null;

  @Column({ type: "uuid", array: true, default: () => "'{}'" })
  merchants: string[];

  @Column({ type: "numeric", precision: 14, scale: 2, nullable: true })
  budget: string | null;

  @Column({ type: "numeric", precision: 14, scale: 2, nullable: true })
  cost: string | null;

  @Column({ type: "uuid", nullable: true })
  owner: string | null;

  @Column({ type: "text", nullable: true, default: "prep" })
  status: string | null;

  @Column({ type: "text", nullable: true })
  goals: string | null;

  @Column({ type: "text", nullable: true })
  summary: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
