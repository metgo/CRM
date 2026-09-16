import { NextRequest, NextResponse } from "next/server";
import { requestSignupOtp } from "@/lib/auth";

/*
 POST /api/auth/signup
 */
export async function POST(request: NextRequest) {
  try {
    const { fullName, email, password, organizationName } = await request.json();

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { error: "Full name, email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const result = await requestSignupOtp(fullName, email, password, organizationName);

    if (!result.success) {
      const status =
        result.error === "Email already in use" ? 409 : result.code === "rate_limited" ? 429 : 500;
      return NextResponse.json({ error: result.error }, { status });
    }

    // Return the pending token — the client submits it alongside the OTP code
    return NextResponse.json({ pendingToken: result.pendingToken });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
