import { layout, button } from "@/lib/email/templates";

type Email = { subject: string; html: string };

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const money = (net: string | number) =>
  new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 })
    .format(Number(net) || 0);

const date = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}.${m}.${y}`;
};

const appLink = (path: string) => `${process.env.APP_URL || "http://localhost:3000"}${path}`;

/** Hebrew paragraph followed by its English translation, for internal emails. */
const bi = (he: string, en: string) =>
  `<p dir="rtl" style="text-align:right;">${he}</p><p style="color:#666;">${en}</p>`;

export type PaymentFacts = {
  client: string;
  net: string;
  due: string;
  invoice: string | null;
};

/** Rule 1 — internal: invoice needs issuing before the due date. */
export function invoiceDueSoonEmail(p: PaymentFacts, daysLeft: number): Email {
  const client = esc(p.client);
  return {
    subject: `להפיק חשבונית · ${p.client} · ${date(p.due)}`,
    html: layout(
      "Invoice to issue",
      bi(
        `תשלום של <b>${money(p.net)}</b> מ־<b>${client}</b> מגיע למועדו ב־${date(p.due)} (בעוד ${daysLeft} ימים) ועדיין לא הופקה חשבונית.`,
        `A payment of <b>${money(p.net)}</b> from <b>${client}</b> is due on ${date(p.due)} (in ${daysLeft} days) and has not been invoiced yet.`
      ) + button(appLink("/payments"), "Open payments")
    ),
  };
}

/** Rules 2–3 — to the client's billing contact. */
export function paymentReminderEmail(
  p: PaymentFacts,
  opts: { contactName: string; orgName: string; daysOverdue: number }
): Email {
  const greeting = opts.contactName ? `שלום ${esc(opts.contactName)},` : "שלום,";
  const when = opts.daysOverdue > 0
    ? `שמועד תשלומו היה ב־${date(p.due)} (לפני ${opts.daysOverdue} ימים)`
    : `שמועד תשלומו היום, ${date(p.due)}`;
  const invoice = p.invoice ? ` (חשבונית מס׳ ${esc(p.invoice)})` : "";
  return {
    subject: opts.daysOverdue > 0
      ? `תזכורת: תשלום באיחור${p.invoice ? ` · חשבונית ${p.invoice}` : ""}`
      : `תזכורת: תשלום לתאריך ${date(p.due)}${p.invoice ? ` · חשבונית ${p.invoice}` : ""}`,
    html: layout(
      "תזכורת תשלום",
      `<p>${greeting}</p>
       <p>זוהי תזכורת ידידותית לגבי תשלום על סך <b>${money(p.net)}</b> (לפני מע״מ)${invoice}, ${when}.</p>
       <p>אם התשלום כבר בוצע, אפשר להתעלם מהודעה זו. לכל שאלה נשמח לעזור.</p>
       <p>בברכה,<br/>${esc(opts.orgName)}</p>`,
      "rtl"
    ),
  };
}

/** Rules 2–3 fallback — internal: the reminder could not go out. */
export function missingContactEmail(p: PaymentFacts): Email {
  const client = esc(p.client);
  return {
    subject: `לא נשלחה תזכורת תשלום · ${p.client}`,
    html: layout(
      "Payment reminder not sent",
      bi(
        `לא נמצא איש קשר עם כתובת מייל עבור <b>${client}</b>, ולכן תזכורת התשלום על סך ${money(p.net)} (יעד ${date(p.due)}) לא נשלחה. הוסיפו איש קשר המשויך ללקוח.`,
        `No contact with an email is linked to <b>${client}</b>, so the reminder for ${money(p.net)} (due ${date(p.due)}) was not sent. Add a contact linked to this client.`
      ) + button(appLink("/contacts"), "Open contacts")
    ),
  };
}

/** Rule 4 — internal: payment escalated to open debt. */
export function debtEscalationEmail(p: PaymentFacts, reminders: number, daysOverdue: number): Email {
  const client = esc(p.client);
  return {
    subject: `חוב פתוח · ${p.client} · ${money(p.net)}`,
    html: layout(
      "Open debt",
      bi(
        `התשלום של <b>${client}</b> על סך <b>${money(p.net)}</b> סומן כחוב פתוח: ${reminders} תזכורות נשלחו, ${daysOverdue} ימי פיגור. נפתחה משימת גבייה דחופה.`,
        `<b>${client}</b>'s payment of <b>${money(p.net)}</b> is now open debt: ${reminders} reminders sent, ${daysOverdue} days overdue. An urgent collection task was created.`
      ) + button(appLink("/payments"), "Open payments")
    ),
  };
}

export type TaskFacts = {
  title: string;
  due: string;
  priority: string | null;
};

