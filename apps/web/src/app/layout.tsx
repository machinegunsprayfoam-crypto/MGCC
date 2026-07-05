import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "MGCC — Machine Gun Command Center",
  description:
    "The unified operating platform for Machine Gun Spray Foam & Concrete Lifting LLC.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          <header className="border-b border-white/10 bg-brand-panel">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
              <Link href="/" className="flex items-center gap-3">
                <span className="text-2xl" aria-hidden>
                  {"\u{1F52B}"}
                </span>
                <span className="font-semibold tracking-tight">
                  Machine Gun Command Center
                </span>
              </Link>
              <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand-fg">
                v0.0.1
              </span>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
