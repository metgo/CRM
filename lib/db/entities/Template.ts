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

export type TemplateType = "sms" | "email" | "whatsapp";

@Entity("templates")
@Index(["organizationId"])
export class Template {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "organization_id", type: "uuid" })
  organizationId: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "varchar", length: 20 })
  type: TemplateType;

  @Column({ type: "varchar", length: 500, nullable: true })
  subject: string | null;

  @Column({ type: "text" })
  body: string;

  @Column({ type: "text", array: true, default: [] })
  variables: string[];

  @Column({ name: "created_by", type: "uuid", nullable: true })
  createdById: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @ManyToOne("Organization")
  @JoinColumn({ name: "organization_id" })
  organization: Relation<Organization>;

  @ManyToOne("Profile", { nullable: true })
  @JoinColumn({ name: "created_by" })
  createdBy: Relation<Profile> | null;
}
