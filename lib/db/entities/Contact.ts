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

@Entity("contacts")
@Index(["organizationId"])
export class Contact {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "organization_id", type: "uuid" })
  organizationId: string;

  @Column({ name: "name_he", type: "text", nullable: true })
  nameHe: string | null;

  @Column({ name: "name_en", type: "text", nullable: true })
  nameEn: string | null;

  @Column({ type: "text", nullable: true })
  mobile: string | null;

  @Column({ type: "text", nullable: true })
  channel: string | null;

  @Column({ type: "jsonb", default: () => "'[]'" })
  links: unknown;

  @Column({ type: "boolean", default: true })
  active: boolean;

  @Column({ name: "role_title", type: "varchar", length: 150, nullable: true })
  roleTitle: string | null;

  @Column({ type: "varchar", length: 50, nullable: true })
  phone: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  email: string | null;

  @Column({ type: "varchar", length: 50, nullable: true })
  whatsapp: string | null;

  @Column({ name: "is_primary", type: "boolean", default: false })
  isPrimary: boolean;

  @Column({ type: "text", nullable: true })
  notes: string | null;

  @Column({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: "organization_id" })
  organization: Relation<Organization>;
}
