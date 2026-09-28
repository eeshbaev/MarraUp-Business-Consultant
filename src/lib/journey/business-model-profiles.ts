// Redesign spec §4.1/§4.2 — suggested indicator examples per business type,
// for Test questions 1-3 (Reach/Interest/Usage). Questions 4-5 (Response/
// Economics) are the same list for every type, defined inline on the Test
// page rather than here. Data-driven, not a hardcoded form per type — same
// pattern as sector-taxonomy.ts. Labels/indicators are translated (Language
// row), same pattern as ui-copy.ts.

import type { Language } from "@/lib/types";

export type BusinessModelType = "saas" | "restaurant_food_service" | "consulting_services" | "physical_product" | "marketplace" | "other";

export const BUSINESS_MODEL_TYPES: { key: BusinessModelType; label: Record<Language, string> }[] = [
  { key: "saas", label: { en: "SaaS", uz: "SaaS", ru: "SaaS", zh: "SaaS（软件即服务）", fr: "SaaS" } },
  {
    key: "restaurant_food_service",
    label: { en: "Restaurant / food service", uz: "Restoran / ovqatlanish xizmati", ru: "Ресторан / общепит", zh: "餐厅/餐饮服务", fr: "Restaurant / restauration" },
  },
  {
    key: "consulting_services",
    label: { en: "Consulting / services", uz: "Konsalting / xizmatlar", ru: "Консалтинг / услуги", zh: "咨询/服务", fr: "Conseil / services" },
  },
  { key: "physical_product", label: { en: "Physical product", uz: "Jismoniy mahsulot", ru: "Физический товар", zh: "实体产品", fr: "Produit physique" } },
  { key: "marketplace", label: { en: "Marketplace", uz: "Bozor maydonchasi", ru: "Маркетплейс", zh: "交易平台", fr: "Place de marché" } },
  { key: "other", label: { en: "Other", uz: "Boshqa", ru: "Другое", zh: "其他", fr: "Autre" } },
];

