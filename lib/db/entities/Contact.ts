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
import { Client } from "./Client";

@Entity("contacts")
@Index(["clientId"])
@Index(["organizationId"])
export class Contact {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "organization_id", type: "uuid" })
  organizationId: string;

  // DB column is nullable since AddMetgoCrm (mc contacts link via `links` jsonb).
  @Column({ name: "client_id", type: "uuid", nullable: true })
  clientId: string;

  // DB columns are nullable since AddMetgoCrm; the mc API mirrors them from name_he.
  @Column({ name: "first_name", type: "varchar", length: 100, nullable: true })
  firstName: string;

  @Column({ name: "last_name", type: "varchar", length: 100, nullable: true })
  lastName: string;

  // --- metgo-crm bilingual fields (all nullable, added by AddMetgoCrm migration) ---
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
  // --- end metgo-crm fields ---

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

  @ManyToOne(() => Client, "contacts")
  @JoinColumn({ name: "client_id" })
  client: Relation<Client>;
}
