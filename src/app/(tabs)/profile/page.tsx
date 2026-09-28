import Link from "next/link";
import TabHeader from "@/components/TabHeader";
import DeleteBusinessButton from "@/components/DeleteBusinessButton";
import { listBusinesses, getUserProfile, getDiscoverAnswers, listActiveProjects } from "@/lib/db";
import { getLanguage } from "@/lib/language";
import { COUNTRIES } from "@/lib/market-copy";
import { t } from "@/lib/ui-copy";
import { computeMilestones } from "@/lib/discover/milestones";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const businesses = listBusinesses();
  const language = await getLanguage();
  const profile = getUserProfile();
  const countryLabel = profile ? COUNTRIES.find((c) => c.code === profile.country)?.label[language] : undefined;

  const discover = getDiscoverAnswers();
  const projects = discover ? listActiveProjects() : [];
  const milestones = discover
    ? computeMilestones({
        discoveryCompleted: !!discover.completed_at,
        directionExplored: !!discover.direction_explored_at,
        projectCount: projects.length,
        activeProjectCount: projects.length,
        anyProjectPastFind: projects.some((p) => p.stage !== "finding"),
      })
    : [];

  return (
    <div>
      <TabHeader title={t("header.profile.title", language)} language={language} />

      {profile && (
        <section className="mb-8 flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 flex-none items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-neutral-100">
              {profile.photo_data_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.photo_data_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-neutral-300">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )}
            </div>
            <div>
              <div className="font-semibold text-neutral-900">{profile.display_name}</div>
              {countryLabel && <div className="text-sm text-neutral-500">{countryLabel}</div>}
            </div>
          </div>
          <Link href="/profile/identity" className="text-sm font-medium text-neutral-500 underline underline-offset-2 hover:text-neutral-700">
            {t("profile.editIdentity", language)}
          </Link>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{t("profile.myBusiness", language)}</h2>

        {businesses.length > 0 && (
          <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
            {businesses.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <div className="font-medium text-neutral-900">{b.name}</div>
                  <div className="text-sm text-neutral-500">{b.sector}</div>
                </div>
                <div className="flex items-center gap-4">
                  <Link href={`/results/${b.id}`} className="text-sm text-neutral-700 underline underline-offset-2">
                    {t("common.view", language)}
                  </Link>
                  <Link href={`/reassess/${b.id}`} className="text-sm text-neutral-700 underline underline-offset-2">
                    Reassess
                  </Link>
                  <DeleteBusinessButton businessId={b.id} businessName={b.name} language={language} />
                </div>
              </li>
            ))}
          </ul>
        )}

        <Link
          href="/new/intro"
          className="block rounded-lg border border-dashed border-neutral-300 px-4 py-3 text-center text-sm font-medium text-neutral-700 hover:border-neutral-400"
        >
          {t("profile.assessNew", language)}
        </Link>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{t("profile.myPathSection", language)}</h2>
        {discover ? (
          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <div className="text-sm font-semibold text-neutral-900">
              {discover.completed_at ? "Discovery completed" : "Discovery in progress"}
            </div>
            <ul className="mt-3 space-y-1.5">
              {milestones.map((m) => (
                <li key={m.id} className="flex items-center gap-2 text-sm">
                  <span
                    className={`flex h-4 w-4 flex-none items-center justify-center rounded-full text-[10px] ${
                      m.achieved ? "bg-neutral-900 text-white" : "border border-neutral-300 text-transparent"
                    }`}
                    aria-hidden
                  >
                    ✓
                  </span>
                  <span className={m.achieved ? "text-neutral-800" : "text-neutral-400"}>{m.label}</span>
                </li>
              ))}
            </ul>
            <Link
              href={discover.completed_at ? "/my-path/results" : "/my-path/start"}
              className="mt-3 inline-block text-sm font-medium text-neutral-700 underline underline-offset-2 hover:text-neutral-900"
            >
              {discover.completed_at ? "See my directions" : "Continue"}
            </Link>
          </div>
        ) : (
          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <div className="text-sm font-semibold text-neutral-900">{t("profile.myPathEmptyTitle", language)}</div>
            <p className="mt-1 text-sm text-neutral-500">{t("profile.myPathEmptyBody", language)}</p>
            <Link href="/my-path" className="mt-3 inline-block text-sm font-medium text-neutral-700 underline underline-offset-2 hover:text-neutral-900">
              {t("profile.myPathLearnMore", language)}
            </Link>
          </div>
        )}
      </section>

      <section className="mt-8 space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{t("profile.accountSection", language)}</h2>
        <div className="rounded-lg border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
          {t("profile.accountBody", language)}
        </div>
      </section>
    </div>
  );
}
