export type Lang = "he" | "en";
export type Bi = { he: string; en: string };

let current: Lang = (() => {
  try {
    const v = localStorage.getItem("metgo_lang");
    return v === "en" ? "en" : "he";
  } catch {
    return "he";
  }
})();

const listeners = new Set<() => void>();

export const lang = () => current;
export function setLang(l: Lang) {
  current = l;
  try {
    localStorage.setItem("metgo_lang", l);
  } catch {
    /* private mode */
  }
  if (typeof document !== "undefined") {
    document.documentElement.lang = l;
    document.documentElement.dir = l === "he" ? "rtl" : "ltr";
  }
  listeners.forEach((fn) => fn());
}
export function onLangChange(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Pick the current language out of a bilingual value. */
export const L = (v: Bi | string | undefined | null): string =>
  v == null ? "" : typeof v === "string" ? v : v[current] || v.he || v.en || "";

const S: Record<string, Bi> = {
  app: { he: "מטגו CRM", en: "Metgo CRM" },
  dashboard: { he: "דשבורד", en: "Dashboard" },
  deals: { he: "עסקאות", en: "Deals" },
  tenders: { he: "מכרזים", en: "Tenders" },
  quotes: { he: "הצעות מחיר", en: "Quotes" },
  clients: { he: "לקוחות ורשויות", en: "Clients & Authorities" },
  clusters: { he: "אשכולות", en: "Clusters" },
  contacts: { he: "אנשי קשר", en: "Contacts" },
  contracts: { he: "חוזים והזמנות", en: "Contracts & POs" },
  payments: { he: "תשלומים וגבייה", en: "Payments & Collections" },
  campaigns: { he: "קמפיינים", en: "Campaigns" },
  batches: { he: "מנות תווים", en: "Voucher batches" },
  vouchers: { he: "תווים", en: "Vouchers" },
  merchants: { he: "עסקים מקומיים", en: "Local businesses" },
  redemptions: { he: "מימושים", en: "Redemptions" },
  partners: { he: "שותפים", en: "Partners" },
  interactions: { he: "פגישות והתקשרויות", en: "Meetings & calls" },
  tasks: { he: "משימות", en: "Tasks" },
  events: { he: "אירועים", en: "Events" },
  users: { he: "צוות", en: "Team" },
  automations: { he: "אוטומציות", en: "Automations" },
  reports: { he: "דוחות", en: "Reports" },
  settings: { he: "הגדרות", en: "Settings" },
  search: { he: "חיפוש…", en: "Search…" },
  searchResults: { he: "תוצאות חיפוש", en: "Search results" },
  g_main: { he: "ראשי", en: "Main" },
  g_sales: { he: "מכירות", en: "Sales" },
  g_clients: { he: "לקוחות", en: "Clients" },
  g_money: { he: "כספים", en: "Finance" },
  g_impact: { he: "אימפקט", en: "Impact" },
  g_work: { he: "עבודה שוטפת", en: "Daily work" },
  g_system: { he: "מערכת", en: "System" },
  save: { he: "שמירה", en: "Save" },
  cancel: { he: "ביטול", en: "Cancel" },
  edit: { he: "עריכה", en: "Edit" },
  del: { he: "מחיקה", en: "Delete" },
  confirmDel: { he: "למחוק את הרשומה? הפעולה אינה הפיכה.", en: "Delete this record? This cannot be undone." },
  addRecord: { he: "הוספת רשומה", en: "Add record" },
  addRow: { he: "הוספת שורה", en: "Add row" },
  required: { he: "שדה חובה", en: "Required field" },
  saved: { he: "נשמר", en: "Saved" },
  deleted: { he: "נמחק", en: "Deleted" },
  saveFailed: { he: "השמירה נכשלה", en: "Save failed" },
  details: { he: "פרטים", en: "Details" },
  computed: { he: "מחושב", en: "Computed" },
  emptyTitle: { he: "אין עדיין רשומות", en: "Nothing here yet" },
  emptyBody: { he: "הוסיפו את הרשומה הראשונה כדי להתחיל.", en: "Add the first record to get started." },
  records: { he: "רשומות", en: "records" },
  board: { he: "לוח", en: "Board" },
  table: { he: "טבלה", en: "Table" },
  alerts: { he: "התראות פעילות", en: "Live alerts" },
  alertsNote: {
    he: "החוקים נבדקים על הנתונים בכל טעינה ומציגים כאן מה דורש טיפול. שליחת מיילים ותזכורות בפועל דורשת שירות שרת (ראו README).",
    en: "Rules run against your data on every load and surface what needs attention. Actually sending emails and reminders needs a server job (see the README)."
  },
  createTask: { he: "צור משימה", en: "Create task" },
  taskCreated: { he: "המשימה נוצרה", en: "Task created" },
  noAlerts: { he: "אין התראות פתוחות. הכול בזמן.", en: "No open alerts. Everything is on time." },
  money: { he: "כסף", en: "Money" },
  salesBand: { he: "מכירות", en: "Sales" },
  impactBand: { he: "אימפקט", en: "Impact" },
  openDebt: { he: "חוב פתוח", en: "Open debt" },
  collected: { he: "תקבולים", en: "Collected" },
  forecast: { he: "תחזית הכנסות", en: "Revenue forecast" },
  aging: { he: "גיול חובות", en: "Debt aging" },
  committed: { he: "מובטח", en: "Committed" },
  weighted: { he: "משוקלל", en: "Weighted" },
  annualTarget: { he: "יעד שנתי", en: "Annual target" },
  ofTarget: { he: "מהיעד", en: "of target" },
  open: { he: "פתוחים", en: "Open" },
  active: { he: "פעילים", en: "Active" },
  redeemed: { he: "מומשו", en: "Redeemed" },
  expired: { he: "פגי תוקף", en: "Expired" },
  partly: { he: "מומשו חלקית", en: "Partly redeemed" },
  liability: { he: "התחייבות פתוחה", en: "Open liability" },
  pace: { he: "קצב מול זמן", en: "Pace vs schedule" },
  progress: { he: "התקדמות", en: "Progress" },
  bottleneck: { he: "צוואר בקבוק", en: "Bottleneck" },
  days: { he: "ימים", en: "days" },
  d: { he: "י", en: "d" },
  today: { he: "היום", en: "Today" },
  noNextStep: { he: "אין צעד הבא", en: "No next step" },
  clients_count: { he: "לקוחות", en: "clients" },
  over60: { he: "מעל 60 יום", en: "over 60 days" },
  trigger: { he: "טריגר", en: "Trigger" },
  condition: { he: "תנאי", en: "Condition" },
  action: { he: "פעולה", en: "Action" },
  recipient: { he: "נמען", en: "Recipient" },
  firingNow: { he: "פעיל כרגע", en: "Firing now" },
  enabled: { he: "מופעל", en: "Enabled" },
  signIn: { he: "כניסה למערכת", en: "Sign in" },
  emailLabel: { he: "כתובת מייל", en: "Email address" },
  sendLink: { he: "שליחת קישור כניסה", en: "Send sign-in link" },
  linkSent: { he: "נשלח קישור כניסה למייל.", en: "A sign-in link is on its way to your inbox." },
  signOut: { he: "יציאה", en: "Sign out" },
  localMode: { he: "מצב מקומי", en: "Local mode" },
  connected: { he: "מחובר", en: "Connected" },
  localWarn: {
    he: "המערכת פועלת ללא שרת — הנתונים נשמרים בדפדפן הזה בלבד. הגדירו Supabase בקובץ .env כדי לעבוד כצוות.",
    en: "Running without a server — data is stored in this browser only. Configure Supabase in .env to work as a team."
  },
  loading: { he: "טוען…", en: "Loading…" },
  noResults: { he: "לא נמצאו תוצאות", en: "No results" },
  typeMore: { he: "הקלידו לפחות שתי אותיות.", en: "Type at least two characters." },
  general: { he: "כללי", en: "General" },
  yes: { he: "כן", en: "Yes" },
  no: { he: "לא", en: "No" },
  none: { he: "—", en: "—" },
  vat: { he: "מע״מ", en: "VAT" },
  gross: { he: "כולל מע״מ", en: "Gross" },
  net: { he: "לפני מע״מ", en: "Net" },
  subtotal: { he: "סה״כ לפני מע״מ", en: "Subtotal" },
  totalIncl: { he: "סה״כ כולל מע״מ", en: "Total incl. VAT" },
  commission: { he: "עמלה", en: "Commission" },
  daysInStage: { he: "ימים בשלב / SLA", en: "Days in stage / SLA" },
  verbalGap: { he: "פער בע״פ→הזמנה", en: "Verbal→PO gap" },
  nextAction: { he: "הפעולה הבאה", en: "Next action" },
  notSet: { he: "לא הוגדרה", en: "Not set" },
  lastContact: { he: "קשר אחרון", en: "Last contact" },
  parameters: { he: "פרמטרים", en: "Parameters" },
  dataCounts: { he: "נתונים במערכת", en: "Data in the system" },
  reportTemplates: { he: "תבניות דוח", en: "Report templates" },
  snapshot: { he: "תמונת מצב עכשיו", en: "Snapshot now" }
};

export const t = (key: string): string => L(S[key]) || key;
