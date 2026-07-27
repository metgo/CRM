import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import type { Relation } from "typeorm";
import { Organization } from "./Organization";
import { Client } from "./Client";
import { Communication } from "./Communication";
import { Reminder } from "./Reminder";

export type UserRole = "admin" | "agent";

@Entity("profiles")
export class Profile {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "organization_id", type: "uuid" })
  organizationId: string;

  @Column({ name: "full_name", type: "varchar", length: 255 })
  fullName: string;

  @Column({ type: "varchar", length: 255, unique: true })
  email: string;

  @Column({ name: "password_hash", type: "varchar", length: 255 })
  passwordHash: string;

  @Column({ type: "varchar", length: 20, default: "agent" })
  role: UserRole;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @ManyToOne(() => Organization, "profiles")
  @JoinColumn({ name: "organization_id" })
  organization: Relation<Organization>;

  @OneToMany(() => Client, "assignedTo")
  assignedClients: Relation<Client[]>;

  @OneToMany(() => Communication, "user")
  communications: Relation<Communication[]>;

  @OneToMany(() => Reminder, "user")
  reminders: Relation<Reminder[]>;
}
