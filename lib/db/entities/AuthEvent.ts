import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

export type AuthEventType =
  | "signup"
  | "login_success"
  | "login_failed"
  | "logout"
  | "password_reset_requested"
  | "password_reset_completed"
  | "email_verified"
  | "signup_otp_requested";

/** Append-only audit trail for auth events. */
@Entity("auth_events")
export class AuthEvent {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "organization_id", type: "uuid", nullable: true })
  organizationId: string | null;

  @Column({ name: "profile_id", type: "uuid", nullable: true })
  profileId: string | null;

  @Column({ name: "event_type", type: "text" })
  eventType: AuthEventType;

  @Column({ type: "text", nullable: true })
  ip: string | null;

  @Column({ name: "user_agent", type: "text", nullable: true })
  userAgent: string | null;

  @Column({ type: "jsonb", nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
