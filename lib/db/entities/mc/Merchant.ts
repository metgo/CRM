import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("merchants")
export class Merchant {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "organization_id", type: "uuid", nullable: true })
  organizationId: string | null;

  @Column({ name: "name_he", type: "text" })
  nameHe: string;

  @Column({ name: "name_en", type: "text", nullable: true })
  nameEn: string | null;

  @Column({ type: "text", nullable: true })
  bn: string | null;

  @Column({ type: "text", nullable: true })
  cat: string | null;

  @Column({ type: "uuid", nullable: true })
  client: string | null;

  @Column({ type: "text", default: "candidate" })
  status: string;

  @Column({ type: "date", nullable: true })
  joined: string | null;

  @Column({ type: "text", nullable: true })
  address: string | null;

  @Column({ type: "text", nullable: true })
  phone: string | null;

  @Column({ name: "owner_name", type: "text", nullable: true })
  ownerName: string | null;

  @Column({ type: "integer", nullable: true, default: 0 })
  redemptions: number | null;

  @Column({ type: "numeric", precision: 14, scale: 2, nullable: true, default: 0 })
  revenue: string | null;

  @Column({ type: "date", nullable: true })
  last: string | null;

  @Column({ type: "text", nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
