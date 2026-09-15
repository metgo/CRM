"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyEmailStatus() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState<"pending" | "success" | "error">(token ? "pending" : "error");
  const [error, setError] = useState(token ? "" : "קישור האימות אינו תקין.");

  useEffect(() => {
    if (!token) return;
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setStatus("error");
          setError(data?.error || "הקישור אינו תקין או שפג תוקפו");
          return;
        }
        setStatus("success");
      })
      .catch(() => {
        setStatus("error");
        setError("שגיאה בחיבור לשרת");
      });
  }, [token]);

  if (status === "pending") {
    return <p className="text-center text-sm text-gray-500">מאמת את כתובת האימייל...</p>;
  }
  if (status === "success") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 text-sm text-center">
        כתובת האימייל אומתה בהצלחה.{" "}
        <Link href="/" className="font-medium hover:underline">
          כניסה למערכת
        </Link>
      </div>
    );
  }
  return <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 text-sm text-center">{error}</div>;
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">M</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">אימות אימייל</h1>
        </div>

        <Suspense fallback={null}>
          <VerifyEmailStatus />
        </Suspense>
      </div>
    </div>
  );
}
