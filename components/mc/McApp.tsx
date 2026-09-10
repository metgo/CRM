"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  COLLECTIONS, loadAll, rows, startRealtime, subscribe,
  type CollName, type Rec
} from "@/lib/mc/store";
import { SCHEMA } from "@/lib/mc/schema";
import { lang, setLang, t, type Lang } from "@/lib/mc/i18n";
import { daysAgo } from "@/lib/mc/format";
import { payStatus } from "@/lib/mc/compute";
import { RecordDrawer, type DrawerTarget } from "./RecordDrawer";
import { Dashboard } from "./pages/Dashboard";
import { DealsBoard } from "./pages/DealsBoard";
import { CollectionPage } from "./pages/CollectionPage";
import { Vouchers } from "./pages/Vouchers";
import { Automations } from "./pages/Automations";
import { Reports } from "./pages/Reports";
import { SettingsPage } from "./pages/SettingsPage";

type Route =
  | { kind: "page"; id: "dashboard" | "vouchers" | "automations" | "reports" | "settings" | "search" }
  | { kind: "coll"; id: CollName };

type NavItem = { id: string; icon: string; badge?: () => number; alert?: boolean; href?: string };
const NAV_GROUPS: Array<{ group: string; items: NavItem[] }> = [
  { group: "g_main", items: [{ id: "dashboard", icon: "▦" }] },
  {
    group: "g_sales",
    items: [
      { id: "deals", icon: "◈", badge: () => rows("deals").filter((d) => !["won", "lost"].includes(d.stage)).length },
      { id: "tenders", icon: "◆", badge: () => rows("tenders").filter((x) => !["won", "lost"].includes(x.status)).length },
      { id: "quotes", icon: "▤" }
    ]
  },
  {
    group: "g_clients",
    items: [{ id: "clients", icon: "◉", badge: () => rows("clients").length }, { id: "clusters", icon: "⬡" }, { id: "contacts", icon: "☏" }]
  },
  {
    group: "g_money",
    items: [
      { id: "contracts", icon: "▣" },
      { id: "payments", icon: "₪", badge: () => rows("payments").filter((p) => payStatus(p) === "debt").length, alert: true }
    ]
  },
  {
    group: "g_impact",
    items: [{ id: "campaigns", icon: "◎" }, { id: "vouchers", icon: "▨" }, { id: "merchants", icon: "⌂" }, { id: "redemptions", icon: "⇄" }]
  },
  {
    group: "g_work",
    items: [
      { id: "tasks", icon: "✓", badge: () => rows("tasks").filter((k) => k.status !== "done" && (daysAgo(k.due) || 0) > 0).length, alert: true },
      { id: "interactions", icon: "◷" },
      { id: "events", icon: "★" }
    ]
  },
  { group: "g_system", items: [{ id: "partners", icon: "⚯" }, { id: "automations", icon: "⚡" }, { id: "reports", icon: "▥" }, { id: "settings", icon: "⚙" }] },
  {
    group: "g_messaging",
    items: [
      { id: "communications", icon: "✉", href: "/communications" },
      { id: "templates", icon: "❏", href: "/templates" },
      { id: "reminders", icon: "⏰", href: "/reminders" }
    ]
  },
  {
    group: "g_classic",
    items: [
      { id: "classicDashboard", icon: "▤", href: "/dashboard" },
      { id: "classicClients", icon: "◉", href: "/clients" },
      { id: "classicContacts", icon: "☏", href: "/contacts" }
    ]
  }
];

type PageId = "dashboard" | "vouchers" | "automations" | "reports" | "settings" | "search";
const PAGE_IDS: PageId[] = ["dashboard", "vouchers", "automations", "reports", "settings", "search"];
const parseHash = (): Route => {
  const h = (typeof window !== "undefined" ? window.location.hash || "#dashboard" : "#dashboard").slice(1);
  if ((PAGE_IDS as string[]).includes(h)) return { kind: "page", id: h as PageId };
  if ((COLLECTIONS as readonly string[]).includes(h)) return { kind: "coll", id: h as CollName };
  return { kind: "page", id: "dashboard" };
};

export default function McApp() {
  const [, force] = useState(0);
  const rerender = useCallback(() => force((n) => n + 1), []);
  const [route, setRoute] = useState<Route>({ kind: "page", id: "dashboard" });
  const [target, setTarget] = useState<DrawerTarget>(null);
  const [toast, setToast] = useState("");
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [navOpen, setNavOpen] = useState(false);

  /* ---------------------------------------------------------------- data */
  useEffect(() => {
    let stop = () => {};
    void loadAll().then(() => {
      setReady(true);
      stop = startRealtime();
    });
    const unsub = subscribe(rerender);
    return () => {
      unsub();
      stop();
    };
  }, [rerender]);

  /* -------------------------------------------------------------- routing */
  useEffect(() => {
    setRoute(parseHash());
    const onHash = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHash);
    document.documentElement.lang = lang();
    document.documentElement.dir = lang() === "he" ? "rtl" : "ltr";
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const go = (id: string) => {
    window.location.hash = id;
    setRoute(parseHash());
    setNavOpen(false);
    window.scrollTo(0, 0);
  };

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2400);
  }, []);

  const switchLang = (l: Lang) => {
    setLang(l);
    rerender();
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

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const out: Array<{ coll: CollName; rec: Rec }> = [];
    COLLECTIONS.forEach((c) => {
      if (c === "settings" || c === "automations") return;
      rows(c).forEach((r) => {
        const hay = Object.values(r).filter((v) => typeof v === "string").join(" ").toLowerCase();
        if (hay.includes(q)) out.push({ coll: c, rec: r });
      });
    });
    return out.slice(0, 40);
  }, [query]);

  if (!ready) {
    return <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", color: "var(--muted)" }}>{t("loading")}</div>;
  }

  const title = route.kind === "coll" ? t(route.id) : route.id === "search" ? t("searchResults") : t(route.id);

  const body = (() => {
    if (query.trim().length >= 2) {
      return searchResults.length ? (
        <div className="card alist">
          {searchResults.map(({ coll, rec }) => (
            <div className="arow" key={`${coll}-${rec.id}`} onClick={() => setTarget({ coll, id: rec.id })}>
              <span className="txt">
                <span className="t1">{SCHEMA[coll].title(rec)}</span>
                <span className="t2">{t(coll)}</span>
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="tablewrap"><div className="empty">{t("noResults")}</div></div>
      );
    }
    if (route.kind === "coll") {
      if (route.id === "deals") return <DealsBoard onOpen={setTarget} />;
      return <CollectionPage coll={route.id} onOpen={setTarget} />;
    }
    switch (route.id) {
      case "vouchers": return <Vouchers onOpen={setTarget} />;
      case "automations": return <Automations onToast={showToast} />;
      case "reports": return <Reports />;
      case "settings": return <SettingsPage onOpen={setTarget} onToast={showToast} />;
      default: return <Dashboard onOpen={setTarget} onToast={showToast} />;
    }
  })();

  return (
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
                  const active = route.id === it.id;
                  if (it.href) {
                    return (
                      <a key={it.id} className="navitem" href={it.href}>
                        <span className="ic">{it.icon}</span>
                        <span>{t(it.id)}</span>
                      </a>
                    );
                  }
                  return (
                    <button key={it.id} className={`navitem ${active ? "on" : ""}`} onClick={() => go(it.id)}>
                      <span className="ic">{it.icon}</span>
                      <span>{t(it.id)}</span>
                      {n ? <span className={`cnt ${it.alert ? "alert" : ""}`}>{n}</span> : null}
                    </button>
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

          <main>{body}</main>
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
  );
}