const PRIORITY: Record<string, [string, string]> = {
  low: ["נמוכה", "Low"], med: ["בינונית", "Medium"], high: ["גבוהה", "High"], urgent: ["דחוף", "Urgent"],
};

/** Rule 18 — internal: a task was assigned to you. */
export function taskAssignedEmail(t: TaskFacts, assignedBy: string | null): Email {
  const title = esc(t.title);
  const [pHe, pEn] = PRIORITY[t.priority ?? ""] ?? ["", ""];
  const byHe = assignedBy ? ` על ידי ${esc(assignedBy)}` : "";
  const byEn = assignedBy ? ` by ${esc(assignedBy)}` : "";
  return {
    subject: `משימה חדשה: ${t.title}`,
    html: layout(
      "New task assigned to you",
      bi(
        `הוקצתה לך משימה${byHe}: <b>${title}</b><br/>יעד: ${date(t.due)}${pHe ? ` · עדיפות: ${pHe}` : ""}`,
        `A task was assigned to you${byEn}: <b>${title}</b><br/>Due: ${date(t.due)}${pEn ? ` · Priority: ${pEn}` : ""}`
      ) + button(appLink("/tasks"), "Open tasks")
    ),
  };
}

/** Rule 19 — internal: task due tomorrow, today, or overdue by `offset` days. */
export function taskReminderEmail(t: TaskFacts, offset: number): Email {
  const title = esc(t.title);
  const [whenHe, whenEn, subj] =
    offset < 0 ? ["מחר", "tomorrow", "מחר"]
    : offset === 0 ? ["היום", "today", "היום"]
    : [`באיחור של ${offset} ימים`, `${offset} days overdue`, `באיחור ${offset} ימים`];
  return {
    subject: `${offset > 0 ? "משימה באיחור" : "תזכורת משימה"} (${subj}): ${t.title}`,
    html: layout(
      offset > 0 ? "Task overdue" : "Task reminder",
      bi(
        offset > 0
          ? `המשימה <b>${title}</b> ${whenHe} (יעד ${date(t.due)}) ועדיין לא הושלמה.`
          : `המשימה <b>${title}</b> מגיעה ליעד ${whenHe}, ${date(t.due)}.`,
        offset > 0
          ? `<b>${title}</b> is ${whenEn} (due ${date(t.due)}) and not completed yet.`
          : `<b>${title}</b> is due ${whenEn}, ${date(t.due)}.`
      ) + button(appLink("/tasks"), "Open tasks")
    ),
  };
}

export type ContractSignedSummary = {
  client: string;
  po: string | null;
  clientActivated: boolean;
  payments: { label: string; due: string; net: string }[];
  paymentsSkipped: string | null;
  tasks: { title: string; due: string }[];
};

/** Rule 17 — internal: what the system did when a contract was signed. */
export function contractSignedEmail(s: ContractSignedSummary): Email {
  const client = esc(s.client);
  const doc = s.po ? ` (${esc(s.po)})` : "";
  const li = (items: string[]) => `<ul style="padding-inline-start:20px;">${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;

  const payHe = s.payments.length
    ? `נוצרו ${s.payments.length} שורות תשלום:` + li(s.payments.map((p) => `${esc(p.label)} · ${money(p.net)} · ${date(p.due)}`))
    : `לא נוצרו שורות תשלום${s.paymentsSkipped ? `: ${esc(s.paymentsSkipped)}` : ""}.`;
  const payEn = s.payments.length
    ? `${s.payments.length} payment rows created:` + li(s.payments.map((p) => `${esc(p.label)} · ${money(p.net)} · ${date(p.due)}`))
    : `No payment rows created${s.paymentsSkipped ? `: ${esc(s.paymentsSkipped)}` : ""}.`;
  const tasks = li(s.tasks.map((t) => `${esc(t.title)} · ${date(t.due)}`));

  return {
    subject: `חוזה נחתם · ${s.client}`,
    html: layout(
      "Contract signed",
      `<div dir="rtl" style="text-align:right;">
         <p>החוזה עם <b>${client}</b>${doc} סומן כחתום. המערכת ביצעה:</p>
         ${s.clientActivated ? "<p>✓ הלקוח עודכן לסטטוס פעיל.</p>" : ""}
         <p>✓ ${payHe}</p>
         ${s.tasks.length ? `<p>✓ נפתחו ${s.tasks.length} משימות קליטה:</p>${tasks}` : ""}
       </div>
       <div style="color:#666;">
         <p>The contract with <b>${client}</b>${doc} was marked signed. The system:</p>
         ${s.clientActivated ? "<p>✓ Set the client to active.</p>" : ""}
         <p>✓ ${payEn}</p>
         ${s.tasks.length ? `<p>✓ Opened ${s.tasks.length} onboarding tasks.</p>` : ""}
       </div>` + button(appLink("/payments"), "Open payments")
    ),
  };
}

