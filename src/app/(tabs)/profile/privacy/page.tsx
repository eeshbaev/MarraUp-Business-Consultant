import Link from "next/link";
import { getLanguage } from "@/lib/language";
import { t } from "@/lib/ui-copy";

export default async function PrivacyPage() {
  const language = await getLanguage();
  return (
    <div>
      <Link href="/profile" className="mb-4 inline-block text-sm text-neutral-500 hover:text-neutral-700">
        {t("common.backToProfile", language)}
      </Link>
      <h1 className="mb-6 text-xl font-semibold tracking-tight text-neutral-900">{t("privacy.title", language)}</h1>

      <div className="space-y-4 text-sm text-neutral-700">
        <p>{t("privacy.p1", language)}</p>
        <p>{t("privacy.p2", language)}</p>
        <p>{t("privacy.p3", language)}</p>
        <p>{t("privacy.p4", language)}</p>
      </div>
    </div>
  );
}
