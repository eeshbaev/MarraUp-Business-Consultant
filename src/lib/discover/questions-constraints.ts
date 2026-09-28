// My Path / Discover — Q27, the hard-constraint question (Part 6, Part
// 17.27). Kept separate from questions.ts because it needs the live
// 40-sector taxonomy (already translated into all 5 languages) rather than
// hand-written option labels.

import { SECTOR_TAXONOMY } from "@/lib/sector-taxonomy";
import type { Language } from "@/lib/types";
import type { SectorId } from "./sectors";

export interface HardConstraintOption {
  sectorId: SectorId;
  label: Record<Language, string>;
}

// One row per canonical sector — selecting it produces a hard exclusion,
// never a legal determination (see Methodology Part 3 / Q27 wording).
export const HARD_CONSTRAINT_OPTIONS: HardConstraintOption[] = SECTOR_TAXONOMY.map((group) => ({
  sectorId: group.id as SectorId,
  label: group.name,
}));

export const Q27_PROMPT: Record<Language, string> = {
  en: "Are there any business areas you currently know you cannot pursue?",
  uz: "Hozircha shug'ullana olmasligingizni bilgan biznes sohalari bormi?",
  ru: "Есть ли сферы бизнеса, которыми вы точно не можете заниматься сейчас?",
  zh: "是否有你目前明确知道无法从事的商业领域？",
  fr: "Y a-t-il des secteurs d'activité que vous savez actuellement ne pas pouvoir exercer ?",
};

export const Q27_HELPER: Record<Language, string> = {
  en: "Select any areas that are currently unavailable to you — for example because of licensing, location, family, employment, or other real constraints you're aware of. This reflects what you currently know, not a legal determination MarraUp is making.",
  uz: "Hozirda sizga mavjud bo'lmagan sohalarni tanlang — masalan, litsenziya, joylashuv, oila, ish yoki boshqa haqiqiy cheklovlar tufayli. Bu MarraUp tomonidan qonuniy xulosa emas, balki siz bilgan holatni aks ettiradi.",
  ru: "Отметьте области, недоступные вам сейчас — например, из-за лицензирования, местоположения, семьи, работы или других реальных ограничений. Это отражает то, что вы знаете сами, а не юридическое заключение MarraUp.",
  zh: "请选择你目前无法从事的领域——例如由于许可、地点、家庭、工作或其他你了解的实际限制。这反映的是你自己的了解，而非 MarraUp 做出的法律判断。",
  fr: "Sélectionnez les secteurs qui vous sont actuellement inaccessibles — par exemple en raison de licences, de localisation, de contraintes familiales, professionnelles ou autres. Cela reflète ce que vous savez déjà, non une décision juridique de MarraUp.",
};
