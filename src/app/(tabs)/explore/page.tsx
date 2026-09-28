import Link from "next/link";
import TabHeader from "@/components/TabHeader";
import { getLanguage } from "@/lib/language";
import { t } from "@/lib/ui-copy";
import { getDiscoverAnswers, listBusinesses } from "@/lib/db";

// Explore (formerly Discover) — the app's entry surface. MarraUp has no
// investor marketplace and no directory of other people's businesses, so
// this is no longer a browse page: it's two doors into the two things
// MarraUp actually does — find a direction to build in, or evaluate a
// business you already run — following the same routing the Profile page
// already uses for each (discover.completed_at picks Start vs Results;
// businesses.length picks whether a "view mine" link appears).
export default async function ExplorePage() {
  const language = await getLanguage();
  const discover = getDiscoverAnswers();
  const businesses = listBusinesses();

  const discoverHref = discover?.completed_at ? "/my-path/results" : "/my-path/start";
  const discoverCta = discover?.completed_at ? t("explore.notSureCtaContinue", language) : t("explore.notSureCta", language);

  return (
    <div>
      <TabHeader title={t("tab.explore", language)} subtitle={t("header.explore.subtitle", language)} language={language} />

      <div className="space-y-4">
        <Link
          href={discoverHref}
          className="block rounded-lg border border-neutral-200 bg-white p-5 hover:border-neutral-400"
        >
          <div className="text-base font-semibold text-neutral-900">{t("explore.notSureTitle", language)}</div>
          <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">{t("explore.notSureBody", language)}</p>
          <span className="mt-3 inline-block text-sm font-medium text-neutral-900 underline underline-offset-2">
            {discoverCta}
          </span>
        </Link>

        <Link
          href="/new/intro"
          className="block rounded-lg border border-neutral-200 bg-white p-5 hover:border-neutral-400"
        >
          <div className="text-base font-semibold text-neutral-900">{t("explore.runningTitle", language)}</div>
          <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">{t("explore.runningBody", language)}</p>
          <span className="mt-3 inline-block text-sm font-medium text-neutral-900 underline underline-offset-2">
            {t("explore.runningCta", language)}
          </span>
        </Link>

        {businesses.length > 0 && (
          <Link
            href="/profile"
            className="block text-center text-sm font-medium text-neutral-500 underline underline-offset-2 hover:text-neutral-700"
          >
            {t("explore.viewBusinesses", language)}
          </Link>
        )}
      </div>
    </div>
  );
}
