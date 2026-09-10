export { AppUser } from "./AppUser";
export { Cluster } from "./Cluster";
export { Deal } from "./Deal";
export { Tender } from "./Tender";
export { Quote } from "./Quote";
export { Contract } from "./Contract";
export { Payment } from "./Payment";
export { Campaign } from "./Campaign";
export { VoucherBatch } from "./VoucherBatch";
export { Merchant } from "./Merchant";
export { Redemption } from "./Redemption";
export { Partner } from "./Partner";
export { Interaction } from "./Interaction";
export { Task } from "./Task";
export { CrmEvent } from "./CrmEvent";
export { Automation } from "./Automation";
export { McSettings } from "./McSettings";

import { AppUser } from "./AppUser";
import { Cluster } from "./Cluster";
import { Deal } from "./Deal";
import { Tender } from "./Tender";
import { Quote } from "./Quote";
import { Contract } from "./Contract";
import { Payment } from "./Payment";
import { Campaign } from "./Campaign";
import { VoucherBatch } from "./VoucherBatch";
import { Merchant } from "./Merchant";
import { Redemption } from "./Redemption";
import { Partner } from "./Partner";
import { Interaction } from "./Interaction";
import { Task } from "./Task";
import { CrmEvent } from "./CrmEvent";
import { Automation } from "./Automation";
import { McSettings } from "./McSettings";

/** All metgo-crm entity classes, for DataSource registration. */
export const MC_ENTITIES = [
  AppUser, Cluster, Deal, Tender, Quote, Contract, Payment, Campaign,
  VoucherBatch, Merchant, Redemption, Partner, Interaction, Task, CrmEvent,
  Automation, McSettings,
];
