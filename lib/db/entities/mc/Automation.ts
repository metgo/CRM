import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("automations")
export class Automation {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "integer", unique: true })
  n: number;

  @Column({ name: "on", type: "boolean", default: true })
  on: boolean;

  @Column({ type: "jsonb" })
  trig: unknown;

  @Column({ type: "jsonb" })
  cond: unknown;

  @Column({ type: "jsonb" })
  act: unknown;

  @Column({ name: "to", type: "jsonb" })
  to: unknown;
}