export const INDICATOR_EXAMPLES: Record<BusinessModelType, { reach: Record<Language, string>; interest: Record<Language, string>; usage: Record<Language, string> }> = {
  saas: {
    reach: {
      en: "Website visits, ad impressions, sign-up page views",
      uz: "Veb-sayt tashriflari, reklama ko'rinishlari, ro'yxatdan o'tish sahifasi ko'rishlari",
      ru: "Посещения сайта, показы рекламы, просмотры страницы регистрации",
      zh: "网站访问量、广告展示次数、注册页面浏览量",
      fr: "Visites du site, impressions publicitaires, vues de la page d'inscription",
    },
    interest: {
      en: "Sign-ups, trial starts, demo requests",
      uz: "Ro'yxatdan o'tishlar, sinov boshlanishi, demo so'rovlari",
      ru: "Регистрации, начало пробного периода, запросы на демо",
      zh: "注册数、试用启动数、演示请求数",
      fr: "Inscriptions, débuts d'essai, demandes de démonstration",
    },
    usage: {
      en: "Activated a core feature, completed onboarding",
      uz: "Asosiy funksiyani faollashtirdi, onboarding'ni yakunladi",
      ru: "Активировал ключевую функцию, завершил онбординг",
      zh: "激活核心功能、完成引导流程",
      fr: "A activé une fonctionnalité clé, a terminé l'intégration",
    },
  },
  restaurant_food_service: {
    reach: {
      en: "Foot traffic, delivery-app impressions, social reach",
      uz: "Tashrif buyuruvchilar oqimi, yetkazib berish ilovasidagi ko'rinishlar, ijtimoiy tarmoq qamrovi",
      ru: "Посещаемость, показы в приложениях доставки, охват в соцсетях",
      zh: "客流量、外卖平台曝光量、社交媒体触达量",
      fr: "Trafic piéton, impressions sur l'appli de livraison, portée sociale",
    },
    interest: {
      en: "Orders placed, table bookings",
      uz: "Berilgan buyurtmalar, stol bron qilishlar",
      ru: "Сделанные заказы, бронирования столиков",
      zh: "下单数、订座数",
      fr: "Commandes passées, réservations de table",
    },
    usage: {
      en: "Order fulfilled, meal delivered/picked up",
      uz: "Buyurtma bajarildi, taom yetkazildi/olib ketildi",
      ru: "Заказ выполнен, еда доставлена/забрана",
      zh: "订单完成、餐食送达/取餐",
      fr: "Commande honorée, repas livré/récupéré",
    },
  },
  consulting_services: {
    reach: {
      en: "Inquiries received, referral mentions, profile views",
      uz: "Kelib tushgan so'rovlar, tavsiyalar, profil ko'rishlari",
      ru: "Полученные обращения, упоминания по рекомендации, просмотры профиля",
      zh: "收到的咨询、转介提及次数、资料浏览量",
      fr: "Demandes reçues, mentions par recommandation, vues de profil",
    },
    interest: {
      en: "Inquiries that became a call, quote requests",
      uz: "Qo'ng'iroqqa aylangan so'rovlar, narx so'rovlari",
      ru: "Обращения, переросшие в звонок, запросы на расчёт стоимости",
      zh: "转化为通话的咨询、报价请求",
      fr: "Demandes ayant abouti à un appel, demandes de devis",
    },
    usage: {
      en: "Project/engagement actually started",
      uz: "Loyiha/hamkorlik haqiqatan boshlandi",
      ru: "Проект/сотрудничество фактически началось",
      zh: "项目/合作实际启动",
      fr: "Projet/mission réellement démarré",
    },
  },
  physical_product: {
    reach: {
      en: "Store/market visits, listing views, social reach",
      uz: "Do'kon/bozor tashriflari, e'lon ko'rishlari, ijtimoiy tarmoq qamrovi",
      ru: "Посещения магазина/рынка, просмотры объявления, охват в соцсетях",
      zh: "店铺/市场访问量、商品浏览量、社交媒体触达量",
      fr: "Visites du magasin/marché, vues de l'annonce, portée sociale",
    },
    interest: {
      en: "Pre-orders, cart adds, deposits taken",
      uz: "Oldindan buyurtmalar, savatga qo'shishlar, olingan garovlar",
      ru: "Предзаказы, добавления в корзину, полученные депозиты",
      zh: "预订数、加入购物车数、已收押金",
      fr: "Précommandes, ajouts au panier, acomptes reçus",
    },
    usage: {
      en: "Product delivered and, where knowable, used",
      uz: "Mahsulot yetkazildi va, aniqlash imkoni bo'lsa, ishlatildi",
      ru: "Товар доставлен и, если можно определить, использован",
      zh: "产品已送达，且在可判断的情况下已被使用",
      fr: "Produit livré et, si vérifiable, utilisé",
    },
  },
  marketplace: {
    reach: {
      en: "Visits from both supply and demand sides",
      uz: "Ham taklif, ham talab tomonidan tashriflar",
      ru: "Посещения со стороны предложения и спроса",
      zh: "供需双方的访问量",
      fr: "Visites des côtés offre et demande",
    },
    interest: {
      en: "Listings created, searches/inquiries",
      uz: "Yaratilgan e'lonlar, qidiruvlar/so'rovlar",
      ru: "Созданные объявления, поиски/запросы",
      zh: "已创建的挂牌、搜索/咨询次数",
      fr: "Annonces créées, recherches/demandes",
    },
    usage: {
      en: "A match completed, a transaction closed",
      uz: "Moslashtirish yakunlandi, bitim yopildi",
      ru: "Совпадение состоялось, сделка закрыта",
      zh: "完成匹配、交易达成",
      fr: "Une mise en relation aboutie, une transaction conclue",
    },
  },
  other: {
    reach: {
      en: "However you define \"someone encountered the offer\"",
      uz: "\"Kimdir taklifga duch keldi\" deganingizni o'zingiz belgilang",
      ru: "Как вы сами определяете «кто-то столкнулся с предложением»",
      zh: "由您自行定义「有人接触到该提议」",
      fr: "Selon votre propre définition de « quelqu'un a découvert l'offre »",
    },
    interest: { en: "Free text", uz: "Erkin matn", ru: "Свободный текст", zh: "自由文本", fr: "Texte libre" },
    usage: { en: "Free text", uz: "Erkin matn", ru: "Свободный текст", zh: "自由文本", fr: "Texte libre" },
  },
};
