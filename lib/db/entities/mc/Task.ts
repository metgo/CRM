import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("tasks")
export class Task {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "organization_id", type: "uuid", nullable: true })
  organizationId: string | null;

  @Column({ name: "title_he", type: "text" })
  titleHe: string;

  @Column({ name: "title_en", type: "text", nullable: true })
  titleEn: string | null;

  @Column({ type: "text", nullable: true, default: "sales" })
  domain: string | null;

  @Column({ type: "uuid", nullable: true })
  client: string | null;

  @Column({ type: "uuid", nullable: true })
  deal: string | null;

  @Column({ type: "uuid", nullable: true })
  tender: string | null;

  @Column({ type: "uuid", nullable: true })
  assignee: string | null;

  @Column({ type: "text", nullable: true, default: "med" })
  priority: string | null;

  @Column({ type: "date" })
  due: string;

  @Column({ type: "text", default: "todo" })
  status: string;

  @Column({ type: "text", nullable: true, default: "manual" })
  src: string | null;

  @Column({ type: "text", nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
