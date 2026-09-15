"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  COLLECTIONS, peek, startRealtime, useMcStore,
  type CollName, type Rec
} from "@/lib/mc/store";
import { SCHEMA } from "@/lib/mc/schema";
import { lang, setLang, t, type Lang } from "@/lib/mc/i18n";
import { daysAgo } from "@/lib/mc/format";
import { payStatus } from "@/lib/mc/compute";
import { RecordDrawer, type DrawerTarget } from "./RecordDrawer";

type NavItem = { id: string; icon: string; badge?: () => number; alert?: boolean };
const NAV_GROUPS: Array<{ group: string; items: NavItem[] }> = [
  { group: "g_main", items: [{ id: "dashboard", icon: "▦" }] },
  {
    group: "g_sales",
    items: [
      { id: "deals", icon: "◈", badge: () => peek("deals").filter((d) => !["won", "lost"].includes(d.stage)).length },
      { id: "tenders", icon: "◆", badge: () => peek("tenders").filter((x) => !["won", "lost"].includes(x.status)).length },
      { id: "quotes", icon: "▤" }
    ]
  },
  {
    group: "g_clients",
    items: [{ id: "clients", icon: "◉", badge: () => peek("clients").length }, { id: "clusters", icon: "⬡" }, { id: "contacts", icon: "☏" }]
  },
  {
    group: "g_money",
    items: [
      { id: "contracts", icon: "▣" },
      { id: "payments", icon: "₪", badge: () => peek("payments").filter((p) => payStatus(p) === "debt").length, alert: true }
    ]
  },
  {
    group: "g_impact",
    items: [{ id: "campaigns", icon: "◎" }, { id: "vouchers", icon: "▨" }, { id: "merchants", icon: "⌂" }, { id: "redemptions", icon: "⇄" }]
  },
  {
    group: "g_work",
    items: [
      { id: "tasks", icon: "✓", badge: () => peek("tasks").filter((k) => k.status !== "done" && (daysAgo(k.due) || 0) > 0).length, alert: true },
      { id: "interactions", icon: "◷" },
      { id: "events", icon: "★" }
    ]
  },
  { group: "g_system", items: [{ id: "partners", icon: "⚯" }, { id: "automations", icon: "⚡" }, { id: "reports", icon: "▥" }, { id: "settings", icon: "⚙" }] }
];

/** Nav item id -> real Next.js route. Every id matches its route segment 1:1. */
const hrefFor = (id: string) => (id === "dashboard" ? "/" : `/${id}`);

interface AppShellContextValue {
  openRecord: (target: DrawerTarget) => void;
  showToast: (msg: string) => void;
}
const AppShellContext = createContext<AppShellContextValue | null>(null);

/** Pages call this to get `onOpen`/`onToast` for the ported mc page components. */
export function useAppShell(): AppShellContextValue {
  const ctx = useContext(AppShellContext);
  if (!ctx) throw new Error("useAppShell must be used within AppShell");
  return ctx;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  useMcStore();
  const pathname = usePathname();
  const [target, setTarget] = useState<DrawerTarget>(null);
  const [toast, setToast] = useState("");
  const [query, setQuery] = useState("");
  const [navOpen, setNavOpen] = useState(false);
  const [, forceLang] = useState(0);

  useEffect(() => {
    const stop = startRealtime();
    return stop;
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang();
    document.documentElement.dir = lang() === "he" ? "rtl" : "ltr";
  }, []);

  const openRecord = useCallback((target: DrawerTarget) => setTarget(target), []);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2400);
  }, []);

  const switchLang = (l: Lang) => {
    setLang(l);
    document.documentElement.lang = l;
    document.documentElement.dir = l === "he" ? "rtl" : "ltr";
    forceLang((n) => n + 1);
  };

  const toggleTheme = () => {
    const el = document.documentElement;
    const cur = el.getAttribute("data-theme");
    const next = cur === "dark" ? "light" : cur === "light" ? "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches ? "light" : "dark";
    el.setAttribute("data-theme", next);
    el.classList.toggle("dark", next === "dark");
    try { localStorage.setItem("metgo_theme", next); } catch { /* ignore */ }
  };

  const signOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch { /* ignore */ }
    window.location.href = "/login";
  };

  const q = query.trim().toLowerCase();
  const searching = q.length >= 2;
  const searchResults: Array<{ coll: CollName; rec: Rec }> = [];
  if (searching) {
    COLLECTIONS.forEach((c) => {
      if (c === "settings" || c === "automations") return;
      peek(c).forEach((r) => {
        const hay = Object.values(r).filter((v) => typeof v === "string").join(" ").toLowerCase();
        if (hay.includes(q)) searchResults.push({ coll: c, rec: r });
      });
    });
  }

  const activeId = pathname === "/" ? "dashboard" : pathname.slice(1).split("/")[0];
  const title = searching ? t("searchResults") : t(activeId);

  return (
    <AppShellContext.Provider value={{ openRecord, showToast }}>
      <div className="mc">
        <div id="app">
          <aside className={`nav ${navOpen ? "open" : ""}`}>
            <div className="brand">
              <span className="mark">מ</span>
              <span>
                <b>{t("app")}</b>
                <small>METGO</small>
              </span>
            </div>
            <div className="navgroups">
              {NAV_GROUPS.map((g) => (
                <div key={g.group} style={{ display: "contents" }}>
                  <div className="navgroup">{t(g.group)}</div>
                  {g.items.map((it) => {
                    const n = it.badge?.() ?? 0;
                    const active = activeId === it.id;
                    return (
                      <Link
                        key={it.id}
                        href={hrefFor(it.id)}
                        className={`navitem ${active ? "on" : ""}`}
                        onClick={() => setNavOpen(false)}
                      >
                        <span className="ic">{it.icon}</span>
                        <span>{t(it.id)}</span>
                        {n ? <span className={`cnt ${it.alert ? "alert" : ""}`}>{n}</span> : null}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          </aside>

          <div>
            <header className="topbar">
              <button className="navtoggle" onClick={() => setNavOpen((v) => !v)} aria-label="menu">☰</button>
              <div className="crumb"><b>{title}</b></div>
              <div className="search">
                <span className="mag">⌕</span>
                <input
                  type="search"
                  value={query}
                  placeholder={t("search")}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="langsw">
                <button className={lang() === "he" ? "on" : ""} onClick={() => switchLang("he")}>עב</button>
                <button className={lang() === "en" ? "on" : ""} onClick={() => switchLang("en")}>EN</button>
              </div>
              <button className="tbtn" onClick={toggleTheme} aria-label="theme">◐</button>
              <button className="tbtn" onClick={() => void signOut()}>{t("signOut")}</button>
            </header>

            <main>
              {searching ? (
                searchResults.length ? (
                  <div className="card alist">
                    {searchResults.map(({ coll, rec }) => (
                      <div className="arow" key={`${coll}-${rec.id}`} onClick={() => openRecord({ coll, id: rec.id })}>
                        <span className="txt">
                          <span className="t1">{SCHEMA[coll].title(rec)}</span>
                          <span className="t2">{t(coll)}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="tablewrap"><div className="empty">{t("noResults")}</div></div>
                )
              ) : (
                children
              )}
            </main>
          </div>
        </div>

        {target ? (
          <RecordDrawer
            target={target}
            onClose={() => setTarget(null)}
            onOpen={setTarget}
            onToast={showToast}
          />
        ) : null}

        <div id="toast" className={toast ? "on" : ""}>{toast}</div>
      </div>
    </AppShellContext.Provider>
  );
}
