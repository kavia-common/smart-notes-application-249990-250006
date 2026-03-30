import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Notes",
  description: "A retro-themed notes app (CRUD, tagging, search).",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <div className="min-h-screen p-4 sm:p-6 md:p-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </div>
      </body>
    </html>
  );
}
