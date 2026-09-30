import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

export type AuthTokenPurpose = "password_reset";

/** Single-use tokens for password reset (hashed at rest). */
@Entity("auth_tokens")
export class AuthToken {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "profile_id", type: "uuid" })
  profileId: string;

  @Column({ type: "text" })
  purpose: AuthTokenPurpose;

  @Column({ name: "token_hash", type: "text" })
  tokenHash: string;

  @Column({ name: "expires_at", type: "timestamptz" })
  expiresAt: Date;

  @Column({ name: "used_at", type: "timestamptz", nullable: true })
  usedAt: Date | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
