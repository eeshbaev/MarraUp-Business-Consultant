// Translated copy for the Intake form (/new) — the 7 intake questions and
// their option lists. These are hardcoded JSX, not part of src/content/*, so
// they were translated directly here rather than through the batch pipeline
// that covers assessment/action-plan content (see src/lib/localization.ts).
// Live in all 5 languages.

import type { Language } from "./types";

type Row = Record<Language, string>;
const row = (en: string, uz: string, ru: string, zh: string, fr: string): Row => ({ en, uz, ru, zh, fr });

export const INTAKE = {
  pageTitle: row(
    "Tell us about the business",
    "Biznes haqida ma'lumot bering",
    "Расскажите о бизнесе",
    "请介绍一下您的企业",
    "Parlez-nous de l'entreprise"
  ),
  pageSubtitle: row(
    "A few facts first — these determine which evidence standard the assessment uses. Nothing here is scored.",
    "Avval bir nechta faktlar — bular baholashda qaysi dalil standarti qo'llanilishini belgilaydi. Bu yerda hech narsa baholanmaydi.",
    "Сначала несколько фактов — они определяют, какой стандарт доказательств использует оценка. Здесь ничего не оценивается.",
    "先了解一些基本情况——这些将决定评估使用哪种证据标准。此处不进行评分。",
    "Quelques informations d'abord — elles déterminent la norme de preuve utilisée par l'évaluation. Rien n'est noté ici."
  ),
  businessName: row("Business name", "Biznes nomi", "Название бизнеса", "企业名称", "Nom de l'entreprise"),
  ownerName: row("Owner name", "Egasining ismi", "Имя владельца", "所有者姓名", "Nom du propriétaire"),
  sector: row("Sector", "Sektor", "Отрасль", "行业", "Secteur"),
  sectorHint: row(
    "Choose the sector, then the closest sub-sector.",
    "Sektorni, so'ngra unga eng yaqin quyi sektorni tanlang.",
    "Выберите отрасль, затем ближайшую подотрасль.",
    "请选择行业，然后选择最接近的子行业。",
    "Choisissez le secteur, puis le sous-secteur le plus proche."
  ),
  sectorPlaceholder: row(
    "e.g. Bakery, logistics, SaaS for retailers",
    "masalan, Novvoyxona, logistika, chakana savdo uchun SaaS",
    "например, Пекарня, логистика, SaaS для ритейлеров",
    "例如：面包店、物流、零售商用SaaS",
    "p. ex. Boulangerie, logistique, SaaS pour détaillants"
  ),

  timeInOperation: row(
    "How long has the business been actively operating?",
    "Biznes qancha vaqtdan beri faol ishlayapti?",
    "Как долго бизнес активно работает?",
    "该企业已积极运营多长时间？",
    "Depuis combien de temps l'entreprise est-elle active ?"
  ),
  timeInOperationHint: row(
    "Count from when it started trading or serving customers, not when it was registered.",
    "Ro'yxatdan o'tgan vaqtdan emas, balki savdo yoki mijozlarga xizmat ko'rsatishni boshlagan vaqtdan hisoblang.",
    "Считайте с момента начала торговли или обслуживания клиентов, а не с момента регистрации.",
    "从开始交易或服务客户时起算，而非注册时间。",
    "Comptez à partir du début de l'activité commerciale, pas de l'enregistrement."
  ),
  selectOne: row("Select one", "Birini tanlang", "Выберите один вариант", "请选择", "Sélectionner"),
  time_lt6mo: row("Less than 6 months", "6 oydan kam", "Менее 6 месяцев", "不到6个月", "Moins de 6 mois"),
  time_6to12mo: row("6–12 months", "6–12 oy", "6–12 месяцев", "6至12个月", "6 à 12 mois"),
  time_1to3y: row("1–3 years", "1–3 yil", "1–3 года", "1至3年", "1 à 3 ans"),
  time_3to10y: row("3–10 years", "3–10 yil", "3–10 лет", "3至10年", "3 à 10 ans"),
  time_gt10y: row("More than 10 years", "10 yildan ko'p", "Более 10 лет", "超过10年", "Plus de 10 ans"),

  customerPaymentStatus: row(
    "Which of these best describes payments from customers?",
    "Quyidagilardan qaysi biri mijozlar to'lovlarini yaxshiroq tavsiflaydi?",
    "Что из этого лучше всего описывает платежи от клиентов?",
    "以下哪项最能描述客户的付款情况？",
    "Laquelle de ces options décrit le mieux les paiements des clients ?"
  ),
  payment_A: row(
    "No customer has ever paid the business",
    "Hech qanday mijoz hech qachon biznesga to'lov qilmagan",
    "Ни один клиент никогда не платил бизнесу",
    "从未有客户向该企业付款",
    "Aucun client n'a jamais payé l'entreprise"
  ),
  payment_B: row(
    "One or a few customers have paid on a trial, pilot, or one-off basis",
    "Bir yoki bir nechta mijoz sinov, pilot yoki bir martalik tarzda to'lov qilgan",
    "Один или несколько клиентов платили на пробной, пилотной или разовой основе",
    "有一个或几个客户以试用、试点或一次性方式付过款",
    "Un ou quelques clients ont payé à titre d'essai, pilote ou ponctuel"
  ),
  payment_C: row(
    "Customers pay on an ongoing basis, for less than a year",
    "Mijozlar doimiy ravishda, bir yildan kam vaqt davomida to'lov qilishmoqda",
    "Клиенты платят на постоянной основе менее года",
    "客户持续付款，但不到一年",
    "Les clients paient de manière continue depuis moins d'un an"
  ),
  payment_D: row(
    "Customers have paid on an ongoing basis for one to three years",
    "Mijozlar bir yildan uch yilgacha doimiy ravishda to'lov qilishgan",
    "Клиенты платят на постоянной основе от одного до трёх лет",
    "客户持续付款一到三年",
    "Les clients paient de manière continue depuis un à trois ans"
  ),
  payment_E: row(
    "Customers have paid on an ongoing basis for more than three years",
    "Mijozlar uch yildan ko'proq vaqt davomida doimiy ravishda to'lov qilishgan",
    "Клиенты платят на постоянной основе более трёх лет",
    "客户持续付款超过三年",
    "Les clients paient de manière continue depuis plus de trois ans"
  ),

  revenueLabel: row(
    "Approximate revenue over the last twelve months",
    "So'nggi o'n ikki oydagi taxminiy daromad",
    "Приблизительная выручка за последние двенадцать месяцев",
    "过去十二个月的大致营收",
    "Chiffre d'affaires approximatif des douze derniers mois"
  ),

  peopleBand: row(
    "How many people work in the business?",
    "Biznesda nechta odam ishlaydi?",
    "Сколько людей работает в бизнесе?",
    "该企业有多少员工？",
    "Combien de personnes travaillent dans l'entreprise ?"
  ),
  peopleBandHint: row(
    "Including owners, employees, and regular contractors.",
    "Egalari, xodimlari va doimiy pudratchilarni ham qo'shgan holda.",
    "Включая владельцев, сотрудников и постоянных подрядчиков.",
    "包括所有者、员工和长期承包商。",
    "Y compris les propriétaires, employés et prestataires réguliers."
  ),
  people_justMe: row("Just me", "Faqat men", "Только я", "只有我一人", "Juste moi"),
  people_2to5: row("2–5", "2–5", "2–5", "2至5", "2 à 5"),
  people_6to20: row("6–20", "6–20", "6–20", "6至20", "6 à 20"),
  people_21to100: row("21–100", "21–100", "21–100", "21至100", "21 à 100"),
  people_100plus: row("More than 100", "100 dan ko'p", "Более 100", "超过100", "Plus de 100"),

  customerBaseBand: row(
    "How many customers or clients does the business currently serve?",
    "Biznes hozirda nechta mijozga xizmat ko'rsatmoqda?",
    "Скольким клиентам бизнес обслуживает в настоящее время?",
    "该企业目前服务多少客户？",
    "Combien de clients l'entreprise sert-elle actuellement ?"
  ),
  cust_none: row("None yet", "Hali yo'q", "Пока нет", "尚无", "Aucun pour l'instant"),
  cust_1to5: row("1–5", "1–5", "1–5", "1至5", "1 à 5"),
  cust_6to25: row("6–25", "6–25", "6–25", "6至25", "6 à 25"),
  cust_26to100: row("26–100", "26–100", "26–100", "26至100", "26 à 100"),
  cust_100plus: row("More than 100", "100 dan ko'p", "Более 100", "超过100", "Plus de 100"),
  cust_tooMany: row(
    "Too many to count individually",
    "Alohida sanab bo'lmaydigan darajada ko'p",
    "Слишком много, чтобы считать поштучно",
    "太多，无法逐一统计",
    "Trop nombreux pour être comptés individuellement"
  ),

  inPlaceLabel: row(
    "Which of these does the business currently have in operation?",
    "Quyidagilardan qaysilari biznesda hozir amal qilmoqda?",
    "Что из этого сейчас есть и работает в бизнесе?",
    "该企业目前具备以下哪些条件？",
    "Lesquels de ces éléments l'entreprise a-t-elle actuellement en place ?"
  ),
  inPlaceHint: row(
    "Select all that apply. “Currently” means operating now — not planned.",
    "Tegishli barchasini tanlang. “Hozir” — hozir amal qilayotgan, rejalashtirilgan emas.",
    "Выберите всё подходящее. «Сейчас» означает действующее сейчас, а не запланированное.",
    "选择所有适用项。“目前”指现在正在运作，而非计划中。",
    "Cochez tout ce qui s'applique. « Actuellement » signifie en fonctionnement maintenant, pas prévu."
  ),
  in_payingCustomers: row("Customers who are paying", "To'lov qilayotgan mijozlar", "Платящие клиенты", "正在付费的客户", "Des clients qui paient"),
  in_activeReach: row(
    "An active way of reaching new customers",
    "Yangi mijozlarga yetib borishning faol usuli",
    "Активный способ привлечения новых клиентов",
    "主动触达新客户的方式",
    "Un moyen actif d'atteindre de nouveaux clients"
  ),
  in_productDelivered: row(
    "A product or service being delivered to customers or users",
    "Mijozlar yoki foydalanuvchilarga yetkazilayotgan mahsulot yoki xizmat",
    "Продукт или услуга, предоставляемые клиентам или пользователям",
    "正在向客户或用户交付的产品或服务",
    "Un produit ou service livré aux clients ou utilisateurs"
  ),
  in_suppliers: row(
    "Suppliers, subcontractors, or providers it depends on",
    "U bog'liq bo'lgan yetkazib beruvchilar, subpudratchilar yoki provayderlar",
    "Поставщики, субподрядчики или провайдеры, от которых бизнес зависит",
    "所依赖的供应商、分包商或服务提供商",
    "Fournisseurs, sous-traitants ou prestataires dont elle dépend"
  ),
  in_premises: row(
    "Premises or a site it operates from",
    "Faoliyat yuritadigan bino yoki joy",
    "Помещение или площадка, откуда ведётся деятельность",
    "开展经营的场所或场地",
    "Des locaux ou un site à partir duquel elle opère"
  ),
  in_systems: row(
    "Systems or platforms it depends on",
    "U bog'liq bo'lgan tizimlar yoki platformalar",
    "Системы или платформы, от которых бизнес зависит",
    "所依赖的系统或平台",
    "Des systèmes ou plateformes dont elle dépend"
  ),

  fundingBasisLabel: row(
    "How is the business currently funded?",
    "Biznes hozirda qanday moliyalashtirilmoqda?",
    "Как в настоящее время финансируется бизнес?",
    "该企业目前的资金来源是什么？",
    "Comment l'entreprise est-elle actuellement financée ?"
  ),
  fundingBasisHint: row(
    "Select all that apply.",
    "Tegishli barchasini tanlang.",
    "Выберите всё подходящее.",
    "选择所有适用项。",
    "Cochez tout ce qui s'applique."
  ),
  fund_ownRevenue: row("Its own revenue", "O'zining daromadi", "Собственная выручка", "自身营收", "Ses propres revenus"),
  fund_ownerMoney: row("Owner or founder money", "Egasi yoki asoschisining puli", "Деньги владельца или основателя", "所有者或创始人资金", "Argent du propriétaire ou fondateur"),
  fund_familyFriends: row("Family or friends", "Oila yoki do'stlar", "Семья или друзья", "家人或朋友", "Famille ou amis"),
  fund_externalInvestment: row("External investment", "Tashqi investitsiya", "Внешние инвестиции", "外部投资", "Investissement externe"),
  fund_borrowing: row("Bank or other borrowing", "Bank yoki boshqa qarz", "Банковские или иные заимствования", "银行或其他借款", "Emprunt bancaire ou autre"),
  fund_grants: row("Grants or public funding", "Grantlar yoki davlat mablag'lari", "Гранты или государственное финансирование", "拨款或公共资金", "Subventions ou financement public"),
  fund_notYetFunded: row(
    "Not yet funded, or currently seeking funding",
    "Hali moliyalashtirilmagan yoki hozirda mablag' izlamoqda",
    "Пока не финансируется, либо в поиске финансирования",
    "尚未获得资金，或正在寻求资金",
    "Pas encore financée, ou en recherche de financement"
  ),

  submit: row(
    "Continue to the assessment",
    "Baholashga o'tish",
    "Перейти к оценке",
    "继续进行评估",
    "Continuer vers l'évaluation"
  ),
} satisfies Record<string, Row>;

export function ti(key: keyof typeof INTAKE, language: Language): string {
  return INTAKE[key][language] || INTAKE[key].en;
}
