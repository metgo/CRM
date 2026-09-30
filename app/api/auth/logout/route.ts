import { NextResponse } from "next/server";
import { getCurrentUser, invalidateSessions } from "@/lib/auth";

const COOKIE_NAME = "auth_token";

export async function POST() {
  const auth = await getCurrentUser();
  if (auth) await invalidateSessions(auth.user.id);

  const response = NextResponse.json({ success: true });

  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}
