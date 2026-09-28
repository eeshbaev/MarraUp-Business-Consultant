import Link from "next/link";
import LanguagePicker from "@/components/LanguagePicker";
import { getLanguage } from "@/lib/language";
import { t } from "@/lib/ui-copy";

export default async function SettingsPage() {
  const language = await getLanguage();
  return (
    <div>
      <Link href="/profile" className="mb-4 inline-block text-sm text-neutral-500 hover:text-neutral-700">
        {t("common.backToProfile", language)}
      </Link>
      <h1 className="mb-6 text-xl font-semibold tracking-tight text-neutral-900">{t("common.settings", language)}</h1>

      <LanguagePicker current={language} />

      <div className="mt-6 divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
        <SettingsLink href="/profile/notifications" label={t("common.notifications", language)} />
        <SettingsLink href="/profile/privacy" label={t("common.privacy", language)} />
      </div>
    </div>
  );
}

function SettingsLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="flex items-center justify-between px-4 py-3">
      <span className="text-sm font-medium text-neutral-900">{label}</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-400">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </Link>
  );
}
