import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

/**
 * metgo-crm "users" collection — a directory of team members referenced by
 * deals/tasks/tenders as owner/assignee. Separate from auth `profiles`.
 */
@Entity("app_users")
export class AppUser {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "organization_id", type: "uuid", nullable: true })
  organizationId: string | null;

  @Column({ name: "name_he", type: "text" })
  nameHe: string;

  @Column({ name: "name_en", type: "text", nullable: true })
  nameEn: string | null;

  @Column({ type: "text", nullable: true })
  role: string | null;

  @Column({ type: "text", nullable: true })
  email: string | null;

  @Column({ type: "boolean", default: true })
  active: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
