import type { WeakPoint } from "@/lib/db";
import type { Language } from "@/lib/types";

// Redesign spec §5.3 — author-authorized suggestion text. Translated
// (Language row) so the hypothesis a founder picks and submits is in their
// own language; suggestion identity for storage/dedup is the index-based
// `${weakPoint}_${i}` key on the Experiment page, not the text itself, so
// translating this text is safe.
export const EXPERIMENT_SUGGESTIONS: Record<WeakPoint, Record<Language, string>[]> = {
  reach: [
    {
      en: "Try a new channel (social platform, marketplace listing, local advertising)",
      uz: "Yangi kanalni sinab ko'ring (ijtimoiy platforma, bozor maydonchasidagi e'lon, mahalliy reklama)",
      ru: "Попробуйте новый канал (соцсеть, объявление на маркетплейсе, локальная реклама)",
      zh: "尝试新渠道（社交平台、市场挂牌、本地广告）",
      fr: "Essayez un nouveau canal (réseau social, annonce sur une place de marché, publicité locale)",
    },
    {
      en: "Improve messaging/description to be clearer",
      uz: "Xabar/tavsifni aniqroq qiling",
      ru: "Сделайте сообщение/описание понятнее",
      zh: "改进信息/描述使其更清晰",
      fr: "Rendez le message/la description plus clair(e)",
    },
    {
      en: "Increase frequency/consistency of posting or outreach",
      uz: "Joylashtirish yoki murojaat qilish chastotasi/izchilligini oshiring",
      ru: "Увеличьте частоту/регулярность публикаций или обращений",
      zh: "提高发布或推广的频率/连贯性",
      fr: "Augmentez la fréquence/régularité des publications ou des prises de contact",
    },
    {
      en: "Partner with someone who already has access to your audience",
      uz: "Auditoriyangizga allaqachon kirish imkoni bor kishi bilan hamkorlik qiling",
      ru: "Найдите партнёра, у которого уже есть доступ к вашей аудитории",
      zh: "与已能触达您目标受众的人合作",
      fr: "Associez-vous à quelqu'un qui a déjà accès à votre audience",
    },
  ],
  interest: [
    {
      en: "Change the offer (different price, bundle, guarantee)",
      uz: "Taklifni o'zgartiring (boshqa narx, to'plam, kafolat)",
      ru: "Измените предложение (другая цена, комплект, гарантия)",
      zh: "调整方案（不同价格、套餐、保证）",
      fr: "Modifiez l'offre (prix différent, forfait, garantie)",
    },
    {
      en: "Clarify the value proposition (what problem it solves, for whom)",
      uz: "Qiymat taklifini aniqlashtiring (qanday muammoni, kim uchun hal qiladi)",
      ru: "Уточните ценностное предложение (какую проблему решает и для кого)",
      zh: "明确价值主张（解决什么问题、为谁而解决）",
      fr: "Clarifiez la proposition de valeur (quel problème elle résout, pour qui)",
    },
    {
      en: "Improve visuals/presentation",
      uz: "Vizual taqdimotni yaxshilang",
      ru: "Улучшите визуальное оформление/подачу",
      zh: "改善视觉呈现/展示方式",
      fr: "Améliorez les visuels/la présentation",
    },
    {
      en: "Add social proof (testimonials, reviews, before/after)",
      uz: "Ijtimoiy dalil qo'shing (fikrlar, sharhlar, oldin/keyin)",
      ru: "Добавьте социальные доказательства (отзывы, обзоры, «до/после»)",
      zh: "增加社会认同（推荐语、评价、前后对比）",
      fr: "Ajoutez une preuve sociale (témoignages, avis, avant/après)",
    },
  ],
  usage: [
    {
      en: "Simplify the process to get/use the product or service",
      uz: "Mahsulot yoki xizmatni olish/ishlatish jarayonini soddalashtiring",
      ru: "Упростите процесс получения/использования продукта или услуги",
      zh: "简化获取/使用产品或服务的流程",
      fr: "Simplifiez le processus d'obtention/d'utilisation du produit ou service",
    },
    {
      en: "Remove friction points (payment, delivery, onboarding steps)",
      uz: "To'siq nuqtalarini olib tashlang (to'lov, yetkazib berish, onboarding bosqichlari)",
      ru: "Устраните точки трения (оплата, доставка, этапы онбординга)",
      zh: "消除阻碍点（支付、配送、引导步骤）",
      fr: "Supprimez les points de friction (paiement, livraison, étapes d'intégration)",
    },
    {
      en: "Follow up directly with people who showed interest but didn't convert",
      uz: "Qiziqish bildirgan, lekin sotib olmagan odamlar bilan bevosita bog'laning",
      ru: "Свяжитесь напрямую с теми, кто проявил интерес, но не совершил покупку",
      zh: "直接跟进表现出兴趣但未转化的人",
      fr: "Recontactez directement les personnes intéressées qui n'ont pas converti",
    },
    {
      en: "Offer a smaller/lower-commitment version to try first",
      uz: "Avval sinab ko'rish uchun kichikroq/kamroq majburiyatli versiyani taklif qiling",
      ru: "Предложите сначала попробовать облегчённую/менее обязывающую версию",
      zh: "先提供一个更小、承诺更低的版本供试用",
      fr: "Proposez d'abord une version plus petite/moins engageante à essayer",
    },
  ],
  response: [
    {
      en: "Ask directly for feedback (short survey, conversation)",
      uz: "To'g'ridan-to'g'ri fikr-mulohaza so'rang (qisqa so'rovnoma, suhbat)",
      ru: "Прямо попросите обратную связь (короткий опрос, разговор)",
      zh: "直接征求反馈（简短调查、交谈）",
      fr: "Demandez directement un retour (court sondage, conversation)",
    },
    {
      en: "Fix the most-mentioned complaint first",
      uz: "Eng ko'p aytilgan shikoyatni birinchi bo'lib hal qiling",
      ru: "Сначала устраните наиболее часто упоминаемую жалобу",
      zh: "优先解决被提及最多的问题",
      fr: "Corrigez d'abord la plainte la plus fréquemment mentionnée",
    },
    {
      en: "Introduce a loyalty/referral incentive",
      uz: "Sadoqat/tavsiya rag'batlantirishini joriy qiling",
      ru: "Введите программу лояльности/реферальное вознаграждение",
      zh: "推出忠诚度/转介奖励机制",
      fr: "Mettez en place une incitation à la fidélité/au parrainage",
    },
    {
      en: "Improve delivery speed/quality/consistency",
      uz: "Yetkazib berish tezligi/sifati/izchilligini yaxshilang",
      ru: "Улучшите скорость/качество/стабильность доставки",
      zh: "提升配送速度/质量/稳定性",
      fr: "Améliorez la rapidité/qualité/régularité de la livraison",
    },
  ],
  economics: [
    {
      en: "Adjust pricing (test higher or lower)",
      uz: "Narxni sozlang (yuqori yoki past narxni sinab ko'ring)",
      ru: "Скорректируйте цену (протестируйте выше или ниже)",
      zh: "调整定价（测试更高或更低）",
      fr: "Ajustez le prix (testez plus haut ou plus bas)",
    },
    {
      en: "Reduce direct costs (supplier, materials, packaging)",
      uz: "To'g'ridan-to'g'ri xarajatlarni kamaytiring (yetkazib beruvchi, materiallar, qadoqlash)",
      ru: "Снизьте прямые затраты (поставщик, материалы, упаковка)",
      zh: "降低直接成本（供应商、材料、包装）",
      fr: "Réduisez les coûts directs (fournisseur, matériaux, emballage)",
    },
    {
      en: "Reduce customer acquisition cost (cheaper/better-targeted channel)",
      uz: "Mijoz jalb qilish xarajatini kamaytiring (arzonroq/yaxshiroq maqsadli kanal)",
      ru: "Снизьте стоимость привлечения клиента (более дешёвый/точный канал)",
      zh: "降低获客成本（更便宜/更精准的渠道）",
      fr: "Réduisez le coût d'acquisition client (canal moins cher/mieux ciblé)",
    },
    {
      en: "Bundle or upsell to increase average order value",
      uz: "O'rtacha buyurtma qiymatini oshirish uchun to'plamlash yoki qo'shimcha sotish qiling",
      ru: "Используйте комплекты или допродажи для увеличения среднего чека",
      zh: "通过套餐或加售提高平均订单价值",
      fr: "Proposez des forfaits ou des ventes complémentaires pour augmenter le panier moyen",
    },
  ],
};

export const WEAK_POINT_LABEL: Record<WeakPoint, Record<Language, string>> = {
  reach: { en: "Reach", uz: "Qamrov", ru: "Охват", zh: "触达", fr: "Portée" },
  interest: { en: "Interest", uz: "Qiziqish", ru: "Интерес", zh: "兴趣", fr: "Intérêt" },
  usage: { en: "Usage", uz: "Foydalanish", ru: "Использование", zh: "使用", fr: "Utilisation" },
  response: { en: "Response", uz: "Munosabat", ru: "Отклик", zh: "反馈", fr: "Réponse" },
  economics: { en: "Economics", uz: "Iqtisodiyot", ru: "Экономика", zh: "经济性", fr: "Économie" },
};
