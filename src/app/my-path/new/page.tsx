import Link from "next/link";
import { createProjectAction } from "@/app/journey-actions";
import { getUserProfile } from "@/lib/db";
import { MARKET_RESEARCH } from "@/lib/market-research-data";
import { findSectorGroup } from "@/lib/sector-taxonomy";
import { getLanguage } from "@/lib/language";
import { t } from "@/lib/ui-copy";

export const dynamic = "force-dynamic";

export default async function NewProjectPage({ searchParams }: { searchParams: Promise<{ source?: string; description?: string }> }) {
  const language = await getLanguage();
  const { source, description } = await searchParams;
  const profile = getUserProfile();
  const activeSource = source === "self" || description ? "self" : "market_gap";

  const countryData = profile ? MARKET_RESEARCH[profile.country as keyof typeof MARKET_RESEARCH] : undefined;
  const gapItems =
    countryData?.flatMap((sector) =>
      (sector.gaps ?? []).slice(0, 1).map((gap) => ({
        sectorId: sector.sectorId,
        sectorName: findSectorGroup(sector.sectorId)?.name[language] ?? sector.sectorId,
        text: gap.description,
      }))
    ) ?? [];

  return (
    <div>
      <Link href="/my-path" className="mb-4 inline-block text-xs text-neutral-500">
        {t("journey.backToMyPath", language)}
      </Link>
      <h1 className="text-lg font-semibold text-neutral-900">{t("newProject.title", language)}</h1>
      <p className="mt-1 text-xs text-neutral-500">{t("newProject.subtitle", language)}</p>

      <div className="mt-4 flex gap-2 text-xs font-semibold">
        <Link
          href="/my-path/new?source=market_gap"
          className={`flex-1 rounded-md border px-3 py-2 text-center ${activeSource === "market_gap" ? "border-neutral-900 bg-neutral-50 text-neutral-900" : "border-neutral-200 text-neutral-500"}`}
        >
          {t("newProject.marketGap", language)}
        </Link>
        <Link
          href="/my-path/new?source=self"
          className={`flex-1 rounded-md border px-3 py-2 text-center ${activeSource === "self" ? "border-neutral-900 bg-neutral-50 text-neutral-900" : "border-neutral-200 text-neutral-500"}`}
        >
          {t("newProject.ownIdea", language)}
        </Link>
      </div>

      {activeSource === "market_gap" ? (
        <div className="mt-5 space-y-2">
          {gapItems.length === 0 && <p className="text-xs text-neutral-500">{t("newProject.noGaps", language)}</p>}
          {gapItems.slice(0, 12).map((gap, i) => (
            <form key={i} action={createProjectAction}>
              <input type="hidden" name="source" value="market_gap" />
              <input type="hidden" name="market_gap_sector_id" value={gap.sectorId} />
              <input type="hidden" name="market_gap_text" value={gap.text} />
              <button type="submit" className="block w-full rounded-md border border-neutral-200 p-3 text-left hover:border-neutral-400">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">{gap.sectorName}</div>
                <div className="mt-0.5 line-clamp-2 text-xs text-neutral-800">{gap.text}</div>
              </button>
            </form>
          ))}
        </div>
      ) : (
        <form action={createProjectAction} className="mt-5 space-y-3">
          <input type="hidden" name="source" value="self" />
          <textarea
            name="self_description"
            required
            rows={4}
            defaultValue={description ?? ""}
            placeholder={t("newProject.placeholder", language)}
            className="w-full rounded-md border border-neutral-200 p-3 text-sm"
          />
          <button type="submit" className="w-full rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white">
            {t("newProject.start", language)}
          </button>
        </form>
      )}
    </div>
  );
}
