// UI-chrome copy — Developer Build Specification's translation architecture
// covers assessment/action-plan content (src/lib/localization.ts); this file
// is the separate set of fixed interface strings: dimension/category names,
// tab labels, page titles, buttons, section headers, and every page's prose
// (Privacy, Notifications, Discover, Market, Profile). All five languages are
// fully wired and live across the app — this is the shipped, operational set,
// not a partial or gated rollout.

import type { Language } from "./types";

export const DIMENSION_NAMES: Record<string, Record<Language, string>> = {
  "Market": { en: "Market", uz: "Bozor", ru: "Рынок", zh: "市场", fr: "Marché" },
  "Product/Service": { en: "Product/Service", uz: "Mahsulot/Xizmat", ru: "Продукт/Услуга", zh: "产品/服务", fr: "Produit/Service" },
  "Business Model": { en: "Business Model", uz: "Biznes modeli", ru: "Бизнес-модель", zh: "商业模式", fr: "Modèle économique" },
  "Financial Health": { en: "Financial Health", uz: "Moliyaviy salomatlik", ru: "Финансовое здоровье", zh: "财务健康", fr: "Santé financière" },
  "Traction": { en: "Traction", uz: "Bozordagi o'sish", ru: "Динамика роста", zh: "业务牵引力", fr: "Traction" },
  "Management & Team": { en: "Management & Team", uz: "Boshqaruv va jamoa", ru: "Управление и команда", zh: "管理与团队", fr: "Direction et équipe" },
  "Operations": { en: "Operations", uz: "Operatsiyalar", ru: "Операционная деятельность", zh: "运营", fr: "Opérations" },
  "Governance": { en: "Governance", uz: "Boshqaruv tizimi", ru: "Корпоративное управление", zh: "治理", fr: "Gouvernance" },
  "Resilience & Growth Capacity": {
    en: "Resilience & Growth Capacity",
    uz: "Barqarorlik va o'sish salohiyati",
    ru: "Устойчивость и потенциал роста",
    zh: "韧性与增长能力",
    fr: "Résilience et capacité de croissance",
  },
  "Concentration Exposure": { en: "Concentration Exposure", uz: "Kontsentratsiya xavfi", ru: "Риск концентрации", zh: "集中度风险", fr: "Exposition à la concentration" },
  "Financial Exposure": { en: "Financial Exposure", uz: "Moliyaviy xavf", ru: "Финансовый риск", zh: "财务风险", fr: "Exposition financière" },
  "Dependency Exposure": { en: "Dependency Exposure", uz: "Bog'liqlik xavfi", ru: "Риск зависимости", zh: "依赖性风险", fr: "Exposition à la dépendance" },
  "Legal & Regulatory Exposure": {
    en: "Legal & Regulatory Exposure",
    uz: "Huquqiy va meʼyoriy xavf",
    ru: "Правовой и нормативный риск",
    zh: "法律与监管风险",
    fr: "Exposition juridique et réglementaire",
  },
  "Market Exposure": { en: "Market Exposure", uz: "Bozor xavfi", ru: "Рыночный риск", zh: "市场风险", fr: "Exposition au marché" },
  "Product & Delivery Exposure": {
    en: "Product & Delivery Exposure",
    uz: "Mahsulot va yetkazib berish xavfi",
    ru: "Риск продукта и доставки",
    zh: "产品与交付风险",
    fr: "Exposition produit et livraison",
  },
  "Owner Exposure": { en: "Owner Exposure", uz: "Egasi uchun shaxsiy xavf", ru: "Личный риск владельца", zh: "所有者风险", fr: "Exposition du dirigeant" },
};

export function getDimensionName(name: string, language: Language): string {
  return DIMENSION_NAMES[name]?.[language] ?? name;
}

