import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from "typeorm";
import type { Relation } from "typeorm";
import { Organization } from "./Organization";
import { Profile } from "./Profile";
import { Contact } from "./Contact";
import { Communication } from "./Communication";
import { Reminder } from "./Reminder";

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

  // DB column is nullable since AddMetgoCrm; the mc API always mirrors it from
  // name_he so CRM's own pages keep seeing a string.
  @Column({ type: "varchar", length: 255, nullable: true })
  name: string;

  // --- metgo-crm bilingual / voucher-programme fields (all nullable, added by AddMetgoCrm migration) ---
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
  // --- end metgo-crm fields ---

  @Column({ type: "varchar", length: 50, default: "lead" })
  status: ClientStatus;

  @Column({ type: "varchar", length: 100, nullable: true })
  region: string | null;

  @Column({ type: "text", nullable: true })
  address: string | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  website: string | null;

  @Column({ type: "text", nullable: true })
  notes: string | null;

  @Column({ name: "assigned_to", type: "uuid", nullable: true })
  assignedToId: string | null;

  @Column({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @ManyToOne(() => Organization, "clients")
  @JoinColumn({ name: "organization_id" })
  organization: Relation<Organization>;

  @ManyToOne(() => Profile, "assignedClients", { nullable: true })
  @JoinColumn({ name: "assigned_to" })
  assignedTo: Relation<Profile> | null;

  @OneToMany(() => Contact, "client")
  contacts: Relation<Contact[]>;

  @OneToMany(() => Communication, "client")
  communications: Relation<Communication[]>;

  @OneToMany(() => Reminder, "client")
  reminders: Relation<Reminder[]>;
}
