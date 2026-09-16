import type { EntityTarget, ObjectLiteral } from "typeorm";
import {
  Cluster, Deal, Tender, Quote, Contract, Payment, Campaign,
  VoucherBatch, Merchant, Redemption, Partner, Interaction, Task, CrmEvent,
  Automation, McSettings, Client, Contact,
} from "@/lib/db";

/**
 * metgo-crm collection name (as used by lib/mc/store.ts) -> TypeORM entity.
 * `clients` / `contacts` reuse CRM's own (now bilingual) tables; `batches` ->
 * voucher_batches; `settings` -> mc_settings. `users` is deliberately NOT
 * here — it's backed by `profiles` (real logins) via lib/mc/server/team.ts,
 * not the generic handler, since Profile carries passwordHash/tokenVersion
 * that must never round-trip through a generic body-driven read/write.
 */
export const MC_REGISTRY: Record<string, EntityTarget<ObjectLiteral>> = {
  clients: Client,
  clusters: Cluster,
  contacts: Contact,
  deals: Deal,
  tenders: Tender,
  quotes: Quote,
  contracts: Contract,
  payments: Payment,
  campaigns: Campaign,
  batches: VoucherBatch,
  merchants: Merchant,
  redemptions: Redemption,
  partners: Partner,
  interactions: Interaction,
  tasks: Task,
  events: CrmEvent,
  automations: Automation,
  settings: McSettings,
};

export type McCollection = keyof typeof MC_REGISTRY;

export const isMcCollection = (c: string): c is McCollection =>
  Object.prototype.hasOwnProperty.call(MC_REGISTRY, c);
