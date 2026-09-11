import type { Bi } from "./i18n";
import { L } from "./i18n";

export type EnumOption = Bi & { cls?: string; sla?: number; prob?: number };
export type EnumGroup = Record<string, EnumOption>;

export const E: Record<string, EnumGroup> = {
  clientType: {
    authority: { he: "רשות מקומית", en: "Local authority", cls: "p-acc" },
    cluster: { he: "אשכול", en: "Cluster", cls: "p-info" },
    company: { he: "חברה פרטית", en: "Private company", cls: "p-mute" },
    ngo: { he: "עמותה", en: "NGO", cls: "p-mute" },
    corp: { he: "תאגיד עירוני", en: "Municipal corporation", cls: "p-mute" }
  },
  clientStatus: {
    lead: { he: "ליד", en: "Lead", cls: "p-mute" },
    inprogress: { he: "בתהליך", en: "In progress", cls: "p-info" },
    active: { he: "פעיל", en: "Active", cls: "p-ok" },
    dormant: { he: "רדום", en: "Dormant", cls: "p-warn" },
    lost: { he: "אבוד", en: "Lost", cls: "p-dan" }
  },
  region: {
    north: { he: "צפון", en: "North" },
    haifa: { he: "חיפה", en: "Haifa" },
    center: { he: "מרכז", en: "Center" },
    ta: { he: "תל אביב", en: "Tel Aviv" },
    jlm: { he: "ירושלים", en: "Jerusalem" },
    south: { he: "דרום", en: "South" }
  },
  engagement: {
    tender: { he: "מכרז", en: "Tender" },
    single: { he: "ספק יחיד", en: "Sole supplier" },
    quotes: { he: "הצעות מחיר", en: "Price quotes" },
    framework: { he: "הסכם מסגרת", en: "Framework agreement" },
    exempt: { he: "פטור", en: "Exempt" }
  },
  stage: {
    lead: { he: "ליד", en: "Lead", cls: "p-mute", prob: 10 },
    meeting: { he: "פגישה ראשונה", en: "First meeting", cls: "p-info", prob: 25 },
    quote: { he: "הצעת מחיר", en: "Quote sent", cls: "p-info", prob: 45 },
    verbal: { he: "סגירה בע״פ", en: "Verbal close", cls: "p-warn", prob: 75 },
    po: { he: "הזמנה / חוזה", en: "PO / contract", cls: "p-acc", prob: 92 },
    won: { he: "לקוח פעיל", en: "Won", cls: "p-ok", prob: 100 },
    lost: { he: "אבוד", en: "Lost", cls: "p-dan", prob: 0 }
  },
  dealType: {
    voucher: { he: "קמפיין תווים", en: "Voucher campaign" },
    renewal: { he: "חידוש", en: "Renewal" },
    event: { he: "אירוע", en: "Event" },
    service: { he: "שירות", en: "Service" }
  },
  source: {
    direct: { he: "ישיר", en: "Direct" },
    tender: { he: "מכרז", en: "Tender" },
    partner: { he: "שותף", en: "Partner" },
    inbound: { he: "פנייה נכנסת", en: "Inbound" },
    conference: { he: "כנס", en: "Conference" },
    referral: { he: "המלצה", en: "Referral" }
  },
  terms: {
    n30: { he: "שוטף+30", en: "Net+30" },
    n45: { he: "שוטף+45", en: "Net+45" },
    n60: { he: "שוטף+60", en: "Net+60" },
    n90: { he: "שוטף+90", en: "Net+90" },
    advance: { he: "מקדמה", en: "Advance" },
    milestones: { he: "תשלומים", en: "Milestones" }
  },
  tenderStatus: {
    spotted: { he: "זוהה", en: "Spotted", cls: "p-mute" },
    review: { he: "בבדיקת כדאיות", en: "Under review", cls: "p-info" },
    prep: { he: "בהכנה", en: "In preparation", cls: "p-warn" },
    submitted: { he: "הוגש", en: "Submitted", cls: "p-acc" },
    won: { he: "זכינו", en: "Won", cls: "p-ok" },
    lost: { he: "הפסדנו", en: "Lost", cls: "p-dan" }
  },
  quoteStatus: {
    draft: { he: "טיוטה", en: "Draft", cls: "p-mute" },
    sent: { he: "נשלחה", en: "Sent", cls: "p-info" },
    review: { he: "בבדיקת הלקוח", en: "Client reviewing", cls: "p-warn" },
    approved: { he: "אושרה", en: "Approved", cls: "p-ok" },
    rejected: { he: "נדחתה", en: "Rejected", cls: "p-dan" },
    expired: { he: "פג תוקף", en: "Expired", cls: "p-mute" }
  },
  contractStatus: {
    draft: { he: "טיוטה", en: "Draft", cls: "p-mute" },
    awaiting: { he: "ממתין לחתימה", en: "Awaiting signature", cls: "p-warn" },
    signed: { he: "חתום ופעיל", en: "Signed & active", cls: "p-ok" },
    ended: { he: "הסתיים", en: "Ended", cls: "p-info" }
  },
  docType: {
    contract: { he: "חוזה", en: "Contract" },
    po: { he: "הזמנת עבודה", en: "Purchase order" },
    framework: { he: "הסכם מסגרת", en: "Framework agreement" },
    addendum: { he: "נספח", en: "Addendum" }
  },
  payStatus: {
    planned: { he: "מתוכנן", en: "Planned", cls: "p-mute" },
    invoiced: { he: "חשבונית הופקה", en: "Invoiced", cls: "p-info" },
    late: { he: "באיחור", en: "Late", cls: "p-warn" },
    debt: { he: "חוב פתוח", en: "Open debt", cls: "p-dan" },
    paid: { he: "שולם", en: "Paid", cls: "p-ok" }
  },
  payType: {
    once: { he: "חד־פעמי", en: "One-time" },
    advance: { he: "מקדמה", en: "Advance" },
    milestone: { he: "אבן דרך", en: "Milestone" },
    monthly: { he: "קבוע חודשי", en: "Monthly recurring" },
    yearly: { he: "קבוע שנתי", en: "Annual recurring" }
  },
  campaignType: {
    voucher: { he: "תווים", en: "Vouchers" },
    sales: { he: "מכירות", en: "Sales" },
    deals: { he: "עסקאות", en: "Deals" },
    other: { he: "יעד אחר", en: "Other goal" }
  },
  goalMetric: {
    ils: { he: "₪ מכירות", en: "₪ sales" },
    vouchers: { he: "מספר תווים", en: "Voucher count" },
    redemptions: { he: "מימושים", en: "Redemptions" },
    merchants: { he: "עסקים חדשים", en: "New businesses" }
  },
  campaignStatus: {
    prep: { he: "בהכנה", en: "In prep", cls: "p-mute" },
    live: { he: "פעיל", en: "Live", cls: "p-ok" },
    paused: { he: "מושהה", en: "Paused", cls: "p-warn" },
    done: { he: "הסתיים", en: "Ended", cls: "p-info" }
  },
  merchantCat: {
    food: { he: "מזון ומסעדנות", en: "Food & dining" },
    fashion: { he: "אופנה", en: "Fashion" },
    leisure: { he: "פנאי", en: "Leisure" },
    health: { he: "בריאות", en: "Health" },
    services: { he: "שירותים", en: "Services" },
    retail: { he: "קמעונאות", en: "Retail" }
  },
  merchantStatus: {
    candidate: { he: "מועמד", en: "Candidate", cls: "p-mute" },
    active: { he: "פעיל", en: "Active", cls: "p-ok" },
    paused: { he: "מושהה", en: "Paused", cls: "p-warn" },
    left: { he: "עזב", en: "Left", cls: "p-dan" }
  },
  taskStatus: {
    todo: { he: "חדשה", en: "New", cls: "p-mute" },
    doing: { he: "בביצוע", en: "In progress", cls: "p-info" },
    waiting: { he: "ממתינה", en: "Waiting", cls: "p-warn" },
    done: { he: "הושלמה", en: "Done", cls: "p-ok" }
  },
  priority: {
    low: { he: "נמוכה", en: "Low", cls: "p-mute" },
    med: { he: "בינונית", en: "Medium", cls: "p-info" },
    high: { he: "גבוהה", en: "High", cls: "p-warn" },
    urgent: { he: "דחוף", en: "Urgent", cls: "p-dan" }
  },
  taskDomain: {
    sales: { he: "מכירות", en: "Sales" },
    collection: { he: "גבייה", en: "Collections" },
    doc: { he: "תיעוד", en: "Documentation" },
    ops: { he: "תפעול", en: "Operations" },
    marketing: { he: "שיווק", en: "Marketing" },
    internal: { he: "פנימי", en: "Internal" }
  },
  taskSrc: {
    manual: { he: "ידני", en: "Manual", cls: "p-mute" },
    automation: { he: "אוטומציה", en: "Automation", cls: "p-info" },
    meeting: { he: "גזירה מסיכום", en: "From a summary", cls: "p-acc" }
  },
  interactionType: {
    meeting: { he: "פגישה", en: "Meeting" },
    call: { he: "שיחת טלפון", en: "Phone call" },
    email: { he: "מייל", en: "Email" },
    whatsapp: { he: "וואטסאפ", en: "WhatsApp" },
    conference: { he: "כנס", en: "Conference" },
    visit: { he: "ביקור", en: "Site visit" }
  },
  dataSource: {
    timeless: { he: "Timeless", en: "Timeless", cls: "p-info" },
    manual: { he: "הזנה ידנית", en: "Manual entry", cls: "p-warn" },
    calendar: { he: "יומן", en: "Calendar", cls: "p-mute" },
    sync: { he: "סנכרון", en: "Sync", cls: "p-info" },
    csv: { he: "ייבוא קובץ", en: "File import", cls: "p-mute" }
  },
  voucherStatus: {
    issued: { he: "הונפק", en: "Issued", cls: "p-mute" },
    active: { he: "פעיל", en: "Active", cls: "p-info" },
    partial: { he: "מומש חלקית", en: "Partly redeemed", cls: "p-warn" },
    redeemed: { he: "מומש", en: "Redeemed", cls: "p-ok" },
    expired: { he: "פג תוקף", en: "Expired", cls: "p-dan" }
  },
  partnerType: {
    agent: { he: "סוכן", en: "Agent" },
    distributor: { he: "מפיץ", en: "Distributor" },
    advisor: { he: "יועץ", en: "Advisor" },
    strategic: { he: "שותף אסטרטגי", en: "Strategic partner" }
  },
  eventType: {
    launch: { he: "השקה", en: "Launch" },
    fair: { he: "יריד", en: "Fair" },
    conference: { he: "כנס", en: "Conference" },
    training: { he: "הדרכה לעסקים", en: "Business training" },
    community: { he: "פעילות קהילתית", en: "Community activity" }
  },
  eventStatus: {
    prep: { he: "בהכנה", en: "In prep", cls: "p-mute" },
    done: { he: "התקיים", en: "Held", cls: "p-ok" },
    cancelled: { he: "בוטל", en: "Cancelled", cls: "p-dan" }
  },
  channel: {
    online: { he: "אונליין", en: "Online", cls: "p-info" },
    offline: { he: "אופליין (POS)", en: "Offline (POS)", cls: "p-acc" },
    phone: { he: "טלפוני", en: "Phone", cls: "p-mute" }
  },
  clusterScope: {
    central: { he: "מרכזי", en: "Central" },
    framework: { he: "הסכם מסגרת", en: "Framework" },
    perAuthority: { he: "לכל רשות בנפרד", en: "Per authority" }
  },
  activeStatus: {
    active: { he: "פעיל", en: "Active", cls: "p-ok" },
    paused: { he: "מושהה", en: "Paused", cls: "p-warn" },
    ended: { he: "הסתיים", en: "Ended", cls: "p-mute" }
  }
};

export const enumLabel = (group: string, key?: string | null): string => {
  if (!key) return "";
  const o = E[group]?.[key];
  return o ? L(o) : String(key);
};
export const enumClass = (group: string, key?: string | null): string =>
  (key && E[group]?.[key]?.cls) || "p-mute";
