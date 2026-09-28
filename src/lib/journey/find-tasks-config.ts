import type { FindTaskKey, DevelopCategory } from "@/lib/db";
import type { Language } from "@/lib/types";

// Redesign spec §2.2 — the 7 fixed Find questions, in order. Question/hint
// text is translated (Language row) same as ui-copy.ts's pattern; key/order/
// repeatable are structural and language-independent.
export const FIND_TASKS: { key: FindTaskKey; order: number; question: Record<Language, string>; hint: Record<Language, string>; repeatable: boolean }[] = [
  {
    key: "define",
    order: 1,
    question: {
      en: "Define the problem and who has it",
      uz: "Muammoni va u kimga tegishli ekanini aniqlang",
      ru: "Определите проблему и кто с ней сталкивается",
      zh: "明确问题及谁面临这个问题",
      fr: "Définissez le problème et qui le rencontre",
    },
    hint: {
      en: "A real segment, not \"everyone.\"",
      uz: "Haqiqiy segment, \"hamma\" emas.",
      ru: "Реальный сегмент, а не «все».",
      zh: "一个真实的群体，而非「所有人」。",
      fr: "Un segment réel, pas « tout le monde ».",
    },
    repeatable: false,
  },
  {
    key: "talk",
    order: 2,
    question: {
      en: "Talk to real people about it",
      uz: "Bu haqda haqiqiy odamlar bilan gaplashing",
      ru: "Поговорите об этом с реальными людьми",
      zh: "与真实的人交流这个问题",
      fr: "Parlez-en à de vraies personnes",
    },
    hint: {
      en: "One entry per conversation.",
      uz: "Har bir suhbat uchun bitta yozuv.",
      ru: "Одна запись на каждый разговор.",
      zh: "每次对话记录一条。",
      fr: "Une entrée par conversation.",
    },
    repeatable: true,
  },
  {
    key: "alternatives",
    order: 3,
    question: {
      en: "What do they do today instead?",
      uz: "Hozir buning o'rniga nima qilishadi?",
      ru: "Что они делают вместо этого сейчас?",
      zh: "他们现在用什么方式代替？",
      fr: "Que font-ils à la place aujourd'hui ?",
    },
    hint: {
      en: "Alternatives, competitors, workarounds.",
      uz: "Alternativalar, raqobatchilar, vaqtinchalik yechimlar.",
      ru: "Альтернативы, конкуренты, обходные пути.",
      zh: "替代方案、竞争对手、变通做法。",
      fr: "Alternatives, concurrents, solutions de contournement.",
    },
    repeatable: false,
  },
  {
    key: "worth_solving",
    order: 4,
    question: {
      en: "Is it actually worth solving?",
      uz: "Buni hal qilish haqiqatan ham arziydimi?",
      ru: "Действительно ли стоит решать эту проблему?",
      zh: "这真的值得解决吗？",
      fr: "Cela vaut-il vraiment la peine d'être résolu ?",
    },
    hint: {
      en: "Frequency, pain, cost of the problem today.",
      uz: "Muammoning bugungi chastotasi, og'irligi va narxi.",
      ru: "Частота, острота и цена проблемы сегодня.",
      zh: "问题当前的发生频率、痛点程度和代价。",
      fr: "Fréquence, gravité et coût du problème aujourd'hui.",
    },
    repeatable: false,
  },
  {
    key: "sketch",
    order: 5,
    question: {
      en: "Sketch a possible solution and test the reaction",
      uz: "Mumkin bo'lgan yechimni chizing va reaksiyani sinab ko'ring",
      ru: "Набросайте возможное решение и проверьте реакцию",
      zh: "勾勒可能的解决方案并测试反应",
      fr: "Esquissez une solution possible et testez la réaction",
    },
    hint: {
      en: "Not a build — just a reaction.",
      uz: "Qurish emas — faqat reaksiya.",
      ru: "Не сборка — просто реакция.",
      zh: "不是要真的做出来——只是测试反应。",
      fr: "Pas une construction — juste une réaction.",
    },
    repeatable: false,
  },
  {
    key: "signal",
    order: 6,
    question: {
      en: "Look for a real commitment signal",
      uz: "Haqiqiy majburiyat signalini qidiring",
      ru: "Ищите реальный сигнал готовности платить",
      zh: "寻找真实的承诺信号",
      fr: "Cherchez un vrai signal d'engagement",
    },
    hint: {
      en: "A pre-order, deposit, or sign-up.",
      uz: "Oldindan buyurtma, garov yoki ro'yxatdan o'tish.",
      ru: "Предзаказ, депозит или регистрация.",
      zh: "预订、押金或注册。",
      fr: "Une précommande, un acompte ou une inscription.",
    },
    repeatable: true,
  },
  {
    key: "decide",
    order: 7,
    question: {
      en: "Decide: proceed or don't",
      uz: "Qaror qabul qiling: davom eting yoki yo'q",
      ru: "Решите: продолжать или нет",
      zh: "做出决定：继续或放弃",
      fr: "Décidez : continuer ou non",
    },
    hint: {
      en: "Closes this list, opens the Blueprint.",
      uz: "Bu ro'yxatni yopadi, Rejani ochadi.",
      ru: "Закрывает этот список, открывает План.",
      zh: "结束此清单，打开蓝图。",
      fr: "Clôture cette liste, ouvre le Plan.",
    },
    repeatable: false,
  },
];

