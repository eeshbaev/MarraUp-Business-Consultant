import Link from "next/link";
import { getLanguage } from "@/lib/language";

// Shared container for the focused, forward-moving flow pages (/new,
// /assessment/[id], /results/[id], /plan/[id]) — these deliberately sit
// outside the (tabs) shell (no bottom tab bar mid-form), but still need the
// max-width/padding the old root layout used to supply, plus a way back into
// Profile now that there's no persistent header linking there.
export default async function FlowPage({ children }: { children: React.ReactNode }) {
  const language = await getLanguage();
  const backLabel: Record<string, string> = {
    en: "← Back to Profile",
    uz: "← Profilga qaytish",
    ru: "← Назад к профилю",
    zh: "← 返回个人资料",
    fr: "← Retour au profil",
  };
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/profile" className="mb-6 inline-block text-sm text-neutral-500 hover:text-neutral-700">
        {backLabel[language] || backLabel.en}
      </Link>
      {children}
    </div>
  );
}
