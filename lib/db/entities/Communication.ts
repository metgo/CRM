import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import type { Relation } from "typeorm";
import type { Organization } from "./Organization";
import type { Client } from "./Client";
import type { Contact } from "./Contact";
import type { Profile } from "./Profile";

export type CommunicationType = "sms" | "email" | "whatsapp" | "call" | "meeting" | "note";
export type CommunicationDirection = "outbound" | "inbound";

@Entity("communications")
@Index(["clientId"])
@Index(["organizationId"])
@Index(["createdAt"])
export class Communication {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "organization_id", type: "uuid" })
  organizationId: string;

  @Column({ name: "client_id", type: "uuid" })
  clientId: string;

  @Column({ name: "contact_id", type: "uuid", nullable: true })
  contactId: string | null;

  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @Column({ type: "varchar", length: 20 })
  type: CommunicationType;

  @Column({ type: "varchar", length: 20, default: "outbound" })
  direction: CommunicationDirection;

  @Column({ type: "varchar", length: 500, nullable: true })
  subject: string | null;

  @Column({ type: "text" })
  body: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  status: string | null;

  @Column({ name: "inforu_message_id", type: "varchar", length: 100, nullable: true })
  inforuMessageId: string | null;

  @Column({ name: "sent_at", type: "timestamptz", nullable: true })
  sentAt: Date | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @ManyToOne("Organization")
  @JoinColumn({ name: "organization_id" })
  organization: Relation<Organization>;

  @ManyToOne("Client", "communications")
  @JoinColumn({ name: "client_id" })
  client: Relation<Client>;

  @ManyToOne("Contact", "communications", { nullable: true })
  @JoinColumn({ name: "contact_id" })
  contact: Relation<Contact> | null;

  @ManyToOne("Profile", "communications")
  @JoinColumn({ name: "user_id" })
  user: Relation<Profile>;
}
