import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Relation,
} from "typeorm";
import type { Organization } from "./Organization";
import type { Profile } from "./Profile";
import type { Client } from "./Client";

@Entity("reminders")
@Index(["userId", "dueAt", "isDone"])
export class Reminder {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "organization_id", type: "uuid" })
  organizationId: string;

  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @Column({ name: "client_id", type: "uuid", nullable: true })
  clientId: string | null;

  @Column({ type: "varchar", length: 255 })
  title: string;

  @Column({ type: "text", nullable: true })
  notes: string | null;

  @Column({ name: "due_at", type: "timestamptz" })
  dueAt: Date;

  @Column({ name: "is_done", type: "boolean", default: false })
  isDone: boolean;

  @Column({ name: "done_at", type: "timestamptz", nullable: true })
  doneAt: Date | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @ManyToOne("Organization")
  @JoinColumn({ name: "organization_id" })
  organization: Relation<Organization>;

  @ManyToOne("Profile", "reminders")
  @JoinColumn({ name: "user_id" })
  user: Relation<Profile>;

  @ManyToOne("Client", "reminders", { nullable: true })
  @JoinColumn({ name: "client_id" })
  client: Relation<Client> | null;
}
