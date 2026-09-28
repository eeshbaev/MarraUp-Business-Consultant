import Link from "next/link";
import { getDiscoverAnswers } from "@/lib/db";
import { rankDirections } from "@/lib/discover/engine";
import { explainDirection, directionDisplayName } from "@/lib/discover/explain";
import { findSectorGroup } from "@/lib/sector-taxonomy";
import type { SectorId } from "@/lib/discover/sectors";
import { exploreDirectionAction } from "@/app/discover-actions";
import { getLanguage } from "@/lib/language";

export const dynamic = "force-dynamic";

// "Recommended direction to explore" / "Worth exploring" — deliberately not
// "This direction fits you" (Methodology v1.0 Part 8's humbled presentation
// language). MarraUp's position: there is enough evidence in what you've
// told us to make this territory worth investigating — never a verdict.
export default async function DiscoverResultsPage() {
  const language = await getLanguage();
  const record = getDiscoverAnswers();

  if (!record) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <p className="text-sm text-neutral-600">You haven&apos;t started My Path yet.</p>
        <Link href="/my-path/start" className="mt-4 inline-block text-sm font-medium underline underline-offset-2">
          Start now
        </Link>
      </div>
    );
  }

  const directions = rankDirections({ tags: record.tags, hardExclusions: record.hardExclusions as SectorId[] });

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <Link href="/profile" className="mb-6 inline-block text-sm text-neutral-500 hover:text-neutral-700">
        Back to Profile
      </Link>

      <h1 className="text-xl font-semibold tracking-tight text-neutral-900">Your directions</h1>
      <p className="mt-1.5 text-sm text-neutral-600">
        Based on what you told us, here {directions.length === 1 ? "is a direction" : "are directions"} worth exploring — not a verdict on
        what you should do, just evidence worth a closer look.
      </p>

      {directions.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-neutral-300 bg-white p-4 text-sm text-neutral-600">
          We couldn&apos;t find enough evidence in your answers to suggest a direction with confidence. That&apos;s an honest result, not
          an error — you can revisit your answers any time.
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {directions.map((d) => {
            const group = findSectorGroup(d.sectorId);
            const label = group ? group.name[language] : d.sectorId;
            return (
              <div key={d.sectorId} className="rounded-lg border border-neutral-200 bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Recommended direction to explore</div>
                <div className="mt-1 text-base font-semibold text-neutral-900">{directionDisplayName(label, d.subSector)}</div>
                <div className="mt-2 text-sm leading-relaxed text-neutral-700">
                  <span className="font-medium text-neutral-800">Why this appeared: </span>
                  {explainDirection(d)}
                </div>
                <form action={exploreDirectionAction} className="mt-3">
                  <input type="hidden" name="sector_id" value={d.sectorId} />
                  <button type="submit" className="text-sm font-medium text-neutral-700 underline underline-offset-2 hover:text-neutral-900">
                    Explore this direction →
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 flex gap-3">
        <Link
          href="/my-path/start"
          className="rounded-md border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Review my answers
        </Link>
        <Link
          href="/my-path/new"
          className="rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800"
        >
          Start a project →
        </Link>
      </div>
    </div>
  );
}
