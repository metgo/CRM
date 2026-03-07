import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MetGo CRM",
  description: "מערכת ניהול לקוחות - מועצות אזוריות",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
