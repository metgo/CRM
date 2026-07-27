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
  Relation,
} from "typeorm";
import type { Organization } from "./Organization";
import type { Profile } from "./Profile";
import type { Contact } from "./Contact";
import type { Communication } from "./Communication";
import type { Reminder } from "./Reminder";

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

  @Column({ type: "varchar", length: 255 })
  name: string;

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

  @ManyToOne("Organization", "clients")
  @JoinColumn({ name: "organization_id" })
  organization: Relation<Organization>;

  @ManyToOne("Profile", "assignedClients", { nullable: true })
  @JoinColumn({ name: "assigned_to" })
  assignedTo: Relation<Profile> | null;

  @OneToMany("Contact", "client")
  contacts: Relation<Contact[]>;

  @OneToMany("Communication", "client")
  communications: Relation<Communication[]>;

  @OneToMany("Reminder", "client")
  reminders: Relation<Reminder[]>;
}