// Redesign spec §3.1 — the 7 fixed Develop categories, in order.
export const DEVELOP_CATEGORIES_CONFIG: { key: DevelopCategory; order: number; title: Record<Language, string>; question: Record<Language, string>; required: boolean }[] = [
  {
    key: "acquire_setup",
    order: 1,
    title: { en: "Acquire & Set Up", uz: "Sotib olish va sozlash", ru: "Приобретение и настройка", zh: "获取与筹备", fr: "Acquérir et installer" },
    question: {
      en: "What do you need to buy, rent, or set up — at minimum, not fully?",
      uz: "Nimani sotib olish, ijaraga olish yoki sozlash kerak — minimal darajada, to'liq emas?",
      ru: "Что нужно купить, арендовать или настроить — минимально, не полностью?",
      zh: "您需要购买、租用或筹备什么——只需最低限度，不必完整？",
      fr: "Que devez-vous acheter, louer ou installer — au minimum, pas complètement ?",
    },
    required: false,
  },
  {
    key: "build",
    order: 2,
    title: { en: "Build", uz: "Qurish", ru: "Создание", zh: "构建", fr: "Construire" },
    question: {
      en: "What do you need to actually make yourself?",
      uz: "O'zingiz nimani yasashingiz kerak?",
      ru: "Что вам нужно сделать самостоятельно?",
      zh: "您需要亲自制作什么？",
      fr: "Que devez-vous fabriquer vous-même ?",
    },
    required: false,
  },
  {
    key: "arrange",
    order: 3,
    title: { en: "Arrange", uz: "Kelishish", ru: "Организация", zh: "安排", fr: "Organiser" },
    question: {
      en: "What relationships or logistics need to be locked in?",
      uz: "Qanday aloqalar yoki logistika mustahkamlanishi kerak?",
      ru: "Какие связи или логистику нужно закрепить?",
      zh: "哪些关系或物流需要落实？",
      fr: "Quelles relations ou quelle logistique doivent être finalisées ?",
    },
    required: false,
  },
  {
    key: "hire",
    order: 4,
    title: { en: "Hire", uz: "Yollash", ru: "Найм", zh: "招聘", fr: "Recruter" },
    question: {
      en: "Does this need anyone besides you yet?",
      uz: "Bunga sizdan boshqa yana kimdir kerakmi?",
      ru: "Нужен ли сейчас кто-то ещё, кроме вас?",
      zh: "目前是否需要除您以外的其他人？",
      fr: "Faut-il déjà quelqu'un d'autre que vous ?",
    },
    required: false,
  },
  {
    key: "register_approve",
    order: 5,
    title: { en: "Register / Approve", uz: "Ro'yxatdan o'tkazish / Tasdiqlash", ru: "Регистрация / Согласование", zh: "注册/审批", fr: "Enregistrer / Approuver" },
    question: {
      en: "What permits or approvals are legally required?",
      uz: "Qonun bo'yicha qanday ruxsatnomalar yoki tasdiqlar talab qilinadi?",
      ru: "Какие разрешения или согласования требуются по закону?",
      zh: "法律上需要哪些许可或审批？",
      fr: "Quels permis ou approbations sont légalement requis ?",
    },
    required: true,
  },
  {
    key: "customer_ready",
    order: 6,
    title: { en: "Customer-Ready", uz: "Mijozga tayyor", ru: "Готово для клиента", zh: "客户就绪", fr: "Prêt pour le client" },
    question: {
      en: "How will a customer get this from you, and pay you?",
      uz: "Mijoz buni sizdan qanday oladi va sizga qanday to'laydi?",
      ru: "Как клиент получит это от вас и заплатит вам?",
      zh: "顾客将如何从您这里获得此服务并付款？",
      fr: "Comment un client va-t-il obtenir ceci auprès de vous, et vous payer ?",
    },
    required: false,
  },
  {
    key: "sell_market",
    order: 7,
    title: { en: "Sell / Market", uz: "Sotish / Marketing", ru: "Продажа / Маркетинг", zh: "销售/营销", fr: "Vendre / Commercialiser" },
    question: {
      en: "How will your first test customers find out this exists?",
      uz: "Birinchi sinov mijozlaringiz bu haqda qanday bilib olishadi?",
      ru: "Как ваши первые тестовые клиенты узнают об этом?",
      zh: "您的首批测试客户将如何得知这个存在？",
      fr: "Comment vos premiers clients test vont-ils découvrir que cela existe ?",
    },
    required: false,
  },
];
