"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ------------------------------------------------------------------ step 1

function SignupForm({ onOtpSent }: { onOtpSent: (token: string, email: string, payload: { fullName: string; organizationName: string; password: string }) => void }) {
  const [fullName, setFullName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("הסיסמאות אינן תואמות");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password, organizationName }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(
          data?.error === "Email already in use"
            ? "כתובת האימייל כבר רשומה במערכת"
            : data?.error || "שגיאה בהרשמה. נסה שוב."
        );
        return;
      }

      onOtpSent(data.pendingToken, email, { fullName, organizationName, password });
    } catch {
      setError("שגיאה בחיבור לשרת");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
          שם מלא
        </label>
        <input
          id="fullName"
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="ישראל ישראלי"
        />
      </div>

      <div>
        <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700 mb-1">
          שם הארגון
        </label>
        <input
          id="organizationName"
          type="text"
          value={organizationName}
          onChange={(e) => setOrganizationName(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="שם החברה או הארגון"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          כתובת אימייל
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="you@example.com"
          dir="ltr"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          סיסמה
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="••••••••"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
          אימות סיסמה
        </label>
        <input
          id="confirmPassword"
          type="password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "שולח קוד אימות..." : "המשך"}
      </button>
    </form>
  );
}

// ------------------------------------------------------------------ step 2

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 45;

function OtpForm({
  email,
  pendingToken,
  signupPayload,
  onBack,
  onNewToken,
}: {
  email: string;
  pendingToken: string;
  signupPayload: { fullName: string; organizationName: string; password: string };
  onBack: () => void;
  onNewToken: (token: string) => void;
}) {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const router = useRouter();

  // Start countdown on mount and whenever a new OTP is sent
  useEffect(() => {
    setCountdown(RESEND_COOLDOWN);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [pendingToken]); // re-run when pendingToken changes (i.e. after resend)

  const focusNext = (index: number) => inputRefs.current[index + 1]?.focus();
  const focusPrev = (index: number) => inputRefs.current[index - 1]?.focus();

  const handleChange = (index: number, raw: string) => {
    // Allow pasting a full 6-digit code into the first box
    const stripped = raw.replace(/\D/g, "");
    if (stripped.length === OTP_LENGTH) {
      const next = stripped.split("");
      setDigits(next);
      inputRefs.current[OTP_LENGTH - 1]?.focus();
      return;
    }
    const char = stripped.slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    if (char) focusNext(index);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index]) focusPrev(index);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const otp = digits.join("");
    if (otp.length < OTP_LENGTH) {
      setError("נא להזין את כל הספרות");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingToken, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "קוד שגוי. נסה שוב.");
        setDigits(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("שגיאה בחיבור לשרת");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    setError("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: signupPayload.fullName,
          email,
          password: signupPayload.password,
          organizationName: signupPayload.organizationName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "שגיאה בשליחת הקוד מחדש");
        return;
      }
      onNewToken(data.pendingToken);
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } catch {
      setError("שגיאה בחיבור לשרת");
    } finally {
      setResending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-sm text-gray-600 text-center">
        שלחנו קוד בן 6 ספרות אל{" "}
        <span className="font-medium text-gray-900" dir="ltr">{email}</span>.
        <br />
        הקוד תקף ל־10 דקות.
      </p>

      {/* OTP digit boxes */}
      <div className="flex justify-center gap-2" dir="ltr">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="w-11 h-12 text-center text-xl font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus={i === 0}
            autoComplete={i === 0 ? "one-time-code" : "off"}
          />
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm text-center">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || digits.join("").length < OTP_LENGTH}
        className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "מאמת..." : "אמת וצור חשבון"}
      </button>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <button type="button" onClick={onBack} className="hover:text-gray-700">
          ← חזרה
        </button>
        {countdown > 0 ? (
          <span className="text-gray-400">
            שלח שוב בעוד {countdown}ש׳
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="text-blue-600 hover:text-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {resending ? "שולח..." : "שלח שוב"}
          </button>
        )}
      </div>
    </form>
  );
}

// ------------------------------------------------------------------ page

export default function SignupPage() {
  const [step, setStep] = useState<"form" | "otp">("form");
  const [pendingToken, setPendingToken] = useState("");
  const [email, setEmail] = useState("");
  const [signupPayload, setSignupPayload] = useState({
    fullName: "",
    organizationName: "",
    password: "",
  });

  const handleOtpSent = (
    token: string,
    emailAddr: string,
    payload: { fullName: string; organizationName: string; password: string }
  ) => {
    setPendingToken(token);
    setEmail(emailAddr);
    setSignupPayload(payload);
    setStep("otp");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">M</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">MetGo CRM</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {step === "form" ? "יצירת חשבון חדש" : "אימות כתובת האימייל"}
          </p>
        </div>

        {step === "form" ? (
          <>
            <SignupForm onOtpSent={handleOtpSent} />
            <p className="text-center text-sm text-gray-500 mt-6">
              כבר יש לך חשבון?{" "}
              <Link href="/login" className="text-blue-600 font-medium hover:underline">
                התחבר
              </Link>
            </p>
          </>
        ) : (
          <OtpForm
            email={email}
            pendingToken={pendingToken}
            signupPayload={signupPayload}
            onBack={() => setStep("form")}
            onNewToken={setPendingToken}
          />
        )}
      </div>
    </div>
  );
}
