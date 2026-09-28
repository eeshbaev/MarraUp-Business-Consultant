import Link from "next/link";
import { getLanguage } from "@/lib/language";
import { t } from "@/lib/ui-copy";

// Short instructional step before the intake form itself (/new) — what this
// is for, roughly how long it takes, that progress is saved, and that
// results are immediate. Added alongside My Path's own intro page so both
// of the app's questionnaire-driven features explain themselves up front
// before asking the user to commit time.
export default async function AssessIntroPage({
  searchParams,
}: {
  searchParams: Promise<{ sector?: string; name?: string }>;
}) {
  const language = await getLanguage();
  const { sector, name } = await searchParams;
  const params = new URLSearchParams();
  if (sector) params.set("sector", sector);
  if (name) params.set("name", name);
  const qs = params.toString();
  const startHref = qs ? `/new?${qs}` : "/new";

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/profile" className="mb-6 inline-block text-sm text-neutral-500 hover:text-neutral-700">
        {t("common.backToProfile", language)}
      </Link>

      <h1 className="text-xl font-semibold tracking-tight text-neutral-900">{t("assessIntro.title", language)}</h1>
      <p className="mt-2 text-sm leading-relaxed text-neutral-700">{t("assessIntro.whyBody", language)}</p>

      <ul className="mt-6 space-y-2 text-sm leading-relaxed text-neutral-700">
        <li className="flex gap-2">
          <span className="flex-none text-neutral-400" aria-hidden>•</span>
          <span>{t("assessIntro.howQuestions", language)}</span>
        </li>
        <li className="flex gap-2">
          <span className="flex-none text-neutral-400" aria-hidden>•</span>
          <span>{t("assessIntro.howSave", language)}</span>
        </li>
        <li className="flex gap-2">
          <span className="flex-none text-neutral-400" aria-hidden>•</span>
          <span>{t("assessIntro.howResults", language)}</span>
        </li>
      </ul>

      <Link
        href={startHref}
        className="mt-8 block rounded-md bg-neutral-900 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-neutral-800"
      >
        {t("assessIntro.start", language)}
      </Link>
    </div>
  );
}
