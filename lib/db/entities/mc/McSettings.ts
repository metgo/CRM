import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("mc_settings")
export class McSettings {
  @PrimaryColumn({ type: "text", default: "main" })
  id: string;

  @Column({ type: "numeric", precision: 5, scale: 2, default: 18 })
  vat: string;

  @Column({ name: "target_year", type: "numeric", precision: 14, scale: 2, default: 2900000 })
  targetYear: string;

  @Column({ name: "sla_lead", type: "integer", default: 7 })
  slaLead: number;

  @Column({ name: "sla_meeting", type: "integer", default: 14 })
  slaMeeting: number;

  @Column({ name: "sla_quote", type: "integer", default: 21 })
  slaQuote: number;

  @Column({ name: "sla_verbal", type: "integer", default: 14 })
  slaVerbal: number;

  @Column({ name: "sla_po", type: "integer", default: 30 })
  slaPo: number;

  @Column({ name: "gap_ok", type: "integer", default: 14 })
  gapOk: number;

  @Column({ name: "gap_warn", type: "integer", default: 30 })
  gapWarn: number;

  @Column({ name: "debt_after", type: "integer", default: 3 })
  debtAfter: number;

  @Column({ name: "doc_hours", type: "integer", default: 24 })
  docHours: number;
}
