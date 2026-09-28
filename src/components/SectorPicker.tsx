"use client";

import { useMemo, useRef, useState } from "react";
import type { Language } from "@/lib/types";
import { SECTOR_TAXONOMY, findSectorGroup, findSubSector } from "@/lib/sector-taxonomy";

const COPY: Record<Language, { searchSector: string; searchSub: string; noMatches: string; change: string; sectorLabel: string; subLabel: string }> = {
  en: { searchSector: "Search sectors…", searchSub: "Search sub-sectors…", noMatches: "No matches", change: "Change", sectorLabel: "Sector", subLabel: "Sub-sector" },
  uz: { searchSector: "Sohalarni qidirish…", searchSub: "Quyi sohalarni qidirish…", noMatches: "Mos kelmadi", change: "Oʻzgartirish", sectorLabel: "Soha", subLabel: "Quyi soha" },
  ru: { searchSector: "Поиск отрасли…", searchSub: "Поиск подотрасли…", noMatches: "Нет совпадений", change: "Изменить", sectorLabel: "Отрасль", subLabel: "Подотрасль" },
  zh: { searchSector: "搜索行业…", searchSub: "搜索细分行业…", noMatches: "无匹配结果", change: "更改", sectorLabel: "行业", subLabel: "细分行业" },
  fr: { searchSector: "Rechercher un secteur…", searchSub: "Rechercher un sous-secteur…", noMatches: "Aucun résultat", change: "Modifier", sectorLabel: "Secteur", subLabel: "Sous-secteur" },
};

const inputClass = "block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none";
const listClass = "mt-1 max-h-56 overflow-y-auto rounded-md border border-neutral-200 bg-white shadow-sm";
const itemClass = "block w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-neutral-100 focus:bg-neutral-100 focus:outline-none";

function normalize(s: string): string {
  return s.toLowerCase();
}

export default function SectorPicker({ language, initialGroupId }: { language: Language; initialGroupId?: string }) {
  const copy = COPY[language] || COPY.en;
  // Coming from Market's "Assess a business in this sector" link: pre-select
  // the sector (only) so the user still has to pick a sub-sector themselves
  // — Market's research is sector-level, never sub-sector-level, so this
  // never pretends to know more than it does.
  const validInitialGroup = initialGroupId && findSectorGroup(initialGroupId) ? initialGroupId : "";
  const [groupId, setGroupId] = useState(validInitialGroup);
  const [subId, setSubId] = useState("");
  const [groupQuery, setGroupQuery] = useState("");
  const [subQuery, setSubQuery] = useState("");
  const [groupOpen, setGroupOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(!!validInitialGroup);
  const subInputRef = useRef<HTMLInputElement>(null);

  const group = groupId ? findSectorGroup(groupId) : undefined;
  const sub = groupId && subId ? findSubSector(groupId, subId) : undefined;

  const filteredGroups = useMemo(() => {
    const q = normalize(groupQuery.trim());
    if (!q) return SECTOR_TAXONOMY;
    return SECTOR_TAXONOMY.filter((g) => normalize(g.name[language] || g.name.en).includes(q) || normalize(g.name.en).includes(q));
  }, [groupQuery, language]);

  const filteredSubs = useMemo(() => {
    if (!group) return [];
    const q = normalize(subQuery.trim());
    if (!q) return group.subsectors;
    return group.subsectors.filter((s) => normalize(s.name[language] || s.name.en).includes(q) || normalize(s.name.en).includes(q));
  }, [group, subQuery, language]);

  function selectGroup(id: string) {
    setGroupId(id);
    setSubId("");
    setGroupQuery("");
    setGroupOpen(false);
    setSubQuery("");
    setSubOpen(true);
    // Focus the sub-sector search box on the next tick so the user can start typing immediately.
    setTimeout(() => subInputRef.current?.focus(), 0);
  }

  function selectSub(id: string) {
    setSubId(id);
    setSubQuery("");
    setSubOpen(false);
  }

  function resetGroup() {
    setGroupId("");
    setSubId("");
    setGroupQuery("");
    setSubQuery("");
    setGroupOpen(true);
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name="sector_group" value={groupId} />
      <input type="hidden" name="sector_sub" value={subId} />

      {/* Sector (group) picker */}
      <div>
        {group && !groupOpen ? (
          <div className="flex items-center justify-between rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm">
            <span>{group.name[language] || group.name.en}</span>
            <button type="button" onClick={resetGroup} className="text-xs font-medium text-neutral-500 underline hover:text-neutral-700">
              {copy.change}
            </button>
          </div>
        ) : (
          <div className="relative">
            <input
              type="text"
              className={inputClass}
              placeholder={copy.searchSector}
              value={groupQuery}
              onChange={(e) => {
                setGroupQuery(e.target.value);
                setGroupOpen(true);
              }}
              onFocus={() => setGroupOpen(true)}
            />
            {groupOpen && (
              <div className={listClass}>
                {filteredGroups.length === 0 && <div className="px-3 py-2 text-sm text-neutral-400">{copy.noMatches}</div>}
                {filteredGroups.map((g) => (
                  <button
                    type="button"
                    key={g.id}
                    className={itemClass}
                    onClick={() => selectGroup(g.id)}
                  >
                    {g.name[language] || g.name.en}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sub-sector picker */}
      <div>
        {!group ? null : sub && !subOpen ? (
          <div className="flex items-center justify-between rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm">
            <span>{sub.name[language] || sub.name.en}</span>
            <button
              type="button"
              onClick={() => {
                setSubId("");
                setSubQuery("");
                setSubOpen(true);
              }}
              className="text-xs font-medium text-neutral-500 underline hover:text-neutral-700"
            >
              {copy.change}
            </button>
          </div>
        ) : (
          <div className="relative">
            <input
              ref={subInputRef}
              type="text"
              className={inputClass}
              placeholder={copy.searchSub}
              value={subQuery}
              onChange={(e) => {
                setSubQuery(e.target.value);
                setSubOpen(true);
              }}
              onFocus={() => setSubOpen(true)}
            />
            {subOpen && (
              <div className={listClass}>
                {filteredSubs.length === 0 && <div className="px-3 py-2 text-sm text-neutral-400">{copy.noMatches}</div>}
                {filteredSubs.map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    className={itemClass}
                    onClick={() => selectSub(s.id)}
                  >
                    {s.name[language] || s.name.en}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
