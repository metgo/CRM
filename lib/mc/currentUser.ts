"use client";

import { useEffect, useState } from "react";

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  organizationId: string;
  emailVerified: boolean;
};

/** undefined = not fetched yet, null = not signed in / request failed. */
let cached: CurrentUser | null | undefined;
let pending: Promise<void> | null = null;
const listeners = new Set<() => void>();

function load(): void {
  if (pending) return;
  pending = fetch("/api/auth/me")
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      cached = data?.user ?? null;
    })
    .catch(() => {
      cached = null;
    })
    .finally(() => {
      pending = null;
      listeners.forEach((fn) => fn());
    });
}

/** The signed-in user (for role checks in the UI). Fetched once and cached for the session. */
export function useCurrentUser(): CurrentUser | null | undefined {
  const [, force] = useState(0);
  useEffect(() => {
    if (cached === undefined) load();
    const fn = () => force((n) => n + 1);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return cached;
}
