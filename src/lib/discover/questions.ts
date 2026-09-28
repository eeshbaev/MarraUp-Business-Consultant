// My Path / Discover — the questionnaire itself (Methodology v1.0 Part 6).
// One declarative array drives the mobile UI: one question per screen.
//
// Mobile-app note: this file is pure data (no React/DOM), so it ports
// unchanged into a native/React Native build later — only the screen
// renderer (currently a Next.js client component) is web-specific.
//
// Each option lists the raw tag(s) it produces. Chapter A/D preference
// answers intentionally carry `tags: []` where the methodology says they
// must never become a sector signal by themselves (kept as explicit empty
// arrays, not omitted, so that's a visible design choice here, not a gap).

export type QuestionType = "single" | "multi";

export interface AnswerOption {
  id: string;
  label: string;
  tags: string[];
  /** For Q7 resource follow-ups: shows a nested single/multi-select only when this option is chosen. */
  followUp?: Question;
}

export interface Question {
  id: string;
  chapter: "A" | "B" | "C" | "D" | "constraints";
  type: QuestionType;
  prompt: string;
  helper?: string;
  options: AnswerOption[];
  maxSelect?: number;
  /** Q8B only: shown conditionally when this tag was selected in the parent question. */
  showIfTag?: string;
  /** Marks this question's answers as user_preferences, never ranking evidence (Part 8, Q26). */
  isPreferenceOnly?: boolean;
}

const domainQuestion = (id: string, chapter: "C", domainLabel: string, domainCode: string, subTags?: { id: string; label: string; tag: string }[]): Question => ({
  id,
  chapter,
  type: "multi",
  prompt: `Which of these describe your experience in ${domainLabel}?`,
  helper: "Select everything that applies — you can pick more than one.",
  options: [
    { id: "knowledge", label: "I have formal education or training in this area.", tags: [`KNOWLEDGE_${domainCode}`] },
    { id: "practical", label: "I have practical experience doing this work, even unpaid (helped family, hobby, volunteered).", tags: [`PRACTICAL_EXPERIENCE_${domainCode}`] },
    { id: "commercial", label: "I have earned money from this work, or operated a business in this area.", tags: [`COMMERCIAL_EXPERIENCE_${domainCode}`] },
    { id: "ability", label: "I believe I'm good at this, even though none of the above apply yet.", tags: [`ABILITY_${domainCode}`] },
    { id: "aspiration", label: "I'm interested in this, but have no background in it.", tags: [`ASPIRATION_${domainCode}`] },
    ...(subTags ?? []).map((s) => ({ id: `sub_${s.id}`, label: s.label, tags: [s.tag] })),
  ],
});

