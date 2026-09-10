import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("interactions")
export class Interaction {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "organization_id", type: "uuid", nullable: true })
  organizationId: string | null;

  @Column({ type: "text", default: "meeting" })
  type: string;

  @Column({ type: "uuid", nullable: true })
  client: string | null;

  @Column({ type: "uuid", nullable: true })
  deal: string | null;

  @Column({ type: "uuid", array: true, default: () => "'{}'" })
  contacts: string[];

  @Column({ type: "date" })
  date: string;

  @Column({ type: "integer", nullable: true })
  dur: number | null;

  @Column({ type: "uuid", nullable: true })
  owner: string | null;

  @Column({ type: "text", nullable: true, default: "manual" })
  source: string | null;

  @Column({ type: "boolean", default: false })
  documented: boolean;

  @Column({ type: "text", nullable: true })
  summary: string | null;

  @Column({ type: "text", nullable: true })
  decisions: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
