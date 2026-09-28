"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Language } from "@/lib/types";
import { t, tf } from "@/lib/ui-copy";
import { COUNTRIES, COUNTRY_HAS_DATA, UZ_SECTOR_HIGHLIGHTS, type CountryCode } from "@/lib/market-copy";
import { SECTOR_TAXONOMY, type SectorGroup } from "@/lib/sector-taxonomy";
import { getSectorMarketData, hasUsableData, type SectorMarketData, type Outlook } from "@/lib/market-research-data";

const selectClass =
  "w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none";

function OutlookBadge({ outlook, language, compact }: { outlook: Outlook; language: Language; compact?: boolean }) {
  const label =
    outlook === "growing"
      ? t("market.outlookGrowing", language)
      : outlook === "stable"
        ? t("market.outlookStable", language)
        : outlook === "declining"
          ? t("market.outlookDeclining", language)
          : t("market.outlookNoData", language);
  const arrow = outlook === "growing" ? "↑" : outlook === "stable" ? "→" : outlook === "declining" ? "↓" : "–";
  const colorClass =
    outlook === "growing"
      ? "bg-emerald-50 text-emerald-700"
      : outlook === "stable"
        ? "bg-amber-50 text-amber-700"
        : outlook === "declining"
          ? "bg-rose-50 text-rose-700"
          : "bg-neutral-100 text-neutral-400";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${colorClass}`}>
      <span aria-hidden>{arrow}</span>
      {!compact && label}
    </span>
  );
}

// A single combined read on the sector — used to color-code the card and
// rank the list so the more interesting sectors surface first. Not a new
// data point: purely derived from the same short/long outlook values
// already shown, just synthesized into one signal for scanning.
type Signal = "growing" | "mixed" | "stable" | "declining" | "no_data";

function combinedSignal(data: SectorMarketData | undefined): Signal {
  const s = data?.shortTerm.outlook ?? "no_data";
  const l = data?.longTerm.outlook ?? "no_data";
  if (s === "no_data" && l === "no_data") return "no_data";
  const real = [s, l].filter((x) => x !== "no_data");
  if (real.every((x) => x === "growing")) return "growing";
  if (real.every((x) => x === "declining")) return "declining";
  if (real.every((x) => x === "stable")) return "stable";
  if (real.includes("growing") && real.includes("declining")) return "mixed";
  if (real.includes("growing")) return "growing";
  return "declining";
}

const SIGNAL_RANK: Record<Signal, number> = { growing: 0, mixed: 1, stable: 2, declining: 3, no_data: 4 };
const SIGNAL_BORDER: Record<Signal, string> = {
  growing: "border-l-emerald-400",
  mixed: "border-l-amber-400",
  stable: "border-l-amber-300",
  declining: "border-l-rose-400",
  no_data: "border-l-neutral-200",
};
const OUTLOOK_DOT: Record<Outlook, string> = {
  growing: "bg-emerald-500",
  stable: "bg-amber-400",
  declining: "bg-rose-500",
  no_data: "bg-neutral-300",
};

// Trim a sourced summary down to its first complete sentence — visual
// scanning, not a paragraph to read. Never cuts mid-word or mid-clause:
// if the first sentence itself is long, it's shown whole rather than
// chopped with an ellipsis. Never invents shorter text — only picks which
// complete sentence of the research to show.
function shortenSummary(summary: string): string {
  const clean = summary.trim();
  const match = clean.match(/^.*?[.!?](?=\s|$)/);
  if (match && match[0].length >= 20) return match[0];
  return clean;
}

// A compact visual read of the two horizons — dot + outlook word + a short
// evidence-backed clause + "as of <date>" (never a bare year, which reads as
// stale once the calendar has moved past it).
function HorizonStrip({
  shortTerm,
  longTerm,
  language,
}: {
  shortTerm: { outlook: Outlook; evidenceDate: string; summary: string };
  longTerm: { outlook: Outlook; evidenceDate: string; summary: string };
  language: Language;
}) {
  if (shortTerm.outlook === "no_data" && longTerm.outlook === "no_data") return null;
  const steps = [
    { label: t("market.shortTermLabel", language), data: shortTerm },
    { label: t("market.longTermLabel", language), data: longTerm },
  ];
  return (
    <div className="space-y-2">
      {steps.map((s) => (
        <div key={s.label} className="flex items-start gap-2 rounded-md border border-neutral-200 bg-white p-3">
          <span className={`mt-1 h-2.5 w-2.5 flex-none rounded-full ${OUTLOOK_DOT[s.data.outlook]}`} aria-hidden />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
              <span className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">{s.label}</span>
              <OutlookBadge outlook={s.data.outlook} language={language} />
              {s.data.evidenceDate && s.data.outlook !== "no_data" && (
                <span className="text-[11px] text-neutral-400">
                  {t("market.asOfLabel", language)} {s.data.evidenceDate}
                </span>
              )}
            </div>
            {s.data.outlook !== "no_data" && s.data.summary && (
              <p className="mt-0.5 text-[13px] leading-snug text-neutral-600">{shortenSummary(s.data.summary)}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ResearchSectorCard({
  group,
  data,
  language,
  open,
  onToggle,
  country,
}: {
  group: SectorGroup;
  data: SectorMarketData | undefined;
  language: Language;
  open: boolean;
  onToggle: () => void;
  country: CountryCode;
}) {
  const usable = hasUsableData(data);
  const highlight = country === "uz" ? UZ_SECTOR_HIGHLIGHTS[group.id] : undefined;
  const signal = combinedSignal(data);

  return (
    <div className={`rounded-lg border border-neutral-200 border-l-4 bg-white ${SIGNAL_BORDER[signal]}`}>
      <button type="button" onClick={onToggle} className="flex w-full flex-col gap-1 p-4 text-left" aria-expanded={open}>
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-neutral-900">{group.name[language] || group.name.en}</span>
          <span className={`flex-none transition-transform text-neutral-400 ${open ? "rotate-180" : ""}`}>▾</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-neutral-400">{t("market.shortTermLabel", language)}</span>
          <OutlookBadge outlook={data?.shortTerm.outlook ?? "no_data"} language={language} compact />
          <span className="mx-0.5 text-neutral-300">·</span>
          <span className="text-[11px] font-medium text-neutral-400">{t("market.longTermLabel", language)}</span>
          <OutlookBadge outlook={data?.longTerm.outlook ?? "no_data"} language={language} compact />
        </div>
      </button>

      <div
        className="grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="space-y-3 border-t border-neutral-100 bg-neutral-50 p-4">
            {highlight && (
              <div className="rounded-md border border-neutral-300 bg-white p-3">
                <h4 className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                  {t("market.keyFiguresHeading", language)}
                </h4>
                <p className="mt-1 text-sm font-semibold text-neutral-900">{highlight.headline[language] || highlight.headline.en}</p>
                <p className="mt-0.5 text-sm text-neutral-600">{highlight.detail[language] || highlight.detail.en}</p>
                <p className="mt-1 text-[11px] text-neutral-400">{highlight.barrier[language] || highlight.barrier.en}</p>
              </div>
            )}

            {!usable || !data ? (
              <p className="text-sm text-neutral-400">{t("market.noSectorData", language)}</p>
            ) : (
              <>
                <HorizonStrip shortTerm={data.shortTerm} longTerm={data.longTerm} language={language} />

                {/* Significant market gaps — specific, sourced, underserved
                    segments/needs, deliberately distinct from the generic
                    macro opportunities below. Only real researched entries
                    ever appear here; never a computed/derived signal. */}
                {data.gaps && data.gaps.length > 0 && (
                  <div className="rounded-md border border-indigo-200 bg-indigo-50 p-3">
                    <h4 className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
                      {t("market.significantGaps", language)}
                    </h4>
                    <ul className="mt-1.5 space-y-2.5">
                      {data.gaps.map((gap, i) => (
                        <li key={i}>
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-1.5">
                            <div>
                              <div className="text-sm font-semibold text-indigo-900">{gap.subSector}</div>
                              <span className="text-sm text-neutral-800">{gap.description}</span>
                            </div>
                            <Link
                              href={`/my-path/new?source=self&description=${encodeURIComponent(`${gap.subSector}: ${gap.description}`)}`}
                              className="flex-none whitespace-nowrap pl-4 text-[11px] font-medium text-indigo-400 underline underline-offset-2 hover:text-indigo-700 sm:pl-0"
                            >
                              Start a Project
                            </Link>
                          </div>
                          {gap.sources.length > 0 && (
                            <p className="mt-1 text-[11px] leading-relaxed text-neutral-400">
                              {t("market.sourcesHeading", language)}:{" "}
                              {gap.sources.map((s, si) => (
                                <span key={si}>
                                  {si > 0 && " · "}
                                  {s.url ? (
                                    <a
                                      href={s.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="underline decoration-neutral-300 underline-offset-2 hover:text-neutral-600 hover:decoration-neutral-500"
                                    >
                                      {s.publisher}
                                    </a>
                                  ) : (
                                    s.publisher
                                  )}
                                  {s.date && ` (${s.date})`}
                                </span>
                              ))}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* When no researched gap exists, show why — never silence,
                    never an invented gap. Only rendered when gaps is empty. */}
                {(!data.gaps || data.gaps.length === 0) && data.noGapReason && (
                  <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3">
                    <h4 className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                      {t("market.noGapFound", language)}
                    </h4>
                    <p className="mt-1 text-sm text-neutral-700">{data.noGapReason.note}</p>
                    {data.noGapReason.sources && data.noGapReason.sources.length > 0 && (
                      <p className="mt-1 text-[11px] leading-relaxed text-neutral-400">
                        {t("market.sourcesHeading", language)}:{" "}
                        {data.noGapReason.sources.map((s, si) => (
                          <span key={si}>
                            {si > 0 && " · "}
                            {s.url ? (
                              <a
                                href={s.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline decoration-neutral-300 underline-offset-2 hover:text-neutral-600 hover:decoration-neutral-500"
                              >
                                {s.publisher}
                              </a>
                            ) : (
                              s.publisher
                            )}
                            {s.date && ` (${s.date})`}
                          </span>
                        ))}
                      </p>
                    )}
                  </div>
                )}

                {/* What the evidence specifically points to — the real sourced opportunities/risks. */}
                {(data.risks.length > 0 || data.opportunities.length > 0) && (
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {data.opportunities.length > 0 && (
                      <div>
                        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                          {t("market.whyItCouldWork", language)}
                        </h4>
                        <ul className="mt-1 space-y-1 text-sm text-neutral-700">
                          {data.opportunities.map((o, i) => (
                            <li key={i} className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-1.5">
                              <span className="flex gap-1.5">
                                <span className="flex-none text-emerald-600" aria-hidden>+</span>
                                <span>{o}</span>
                              </span>
                              <Link
                                href={`/my-path/new?source=self&description=${encodeURIComponent(o)}`}
                                className="flex-none whitespace-nowrap pl-4 text-[11px] font-medium text-neutral-400 underline underline-offset-2 hover:text-neutral-700 sm:pl-0"
                              >
                                Start a Project
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {data.risks.length > 0 && (
                      <div>
                        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-rose-700">
                          {t("market.whatCouldGoWrong", language)}
                        </h4>
                        <ul className="mt-1 space-y-1 text-sm text-neutral-700">
                          {data.risks.map((r, i) => (
                            <li key={i} className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-1.5">
                              <span className="flex gap-1.5">
                                <span className="flex-none text-rose-500" aria-hidden>–</span>
                                <span>{r}</span>
                              </span>
                              <Link
                                href={`/my-path/new?source=self&description=${encodeURIComponent(r)}`}
                                className="flex-none whitespace-nowrap pl-4 text-[11px] font-medium text-neutral-400 underline underline-offset-2 hover:text-neutral-700 sm:pl-0"
                              >
                                Start a Project
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {data.sources.length > 0 && (
                  <p className="text-[11px] leading-relaxed text-neutral-400">
                    {t("market.sourcesHeading", language)}:{" "}
                    {data.sources.map((s, i) => (
                      <span key={i}>
                        {i > 0 && " · "}
                        {s.url ? (
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline decoration-neutral-300 underline-offset-2 hover:text-neutral-600 hover:decoration-neutral-500"
                          >
                            {s.publisher}
                          </a>
                        ) : (
                          s.publisher
                        )}
                        {s.date && ` (${s.date})`}
                      </span>
                    ))}
                  </p>
                )}

                <p className="text-[11px] italic text-neutral-300">{t("market.researchEnglishNote", language)}</p>
              </>
            )}

            <Link
              href={`/new/intro?sector=${group.id}`}
              className="flex items-center justify-between rounded-md border border-neutral-900 bg-neutral-900 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
            >
              {t("market.assessCta", language)}
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MarketBody({ language }: { language: Language }) {
  const [country, setCountry] = useState<CountryCode>("uz");
  const [groupId, setGroupId] = useState<string>("");
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  const hasData = COUNTRY_HAS_DATA[country];

  // Default order surfaces the more attractive sectors first (growing, then
  // mixed, then stable, then declining, then unsourced) rather than the
  // fixed taxonomy order — an investor scanning 40 sectors wants the
  // interesting ones on top, not alphabetical/category order. A stable sort
  // (index as tiebreaker) keeps same-signal sectors in taxonomy order.
  const groups = useMemo(() => {
    let list = SECTOR_TAXONOMY;
    if (groupId) list = list.filter((g) => g.id === groupId);
    if (!hasData) return list;
    return list
      .map((g, i) => ({ g, i, rank: SIGNAL_RANK[combinedSignal(getSectorMarketData(country, g.id))] }))
      .sort((a, b) => a.rank - b.rank || a.i - b.i)
      .map((x) => x.g);
  }, [groupId, country, hasData]);

  return (
    <div>
      <div className="mb-4 space-y-2.5 rounded-lg border border-neutral-200 bg-white p-3">
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
            {t("market.countryLabel", language)}
          </label>
          <select
            className={selectClass}
            value={country}
            onChange={(e) => {
              setCountry(e.target.value as CountryCode);
              setExpandedGroupId(null);
            }}
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label[language] || c.label.en}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
            {t("market.sectorLabel", language)}
          </label>
          <select
            className={selectClass}
            value={groupId}
            onChange={(e) => {
              setGroupId(e.target.value);
              setExpandedGroupId(null);
            }}
          >
            <option value="">{t("market.sectorAll", language)}</option>
            {SECTOR_TAXONOMY.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name[language] || g.name.en}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!hasData ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-6 text-center">
          <div className="text-sm font-semibold text-neutral-900">{t("market.comingSoonHeading", language)}</div>
          <p className="mt-1 text-sm text-neutral-500">{t("market.comingSoonBody", language)}</p>
        </div>
      ) : (
        <>
          <section className="space-y-2">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{t("market.opportunityHeading", language)}</h2>
              <span className="text-xs text-neutral-400">{tf("market.sectorsCount", language, { n: groups.length })}</span>
            </div>
            {groups.length === 0 ? (
              <p className="rounded-lg border border-neutral-200 bg-white p-4 text-sm text-neutral-400">
                {t("market.noSectorMatch", language)}
              </p>
            ) : (
              <div className="space-y-3">
                {groups.map((g) => (
                  <ResearchSectorCard
                    key={g.id}
                    group={g}
                    data={getSectorMarketData(country, g.id)}
                    language={language}
                    open={expandedGroupId === g.id}
                    onToggle={() => setExpandedGroupId((cur) => (cur === g.id ? null : g.id))}
                    country={country}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
