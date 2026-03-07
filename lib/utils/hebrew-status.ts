import type { ClientStatus, CommunicationType, TemplateType } from "@/types/database";

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  lead: "ליד",
  active: "פעיל",
  negotiation: "משא ומתן",
  paused: "מושהה",
  closed: "סגור",
};

export const CLIENT_STATUS_COLORS: Record<ClientStatus, string> = {
  lead: "bg-blue-100 text-blue-800",
  active: "bg-green-100 text-green-800",
  negotiation: "bg-yellow-100 text-yellow-800",
  paused: "bg-gray-100 text-gray-800",
  closed: "bg-red-100 text-red-800",
};

export const COMMUNICATION_TYPE_LABELS: Record<CommunicationType, string> = {
  sms: "SMS",
  email: "אימייל",
  whatsapp: "WhatsApp",
  call: "שיחה",
  meeting: "פגישה",
  note: "הערה",
};

export const COMMUNICATION_TYPE_ICONS: Record<CommunicationType, string> = {
  sms: "📱",
  email: "✉️",
  whatsapp: "💬",
  call: "📞",
  meeting: "🤝",
  note: "📝",
};

export const TEMPLATE_TYPE_LABELS: Record<TemplateType, string> = {
  sms: "SMS",
  email: "אימייל",
  whatsapp: "WhatsApp",
};

export const CLIENT_STATUSES: ClientStatus[] = [
  "lead",
  "active",
  "negotiation",
  "paused",
  "closed",
];
