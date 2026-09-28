// Translated copy for the Market tab. Growth is now shown per-sector inside
// each sector's own card (see market-research-data.ts) rather than as a
// separate chart — this file keeps only the filter-bar copy (countries) and
// a small set of real, sourced Uzbekistan headline figures that predate the
// broader 40-country/40-sector research pass and are worth keeping folded
// into their matching sector card rather than discarded.

import type { Language } from "./types";

type Row = Record<Language, string>;
const row = (en: string, uz: string, ru: string, zh: string, fr: string): Row => ({ en, uz, ru, zh, fr });

// Countries selectable in the Market page's filter bar. Uzbekistan, USA and
// Germany currently have sourced sector-level data (market-research-data.ts);
// the rest resolve to a "coming soon" state (see COUNTRY_HAS_DATA) rather
// than fabricated figures.
export type CountryCode = "uz" | "us" | "ca" | "de" | "gb" | "fr" | "ru" | "tr" | "in" | "cn" | "jp";

export const COUNTRIES: { code: CountryCode; label: Row }[] = [
  { code: "uz", label: row("Uzbekistan", "O'zbekiston", "Узбекистан", "乌兹别克斯坦", "Ouzbékistan") },
  { code: "us", label: row("United States", "AQSH", "США", "美国", "États-Unis") },
  { code: "ca", label: row("Canada", "Kanada", "Канада", "加拿大", "Canada") },
  { code: "de", label: row("Germany", "Germaniya", "Германия", "德国", "Allemagne") },
  { code: "gb", label: row("England / UK", "Angliya / Buyuk Britaniya", "Англия / Великобритания", "英格兰/英国", "Angleterre / Royaume-Uni") },
  { code: "fr", label: row("France", "Fransiya", "Франция", "法国", "France") },
  { code: "ru", label: row("Russia", "Rossiya", "Россия", "俄罗斯", "Russie") },
  { code: "tr", label: row("Turkiye", "Turkiya", "Турция", "土耳其", "Turquie") },
  { code: "in", label: row("India", "Hindiston", "Индия", "印度", "Inde") },
  { code: "cn", label: row("China", "Xitoy", "Китай", "中国", "Chine") },
  { code: "jp", label: row("Japan", "Yaponiya", "Япония", "日本", "Japon") },
];

// Plain list of the 11 supported country codes — used by onboarding's
// country picker (and anywhere else that needs to validate a CountryCode
// without pulling in the translated labels).
export const COUNTRY_CODES: CountryCode[] = COUNTRIES.map((c) => c.code);

/** ISO 3166-1 alpha-2 → flag emoji (no image assets). */
export function countryFlagEmoji(code: CountryCode | string): string {
  const iso = code.trim().toUpperCase();
  if (iso.length !== 2 || !/^[A-Z]{2}$/.test(iso)) return "";
  const base = 0x1f1e6;
  return String.fromCodePoint(...[...iso].map((ch) => base + ch.charCodeAt(0) - 65));
}

export function countryLabelWithFlag(code: CountryCode, language: Language): string {
  const entry = COUNTRIES.find((c) => c.code === code);
  if (!entry) return "";
  const name = entry.label[language] || entry.label.en;
  const flag = countryFlagEmoji(code);
  return flag ? `${flag} ${name}` : name;
}

export function countrySelectOptions(language: Language): { value: CountryCode; label: string; leading: string }[] {
  return COUNTRIES.map((c) => ({
    value: c.code,
    label: c.label[language] || c.label.en,
    leading: countryFlagEmoji(c.code),
  }));
}

// All 11 countries carry sourced sector-level data (coverage varies a lot —
// unsourced sectors within a country still render as an explicit "no data"
// card, never invented).
export const COUNTRY_HAS_DATA: Record<CountryCode, boolean> = {
  uz: true,
  us: true,
  ca: true,
  de: true,
  gb: true,
  fr: true,
  ru: true,
  tr: true,
  in: true,
  cn: true,
  jp: true,
};

export interface SectorHighlight {
  headline: Row;
  detail: Row;
  barrier: Row;
}

