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
import type { Client } from "./Client";
import type { Communication } from "./Communication";

@Entity("contacts")
@Index(["clientId"])
@Index(["organizationId"])
export class Contact {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "organization_id", type: "uuid" })
  organizationId: string;

  @Column({ name: "client_id", type: "uuid" })
  clientId: string;

  @Column({ name: "first_name", type: "varchar", length: 100 })
  firstName: string;

  @Column({ name: "last_name", type: "varchar", length: 100 })
  lastName: string;

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

  @ManyToOne("Organization")
  @JoinColumn({ name: "organization_id" })
  organization: Relation<Organization>;

  @ManyToOne("Client", "contacts")
  @JoinColumn({ name: "client_id" })
  client: Relation<Client>;

  @OneToMany("Communication", "contact")
  communications: Relation<Communication[]>;
}