export const DISCOVER_QUESTIONS: Question[] = [
  // ---------------- Chapter A — About You ----------------
  {
    id: "q1_situation",
    chapter: "A",
    type: "single",
    prompt: "What best describes your current situation?",
    options: [
      { id: "student", label: "Student", tags: [] },
      { id: "employed_ft", label: "Employed full-time", tags: [] },
      { id: "employed_pt", label: "Employed part-time", tags: [] },
      { id: "self_employed", label: "Self-employed / freelancer", tags: [] },
      { id: "running_business", label: "Running a business", tags: [] },
      { id: "not_working", label: "Currently not working", tags: [] },
      { id: "other", label: "Other", tags: [] },
    ],
  },
  {
    id: "q2_time",
    chapter: "A",
    type: "single",
    prompt: "How much time could you realistically dedicate to exploring or starting a business?",
    options: [
      { id: "very_low", label: "Less than 5 hours/week", tags: ["TIME_VERY_LOW"] },
      { id: "low", label: "5–10 hours/week", tags: ["TIME_LOW"] },
      { id: "moderate", label: "11–20 hours/week", tags: ["TIME_MODERATE"] },
      { id: "high", label: "21–40 hours/week", tags: ["TIME_HIGH"] },
      { id: "full", label: "40+ hours/week", tags: ["TIME_FULL"] },
    ],
  },
  {
    id: "q3_capital",
    chapter: "A",
    type: "single",
    prompt: "How much could you realistically put into starting something?",
    options: [
      { id: "zero", label: "Almost nothing right now", tags: ["CAPITAL_0"] },
      { id: "micro", label: "Up to $500", tags: ["CAPITAL_MICRO"] },
      { id: "low", label: "$500–$2,000", tags: ["CAPITAL_LOW"] },
      { id: "medium", label: "$2,000–$10,000", tags: ["CAPITAL_MEDIUM"] },
      { id: "high", label: "$10,000–$50,000", tags: ["CAPITAL_HIGH"] },
      { id: "very_high", label: "More than $50,000", tags: ["CAPITAL_VERY_HIGH"] },
      { id: "unknown", label: "I don't know yet", tags: ["CAPITAL_UNKNOWN"] },
    ],
  },
  {
    id: "q4_income_protection",
    chapter: "A",
    type: "single",
    prompt: "How important is it that you continue earning your current income while exploring a business?",
    options: [
      { id: "very_high", label: "Essential — I cannot risk losing my current income", tags: ["INCOME_PROTECTION_VERY_HIGH"] },
      { id: "high", label: "Very important", tags: ["INCOME_PROTECTION_HIGH"] },
      { id: "moderate", label: "Somewhat important", tags: ["INCOME_PROTECTION_MODERATE"] },
      { id: "low", label: "I could accept a period with lower income", tags: ["INCOME_PROTECTION_LOW"] },
      { id: "none", label: "I can focus on the business without current-income pressure", tags: ["INCOME_PROTECTION_NONE"] },
    ],
  },
  {
    id: "q5_risk",
    chapter: "A",
    type: "single",
    prompt: "Which statement best describes your comfort with financial uncertainty?",
    options: [
      { id: "low", label: "I need very predictable income", tags: ["RISK_LOW"] },
      { id: "moderate", label: "I can tolerate some uncertainty", tags: ["RISK_MODERATE"] },
      { id: "high", label: "I am comfortable with significant uncertainty", tags: ["RISK_HIGH"] },
      { id: "very_high", label: "I am willing to take substantial risks for higher potential upside", tags: ["RISK_VERY_HIGH"] },
    ],
  },
  {
    id: "q6_scope",
    chapter: "A",
    type: "single",
    prompt: "Where do you expect to operate initially?",
    options: [
      { id: "local", label: "Mainly in my local community/city", tags: ["SCOPE_LOCAL"] },
      { id: "national", label: "Within my country", tags: ["SCOPE_NATIONAL"] },
      { id: "multi_country", label: "Across several countries", tags: ["SCOPE_MULTI_COUNTRY"] },
      { id: "online", label: "Primarily online/global", tags: ["SCOPE_ONLINE"] },
      { id: "unknown", label: "I don't know yet", tags: ["SCOPE_UNKNOWN"] },
    ],
  },

  // ---------------- Chapter B — What You Can Access ----------------
  {
    id: "q7_resources",
    chapter: "B",
    type: "multi",
    prompt: "Which physical resources do you currently have access to?",
    options: [
      { id: "land", label: "Land or agricultural space", tags: ["LAND_ACCESS"] },
      { id: "workshop", label: "Workshop / production space", tags: ["WORKSHOP_ACCESS"] },
      { id: "premises", label: "Commercial premises", tags: ["COMMERCIAL_PREMISES"] },
      { id: "kitchen", label: "Kitchen / food-production space", tags: ["KITCHEN_ACCESS"] },
      {
        id: "vehicle",
        label: "Vehicle(s)",
        tags: [],
        followUp: {
          id: "q7_vehicle_type",
          chapter: "B",
          type: "multi",
          prompt: "What type of vehicle?",
          options: [
            { id: "personal_car", label: "Personal car", tags: ["VEHICLE_PERSONAL"] },
            { id: "van", label: "Van / minibus", tags: ["VEHICLE_VAN"] },
            { id: "truck", label: "Truck", tags: ["VEHICLE_TRUCK"] },
            { id: "agricultural", label: "Agricultural vehicle", tags: ["VEHICLE_AGRICULTURAL"] },
            { id: "specialized", label: "Specialized vehicle (e.g. refrigerated, taxi)", tags: ["VEHICLE_SPECIALIZED"] },
            { id: "light", label: "Motorcycle/bicycle", tags: ["VEHICLE_LIGHT"] },
            { id: "other", label: "Other", tags: ["VEHICLE_OTHER"] },
          ],
        },
      },
      { id: "machinery", label: "Machinery or specialized equipment", tags: ["MACHINERY_ACCESS"] },
      {
        id: "computer",
        label: "Computer / professional digital equipment",
        tags: [],
        followUp: {
          id: "q7_computer_type",
          chapter: "B",
          type: "single",
          prompt: "What best describes your setup?",
          options: [
            { id: "ordinary", label: "An ordinary personal computer/laptop", tags: ["COMPUTER_ORDINARY"] },
            { id: "professional", label: "A professional/specialized digital setup (specific software licenses, dedicated workstation, studio/server equipment)", tags: ["COMPUTER_PROFESSIONAL"] },
          ],
        },
      },
      { id: "warehouse", label: "Storage / warehouse space", tags: ["WAREHOUSE_ACCESS"] },
      { id: "none", label: "None of these", tags: [] },
      { id: "other", label: "Other", tags: [] },
    ],
  },
  {
    id: "q8a_networks",
    chapter: "B",
    type: "multi",
    prompt: "Which business relationships or networks can you realistically access?",
    options: [
      { id: "customers", label: "Potential customers in a specific industry", tags: ["POTENTIAL_CUSTOMERS_ACCESS"] },
      { id: "suppliers", label: "Suppliers", tags: ["SUPPLIER_ACCESS"] },
      { id: "distributors", label: "Wholesalers/distributors", tags: ["DISTRIBUTOR_ACCESS"] },
      { id: "retailers", label: "Retailers", tags: ["RETAILER_ACCESS"] },
      { id: "owners", label: "Business owners/managers", tags: ["BUSINESS_OWNER_NETWORK"] },
      { id: "specialists", label: "Professionals with specialized knowledge", tags: ["SPECIALIST_NETWORK"] },
      { id: "government", label: "Government/public-sector contacts", tags: ["GOVERNMENT_NETWORK"] },
      { id: "international", label: "International contacts", tags: ["INTERNATIONAL_NETWORK"] },
      { id: "family_business", label: "Family business", tags: ["FAMILY_BUSINESS_ACCESS"] },
      { id: "community", label: "Community/local network", tags: ["COMMUNITY_NETWORK"] },
      { id: "none", label: "None yet", tags: [] },
    ],
  },
  {
    id: "q8b_customer_type",
    chapter: "B",
    type: "multi",
    showIfTag: "POTENTIAL_CUSTOMERS_ACCESS",
    prompt: "What type of customers do you have access to?",
    options: [
      { id: "agri_food", label: "Agriculture/food", tags: ["CUSTOMER_NETWORK_AGRICULTURE_FOOD"] },
      { id: "manufacturing", label: "Manufacturing", tags: ["CUSTOMER_NETWORK_MANUFACTURING"] },
      { id: "construction", label: "Construction", tags: ["CUSTOMER_NETWORK_CONSTRUCTION"] },
      { id: "retail_trade", label: "Retail/trade", tags: ["CUSTOMER_NETWORK_RETAIL_TRADE"] },
      { id: "finance_business", label: "Finance/business", tags: ["CUSTOMER_NETWORK_FINANCE_BUSINESS"] },
      { id: "technology", label: "Technology", tags: ["CUSTOMER_NETWORK_TECHNOLOGY"] },
      { id: "healthcare", label: "Healthcare", tags: ["CUSTOMER_NETWORK_HEALTHCARE"] },
      { id: "education", label: "Education", tags: ["CUSTOMER_NETWORK_EDUCATION"] },
      { id: "government", label: "Government/public sector", tags: ["CUSTOMER_NETWORK_GOVERNMENT"] },
      { id: "hospitality", label: "Hospitality/tourism", tags: ["CUSTOMER_NETWORK_HOSPITALITY"] },
      { id: "transport_logistics", label: "Transport/logistics", tags: ["CUSTOMER_NETWORK_TRANSPORT_LOGISTICS"] },
      { id: "other", label: "Other", tags: [] },
    ],
  },
  {
    id: "q9_languages",
    chapter: "B",
    type: "multi",
    prompt: "Which languages can you use comfortably for professional or commercial purposes?",
    options: [
      { id: "uzbek", label: "Uzbek", tags: ["LANGUAGE_UZBEK"] },
      { id: "russian", label: "Russian", tags: ["LANGUAGE_RUSSIAN"] },
      { id: "english", label: "English", tags: ["LANGUAGE_ENGLISH"] },
      { id: "regional", label: "Other regional languages", tags: ["LANGUAGE_REGIONAL"] },
      { id: "international", label: "Other international languages", tags: ["LANGUAGE_INTERNATIONAL"] },
    ],
  },
  {
    id: "q10_reach",
    chapter: "B",
    type: "multi",
    prompt: "Where could you realistically reach customers?",
    options: [
      { id: "local", label: "My local neighborhood/community", tags: ["LOCAL_ACCESS"] },
      { id: "national", label: "My city / other cities in my country", tags: ["NATIONAL_ACCESS"] },
      { id: "rural", label: "Rural areas", tags: ["RURAL_ACCESS"] },
      { id: "international", label: "International customers", tags: ["INTERNATIONAL_ACCESS"] },
      { id: "online", label: "Online customers", tags: ["ONLINE_ACCESS"] },
      { id: "professional_network", label: "Existing professional network", tags: ["PROFESSIONAL_NETWORK_ACCESS"] },
      { id: "none", label: "I currently have no customer access", tags: [] },
    ],
  },
  {
    id: "q11_existing_operation",
    chapter: "B",
    type: "multi",
    prompt: "Do you already have access to any existing business operation?",
    options: [
      { id: "family", label: "Family business", tags: ["FAMILY_BUSINESS_ACCESS"] },
      { id: "employer", label: "Employer's business knowledge/resources I could build on", tags: ["EMPLOYER_BUSINESS_ACCESS"] },
      { id: "side_business", label: "Existing side business", tags: ["SIDE_BUSINESS_ACCESS"] },
      { id: "freelance", label: "Existing freelance activity", tags: ["FREELANCE_ACCESS"] },
      { id: "customer_base", label: "Existing customer base", tags: ["CUSTOMER_BASE_ACCESS"] },
      { id: "suppliers", label: "Existing supplier relationships", tags: ["SUPPLIER_RELATIONSHIP_ACCESS"] },
      { id: "production", label: "Existing production capability", tags: ["PRODUCTION_CAPABILITY_ACCESS"] },
      { id: "none", label: "None", tags: [] },
    ],
  },

  // ---------------- Chapter C — Skills & Knowledge ----------------
  domainQuestion("q12_food_agriculture", "C", "Food & Agriculture", "FOOD_AGRICULTURE"),
  domainQuestion("q13_machinery", "C", "Vehicles, Machinery & Repair", "MACHINERY", [
    { id: "vehicle_repair", label: "Vehicle repair & maintenance", tag: "MACHINERY_SUBTAG_VEHICLE_REPAIR" },
    { id: "machinery_maintenance", label: "Machinery maintenance", tag: "MACHINERY_SUBTAG_MAINTENANCE" },
    { id: "equipment_repair", label: "Equipment repair", tag: "MACHINERY_SUBTAG_EQUIPMENT_REPAIR" },
    { id: "auto_parts", label: "Automotive parts", tag: "MACHINERY_SUBTAG_AUTO_PARTS" },
  ]),
  domainQuestion("q14_construction", "C", "Construction & Built Environment", "CONSTRUCTION", [
    { id: "construction_services", label: "Construction services", tag: "CONSTRUCTION_SUBTAG_SERVICES" },
    { id: "building_maintenance", label: "Building maintenance", tag: "CONSTRUCTION_SUBTAG_MAINTENANCE" },
    { id: "architecture", label: "Architecture/design", tag: "CONSTRUCTION_SUBTAG_ARCHITECTURE" },
    { id: "interior_fitout", label: "Interior/fit-out", tag: "CONSTRUCTION_SUBTAG_FITOUT" },
    { id: "materials", label: "Construction materials", tag: "CONSTRUCTION_SUBTAG_MATERIALS" },
  ]),
  domainQuestion("q15_it", "C", "Software, IT & Digital Technology", "IT", [
    { id: "software_dev", label: "Software development", tag: "IT_SUBTAG_SOFTWARE_DEV" },
    { id: "web_mobile", label: "Web/mobile development", tag: "IT_SUBTAG_WEB_MOBILE" },
    { id: "it_services", label: "IT services", tag: "IT_SUBTAG_IT_SERVICES" },
    { id: "saas", label: "SaaS/software products", tag: "IT_SUBTAG_SAAS" },
    { id: "data", label: "Data", tag: "IT_SUBTAG_DATA" },
    { id: "cybersecurity", label: "Cybersecurity", tag: "IT_SUBTAG_CYBERSECURITY" },
  ]),
  domainQuestion("q16_professional", "C", "Finance, Business & Professional Services", "PROFESSIONAL", [
    { id: "accounting", label: "Accounting", tag: "PROFESSIONAL_SUBTAG_ACCOUNTING" },
    { id: "finance", label: "Finance", tag: "PROFESSIONAL_SUBTAG_FINANCE" },
    { id: "consulting", label: "Consulting", tag: "PROFESSIONAL_SUBTAG_CONSULTING" },
    { id: "legal", label: "Legal services", tag: "PROFESSIONAL_SUBTAG_LEGAL" },
    { id: "management", label: "Management services", tag: "PROFESSIONAL_SUBTAG_MANAGEMENT" },
    { id: "advisory", label: "Business advisory", tag: "PROFESSIONAL_SUBTAG_ADVISORY" },
  ]),
  domainQuestion("q17_retail", "C", "Sales, Retail & Trade", "RETAIL", [
    { id: "retail", label: "Retail", tag: "RETAIL_SUBTAG_RETAIL" },
    { id: "wholesale", label: "Wholesale", tag: "RETAIL_SUBTAG_WHOLESALE" },
    { id: "import_export", label: "Import/export", tag: "RETAIL_SUBTAG_IMPORT_EXPORT" },
    { id: "distribution", label: "Distribution", tag: "RETAIL_SUBTAG_DISTRIBUTION" },
    { id: "sales_services", label: "Sales services", tag: "RETAIL_SUBTAG_SALES_SERVICES" },
  ]),
  domainQuestion("q18_education", "C", "Education, Training & Knowledge Services", "EDUCATION", [
    { id: "tutoring", label: "Tutoring", tag: "EDUCATION_SUBTAG_TUTORING" },
    { id: "professional_training", label: "Professional training", tag: "EDUCATION_SUBTAG_PROFESSIONAL_TRAINING" },
    { id: "language_education", label: "Language education", tag: "EDUCATION_SUBTAG_LANGUAGE" },
    { id: "online_education", label: "Online education", tag: "EDUCATION_SUBTAG_ONLINE" },
    { id: "corporate_training", label: "Corporate training", tag: "EDUCATION_SUBTAG_CORPORATE_TRAINING" },
  ]),
  domainQuestion("q19_health_personal", "C", "Health, Wellness & Personal Services", "HEALTH_PERSONAL", [
    { id: "personal_care", label: "Personal care", tag: "HEALTH_PERSONAL_SUBTAG_PERSONAL_CARE" },
    { id: "wellness", label: "Wellness", tag: "HEALTH_PERSONAL_SUBTAG_WELLNESS" },
    { id: "fitness", label: "Fitness", tag: "HEALTH_PERSONAL_SUBTAG_FITNESS" },
    { id: "beauty", label: "Beauty", tag: "HEALTH_PERSONAL_SUBTAG_BEAUTY" },
    { id: "non_clinical", label: "Non-clinical personal services", tag: "HEALTH_PERSONAL_SUBTAG_NON_CLINICAL" },
  ]),
  domainQuestion("q20_creative", "C", "Creative, Media & Communication", "CREATIVE", [
    { id: "graphic_design", label: "Graphic design", tag: "CREATIVE_SUBTAG_GRAPHIC_DESIGN" },
    { id: "photography", label: "Photography", tag: "CREATIVE_SUBTAG_PHOTOGRAPHY" },
    { id: "video", label: "Video", tag: "CREATIVE_SUBTAG_VIDEO" },
    { id: "content", label: "Content production", tag: "CREATIVE_SUBTAG_CONTENT" },
    { id: "advertising", label: "Advertising", tag: "CREATIVE_SUBTAG_ADVERTISING" },
    { id: "media", label: "Media", tag: "CREATIVE_SUBTAG_MEDIA" },
  ]),

  // ---------------- Chapter D — How You Prefer to Work ----------------
  {
    id: "q21_sell_to",
    chapter: "D",
    type: "single",
    prompt: "Who would you prefer to sell to?",
    options: [
      { id: "b2c", label: "Mostly individual customers", tags: ["PREFERENCE_B2C"] },
      { id: "b2b", label: "Mostly businesses", tags: ["PREFERENCE_B2B"] },
      { id: "b2g", label: "Government/public organizations", tags: ["PREFERENCE_B2G"] },
      { id: "mixed", label: "A mixture", tags: ["PREFERENCE_MIXED"] },
      { id: "unknown", label: "I don't know yet", tags: [] },
    ],
  },
  {
    id: "q22_provide",
    chapter: "D",
    type: "single",
    prompt: "What would you rather provide?",
    options: [
      { id: "product", label: "Physical products", tags: ["PREFERENCE_PRODUCT"] },
      { id: "service", label: "Services", tags: ["PREFERENCE_SERVICE"] },
      { id: "digital", label: "Software/digital products", tags: ["PREFERENCE_DIGITAL"] },
      { id: "mixed", label: "A combination", tags: ["PREFERENCE_MIXED"] },
      { id: "unknown", label: "I don't know yet", tags: [] },
    ],
  },
  {
    id: "q23_work_style",
    chapter: "D",
    type: "single",
    prompt: "How would you prefer to work?",
    options: [
      { id: "solo", label: "Mostly by myself", tags: ["PREFERENCE_SOLO"] },
      { id: "small_team", label: "With a small team", tags: ["PREFERENCE_SMALL_TEAM"] },
      { id: "team", label: "With a larger organization/team", tags: ["PREFERENCE_TEAM"] },
      { id: "no_preference", label: "I don't mind", tags: [] },
    ],
  },
  {
    id: "q24_location",
    chapter: "D",
    type: "single",
    prompt: "How important is location flexibility to you?",
    options: [
      { id: "fixed", label: "I want to work mainly from one place", tags: ["LOCATION_FIXED"] },
      { id: "flexible", label: "Some flexibility would be useful", tags: ["LOCATION_FLEXIBLE"] },
      { id: "highly_flexible", label: "I want significant geographic flexibility", tags: ["LOCATION_HIGHLY_FLEXIBLE"] },
      { id: "online", label: "I want to be able to operate largely online", tags: ["LOCATION_ONLINE"] },
    ],
  },
  {
    id: "q25_work_type",
    chapter: "D",
    type: "multi",
    prompt: "Which type of work appeals to you most?",
    options: [
      { id: "making", label: "Making things", tags: ["WORK_MAKING"] },
      { id: "fixing", label: "Fixing things", tags: ["WORK_FIXING"] },
      { id: "selling", label: "Selling", tags: ["WORK_SELLING"] },
      { id: "teaching", label: "Teaching", tags: ["WORK_TEACHING"] },
      { id: "analyzing", label: "Analyzing information", tags: ["WORK_ANALYSIS"] },
      { id: "operations", label: "Managing operations", tags: ["WORK_OPERATIONS"] },
      { id: "creating", label: "Designing/creating", tags: ["WORK_CREATING"] },
      { id: "people", label: "Working with people directly", tags: ["WORK_PEOPLE"] },
      { id: "technology", label: "Working with technology", tags: ["WORK_TECHNOLOGY"] },
      { id: "logistics", label: "Organizing logistics/movement", tags: ["WORK_LOGISTICS"] },
      { id: "technical", label: "Solving technical problems", tags: ["WORK_TECHNICAL"] },
    ],
  },
  {
    id: "q26_priorities",
    chapter: "D",
    type: "multi",
    maxSelect: 3,
    isPreferenceOnly: true,
    prompt: "Which matters most to you when choosing a potential business direction?",
    helper: "Choose up to 3. These help explain results to you — they never change which directions are shown.",
    options: [
      { id: "using_skills", label: "Using skills I already have", tags: ["USING_SKILLS"] },
      { id: "building_new", label: "Building something new", tags: ["BUILDING_NEW"] },
      { id: "low_cost", label: "Having low starting costs", tags: ["LOW_STARTING_COSTS"] },
      { id: "high_growth", label: "Having potential to grow significantly", tags: ["HIGH_GROWTH"] },
      { id: "predictable_demand", label: "Having predictable demand", tags: ["PREDICTABLE_DEMAND"] },
      { id: "independence", label: "Being independent", tags: ["INDEPENDENCE"] },
      { id: "helping_people", label: "Helping people solve real problems", tags: ["HELPING_PEOPLE"] },
      { id: "online_work", label: "Working online", tags: ["ONLINE_WORK"] },
      { id: "local_work", label: "Working locally", tags: ["LOCAL_WORK"] },
      { id: "physical_products", label: "Creating physical products", tags: ["PHYSICAL_PRODUCTS"] },
      { id: "flexible_hours", label: "Having flexible working hours", tags: ["FLEXIBLE_HOURS"] },
      { id: "eventual_exit", label: "Building something I could eventually sell", tags: ["EVENTUAL_EXIT"] },
    ],
  },
];

// ---------------- Hard constraints (Q27) ----------------
// Built separately in questions-constraints.ts against the live sector list
// (needs the 5-language taxonomy import, kept out of this otherwise
// framework-light file so DISCOVER_QUESTIONS above stays trivially portable).
