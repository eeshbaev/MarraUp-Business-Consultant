import type { Metadata } from "next";
import "./globals.css";
import { getLanguage } from "@/lib/language";
import { t } from "@/lib/ui-copy";

// Deliberately not next/font/google here: it fetches from fonts.googleapis.com
// at build time, which this build environment's network policy blocks —
// system fonts avoid that dependency entirely and cost nothing to maintain.
// Swap in next/font/google (or next/font/local) later if a custom typeface matters.

export const metadata: Metadata = {
  title: "MarraUp",
  description: "A plain-evidence business health and risk diagnostic.",
};

// No global header here on purpose: the (tabs) section (Discover/Market/
// Profile) renders its own TabHeader + bottom tab bar per page, and the
// focused flow pages (/new, /assessment, /results, /plan) render their own
// title + a "back to Profile" link — a second app-level header would just
// duplicate that. This root layout only supplies the page shell and the
// disclaimer every page carries.
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const language = await getLanguage();
  return (
    <html lang={language} className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900">
        <main className="flex-1 w-full">{children}</main>
        <footer className="border-t border-neutral-200 py-6">
          <div className="mx-auto max-w-3xl px-6 text-xs text-neutral-500">{t("layout.disclaimer", language)}</div>
        </footer>
      </body>
    </html>
  );
}
