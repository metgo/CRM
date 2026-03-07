import { format } from "date-fns";
import { he } from "date-fns/locale";

export interface TemplateVariables {
  contact_name?: string;
  council_name?: string;
  date?: string;
  user_name?: string;
  phone?: string;
  email?: string;
}

export function parseTemplate(
  body: string,
  vars: TemplateVariables
): string {
  const today = format(new Date(), "dd/MM/yyyy", { locale: he });
  const replacements: Record<string, string> = {
    "{{contact_name}}": vars.contact_name ?? "",
    "{{council_name}}": vars.council_name ?? "",
    "{{date}}": vars.date ?? today,
    "{{user_name}}": vars.user_name ?? "",
    "{{phone}}": vars.phone ?? "",
    "{{email}}": vars.email ?? "",
  };

  return Object.entries(replacements).reduce(
    (text, [key, val]) => text.replaceAll(key, val),
    body
  );
}

export const TEMPLATE_VARIABLES = [
  { key: "{{contact_name}}", label: "שם איש קשר" },
  { key: "{{council_name}}", label: "שם מועצה" },
  { key: "{{date}}", label: "תאריך היום" },
  { key: "{{user_name}}", label: "שם המשתמש" },
  { key: "{{phone}}", label: "טלפון" },
  { key: "{{email}}", label: "אימייל" },
];