// Real, sourced Uzbekistan figures from the app's original Market build
// (IFC, ADB, U.S. Trade Administration, Uzbek government reporting — see
// market.sourcesFooter). Keyed by SECTOR_TAXONOMY group id and shown as a
// "Key figures" highlight inside that sector's own card, folded in rather
// than kept as a separate block.
export const UZ_SECTOR_HIGHLIGHTS: Record<string, SectorHighlight> = {
  travel_tourism_and_hospitality: {
    headline: row(
      "$3.1–4.2B potential · ~180,000 jobs",
      "3.1–4.2 mlrd$ salohiyat · ~180,000 ish o'rni",
      "Потенциал $3,1–4,2 млрд · ~180 000 рабочих мест",
      "31亿–42亿美元潜力 · 约18万个就业岗位",
      "Potentiel de 3,1 à 4,2 Md$ · ~180 000 emplois"
    ),
    detail: row(
      "11.7M visitors in 2025",
      "2025 yilda 11,7 million tashrif buyuruvchi",
      "11,7 млн посетителей в 2025 году",
      "2025年访客1170万人次",
      "11,7 M de visiteurs en 2025"
    ),
    barrier: row(
      "Land tenure rules, workforce skills, site management",
      "Yer egaligi qoidalari, ishchi kuchi malakasi, ob'ektni boshqarish",
      "Правила землевладения, квалификация кадров, управление объектами",
      "土地使用权规则、劳动力技能、场地管理",
      "Règles foncières, compétences de la main-d'œuvre, gestion des sites"
    ),
  },
  energy_and_power: {
    headline: row(
      "$36.5B investment pipeline",
      "36,5 mlrd$ investitsiya rejasi",
      "Инвестиционный портфель $36,5 млрд",
      "365亿美元投资管道",
      "Portefeuille d'investissement de 36,5 Md$"
    ),
    detail: row("Through 2030", "2030 yilgacha", "До 2030 года", "至2030年", "D'ici 2030"),
    barrier: row(
      "Capital intensity, pace of reform",
      "Kapital talabchanligi, islohotlar sur'ati",
      "Капиталоёмкость, темпы реформ",
      "资本密集度、改革速度",
      "Intensité capitalistique, rythme des réformes"
    ),
  },
  manufacturing_and_industrial: {
    headline: row(
      "$12B across 31 projects",
      "31 loyihada 12 mlrd$",
      "$12 млрд в рамках 31 проекта",
      "31个项目共120亿美元",
      "12 Md$ répartis sur 31 projets"
    ),
    detail: row("Through 2030", "2030 yilgacha", "До 2030 года", "至2030年", "D'ici 2030"),
    barrier: row(
      "Project financing, execution capacity",
      "Loyihani moliyalashtirish, amalga oshirish salohiyati",
      "Проектное финансирование, возможности реализации",
      "项目融资、执行能力",
      "Financement de projet, capacité d'exécution"
    ),
  },
  logistics_and_supply_chain: {
    headline: row(
      "$1.05B potential · ~41,000 jobs",
      "1,05 mlrd$ salohiyat · ~41,000 ish o'rni",
      "Потенциал $1,05 млрд · ~41 000 рабочих мест",
      "10.5亿美元潜力 · 约4.1万个就业岗位",
      "Potentiel de 1,05 Md$ · ~41 000 emplois"
    ),
    detail: row(
      "88% gap in modern warehousing",
      "Zamonaviy omborxonalarda 88% tanqislik",
      "Дефицит современных складов — 88%",
      "现代化仓储缺口达88%",
      "Déficit de 88 % en entreposage moderne"
    ),
    barrier: row(
      "Warehousing capacity on the Middle Corridor route",
      "O'rta yo'lak marshrutida omborxona sig'imi",
      "Складские мощности на маршруте Среднего коридора",
      "中间走廊路线上的仓储能力",
      "Capacité d'entreposage sur l'itinéraire du Corridor central"
    ),
  },
  financial_services_and_fintech: {
    headline: row(
      "Privatization → 60% private share",
      "Xususiylashtirish → 60% xususiy ulush",
      "Приватизация → 60% частной доли",
      "私有化 → 私营占比达60%",
      "Privatisation → 60 % de part privée"
    ),
    detail: row("Target set for 2026", "2026 yilga mo'ljallangan maqsad", "Цель установлена на 2026 год", "目标设定为2026年", "Objectif fixé pour 2026"),
    barrier: row(
      "State-bank legacy share, thin capital markets",
      "Davlat bankining eski ulushi, kapital bozorlarining yupqaligi",
      "Историческая доля госбанков, неразвитые рынки капитала",
      "国有银行遗留份额、资本市场薄弱",
      "Part historique des banques d'État, marchés de capitaux peu développés"
    ),
  },
  information_technology_and_software: {
    headline: row(
      "$329M startup investment (2025)",
      "329 mln$ startap investitsiyasi (2025)",
      "$329 млн инвестиций в стартапы (2025)",
      "2025年初创企业投资3.29亿美元",
      "329 M$ d'investissement dans les startups (2025)"
    ),
    detail: row("+522% year-over-year", "yillik +522%", "+522% в годовом выражении", "同比增长522%", "+522 % sur un an"),
    barrier: row(
      "Talent pipeline, Digital Uzbekistan 2030 execution",
      "Iqtidorlar zaxirasi, Digital Uzbekistan 2030 dasturini amalga oshirish",
      "Кадровый резерв, реализация «Цифровой Узбекистан 2030»",
      "人才储备、《数字乌兹别克斯坦2030》的执行情况",
      "Vivier de talents, mise en œuvre de Digital Uzbekistan 2030"
    ),
  },
  pharmaceuticals_biotechnology_and_life_sciences: {
    headline: row(
      "$188M potential · 20,000+ jobs",
      "188 mln$ salohiyat · 20,000+ ish o'rni",
      "Потенциал $188 млн · более 20 000 рабочих мест",
      "1.88亿美元潜力 · 逾2万个就业岗位",
      "Potentiel de 188 M$ · plus de 20 000 emplois"
    ),
    detail: row("Reform-gated growth", "Islohotga bog'liq o'sish", "Рост, зависящий от реформ", "增长取决于改革进程", "Croissance conditionnée par les réformes"),
    barrier: row(
      "Drug registration process, no domestic bioequivalence labs",
      "Dori ro'yxatdan o'tkazish jarayoni, mahalliy bioekvivalentlik laboratoriyalari yo'q",
      "Процесс регистрации лекарств, отсутствие отечественных лабораторий биоэквивалентности",
      "药品注册流程、国内缺乏生物等效性实验室",
      "Processus d'enregistrement des médicaments, absence de laboratoires nationaux de bioéquivalence"
    ),
  },
  mining_minerals_and_natural_resources: {
    headline: row(
      "Gold, uranium, silver, copper",
      "Oltin, uran, kumush, mis",
      "Золото, уран, серебро, медь",
      "黄金、铀、白银、铜",
      "Or, uranium, argent, cuivre"
    ),
    detail: row(
      "Production rising through 2030",
      "Ishlab chiqarish 2030 yilgacha o'sib bormoqda",
      "Рост добычи до 2030 года",
      "产量将持续增长至2030年",
      "Production en hausse jusqu'en 2030"
    ),
    barrier: row(
      "Capital intensity, extraction infrastructure",
      "Kapital talabchanligi, qazib olish infratuzilmasi",
      "Капиталоёмкость, инфраструктура добычи",
      "资本密集度、开采基础设施",
      "Intensité capitalistique, infrastructure d'extraction"
    ),
  },
  education_and_edtech: {
    headline: row(
      "47.7% higher-ed enrollment",
      "Oliy ta'limga qamrov 47,7%",
      "Охват высшим образованием — 47,7%",
      "高等教育入学率达47.7%",
      "Taux d'inscription dans le supérieur de 47,7 %"
    ),
    detail: row(
      "Demand for foreign-university campuses",
      "Xorijiy universitet kampuslariga talab",
      "Спрос на кампусы иностранных университетов",
      "对外国大学分校的需求",
      "Demande de campus d'universités étrangères"
    ),
    barrier: row(
      "Accreditation pathways, campus infrastructure",
      "Akkreditatsiya yo'llari, kampus infratuzilmasi",
      "Пути аккредитации, инфраструктура кампусов",
      "认证路径、校园基础设施",
      "Voies d'accréditation, infrastructure de campus"
    ),
  },
  construction_and_infrastructure: {
    headline: row(
      "80 PPP projects planned",
      "80 ta DXSH loyihasi rejalashtirilgan",
      "Запланировано 80 проектов ГЧП",
      "计划中的80个PPP项目",
      "80 projets PPP prévus"
    ),
    detail: row("2024–2030 pipeline", "2024–2030 rejasi", "План на 2024–2030 гг.", "2024–2030年项目储备", "Portefeuille 2024–2030"),
    barrier: row(
      "Public-sector execution capacity",
      "Davlat sektorining amalga oshirish salohiyati",
      "Исполнительские возможности государственного сектора",
      "公共部门执行能力",
      "Capacité d'exécution du secteur public"
    ),
  },
  agriculture_food_and_agribusiness: {
    headline: row(
      "Rising demand for processing tech",
      "Qayta ishlash texnologiyalariga talab ortib bormoqda",
      "Растущий спрос на технологии переработки",
      "对加工技术的需求不断增长",
      "Demande croissante pour les technologies de transformation"
    ),
    detail: row(
      "Preservation, packaging, cold-chain",
      "Konservalash, qadoqlash, sovuq zanjir",
      "Консервация, упаковка, холодовая цепь",
      "保鲜、包装、冷链",
      "Conservation, emballage, chaîne du froid"
    ),
    barrier: row(
      "Cold-chain and logistics infrastructure",
      "Sovuq zanjir va logistika infratuzilmasi",
      "Инфраструктура холодовой цепи и логистики",
      "冷链与物流基础设施",
      "Infrastructure de chaîne du froid et logistique"
    ),
  },
};
