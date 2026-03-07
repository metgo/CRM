"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Search, Download, ChevronLeft } from "lucide-react";
import {
  CLIENT_STATUS_LABELS,
  CLIENT_STATUS_COLORS,
  CLIENT_STATUSES,
} from "@/lib/utils/hebrew-status";
import { exportToCSV } from "@/lib/utils/csv-export";
import type { Client, ClientStatus } from "@/types/database";

type ClientWithProfile = Client & { profiles: { full_name: string } | null };

interface ClientsTableProps {
  clients: ClientWithProfile[];
}

export function ClientsTable({ clients }: ClientsTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClientStatus | "all">("all");

  const filtered = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.region ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExport = () => {
    exportToCSV(
      filtered,
      [
        { key: "name", label: "שם מועצה" },
        { key: "status", label: "סטטוס" },
        { key: "region", label: "אזור" },
        { key: "address", label: "כתובת" },
        { key: "created_at", label: "תאריך יצירה" },
      ],
      "מועצות"
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Filters */}
      <div className="p-4 border-b border-gray-200 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="חיפוש לפי שם או אזור..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-9 pl-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as ClientStatus | "all")
          }
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">כל הסטטוסים</option>
          {CLIENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {CLIENT_STATUS_LABELS[s]}
            </option>
          ))}
        </select>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          ייצוא CSV
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                שם מועצה
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                סטטוס
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                אזור
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                אחראי
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                תאריך
              </th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-gray-400 text-sm"
                >
                  לא נמצאו מועצות
                </td>
              </tr>
            ) : (
              filtered.map((client) => (
                <tr
                  key={client.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/clients/${client.id}`}
                      className="font-medium text-gray-900 hover:text-blue-600"
                    >
                      {client.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CLIENT_STATUS_COLORS[client.status]}`}
                    >
                      {CLIENT_STATUS_LABELS[client.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {client.region ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {client.profiles?.full_name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {format(new Date(client.created_at), "dd/MM/yyyy", {
                      locale: he,
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/clients/${client.id}`}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
        מציג {filtered.length} מתוך {clients.length} מועצות
      </div>
    </div>
  );
}
