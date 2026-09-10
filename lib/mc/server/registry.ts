import type { EntityTarget, ObjectLiteral } from "typeorm";
import {
  AppUser, Cluster, Deal, Tender, Quote, Contract, Payment, Campaign,
  VoucherBatch, Merchant, Redemption, Partner, Interaction, Task, CrmEvent,
  Automation, McSettings, Client, Contact,
} from "@/lib/db";

/**
 * metgo-crm collection name (as used by lib/mc/store.ts) -> TypeORM entity.
 * `clients` / `contacts` reuse CRM's own (now bilingual) tables; `users` is the
 * standalone `app_users` team directory; `batches` -> voucher_batches;
 * `settings` -> mc_settings.
 */
export const MC_REGISTRY: Record<string, EntityTarget<ObjectLiteral>> = {
  users: AppUser,
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