// Small fixed-key UI strings, grouped by area. Add entries here as pages are
// wired up — never invent a key on a page without adding it here first.
export const UI: Record<string, Record<Language, string>> = {
  // Bottom tab bar
  "tab.explore": { en: "Explore", uz: "Kashf etish", ru: "Обзор", zh: "探索", fr: "Explorer" },
  "tab.market": { en: "Market", uz: "Bozor", ru: "Рынок", zh: "市场", fr: "Marché" },
  "tab.profile": { en: "Profile", uz: "Profil", ru: "Профиль", zh: "个人资料", fr: "Profil" },

  // Tab headers
  "header.explore.subtitle": { en: "Where do you want to start?", uz: "Qayerdan boshlamoqchisiz?", ru: "С чего вы хотите начать?", zh: "您想从哪里开始？", fr: "Par où voulez-vous commencer ?" },
  "header.market.title": { en: "Market", uz: "Bozor", ru: "Рынок", zh: "市场", fr: "Marché" },
  "header.market.subtitle": { en: "Uzbekistan sector opportunities", uz: "O'zbekiston sektor imkoniyatlari", ru: "Отраслевые возможности Узбекистана", zh: "乌兹别克斯坦行业机遇", fr: "Opportunités sectorielles en Ouzbékistan" },
  "header.profile.title": { en: "Profile", uz: "Profil", ru: "Профиль", zh: "个人资料", fr: "Profil" },

  // Results page
  "results.health": { en: "Business Health", uz: "Biznes salomatligi", ru: "Здоровье бизнеса", zh: "业务健康度", fr: "Santé de l'entreprise" },
  "results.risk": { en: "Risk Exposure", uz: "Xavf darajasi", ru: "Уровень риска", zh: "风险敞口", fr: "Exposition au risque" },
  "results.criticalExposures": { en: "Critical Exposures", uz: "Kritik xavflar", ru: "Критические риски", zh: "严重风险", fr: "Expositions critiques" },
  "results.notYetDemonstrated": { en: "Not yet demonstrated", uz: "Hali isbotlanmagan", ru: "Пока не подтверждено", zh: "尚未证实", fr: "Pas encore démontré" },
  "results.healthByDimension": { en: "Business Health by dimension", uz: "Yo'nalishlar bo'yicha biznes salomatligi", ru: "Здоровье бизнеса по направлениям", zh: "各维度业务健康度", fr: "Santé de l'entreprise par dimension" },
  "results.riskByCategory": { en: "Risk Exposure by category", uz: "Toifalar bo'yicha xavf darajasi", ru: "Уровень риска по категориям", zh: "各类别风险敞口", fr: "Exposition au risque par catégorie" },
  "results.saturated": { en: "Saturated — at or above 75% of this category's max", uz: "To'yingan — ushbu toifaning maksimal qiymatining 75% yoki undan yuqori", ru: "Насыщено — 75% или более от максимума этой категории", zh: "已饱和——达到或超过该类别最大值的75%", fr: "Saturé — 75 % ou plus du maximum de cette catégorie" },
  "results.ownerExposure": { en: "Owner Exposure", uz: "Egasi uchun shaxsiy xavf", ru: "Личный риск владельца", zh: "所有者风险", fr: "Exposition du dirigeant" },
  "results.viewPlan": { en: "View action plan", uz: "Harakat rejasini ko'rish", ru: "Посмотреть план действий", zh: "查看行动计划", fr: "Voir le plan d'action" },

  // Common buttons / labels
  "common.back": { en: "Back", uz: "Orqaga", ru: "Назад", zh: "返回", fr: "Retour" },
  "common.backToProfile": { en: "← Profile", uz: "← Profil", ru: "← Профиль", zh: "← 个人资料", fr: "← Profil" },
  "common.delete": { en: "Delete", uz: "O'chirish", ru: "Удалить", zh: "删除", fr: "Supprimer" },
  "common.settings": { en: "Settings", uz: "Sozlamalar", ru: "Настройки", zh: "设置", fr: "Paramètres" },
  "common.notifications": { en: "Notifications", uz: "Bildirishnomalar", ru: "Уведомления", zh: "通知", fr: "Notifications" },
  "common.privacy": { en: "Privacy", uz: "Maxfiylik", ru: "Конфиденциальность", zh: "隐私", fr: "Confidentialité" },
  "common.language": { en: "Language", uz: "Til", ru: "Язык", zh: "语言", fr: "Langue" },
  "common.view": { en: "View", uz: "Ko'rish", ru: "Просмотр", zh: "查看", fr: "Voir" },

  // Delete confirm button
  "deleteConfirm.confirm": {
    en: "Delete {name}? This removes its assessments and action plan permanently.",
    uz: "{name} o'chirilsinmi? Bu uning baholari va harakat rejasini butunlay o'chirib tashlaydi.",
    ru: "Удалить «{name}»? Это безвозвратно удалит его оценки и план действий.",
    zh: "确定删除{name}吗？这将永久删除其评估和行动计划。",
    fr: "Supprimer {name} ? Cela supprimera définitivement ses évaluations et son plan d'action.",
  },

  // Privacy page
  "privacy.title": { en: "Privacy", uz: "Maxfiylik", ru: "Конфиденциальность", zh: "隐私", fr: "Confidentialité" },
  "privacy.p1": {
    en: "Everything you enter — business details, assessment answers, the resulting scores — is self-reported by you. MarraUp does not verify, audit, or independently confirm any of it, and takes no responsibility for decisions made using it.",
    uz: "Siz kiritgan hamma narsa — biznes tafsilotlari, baholash javoblari, natijaviy ballar — o'zingiz tomonidan bildirilgan. MarraUp bularning hech birini tekshirmaydi, audit qilmaydi yoki mustaqil tasdiqlamaydi va undan foydalangan holda qabul qilingan qarorlar uchun javobgar emas.",
    ru: "Всё, что вы вводите — сведения о бизнесе, ответы на оценку, итоговые баллы — указано вами самостоятельно. MarraUp не проверяет, не аудирует и не подтверждает независимо ничего из этого и не несёт ответственности за решения, принятые на основе этих данных.",
    zh: "您输入的一切——企业详情、评估答案、最终得分——均为您自行申报。MarraUp不对其进行核实、审计或独立确认，也不对据此作出的决定承担任何责任。",
    fr: "Tout ce que vous saisissez — détails de l'entreprise, réponses à l'évaluation, scores obtenus — est déclaré par vous-même. MarraUp ne vérifie, n'audite ni ne confirme aucune de ces informations de manière indépendante, et n'assume aucune responsabilité pour les décisions prises sur cette base.",
  },
  "privacy.p2": {
    en: "This build has no account system yet: your data lives on this device only, is not sent to any investor or third party, and there is nothing published or discoverable outside of it. The Discover tab currently shows illustrative examples only, not real data.",
    uz: "Ushbu versiyada hali hisob tizimi yo'q: ma'lumotlaringiz faqat shu qurilmada saqlanadi, hech qanday investor yoki uchinchi tomonga yuborilmaydi va undan tashqarida hech narsa e'lon qilinmagan yoki topib bo'lmaydi. Discover bo'limi hozircha faqat namunaviy misollarni ko'rsatadi, haqiqiy ma'lumotlarni emas.",
    ru: "В этой версии пока нет системы учётных записей: ваши данные хранятся только на этом устройстве, не отправляются никакому инвестору или третьей стороне, и ничего за его пределами не публикуется и не может быть обнаружено. Вкладка «Обзор» сейчас показывает только иллюстративные примеры, а не реальные данные.",
    zh: "此版本尚无账户系统：您的数据仅保存在本设备上，不会发送给任何投资者或第三方，设备之外也没有任何内容被发布或可被发现。"+"发现"+"页面目前仅展示示例性内容，并非真实数据。",
    fr: "Cette version n'a pas encore de système de compte : vos données ne vivent que sur cet appareil, ne sont envoyées à aucun investisseur ni à aucun tiers, et rien n'est publié ou consultable en dehors de celui-ci. L'onglet Découvrir affiche pour l'instant uniquement des exemples illustratifs, pas de données réelles.",
  },
  "privacy.p3": {
    en: "If MarraUp later adds the ability to publish a profile for investors to see (a planned, not-yet-built layer), that will always be an explicit choice you make, never automatic.",
    uz: "Agar MarraUp keyinchalik profilni investorlar ko'rishi uchun e'lon qilish imkoniyatini qo'shsa (rejalashtirilgan, hali qurilmagan qatlam), bu har doim siz tomonidan aniq qilingan tanlov bo'ladi, hech qachon avtomatik emas.",
    ru: "Если MarraUp позже добавит возможность публиковать профиль для просмотра инвесторами (запланированный, но ещё не реализованный уровень), это всегда будет вашим осознанным выбором, а не автоматическим действием.",
    zh: "如果MarraUp日后加入向投资者发布企业档案的功能（计划中但尚未构建的功能），这始终将是您明确做出的选择，绝不会自动发生。",
    fr: "Si MarraUp ajoute plus tard la possibilité de publier un profil visible par les investisseurs (une fonctionnalité prévue mais pas encore construite), ce sera toujours un choix explicite de votre part, jamais automatique.",
  },
  "privacy.p4": {
    en: "You can delete any business — and everything recorded under it — at any time from Profile. Deletion is permanent.",
    uz: "Siz istalgan biznesni — va u ostida qayd etilgan hamma narsani — Profil bo'limidan istalgan vaqtda o'chirishingiz mumkin. O'chirish qaytarib bo'lmaydi.",
    ru: "Вы можете удалить любой бизнес — и всё, что записано под ним — в любой момент из раздела «Профиль». Удаление необратимо.",
    zh: "您可以随时在个人资料中删除任何企业——以及其下记录的一切内容。删除操作不可撤销。",
    fr: "Vous pouvez supprimer n'importe quelle entreprise — et tout ce qui y est enregistré — à tout moment depuis Profil. La suppression est définitive.",
  },

  // Notifications page
  "notifications.title": { en: "Notifications", uz: "Bildirishnomalar", ru: "Уведомления", zh: "通知", fr: "Notifications" },
  "notifications.subtitle": {
    en: "Only real, computed activity — never anything invented.",
    uz: "Faqat haqiqiy, hisoblangan faoliyat — hech qachon o'ylab topilgan narsa emas.",
    ru: "Только реальная, вычисленная активность — никогда ничего выдуманного.",
    zh: "仅显示真实的、经计算得出的活动——绝无任何虚构内容。",
    fr: "Uniquement une activité réelle et calculée — jamais rien d'inventé.",
  },
  "notifications.empty": {
    en: "Nothing to flag right now.",
    uz: "Hozircha e'tiborga olinadigan narsa yo'q.",
    ru: "Сейчас нечего отметить.",
    zh: "目前没有需要提示的内容。",
    fr: "Rien à signaler pour le moment.",
  },
  "notifications.openActions": {
    en: "{name}: {count} open action item{plural} in this cycle",
    uz: "{name}: ushbu tsiklda {count} ta ochiq harakat bandi",
    ru: "{name}: {count} открытых пунктов действий в этом цикле",
    zh: "{name}：本周期内有{count}项未完成的行动事项",
    fr: "{name} : {count} action{plural} en attente dans ce cycle",
  },
  "notifications.reassessOverdue": {
    en: "{name}: this 120-day cycle has ended — time to reassess",
    uz: "{name}: ushbu 120 kunlik tsikl tugadi — qayta baholash vaqti keldi",
    ru: "{name}: этот 120-дневный цикл завершён — пора провести переоценку",
    zh: "{name}：本120天周期已结束——该重新评估了",
    fr: "{name} : ce cycle de 120 jours est terminé — il est temps de réévaluer",
  },
  "notifications.reassessDue": {
    en: "{name}: reassessment due in {days} day{plural}",
    uz: "{name}: qayta baholash {days} kundan so'ng kerak",
    ru: "{name}: переоценка требуется через {days} дн.",
    zh: "{name}：还有{days}天需要重新评估",
    fr: "{name} : réévaluation due dans {days} jour{plural}",
  },

  // Explore page (formerly Discover) — two entry points, no investor
  // marketplace: "not sure what to build" routes into My Path's own
  // Discover/Explore questionnaire, "already running a business" routes
  // into a Business Assessment.
  "explore.notSureTitle": { en: "Not sure what to build?", uz: "Nima qurishni bilmayapsizmi?", ru: "Не знаете, что создать?", zh: "还不确定要做什么？", fr: "Vous ne savez pas quoi créer ?" },
  "explore.notSureBody": {
    en: "Answer a short questionnaire about your situation, skills, and resources. MarraUp gives you up to 5 directions worth exploring — real problems to research, not a business plan.",
    uz: "Vaziyatingiz, ko'nikmalaringiz va resurslaringiz haqida qisqa savolnomaga javob bering. MarraUp sizga o'rganishga arziydigan 5 tagacha yo'nalish beradi — tayyor biznes-reja emas, tadqiq qilish uchun haqiqiy muammolar.",
    ru: "Ответьте на короткую анкету о вашей ситуации, навыках и ресурсах. MarraUp предложит до 5 направлений, достойных изучения, — реальные проблемы для исследования, а не готовый бизнес-план.",
    zh: "回答一份关于您的处境、技能和资源的简短问卷。MarraUp 会给出最多 5 个值得探索的方向——是需要您研究的真实问题，而非现成的商业计划。",
    fr: "Répondez à un court questionnaire sur votre situation, vos compétences et vos ressources. MarraUp vous propose jusqu'à 5 pistes à explorer — de vrais problèmes à étudier, pas un plan d'affaires tout fait.",
  },
  "explore.notSureCta": { en: "Start the questionnaire", uz: "Savolnomani boshlash", ru: "Начать анкету", zh: "开始问卷", fr: "Commencer le questionnaire" },
  "explore.notSureCtaContinue": { en: "See my directions", uz: "Yo'nalishlarimni ko'rish", ru: "Посмотреть мои направления", zh: "查看我的方向", fr: "Voir mes pistes" },
  "explore.runningTitle": { en: "Already running a business?", uz: "Allaqachon biznesingiz bormi?", ru: "Уже ведёте бизнес?", zh: "已经在经营企业？", fr: "Vous gérez déjà une entreprise ?" },
  "explore.runningBody": {
    en: "Get a Business Health score and a Risk Exposure score across your operations, plus a ranked action plan on what to fix first.",
    uz: "Faoliyatingiz bo'yicha Biznes salomatligi va Xavf darajasi ballarini, shuningdek, birinchi navbatda nimani tuzatish kerakligi bo'yicha reja oling.",
    ru: "Получите оценку здоровья бизнеса и уровня риска по вашей деятельности, а также ранжированный план действий — что исправить в первую очередь.",
    zh: "获取涵盖您各项运营的业务健康度评分和风险敞口评分，以及一份按优先级排序的、说明应先解决什么的行动计划。",
    fr: "Obtenez un score de santé d'entreprise et un score d'exposition au risque sur vos opérations, ainsi qu'un plan d'action classé par priorité sur ce qu'il faut corriger en premier.",
  },
  "explore.runningCta": { en: "Start a Business Assessment", uz: "Biznesni baholashni boshlash", ru: "Начать оценку бизнеса", zh: "开始业务评估", fr: "Démarrer une évaluation d'entreprise" },
  "explore.viewBusinesses": { en: "View my businesses", uz: "Bizneslarimni ko'rish", ru: "Посмотреть мои бизнесы", zh: "查看我的企业", fr: "Voir mes entreprises" },

  // Profile page
  "profile.myBusiness": { en: "My business", uz: "Mening biznesim", ru: "Мой бизнес", zh: "我的企业", fr: "Mon entreprise" },
  "profile.assessNew": { en: "+ Assess a new business", uz: "+ Yangi biznesni baholash", ru: "+ Оценить новый бизнес", zh: "+ 评估新企业", fr: "+ Évaluer une nouvelle entreprise" },
  "profile.settingsSection": { en: "Settings", uz: "Sozlamalar", ru: "Настройки", zh: "设置", fr: "Paramètres" },
  "profile.accountSection": { en: "Account", uz: "Hisob", ru: "Учётная запись", zh: "账户", fr: "Compte" },
  "profile.accountBody": {
    en: "MarraUp has no login yet in this build — everything above lives on this device, not behind an account. There's nothing account-level to delete; delete an individual business instead, using the Delete link next to it above.",
    uz: "Ushbu versiyada MarraUp hali tizimga kirishga ega emas — yuqoridagi hammasi hisob ortida emas, shu qurilmada saqlanadi. Hisob darajasida o'chiriladigan narsa yo'q; buning o'rniga yuqorida uning yonidagi O'chirish havolasi orqali alohida biznesni o'chiring.",
    ru: "В этой версии MarraUp пока нет входа в систему — всё вышеперечисленное хранится на этом устройстве, а не привязано к учётной записи. Удалять на уровне учётной записи нечего; вместо этого удалите отдельный бизнес, используя ссылку «Удалить» рядом с ним выше.",
    zh: "此版本的MarraUp尚无登录功能——以上所有内容都保存在本设备上，而非账户之下。没有可在账户层面删除的内容；请改用上方每个企业旁的"+"删除"+"链接来删除单个企业。",
    fr: "MarraUp n'a pas encore de connexion dans cette version — tout ce qui précède vit sur cet appareil, pas derrière un compte. Il n'y a rien à supprimer au niveau du compte ; supprimez plutôt une entreprise individuelle via le lien Supprimer à côté d'elle ci-dessus.",
  },

  // Language picker
  "languagePicker.body": {
    en: "Choose the language MarraUp uses throughout the app — the assessment, action plan, and every screen.",
    uz: "MarraUp ilova bo'ylab ishlatadigan tilni tanlang — baholash, harakat rejasi va har bir ekran.",
    ru: "Выберите язык, который MarraUp использует во всём приложении — в оценке, плане действий и на каждом экране.",
    zh: "选择MarraUp在整个应用中使用的语言——评估、行动计划以及每一个界面。",
    fr: "Choisissez la langue utilisée par MarraUp dans toute l'application — l'évaluation, le plan d'action et chaque écran.",
  },

  // Market page
  "market.opportunityHeading": { en: "Opportunity by sector", uz: "Sektorlar bo'yicha imkoniyatlar", ru: "Возможности по секторам", zh: "各行业机遇", fr: "Opportunités par secteur" },
  "market.sectorsCount": { en: "{n} sectors", uz: "{n} sektor", ru: "{n} секторов", zh: "{n}个行业", fr: "{n} secteurs" },
  "market.countryLabel": { en: "Country", uz: "Davlat", ru: "Страна", zh: "国家/地区", fr: "Pays" },
  "market.sectorLabel": { en: "Sector", uz: "Soha", ru: "Отрасль", zh: "行业", fr: "Secteur" },
  "market.sectorAll": { en: "All sectors", uz: "Barcha sohalar", ru: "Все отрасли", zh: "所有行业", fr: "Tous les secteurs" },
  "market.comingSoonHeading": {
    en: "Data coming soon",
    uz: "Ma'lumotlar tez orada",
    ru: "Данные скоро появятся",
    zh: "数据即将上线",
    fr: "Données à venir",
  },
  "market.comingSoonBody": {
    en: "MarraUp currently covers sourced market data for Uzbekistan only. Coverage for other countries is planned.",
    uz: "Hozircha MarraUp faqat O'zbekiston bo'yicha manbali bozor ma'lumotlarini qamrab oladi. Boshqa davlatlar bo'yicha qamrov rejalashtirilmoqda.",
    ru: "В настоящее время MarraUp охватывает достоверные рыночные данные только по Узбекистану. Охват других стран запланирован.",
    zh: "MarraUp目前仅涵盖乌兹别克斯坦的可溯源市场数据。其他国家的数据覆盖正在规划中。",
    fr: "MarraUp couvre actuellement des données de marché sourcées uniquement pour l'Ouzbékistan. La couverture d'autres pays est prévue.",
  },
  "market.noSectorMatch": {
    en: "No sectors match the selected filters yet.",
    uz: "Tanlangan filtrlarga mos soha topilmadi.",
    ru: "Пока нет отраслей, соответствующих выбранным фильтрам.",
    zh: "暂无符合所选筛选条件的行业。",
    fr: "Aucun secteur ne correspond encore aux filtres sélectionnés.",
  },
  // Market page — sourced per-sector research cards (uz/us/de pilot)
  "market.outlookGrowing": { en: "Growing", uz: "O'sib bormoqda", ru: "Растёт", zh: "增长中", fr: "En croissance" },
  "market.outlookStable": { en: "Stable", uz: "Barqaror", ru: "Стабильно", zh: "稳定", fr: "Stable" },
  "market.outlookDeclining": { en: "Declining", uz: "Pasaymoqda", ru: "Снижается", zh: "下降中", fr: "En baisse" },
  "market.outlookNoData": { en: "No data yet", uz: "Hali ma'lumot yo'q", ru: "Данных пока нет", zh: "暂无数据", fr: "Pas encore de données" },
  "market.shortTermLabel": { en: "Short-term (2–3 yrs)", uz: "Qisqa muddatli (2–3 yil)", ru: "Краткосрочно (2–3 года)", zh: "短期（2–3年）", fr: "Court terme (2–3 ans)" },
  "market.longTermLabel": { en: "Long-term (4–8+ yrs)", uz: "Uzoq muddatli (4–8+ yil)", ru: "Долгосрочно (4–8+ лет)", zh: "长期（4–8年以上）", fr: "Long terme (4–8 ans et plus)" },
  "market.asOfLabel": { en: "as of", uz: "holatiga", ru: "по состоянию на", zh: "截至", fr: "au" },
  "market.keyFiguresHeading": { en: "Key figures", uz: "Asosiy ko'rsatkichlar", ru: "Ключевые показатели", zh: "关键数据", fr: "Chiffres clés" },
  "market.whyItCouldWork": {
    en: "Why this could work for you",
    uz: "Bu nima uchun siz uchun foydali bo'lishi mumkin",
    ru: "Почему это может сработать для вас",
    zh: "为什么这对您可能有利",
    fr: "Pourquoi cela pourrait fonctionner pour vous",
  },
  "market.whatCouldGoWrong": {
    en: "What could go wrong",
    uz: "Nima noto'g'ri ketishi mumkin",
    ru: "Что может пойти не так",
    zh: "可能出现的问题",
    fr: "Ce qui pourrait mal tourner",
  },
  "market.significantGaps": {
    en: "Significant market gaps",
    uz: "Muhim bozor bo'shliqlari",
    ru: "Значительные пробелы рынка",
    zh: "重大市场空白",
    fr: "Lacunes importantes du marché",
  },
  "market.noGapFound": {
    en: "No specific market gap found",
    uz: "Aniq bozor bo'shlig'i topilmadi",
    ru: "Конкретный пробел рынка не обнаружен",
    zh: "未发现具体市场空白",
    fr: "Aucune lacune de marché spécifique trouvée",
  },
  "market.assessCta": {
    en: "Assess a business in this sector",
    uz: "Ushbu sohada biznesni baholash",
    ru: "Оценить бизнес в этой отрасли",
    zh: "评估该行业的企业",
    fr: "Évaluer une entreprise dans ce secteur",
  },
  "market.sourcesHeading": { en: "Sources", uz: "Manbalar", ru: "Источники", zh: "来源", fr: "Sources" },
  "market.noSectorData": {
    en: "No reliable data found for this sector yet.",
    uz: "Bu soha uchun hali ishonchli ma'lumot topilmadi.",
    ru: "Для этой отрасли пока не найдено достоверных данных.",
    zh: "暂未找到该行业的可靠数据。",
    fr: "Aucune donnée fiable trouvée pour ce secteur pour l'instant.",
  },
  "market.researchEnglishNote": {
    en: "This research is shown in English only.",
    uz: "Ushbu tadqiqot faqat ingliz tilida ko'rsatiladi.",
    ru: "Эти данные исследования показаны только на английском языке.",
    zh: "此研究内容仅提供英文版本。",
    fr: "Cette recherche n'est présentée qu'en anglais.",
  },

  // ---------- Onboarding ----------
  "onboarding.title": { en: "Welcome to MarraUp", uz: "MarraUp'ga xush kelibsiz", ru: "Добро пожаловать в MarraUp", zh: "欢迎使用 MarraUp", fr: "Bienvenue sur MarraUp" },
  "onboarding.subtitle": {
    en: "A few quick details so the app is set up for you. Everything you enter stays on this device.",
    uz: "Ilova siz uchun sozlanishi uchun bir nechta tezkor ma'lumot. Kiritgan barcha narsangiz shu qurilmada qoladi.",
    ru: "Несколько быстрых деталей, чтобы настроить приложение под вас. Всё, что вы вводите, остаётся на этом устройстве.",
    zh: "只需几项简单信息即可为您设置应用。您输入的所有内容都只保存在此设备上。",
    fr: "Quelques détails rapides pour configurer l'application pour vous. Tout ce que vous saisissez reste sur cet appareil.",
  },
  "onboarding.nameLabel": { en: "Your name", uz: "Ismingiz", ru: "Ваше имя", zh: "您的姓名", fr: "Votre nom" },
  "onboarding.namePlaceholder": { en: "e.g. Aziza Karimova", uz: "masalan, Aziza Karimova", ru: "например, Азиза Каримова", zh: "例如：Aziza Karimova", fr: "p. ex. Aziza Karimova" },
  "onboarding.countryLabel": { en: "Country you live in", uz: "Yashaydigan mamlakatingiz", ru: "Страна проживания", zh: "您所在的国家", fr: "Pays de résidence" },
  "onboarding.countryHint": {
    en: "Used to show you relevant market data. You can change this later in Settings.",
    uz: "Sizga tegishli bozor ma'lumotlarini ko'rsatish uchun ishlatiladi. Buni keyinroq Sozlamalarda o'zgartirishingiz mumkin.",
    ru: "Используется, чтобы показывать вам актуальные рыночные данные. Вы можете изменить это позже в Настройках.",
    zh: "用于向您展示相关的市场数据。您可以稍后在设置中更改此项。",
    fr: "Utilisé pour vous montrer des données de marché pertinentes. Vous pourrez le modifier plus tard dans les Paramètres.",
  },
  "onboarding.photoLabel": { en: "Profile photo (optional)", uz: "Profil rasmi (ixtiyoriy)", ru: "Фото профиля (необязательно)", zh: "个人头像（可选）", fr: "Photo de profil (facultatif)" },
  "onboarding.photoHint": {
    en: "Stored only on this device, never uploaded anywhere.",
    uz: "Faqat shu qurilmada saqlanadi, hech qayerga yuklanmaydi.",
    ru: "Хранится только на этом устройстве, никуда не отправляется.",
    zh: "仅保存在此设备上，不会上传到任何地方。",
    fr: "Stockée uniquement sur cet appareil, jamais téléchargée ailleurs.",
  },
  "onboarding.choosePhoto": { en: "Choose photo", uz: "Rasm tanlash", ru: "Выбрать фото", zh: "选择照片", fr: "Choisir une photo" },
  "onboarding.removePhoto": { en: "Remove", uz: "Olib tashlash", ru: "Удалить", zh: "移除", fr: "Retirer" },
  "onboarding.continue": { en: "Continue", uz: "Davom etish", ru: "Продолжить", zh: "继续", fr: "Continuer" },
  "onboarding.selectCountry": { en: "Select a country", uz: "Mamlakatni tanlang", ru: "Выберите страну", zh: "请选择国家", fr: "Sélectionnez un pays" },

  // ---------- Profile identity / restructure ----------
  "profile.editIdentity": { en: "Edit", uz: "Tahrirlash", ru: "Изменить", zh: "编辑", fr: "Modifier" },
  "profile.myPathSection": { en: "My Path", uz: "Mening yo'lim", ru: "Мой путь", zh: "我的道路", fr: "Mon chemin" },
  "profile.myPathEmptyTitle": {
    en: "You haven't started My Path yet",
    uz: "Siz hali \"Mening yo'lim\"ni boshlamagansiz",
    ru: "Вы ещё не начали «Мой путь»",
    zh: "您尚未开始「我的道路」",
    fr: "Vous n'avez pas encore commencé Mon chemin",
  },
  "profile.myPathEmptyBody": {
    en: "My Path helps you identify sectors worth investigating, based on who you are, what you can access, and what life you want.",
    uz: "\"Mening yo'lim\" sizga kim ekanligingiz, nimaga ega ekanligingiz va qanday hayot xohlashingiz asosida tekshirishga arziydigan sohalarni aniqlashga yordam beradi.",
    ru: "«Мой путь» помогает определить отрасли, достойные изучения, на основе того, кто вы, к чему у вас есть доступ и какую жизнь вы хотите.",
    zh: "「我的道路」根据您的背景、可利用的资源以及您想要的生活方式，帮助您找到值得探索的行业。",
    fr: "Mon chemin vous aide à identifier des secteurs à explorer, selon qui vous êtes, ce à quoi vous avez accès et la vie que vous souhaitez.",
  },
  "profile.myPathLearnMore": { en: "Learn about My Path", uz: "\"Mening yo'lim\" haqida bilib oling", ru: "Узнать о «Моём пути»", zh: "了解「我的道路」", fr: "En savoir plus sur Mon chemin" },

  // ---------- My Path intro (informational, before the questionnaire exists) ----------
  "myPath.title": { en: "My Path", uz: "Mening yo'lim", ru: "Мой путь", zh: "我的道路", fr: "Mon chemin" },
  "myPath.tagline": {
    en: "Path to Your Own Business",
    uz: "O'z biznesingizga yo'l",
    ru: "Путь к собственному бизнесу",
    zh: "通往自己事业的道路",
    fr: "Le chemin vers votre propre entreprise",
  },
  "myPath.whyHeading": { en: "Why this exists", uz: "Bu nima uchun kerak", ru: "Зачем это нужно", zh: "为何需要它", fr: "Pourquoi cela existe" },
  "myPath.whyBody": {
    en: "If you want to start something of your own but don't know which direction to look in, My Path helps you find 3–5 sectors worth investigating — based on your experience, what you can access, your constraints, and the life you want. It never tells you exactly what business to start; that decision stays yours.",
    uz: "Agar o'zingizning ishingizni boshlamoqchi bo'lsangiz-u, qaysi yo'nalishga qarashni bilmasangiz, \"Mening yo'lim\" tajribangiz, imkoniyatlaringiz, cheklovlaringiz va xohlagan hayotingiz asosida tekshirishga arziydigan 3–5 ta sohani topishga yordam beradi. U sizga aniq qanday biznes boshlashni hech qachon aytmaydi — bu qaror sizda qoladi.",
    ru: "Если вы хотите начать своё дело, но не знаете, в каком направлении искать, «Мой путь» поможет найти 3–5 отраслей, достойных изучения — на основе вашего опыта, доступных возможностей, ограничений и желаемой жизни. Он никогда не скажет вам, какой именно бизнес открыть — это решение остаётся за вами.",
    zh: "如果您想创办属于自己的事业，却不知道该往哪个方向发展，「我的道路」会根据您的经验、可利用的资源、限制条件以及您想要的生活，帮您找到3-5个值得探索的行业。它不会替您决定具体要做什么生意——这个决定始终由您自己做出。",
    fr: "Si vous voulez créer votre propre activité mais ne savez pas dans quelle direction chercher, Mon chemin vous aide à trouver 3 à 5 secteurs à explorer — selon votre expérience, ce à quoi vous avez accès, vos contraintes et la vie que vous souhaitez. Il ne vous dira jamais quelle entreprise précise créer : cette décision reste la vôtre.",
  },
  "myPath.howHeading": { en: "How it works", uz: "Bu qanday ishlaydi", ru: "Как это работает", zh: "运作方式", fr: "Comment ça marche" },
  "myPath.howQuestions": {
    en: "About 20 short questions, grouped into 4 short chapters — no writing required, just tapping the option that fits.",
    uz: "Taxminan 20 ta qisqa savol, 4 ta qisqa bobga guruhlangan — yozish shart emas, faqat mos variantni bosish kifoya.",
    ru: "Около 20 коротких вопросов, разбитых на 4 коротких раздела — писать ничего не нужно, просто нажимайте подходящий вариант.",
    zh: "约20个简短问题，分为4个小章节——无需书写，只需点选合适的选项即可。",
    fr: "Environ 20 questions courtes, réparties en 4 chapitres courts — aucune rédaction requise, il suffit de choisir l'option qui vous correspond.",
  },
  "myPath.howSave": {
    en: "You can stop at any point and pick up exactly where you left off — nothing is lost.",
    uz: "Istalgan vaqtda to'xtatishingiz va aynan to'xtagan joydan davom ettirishingiz mumkin — hech narsa yo'qolmaydi.",
    ru: "Вы можете остановиться в любой момент и продолжить точно с того места, где остановились — ничего не потеряется.",
    zh: "您可以随时暂停，之后从中断处继续——不会丢失任何内容。",
    fr: "Vous pouvez vous arrêter à tout moment et reprendre exactement là où vous en étiez — rien n'est perdu.",
  },
  "myPath.howResults": {
    en: "As soon as you finish, you get your results immediately — no waiting, no account needed.",
    uz: "Tugatishingiz bilanoq natijalaringizni darhol olasiz — kutish yo'q, hisob ochish shart emas.",
    ru: "Как только вы закончите, вы сразу получаете результаты — без ожидания, без учётной записи.",
    zh: "完成后即可立即获得结果——无需等待，无需注册账户。",
    fr: "Dès que vous avez terminé, vous obtenez vos résultats immédiatement — sans attente, sans compte requis.",
  },
  "myPath.howSaved": {
    en: "Every run is saved to your Profile so you can revisit or compare it later.",
    uz: "Har bir urinish Profilingizga saqlanadi, shunda uni keyinroq qayta ko'rishingiz yoki solishtirishingiz mumkin.",
    ru: "Каждый прогон сохраняется в вашем Профиле, чтобы вы могли вернуться к нему или сравнить позже.",
    zh: "每次结果都会保存到您的个人资料中，方便您日后查看或比较。",
    fr: "Chaque session est enregistrée dans votre Profil afin que vous puissiez la consulter ou la comparer plus tard.",
  },
  "myPath.comingSoon": {
    en: "The questionnaire itself is still being built — this page will let you start it as soon as it's ready.",
    uz: "So'rovnomaning o'zi hali yaratilmoqda — bu sahifa tayyor bo'lishi bilanoq uni boshlash imkonini beradi.",
    ru: "Сама анкета пока в разработке — эта страница позволит вам начать её, как только она будет готова.",
    zh: "问卷本身仍在开发中——该页面将在问卷准备好后立即让您开始使用。",
    fr: "Le questionnaire lui-même est encore en construction — cette page vous permettra de le commencer dès qu'il sera prêt.",
  },

  // ---------- Business Assessment intro (before the intake form) ----------
  "assessIntro.title": { en: "Assess a business", uz: "Biznesni baholash", ru: "Оценить бизнес", zh: "评估企业", fr: "Évaluer une entreprise" },
  "assessIntro.whyBody": {
    en: "This walks through your business's health and risk exposure using plain questions about what's actually happening — no jargon, no guessing.",
    uz: "Bu sizning biznesingizning holati va xavf darajasini haqiqatda sodir bo'layotgan narsalar haqidagi oddiy savollar orqali ko'rib chiqadi — jargon yo'q, taxmin yo'q.",
    ru: "Здесь пошагово оценивается состояние и уровень риска вашего бизнеса с помощью простых вопросов о том, что происходит на самом деле — без жаргона и догадок.",
    zh: "本流程通过关于实际情况的简明问题，评估您企业的健康状况和风险敞口——没有术语，无需猜测。",
    fr: "Ce parcours évalue la santé et l'exposition au risque de votre entreprise à l'aide de questions simples sur ce qui se passe réellement — sans jargon, sans supposition.",
  },
  "assessIntro.howQuestions": {
    en: "Sector and basic details, then a set of health and risk questions — most people finish in 10–15 minutes.",
    uz: "Soha va asosiy tafsilotlar, so'ngra holat va xavf haqida bir qator savollar — ko'pchilik 10–15 daqiqada tugatadi.",
    ru: "Отрасль и основные детали, затем ряд вопросов о состоянии и рисках — большинство завершает за 10–15 минут.",
    zh: "先填写行业和基本信息，然后回答一系列健康与风险问题——大多数人可在10-15分钟内完成。",
    fr: "Secteur et informations de base, puis une série de questions sur la santé et les risques — la plupart des gens terminent en 10 à 15 minutes.",
  },
  "assessIntro.howSave": {
    en: "Your answers are saved as you go, so you can leave and come back without losing progress.",
    uz: "Javoblaringiz davom etayotganingizda saqlanadi, shuning uchun chiqib ketib, yana qaytishingiz mumkin va jarayon yo'qolmaydi.",
    ru: "Ваши ответы сохраняются по мере заполнения, поэтому вы можете выйти и вернуться, не теряя прогресс.",
    zh: "您的回答会随时保存，因此您可以随时离开并返回，而不会丢失进度。",
    fr: "Vos réponses sont enregistrées au fur et à mesure, vous pouvez donc quitter et revenir sans perdre votre progression.",
  },
  "assessIntro.howResults": {
    en: "You get your Business Health and Risk Exposure scores immediately after the last question — along with a plain-language breakdown, not just a number.",
    uz: "Oxirgi savoldan so'ng darhol Biznes salomatligi va Xavf darajasi ko'rsatkichlarini olasiz — shunchaki raqam emas, oddiy tilda tushuntirish bilan birga.",
    ru: "Сразу после последнего вопроса вы получаете показатели состояния бизнеса и уровня риска — вместе с расшифровкой простым языком, а не просто цифрой.",
    zh: "回答完最后一个问题后，您会立即获得企业健康度和风险敞口评分——并附有通俗易懂的详细说明，而不仅仅是一个数字。",
    fr: "Vous obtenez vos scores de santé d'entreprise et d'exposition au risque immédiatement après la dernière question — avec une explication en langage clair, pas seulement un chiffre.",
  },
  "assessIntro.start": { en: "Start assessment", uz: "Baholashni boshlash", ru: "Начать оценку", zh: "开始评估", fr: "Commencer l'évaluation" },

  // ---------- Shared journey chrome (Find/Develop/Test/Experiment/Revenue/Stable) ----------
  "journey.status.notStarted": { en: "Not started", uz: "Boshlanmagan", ru: "Не начато", zh: "尚未开始", fr: "Non commencé" },
  "journey.status.inProgress": { en: "In progress", uz: "Jarayonda", ru: "В процессе", zh: "进行中", fr: "En cours" },
  "journey.status.done": { en: "Done", uz: "Bajarildi", ru: "Готово", zh: "已完成", fr: "Terminé" },
  "journey.save": { en: "Save", uz: "Saqlash", ru: "Сохранить", zh: "保存", fr: "Enregistrer" },
  "journey.addEntry": { en: "Add entry…", uz: "Yozuv qo'shish…", ru: "Добавить запись…", zh: "添加记录…", fr: "Ajouter une entrée…" },
  "journey.add": { en: "Add", uz: "Qo'shish", ru: "Добавить", zh: "添加", fr: "Ajouter" },
  "journey.newProject": { en: "New project", uz: "Yangi loyiha", ru: "Новый проект", zh: "新项目", fr: "Nouveau projet" },
  "journey.backToMyPath": { en: "← My Path", uz: "← Mening yo'lim", ru: "← Мой путь", zh: "← 我的路径", fr: "← Mon parcours" },

  // ---------- Find ----------
  "find.subtitle": { en: "Find — is this worth building?", uz: "Topish — bunga arziydimi?", ru: "Найти — стоит ли этим заниматься?", zh: "探索——这值得去做吗？", fr: "Trouver — cela vaut-il la peine d'être construit ?" },
  "find.decided": { en: "Decided — write the Blueprint when ready.", uz: "Qaror qabul qilindi — tayyor bo'lganingizda Rejani yozing.", ru: "Решение принято — напишите План, когда будете готовы.", zh: "已决定——准备好后撰写蓝图。", fr: "Décidé — rédigez le Plan quand vous serez prêt." },
  "find.openBlueprint": { en: "Open Blueprint", uz: "Rejani ochish", ru: "Открыть План", zh: "打开蓝图", fr: "Ouvrir le Plan" },

  // ---------- Start a Project ----------
  "newProject.title": { en: "Start a Project", uz: "Loyihani boshlash", ru: "Начать проект", zh: "启动项目", fr: "Démarrer un projet" },
  "newProject.subtitle": { en: "Where does the question come from?", uz: "Savol qayerdan kelib chiqadi?", ru: "Откуда возник этот вопрос?", zh: "这个问题从何而来？", fr: "D'où vient cette question ?" },
  "newProject.marketGap": { en: "Market gap", uz: "Bozor bo'shlig'i", ru: "Рыночный пробел", zh: "市场空白", fr: "Lacune du marché" },
  "newProject.ownIdea": { en: "My own idea", uz: "O'z g'oyam", ru: "Моя собственная идея", zh: "我自己的想法", fr: "Ma propre idée" },
  "newProject.noGaps": { en: "No sourced gaps for your country yet — try your own idea.", uz: "Mamlakatingiz uchun hali manbali bo'shliqlar yo'q — o'z g'oyangizni sinab ko'ring.", ru: "Для вашей страны пока нет подтверждённых пробелов — попробуйте свою идею.", zh: "您所在国家/地区尚无已核实的市场空白——请尝试您自己的想法。", fr: "Aucune lacune sourcée pour votre pays pour l'instant — essayez votre propre idée." },
  "newProject.placeholder": { en: "What problem have you noticed?", uz: "Qanday muammoni sezdingiz?", ru: "Какую проблему вы заметили?", zh: "您注意到了什么问题？", fr: "Quel problème avez-vous remarqué ?" },
  "newProject.start": { en: "Start Project", uz: "Loyihani boshlash", ru: "Начать проект", zh: "启动项目", fr: "Démarrer le projet" },

  // ---------- Develop ----------
  "develop.subtitle": { en: "Develop — build the smallest real version.", uz: "Rivojlantirish — eng kichik haqiqiy versiyasini yarating.", ru: "Разработка — создайте минимальную реальную версию.", zh: "开发——构建最小的真实版本。", fr: "Développer — construisez la plus petite version réelle." },
  "develop.launchReady": { en: "Launch-ready", uz: "Ishga tushirishga tayyor", ru: "Готово к запуску", zh: "可发布状态", fr: "Prêt à lancer" },
  "develop.notCoveredYet": { en: "Not covered yet:", uz: "Hali qamrab olinmagan:", ru: "Пока не охвачено:", zh: "尚未覆盖：", fr: "Pas encore couvert :" },
  "develop.readyForTest": { en: "Ready for Test?", uz: "Sinovga tayyormi?", ru: "Готово к Тестированию?", zh: "准备好测试了吗？", fr: "Prêt pour le Test ?" },
  "develop.confirmMoveToTest": { en: "Confirm — move to Test", uz: "Tasdiqlash — Sinovga o'tish", ru: "Подтвердить — перейти к Тестированию", zh: "确认——进入测试阶段", fr: "Confirmer — passer au Test" },
  "develop.required": { en: "Required", uz: "Majburiy", ru: "Обязательно", zh: "必需", fr: "Requis" },
  "develop.addTask": { en: "Add task…", uz: "Vazifa qo'shish…", ru: "Добавить задачу…", zh: "添加任务…", fr: "Ajouter une tâche…" },

  // ---------- Blueprint ----------
  "blueprint.backToFind": { en: "← Find", uz: "← Topish", ru: "← Найти", zh: "← 探索", fr: "← Trouver" },
  "blueprint.title": { en: "Blueprint", uz: "Reja", ru: "План", zh: "蓝图", fr: "Plan" },
  "blueprint.subtitle": { en: "One page describing what you're building.", uz: "Nima qurayotganingizni tasvirlovchi bitta sahifa.", ru: "Одна страница с описанием того, что вы создаёте.", zh: "一页描述您正在构建的内容。", fr: "Une page décrivant ce que vous construisez." },
  "blueprint.proceedToDevelop": { en: "Proceed to Develop", uz: "Rivojlantirishga o'tish", ru: "Перейти к Разработке", zh: "进入开发阶段", fr: "Passer au Développement" },
  "blueprint.field.name": { en: "Project name", uz: "Loyiha nomi", ru: "Название проекта", zh: "项目名称", fr: "Nom du projet" },
  "blueprint.field.problem": { en: "Problem", uz: "Muammo", ru: "Проблема", zh: "问题", fr: "Problème" },
  "blueprint.field.customer": { en: "Customer", uz: "Mijoz", ru: "Клиент", zh: "客户", fr: "Client" },
  "blueprint.field.offering": { en: "Offering", uz: "Taklif", ru: "Предложение", zh: "产品/服务", fr: "Offre" },
  "blueprint.field.revenueModel": { en: "Revenue model", uz: "Daromad modeli", ru: "Модель дохода", zh: "盈利模式", fr: "Modèle de revenus" },
  "blueprint.field.pricing": { en: "Pricing", uz: "Narxlash", ru: "Ценообразование", zh: "定价", fr: "Tarification" },
  "blueprint.field.advantage": { en: "Unique advantage", uz: "Noyob ustunlik", ru: "Уникальное преимущество", zh: "独特优势", fr: "Avantage unique" },
  "blueprint.field.locationScope": { en: "Location / scope", uz: "Joylashuv / qamrov", ru: "Локация / охват", zh: "地点/范围", fr: "Emplacement / portée" },
  "blueprint.field.requiredResources": { en: "Required resources", uz: "Kerakli resurslar", ru: "Необходимые ресурсы", zh: "所需资源", fr: "Ressources nécessaires" },
  "blueprint.field.launchReadyCondition": { en: "Launch-ready condition", uz: "Ishga tushirishga tayyorlik sharti", ru: "Условие готовности к запуску", zh: "可发布条件", fr: "Condition de mise en route" },

  // ---------- Test ----------
  "test.setupTitle": { en: "Set up your test", uz: "Sinovingizni sozlang", ru: "Настройте ваш тест", zh: "设置您的测试", fr: "Configurez votre test" },
  "test.whatTesting": { en: "What are you testing", uz: "Nimani sinayapsiz", ru: "Что вы тестируете", zh: "您正在测试什么", fr: "Que testez-vous" },
  "test.whoWith": { en: "Who with", uz: "Kim bilan", ru: "С кем", zh: "与谁", fr: "Avec qui" },
  "test.price": { en: "Price", uz: "Narx", ru: "Цена", zh: "价格", fr: "Prix" },
  "test.channel": { en: "Channel", uz: "Kanal", ru: "Канал", zh: "渠道", fr: "Canal" },
  "test.businessType": { en: "Business type", uz: "Biznes turi", ru: "Тип бизнеса", zh: "业务类型", fr: "Type d'activité" },
  "test.startTesting": { en: "Start testing", uz: "Sinovni boshlash", ru: "Начать тестирование", zh: "开始测试", fr: "Commencer le test" },
  "test.subtitle": { en: "Test — do real customers want it?", uz: "Sinov — haqiqiy mijozlar buni xohlaydimi?", ru: "Тест — хотят ли этого реальные клиенты?", zh: "测试——真实客户想要吗？", fr: "Test — les vrais clients le veulent-ils ?" },
  "test.milestone.customer": { en: "Customer", uz: "Mijoz", ru: "Клиент", zh: "客户", fr: "Client" },
  "test.milestone.payment": { en: "Payment", uz: "To'lov", ru: "Платёж", zh: "付款", fr: "Paiement" },
  "test.milestone.repeat": { en: "Repeat", uz: "Takror", ru: "Повтор", zh: "复购", fr: "Répétition" },
  "test.markFirstCustomer": { en: "Mark first customer", uz: "Birinchi mijozni belgilash", ru: "Отметить первого клиента", zh: "标记首位客户", fr: "Marquer le premier client" },
  "test.markFirstPayment": { en: "Mark first payment", uz: "Birinchi to'lovni belgilash", ru: "Отметить первый платёж", zh: "标记首笔付款", fr: "Marquer le premier paiement" },
  "test.markFirstRepeat": { en: "Mark first repeat", uz: "Birinchi takrorni belgilash", ru: "Отметить первый повтор", zh: "标记首次复购", fr: "Marquer la première répétition" },
  "test.log": { en: "Log", uz: "Qayd etish", ru: "Записать", zh: "记录", fr: "Enregistrer" },
  "test.question.reach": { en: "Reach — did people notice?", uz: "Qamrov — odamlar sezdimi?", ru: "Охват — люди заметили?", zh: "触达——人们注意到了吗？", fr: "Portée — les gens ont-ils remarqué ?" },
  "test.question.interest": { en: "Interest — real intent?", uz: "Qiziqish — haqiqiy niyatmi?", ru: "Интерес — реальное намерение?", zh: "兴趣——真实意向？", fr: "Intérêt — intention réelle ?" },
  "test.question.usage": { en: "Usage — did they use it?", uz: "Foydalanish — ular ishlatdimi?", ru: "Использование — они это использовали?", zh: "使用——他们使用了吗？", fr: "Utilisation — l'ont-ils utilisé ?" },
  "test.question.response": { en: "Response — did they value it?", uz: "Munosabat — ular qadrladimi?", ru: "Отклик — они это оценили?", zh: "反馈——他们认可吗？", fr: "Réponse — l'ont-ils valorisé ?" },
  "test.question.economics": { en: "Economics — numbers make sense?", uz: "Iqtisodiyot — raqamlar mos keladimi?", ru: "Экономика — цифры сходятся?", zh: "经济性——数字合理吗？", fr: "Économie — les chiffres tiennent-ils la route ?" },
  "test.yes": { en: "yes", uz: "ha", ru: "да", zh: "是", fr: "oui" },
  "test.responseEconomicsExamples": {
    en: "Repeat, renewal, referral, feedback, refund, cancellation",
    uz: "Takror, uzaytirish, tavsiya, fikr-mulohaza, qaytarish, bekor qilish",
    ru: "Повтор, продление, рекомендация, отзыв, возврат, отмена",
    zh: "复购、续费、转介、反馈、退款、取消",
    fr: "Répétition, renouvellement, recommandation, avis, remboursement, annulation",
  },
  "test.priceEconomicsExamples": {
    en: "Price, revenue, direct cost, spend, cash in vs. out",
    uz: "Narx, daromad, to'g'ridan-to'g'ri xarajat, sarf, kirim va chiqim",
    ru: "Цена, выручка, прямые затраты, расходы, приход и расход денег",
    zh: "价格、收入、直接成本、支出、现金流入与流出",
    fr: "Prix, revenu, coût direct, dépense, trésorerie entrante et sortante",
  },
  "test.logObservation": { en: "Log an observation…", uz: "Kuzatuvni qayd eting…", ru: "Записать наблюдение…", zh: "记录一条观察…", fr: "Enregistrer une observation…" },
  "test.countsAsYes": { en: "Counts as a \"yes\"", uz: "\"Ha\" deb hisoblanadi", ru: "Считается «да»", zh: "算作「是」", fr: "Compte comme un « oui »" },
  "test.observationsLogged": { en: "observations logged", uz: "ta kuzatuv qayd etildi", ru: "наблюдений записано", zh: "条观察已记录", fr: "observations enregistrées" },
  "test.positiveSignal": { en: "At least one positive signal recorded.", uz: "Kamida bitta ijobiy signal qayd etildi.", ru: "Зафиксирован хотя бы один положительный сигнал.", zh: "已记录至少一个积极信号。", fr: "Au moins un signal positif enregistré." },
  "test.noPositiveSignal": { en: "No positive signal recorded yet.", uz: "Hali ijobiy signal qayd etilmagan.", ru: "Положительный сигнал пока не зафиксирован.", zh: "尚未记录到积极信号。", fr: "Aucun signal positif enregistré pour l'instant." },
  "test.runExperiment": { en: "Run an Experiment", uz: "Tajriba o'tkazish", ru: "Провести Эксперимент", zh: "开展实验", fr: "Lancer une Expérience" },
  "test.runExperimentDisabled": { en: "Run an Experiment — needs a positive signal first", uz: "Tajriba o'tkazish — avval ijobiy signal kerak", ru: "Провести Эксперимент — сначала нужен положительный сигнал", zh: "开展实验——需要先有积极信号", fr: "Lancer une Expérience — nécessite d'abord un signal positif" },
  "test.backToFind": { en: "Back to Find", uz: "Topishga qaytish", ru: "Назад к Поиску", zh: "返回探索", fr: "Retour à Trouver" },
  "test.archive": { en: "Archive", uz: "Arxivlash", ru: "Архивировать", zh: "归档", fr: "Archiver" },

  // ---------- Experiment ----------
  "experiment.backToTest": { en: "← Test", uz: "← Sinov", ru: "← Тест", zh: "← 测试", fr: "← Test" },
  "experiment.subtitle": { en: "Experiment — what can you change to improve it?", uz: "Tajriba — uni yaxshilash uchun nimani o'zgartirishingiz mumkin?", ru: "Эксперимент — что можно изменить, чтобы улучшить?", zh: "实验——您可以改变什么来改善它？", fr: "Expérience — que pouvez-vous changer pour l'améliorer ?" },
  "experiment.openSingular": { en: "experiment still open — reach a decision to move on.", uz: "tajriba hali ochiq — davom etish uchun qaror qabul qiling.", ru: "эксперимент всё ещё открыт — примите решение, чтобы двигаться дальше.", zh: "个实验仍处于进行中——做出决定后才能继续。", fr: "expérience encore ouverte — prenez une décision pour avancer." },
  "experiment.openPlural": { en: "experiments still open — reach a decision to move on.", uz: "tajriba hali ochiq — davom etish uchun qaror qabul qiling.", ru: "эксперимента всё ещё открыты — примите решение, чтобы двигаться дальше.", zh: "个实验仍处于进行中——做出决定后才能继续。", fr: "expériences encore ouvertes — prenez une décision pour avancer." },
  "experiment.weakPointsFound": { en: "Weak points found", uz: "Aniqlangan zaif nuqtalar", ru: "Найденные слабые места", zh: "发现的薄弱环节", fr: "Points faibles identifiés" },
  "experiment.startThis": { en: "Start this experiment", uz: "Ushbu tajribani boshlash", ru: "Начать этот эксперимент", zh: "开始此实验", fr: "Démarrer cette expérience" },
  "experiment.whatWillYouDo": { en: "What exactly will you do?", uz: "Aniq nima qilasiz?", ru: "Что именно вы будете делать?", zh: "您具体会做什么？", fr: "Que ferez-vous exactement ?" },
  "experiment.howWillYouKnow": { en: "How will you know it worked?", uz: "Ishlaganini qanday bilasiz?", ru: "Как вы поймёте, что это сработало?", zh: "您怎么知道它成功了？", fr: "Comment saurez-vous que ça a fonctionné ?" },
  "experiment.whyThatRule": { en: "Why that rule?", uz: "Nega bu qoida?", ru: "Почему именно это правило?", zh: "为什么选择这个标准？", fr: "Pourquoi cette règle ?" },
  "experiment.start": { en: "Start", uz: "Boshlash", ru: "Начать", zh: "开始", fr: "Démarrer" },
  "experiment.yourExperiments": { en: "Your experiments", uz: "Sizning tajribalaringiz", ru: "Ваши эксперименты", zh: "您的实验", fr: "Vos expériences" },
  "experiment.decision": { en: "Decision:", uz: "Qaror:", ru: "Решение:", zh: "决定：", fr: "Décision :" },
  "experiment.notYetDecided": { en: "Not yet decided", uz: "Hali qaror qabul qilinmagan", ru: "Решение пока не принято", zh: "尚未决定", fr: "Pas encore décidé" },
  "experiment.whatHappened": { en: "What happened?", uz: "Nima bo'ldi?", ru: "Что произошло?", zh: "发生了什么？", fr: "Que s'est-il passé ?" },
  "experiment.interpretation": { en: "Interpretation", uz: "Talqin", ru: "Интерпретация", zh: "解读", fr: "Interprétation" },
  "experiment.whatDidYouLearn": { en: "What did you learn?", uz: "Nimani o'rgandingiz?", ru: "Что вы узнали?", zh: "您学到了什么？", fr: "Qu'avez-vous appris ?" },
  "experiment.evidence.supported": { en: "Supported", uz: "Tasdiqlandi", ru: "Подтверждено", zh: "得到支持", fr: "Confirmé" },
  "experiment.evidence.challenged": { en: "Challenged", uz: "Shubha ostiga olindi", ru: "Опровергнуто", zh: "受到质疑", fr: "Contesté" },
  "experiment.evidence.unclear": { en: "Unclear", uz: "Noaniq", ru: "Неясно", zh: "不明确", fr: "Peu clair" },
  "experiment.decision.continue": { en: "Continue", uz: "Davom etish", ru: "Продолжить", zh: "继续", fr: "Continuer" },
  "experiment.decision.change": { en: "Change", uz: "O'zgartirish", ru: "Изменить", zh: "改变", fr: "Changer" },
  "experiment.decision.stop": { en: "Stop", uz: "To'xtatish", ru: "Остановить", zh: "停止", fr: "Arrêter" },
  "experiment.backToTestButton": { en: "Back to Test", uz: "Sinovga qaytish", ru: "Назад к Тесту", zh: "返回测试", fr: "Retour au Test" },
  "experiment.moveToRevenue": { en: "Move to Revenue", uz: "Daromadga o'tish", ru: "Перейти к Доходу", zh: "进入收入阶段", fr: "Passer aux Revenus" },

  // ---------- Revenue ----------
  "revenue.day": { en: "Revenue — Day {day} / 30", uz: "Daromad — {day}-kun / 30", ru: "Доход — День {day} / 30", zh: "收入——第 {day} 天 / 30", fr: "Revenus — Jour {day} / 30" },
  "revenue.revenue": { en: "Revenue", uz: "Daromad", ru: "Доход", zh: "收入", fr: "Revenus" },
  "revenue.netCash": { en: "Net cash", uz: "Sof pul mablag'i", ru: "Чистый денежный поток", zh: "净现金", fr: "Trésorerie nette" },
  "revenue.customers": { en: "Customers", uz: "Mijozlar", ru: "Клиенты", zh: "客户", fr: "Clients" },
  "revenue.repeat": { en: "repeat", uz: "takror", ru: "повтор", zh: "复购", fr: "répétés" },
  "revenue.cycle": { en: "Cycle", uz: "Sikl", ru: "Цикл", zh: "周期", fr: "Cycle" },
  "revenue.editCycle": { en: "Edit this cycle", uz: "Ushbu siklni tahrirlash", ru: "Редактировать этот цикл", zh: "编辑本周期", fr: "Modifier ce cycle" },
  "revenue.field.moneyInvested": { en: "Money invested", uz: "Investitsiya qilingan pul", ru: "Вложенные средства", zh: "投入资金", fr: "Argent investi" },
  "revenue.field.expenses": { en: "Expenses", uz: "Xarajatlar", ru: "Расходы", zh: "支出", fr: "Dépenses" },
  "revenue.field.newCustomers": { en: "New customers", uz: "Yangi mijozlar", ru: "Новые клиенты", zh: "新客户", fr: "Nouveaux clients" },
  "revenue.field.totalCustomers": { en: "Total customers", uz: "Jami mijozlar", ru: "Всего клиентов", zh: "客户总数", fr: "Total clients" },
  "revenue.field.repeatCustomers": { en: "Repeat customers", uz: "Takroriy mijozlar", ru: "Повторные клиенты", zh: "复购客户", fr: "Clients récurrents" },
  "revenue.field.salesCount": { en: "Sales / orders", uz: "Sotuvlar / buyurtmalar", ru: "Продажи / заказы", zh: "销售/订单数", fr: "Ventes / commandes" },
  "revenue.field.avgSaleValue": { en: "Avg sale value", uz: "O'rtacha sotuv qiymati", ru: "Средняя сумма продажи", zh: "平均销售额", fr: "Valeur moyenne de vente" },
  "revenue.recurringCommitments": { en: "Recurring commitments", uz: "Doimiy majburiyatlar", ru: "Регулярные обязательства", zh: "经常性承诺", fr: "Engagements récurrents" },
  "revenue.notes": { en: "Notes", uz: "Eslatmalar", ru: "Заметки", zh: "备注", fr: "Notes" },
  "revenue.saveCycle": { en: "Save cycle", uz: "Siklni saqlash", ru: "Сохранить цикл", zh: "保存周期", fr: "Enregistrer le cycle" },
  "revenue.day30Review": { en: "Day-30 review", uz: "30-kunlik ko'rib chiqish", ru: "Обзор 30-го дня", zh: "第30天回顾", fr: "Bilan du jour 30" },
  "revenue.whatChanged": { en: "What changed?", uz: "Nima o'zgardi?", ru: "Что изменилось?", zh: "发生了什么变化？", fr: "Qu'est-ce qui a changé ?" },
  "revenue.needsAttention": { en: "What needs attention?", uz: "Nimaga e'tibor berish kerak?", ru: "На что нужно обратить внимание?", zh: "什么需要关注？", fr: "Qu'est-ce qui nécessite de l'attention ?" },
  "revenue.nextStep": { en: "What should I do next?", uz: "Keyin nima qilishim kerak?", ru: "Что мне делать дальше?", zh: "接下来该做什么？", fr: "Que dois-je faire ensuite ?" },
  "revenue.closeCycle": { en: "Close cycle — start next", uz: "Siklni yopish — keyingisini boshlash", ru: "Закрыть цикл — начать следующий", zh: "结束周期——开始下一个", fr: "Clôturer le cycle — démarrer le suivant" },
  "revenue.investigateInExperiment": { en: "Investigate in Experiment", uz: "Tajribada tekshirish", ru: "Исследовать в Эксперименте", zh: "在实验中调查", fr: "Investiguer dans Expérience" },
  "revenue.viewAsStable": { en: "View as Stable Business", uz: "Barqaror biznes sifatida ko'rish", ru: "Смотреть как Стабильный бизнес", zh: "以稳定业务视角查看", fr: "Voir comme Entreprise stable" },

  // ---------- Stable Business ----------
  "stable.backToRevenue": { en: "← Revenue", uz: "← Daromad", ru: "← Доход", zh: "← 收入", fr: "← Revenus" },
  "stable.introBody": {
    en: "Your journey has reached its next phase. You've moved from building a business into managing an operating one.",
    uz: "Sayohatingiz keyingi bosqichga yetdi. Siz biznes qurishdan uni boshqarishga o'tdingiz.",
    ru: "Ваш путь достиг следующего этапа. Вы перешли от построения бизнеса к управлению уже действующим.",
    zh: "您的旅程进入了下一阶段。您已从创建企业转向经营一家运转中的企业。",
    fr: "Votre parcours a atteint sa prochaine phase. Vous êtes passé de la construction d'une entreprise à la gestion d'une entreprise en activité.",
  },
  "stable.gotIt": { en: "Got it", uz: "Tushunarli", ru: "Понятно", zh: "知道了", fr: "Compris" },
  "stable.subtitle": { en: "How the business is running.", uz: "Biznes qanday ishlayotgani.", ru: "Как идут дела в бизнесе.", zh: "业务运营情况。", fr: "Comment l'entreprise fonctionne." },
  "stable.needsCycle": { en: "Close at least one Revenue cycle to see this view.", uz: "Bu ko'rinishni ko'rish uchun kamida bitta Daromad siklini yoping.", ru: "Закройте хотя бы один цикл Дохода, чтобы увидеть этот раздел.", zh: "至少结束一个收入周期才能查看此视图。", fr: "Clôturez au moins un cycle de Revenus pour voir cette vue." },
  "stable.operations": { en: "Operations", uz: "Operatsiyalar", ru: "Операционная деятельность", zh: "运营", fr: "Opérations" },
  "stable.addNote": { en: "Add a note…", uz: "Eslatma qo'shish…", ru: "Добавить заметку…", zh: "添加备注…", fr: "Ajouter une note…" },
  "stable.founderDependence": { en: "Founder dependence", uz: "Asoschiga bog'liqlik", ru: "Зависимость от основателя", zh: "创始人依赖度", fr: "Dépendance au fondateur" },
  "stable.dep.onlyISell": { en: "Only I can sell", uz: "Faqat men sotishim mumkin", ru: "Только я могу продавать", zh: "只有我能销售", fr: "Je suis le seul à pouvoir vendre" },
  "stable.dep.onlyIDeliver": { en: "Only I can deliver", uz: "Faqat men yetkazib berishim mumkin", ru: "Только я могу выполнять доставку", zh: "只有我能交付", fr: "Je suis le seul à pouvoir livrer" },
  "stable.dep.onlyIKnowProcess": { en: "Only I know important processes", uz: "Faqat men muhim jarayonlarni bilaman", ru: "Только я знаю важные процессы", zh: "只有我了解重要流程", fr: "Je suis le seul à connaître les processus importants" },
  "stable.dep.processUndocumented": { en: "Processes aren't documented", uz: "Jarayonlar hujjatlashtirilmagan", ru: "Процессы не задокументированы", zh: "流程尚未文档化", fr: "Les processus ne sont pas documentés" },
  "stable.dep.noBackup": { en: "No backup if I'm unavailable", uz: "Men bo'lmasam zaxira yo'q", ru: "Нет замены, если я недоступен", zh: "我缺席时没有替补", fr: "Aucune solution de secours en mon absence" },
  "stable.openAssessment": { en: "Open Business Assessment", uz: "Biznes baholashni ochish", ru: "Открыть Оценку бизнеса", zh: "打开企业评估", fr: "Ouvrir l'Évaluation d'entreprise" },

  // ---------- Revenue cycle interpretation (deterministic templates, revenue-interpretation.ts) ----------
  "cycleSummary.revenueIncreased": { en: "Revenue increased {pct}% this cycle.", uz: "Bu siklda daromad {pct}% oshdi.", ru: "Доход вырос на {pct}% в этом цикле.", zh: "本周期收入增长了 {pct}%。", fr: "Les revenus ont augmenté de {pct}% ce cycle." },
  "cycleSummary.revenueDecreased": { en: "Revenue decreased {pct}% this cycle.", uz: "Bu siklda daromad {pct}% kamaydi.", ru: "Доход снизился на {pct}% в этом цикле.", zh: "本周期收入下降了 {pct}%。", fr: "Les revenus ont diminué de {pct}% ce cycle." },
  "cycleSummary.netCashImproved": { en: "Net cash improved by {amount} compared to last cycle.", uz: "Sof pul mablag'i oldingi siklga nisbatan {amount} ga yaxshilandi.", ru: "Чистый денежный поток улучшился на {amount} по сравнению с прошлым циклом.", zh: "净现金较上一周期改善了 {amount}。", fr: "La trésorerie nette s'est améliorée de {amount} par rapport au cycle précédent." },
  "cycleSummary.netCashWorsened": { en: "Net cash worsened by {amount} compared to last cycle.", uz: "Sof pul mablag'i oldingi siklga nisbatan {amount} ga yomonlashdi.", ru: "Чистый денежный поток ухудшился на {amount} по сравнению с прошлым циклом.", zh: "净现金较上一周期恶化了 {amount}。", fr: "La trésorerie nette s'est dégradée de {amount} par rapport au cycle précédent." },
  "cycleSummary.moreNewCustomers": { en: "{n} more new customers than last cycle.", uz: "Oldingi siklga qaraganda {n} ta ko'proq yangi mijoz.", ru: "На {n} новых клиентов больше, чем в прошлом цикле.", zh: "比上一周期多了 {n} 位新客户。", fr: "{n} nouveaux clients de plus que le cycle précédent." },
  "cycleSummary.fewerNewCustomers": { en: "{n} fewer new customers than last cycle.", uz: "Oldingi siklga qaraganda {n} ta kamroq yangi mijoz.", ru: "На {n} новых клиентов меньше, чем в прошлом цикле.", zh: "比上一周期少了 {n} 位新客户。", fr: "{n} nouveaux clients de moins que le cycle précédent." },
  "cycleSummary.avgSaleIncreased": { en: "Your average sale value increased {pct}%.", uz: "O'rtacha sotuv qiymatingiz {pct}% oshdi.", ru: "Средняя сумма продажи выросла на {pct}%.", zh: "您的平均销售额增长了 {pct}%。", fr: "Votre valeur moyenne de vente a augmenté de {pct}%." },
  "cycleSummary.avgSaleDecreased": { en: "Your average sale value decreased {pct}%.", uz: "O'rtacha sotuv qiymatingiz {pct}% kamaydi.", ru: "Средняя сумма продажи снизилась на {pct}%.", zh: "您的平均销售额下降了 {pct}%。", fr: "Votre valeur moyenne de vente a diminué de {pct}%." },
  "cycleSummary.repeatCustomers": {
    en: "{repeat} of {total} customers this cycle are repeat customers ({pct}%).",
    uz: "Bu siklda {total} mijozdan {repeat} tasi takroriy mijozlar ({pct}%).",
    ru: "{repeat} из {total} клиентов в этом цикле — повторные клиенты ({pct}%).",
    zh: "本周期 {total} 位客户中有 {repeat} 位是复购客户（{pct}%）。",
    fr: "{repeat} clients sur {total} ce cycle sont des clients récurrents ({pct}%).",
  },
  "cycleSummary.notEnoughData": {
    en: "Not enough recorded numbers yet to compare this cycle to the last.",
    uz: "Bu siklni oldingisi bilan solishtirish uchun hali yetarli raqamlar qayd etilmagan.",
    ru: "Пока недостаточно записанных данных, чтобы сравнить этот цикл с прошлым.",
    zh: "记录的数据尚不足以将本周期与上一周期进行比较。",
    fr: "Pas encore assez de données enregistrées pour comparer ce cycle au précédent.",
  },
  "cycleSummary.firstCycle": {
    en: "This is your first cycle — nothing to compare against yet.",
    uz: "Bu sizning birinchi siklingiz — hali solishtiradigan narsa yo'q.",
    ru: "Это ваш первый цикл — пока не с чем сравнивать.",
    zh: "这是您的第一个周期——目前还没有可比较的数据。",
    fr: "C'est votre premier cycle — rien à comparer pour l'instant.",
  },

  // ---------- My Path (project list) ----------
  "myPathList.title": { en: "My Path", uz: "Mening yo'lim", ru: "Мой путь", zh: "我的路径", fr: "Mon parcours" },
  "myPathList.slotsInUse": { en: "of {max} project slots in use", uz: "{max} tadan loyiha o'rni band", ru: "из {max} слотов проектов используется", zh: "已使用 {max} 个项目位中的", fr: "sur {max} emplacements de projet utilisés" },
  "myPathList.stalled": { en: "hasn't moved in {days}+ days", uz: "{days}+ kundan beri o'zgarmagan", ru: "не двигается уже {days}+ дней", zh: "已 {days}+ 天没有进展", fr: "n'a pas avancé depuis {days}+ jours" },
  "myPathList.aProject": { en: "A project", uz: "Bir loyiha", ru: "Проект", zh: "某个项目", fr: "Un projet" },
  "myPathList.anotherReady": { en: "You have another project ready to move forward.", uz: "Sizda oldinga siljishga tayyor yana bir loyiha bor.", ru: "У вас есть ещё один проект, готовый к продвижению.", zh: "您还有另一个项目可以继续推进。", fr: "Vous avez un autre projet prêt à avancer." },
  "myPathList.continue": { en: "Continue {name}", uz: "{name}ni davom ettirish", ru: "Продолжить {name}", zh: "继续 {name}", fr: "Continuer {name}" },
  "myPathList.develop": { en: "Develop {name}", uz: "{name}ni rivojlantirish", ru: "Разработать {name}", zh: "开发 {name}", fr: "Développer {name}" },
  "myPathList.it": { en: "it", uz: "uni", ru: "его", zh: "它", fr: "le" },
  "myPathList.noActiveProjects": { en: "No active projects yet.", uz: "Hali faol loyihalar yo'q.", ru: "Пока нет активных проектов.", zh: "尚无进行中的项目。", fr: "Aucun projet actif pour le moment." },
  "myPathList.startProject": { en: "Start a project", uz: "Loyiha boshlash", ru: "Начать проект", zh: "启动项目", fr: "Démarrer un projet" },
  "myPathList.untitled": { en: "Untitled project", uz: "Nomsiz loyiha", ru: "Проект без названия", zh: "未命名项目", fr: "Projet sans titre" },
  "myPathList.stalledSuffix": { en: "stalled", uz: "to'xtab qoldi", ru: "застопорилось", zh: "已停滞", fr: "au point mort" },
  "myPathList.readySuffix": { en: "ready", uz: "tayyor", ru: "готово", zh: "已就绪", fr: "prêt" },
  "myPathList.decidedSuffix": { en: "decided", uz: "qaror qilindi", ru: "решено", zh: "已决定", fr: "décidé" },
  "myPathList.stage.finding": { en: "Find", uz: "Topish", ru: "Найти", zh: "探索", fr: "Trouver" },
  "myPathList.stage.blueprint": { en: "Blueprint", uz: "Reja", ru: "План", zh: "蓝图", fr: "Plan" },
  "myPathList.stage.developing": { en: "Develop", uz: "Rivojlantirish", ru: "Разработка", zh: "开发", fr: "Développer" },
  "myPathList.stage.testing": { en: "Test", uz: "Sinov", ru: "Тест", zh: "测试", fr: "Test" },
  "myPathList.stage.revenue": { en: "Revenue", uz: "Daromad", ru: "Доход", zh: "收入", fr: "Revenus" },

  // ---------- Root layout / shell ----------
  "layout.disclaimer": {
    en: "MarraUp does not verify what you report and takes no responsibility for decisions made using it. If you plan to share this with an investor or another party, they should conduct their own diligence.",
    uz: "MarraUp siz taqdim etgan ma'lumotlarni tekshirmaydi va undan foydalanib qabul qilingan qarorlar uchun javobgar emas. Buni investor yoki boshqa tomon bilan bo'lishmoqchi bo'lsangiz, ular o'z tekshiruvlarini o'tkazishlari kerak.",
    ru: "MarraUp не проверяет предоставленные вами данные и не несёт ответственности за решения, принятые на их основе. Если вы планируете поделиться этим с инвестором или другой стороной, им следует провести собственную проверку.",
    zh: "MarraUp 不核实您所报告的信息，也不对基于该信息做出的决定承担任何责任。如果您计划与投资者或其他方分享此内容，他们应自行进行尽职调查。",
    fr: "MarraUp ne vérifie pas les informations que vous fournissez et décline toute responsabilité quant aux décisions prises à partir de celles-ci. Si vous prévoyez de partager ceci avec un investisseur ou un tiers, celui-ci devrait mener sa propre vérification.",
  },
  "notificationBell.countLabel": { en: "{count} notifications", uz: "{count} ta bildirishnoma", ru: "{count} уведомлений", zh: "{count} 条通知", fr: "{count} notifications" },
};

export function t(key: string, language: Language): string {
  const row = UI[key];
  if (!row) return key;
  return row[language] || row.en;
}

// Simple {placeholder} substitution for templated notification/label strings.
export function tf(key: string, language: Language, vars: Record<string, string | number>): string {
  let text = t(key, language);
  for (const [k, v] of Object.entries(vars)) text = text.split(`{${k}}`).join(String(v));
  return text;
}

// BCP-47 locale for Intl/toLocaleDateString()/toLocaleString() calls, so
// dates and numbers render in each language's own conventions instead of
// always defaulting to the server's locale.
export const LOCALE_BY_LANGUAGE: Record<Language, string> = { en: "en-US", uz: "uz-UZ", ru: "ru-RU", zh: "zh-CN", fr: "fr-FR" };
