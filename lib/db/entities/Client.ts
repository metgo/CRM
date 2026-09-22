import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import type { Relation } from "typeorm";
import { Organization } from "./Organization";

export type ClientStatus = "lead" | "active" | "negotiation" | "paused" | "closed";

@Entity("clients")
@Index(["organizationId"])
@Index(["status"])
@Index(["deletedAt"])
export class Client {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "organization_id", type: "uuid" })
  organizationId: string;

  @Column({ name: "name_he", type: "text", nullable: true })
  nameHe: string | null;

  @Column({ name: "name_en", type: "text", nullable: true })
  nameEn: string | null;

  @Column({ type: "text", nullable: true, default: "authority" })
  type: string | null;

  @Column({ type: "uuid", nullable: true })
  cluster: string | null;

  @Column({ type: "integer", nullable: true })
  population: number | null;

  @Column({ type: "text", nullable: true })
  engagement: string | null;

  @Column({ name: "valid_until", type: "date", nullable: true })
  validUntil: string | null;

  @Column({ type: "uuid", nullable: true })
  owner: string | null;

  @Column({ type: "text", nullable: true })
  source: string | null;

  @Column({ type: "smallint", nullable: true })
  satisfaction: number | null;

  @Column({ type: "date", nullable: true })
  activated: string | null;

  @Column({ type: "text", nullable: true })
  phone: string | null;

  @Column({ type: "varchar", length: 50, default: "lead" })
  status: ClientStatus;

  @Column({ type: "varchar", length: 100, nullable: true })
  region: string | null;

  @Column({ type: "text", nullable: true })
  address: string | null;

  @Column({ type: "text", nullable: true })
  notes: string | null;

  @Column({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @ManyToOne(() => Organization, "clients")
  @JoinColumn({ name: "organization_id" })
  organization: Relation<Organization>;
}
