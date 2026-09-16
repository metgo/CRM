import { NextRequest, NextResponse } from "next/server";
import { verifySignupOtp } from "@/lib/auth";

const COOKIE_NAME = "auth_token";

/*
 * POST /api/auth/verify-otp
 * Step 2 of the OTP signup flow. Receives the `pendingToken` (issued by
 * /api/auth/signup) and the 6-digit `otp` the user entered. 
 */
export async function POST(request: NextRequest) {
  try {
    const { pendingToken, otp } = await request.json();

    if (!pendingToken || !otp) {
      return NextResponse.json(
        { error: "pendingToken and otp are required" },
        { status: 400 }
      );
    }

    const result = await verifySignupOtp(pendingToken, otp);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
