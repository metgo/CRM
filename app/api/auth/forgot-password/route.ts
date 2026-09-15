import { NextRequest, NextResponse } from "next/server";
import { requestPasswordReset } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    await requestPasswordReset(email);

    // Same response whether or not the email is registered — avoids leaking
    // which addresses have accounts.
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
