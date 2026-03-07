"use client";

import { format } from "date-fns";
import { he } from "date-fns/locale";
import {
  Building2,
  CheckCircle,
  Bell,
  MessageSquare,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  CLIENT_STATUS_LABELS,
  COMMUNICATION_TYPE_ICONS,
  COMMUNICATION_TYPE_LABELS,
} from "@/lib/utils/hebrew-status";
import Link from "next/link";

interface DashboardContentProps {
  userName: string;
  kpis: {
    totalClients: number;
    activeClients: number;
    openReminders: number;
    messagesSent: number;
  };
  recentCommunications: any[];
  upcomingReminders: any[];
  statusCounts: Record<string, number>;
}

const STATUS_CHART_COLORS: Record<string, string> = {
  lead: "#3b82f6",
  active: "#22c55e",
  negotiation: "#eab308",
  paused: "#9ca3af",
  closed: "#ef4444",
};

export function DashboardContent({
  userName,
  kpis,
  recentCommunications,
  upcomingReminders,
  statusCounts,
}: DashboardContentProps) {
  const chartData = Object.entries(statusCounts).map(([status, count]) => ({
    name: CLIENT_STATUS_LABELS[status as keyof typeof CLIENT_STATUS_LABELS] ?? status,
    value: count,
    color: STATUS_CHART_COLORS[status] ?? "#9ca3af",
  }));

  const kpiCards = [
    {
      label: "סה\"כ מועצות",
      value: kpis.totalClients,
      icon: Building2,
      color: "text-blue-600",
      bg: "bg-blue-50",
      href: "/clients",
    },
    {
      label: "מועצות פעילות",
      value: kpis.activeClients,
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-50",
      href: "/clients",
    },
    {
      label: "תזכורות פתוחות",
      value: kpis.openReminders,
      icon: Bell,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
      href: "/reminders",
    },
    {
      label: "הודעות החודש",
      value: kpis.messagesSent,
      icon: MessageSquare,
      color: "text-purple-600",
      bg: "bg-purple-50",
      href: "/communications",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          שלום, {userName || "משתמש"} 👋
        </h2>
        <p className="text-gray-500 mt-1">
          {format(new Date(), "EEEE, dd בMMMM yyyy", { locale: he })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Link key={kpi.label} href={kpi.href}>
              <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-600">
                    {kpi.label}
                  </span>
                  <div className={`w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${kpi.color}`} />
                  </div>
                </div>
                <p className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</p>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Communications */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">תקשורת אחרונה</h3>
            <Link
              href="/communications"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              הכל
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentCommunications.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                אין רשומות תקשורת עדיין
              </div>
            ) : (
              recentCommunications.slice(0, 7).map((comm: any) => (
                <div key={comm.id} className="px-6 py-3 flex items-center gap-3">
                  <span className="text-lg flex-shrink-0">
                    {COMMUNICATION_TYPE_ICONS[comm.type as keyof typeof COMMUNICATION_TYPE_ICONS]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {comm.clients?.name ?? "—"}
                      </span>
                      <span className="text-xs text-gray-500">
                        {COMMUNICATION_TYPE_LABELS[comm.type as keyof typeof COMMUNICATION_TYPE_LABELS]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{comm.body}</p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                    {format(new Date(comm.created_at), "dd/MM HH:mm", {
                      locale: he,
                    })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Pie Chart */}
          {chartData.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                מועצות לפי סטטוס
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Upcoming Reminders */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">תזכורות קרובות</h3>
              <Link
                href="/reminders"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                הכל
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {upcomingReminders.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">
                  אין תזכורות קרובות
                </div>
              ) : (
                upcomingReminders.map((r: any) => (
                  <div key={r.id} className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {r.title}
                    </p>
                    {r.clients && (
                      <p className="text-xs text-gray-500 truncate">
                        {r.clients.name}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {format(new Date(r.due_at), "dd/MM/yyyy HH:mm", {
                        locale: he,
                      })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">פעולות מהירות</h3>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/clients/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Building2 className="w-4 h-4" />
            + מועצה חדשה
          </Link>
          <Link
            href="/reminders"
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Bell className="w-4 h-4" />
            כל התזכורות
          </Link>
          <Link
            href="/templates"
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            תבניות הודעה
          </Link>
        </div>
      </div>
    </div>
  );
}
