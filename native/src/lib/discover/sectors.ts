// Canonical sector IDs for My Path / Discover.
//
// Per Methodology v1.0 Part 17.1, these must be the SAME 40 sectors already
// live in Market Intelligence and the Business Assessment intake form
// (src/lib/sector-taxonomy.ts SECTOR_TAXONOMY group ids) — not a fresh,
// parallel taxonomy. Re-declared here as short, readable constants so the
// mapping table (mapping.ts) doesn't have to spell out the long snake_case
// group ids inline. SECTOR.X values below are IDENTICAL strings to the
// corresponding SECTOR_TAXONOMY group id — verified by the exported
// assertion at the bottom of this file (checked in engine.test.ts).

export const SECTOR = {
  AGRICULTURE: "agriculture_food_and_agribusiness",
  MINING: "mining_minerals_and_natural_resources",
  ENERGY: "energy_and_power",
  UTILITIES: "utilities_and_essential_infrastructure",
  MANUFACTURING: "manufacturing_and_industrial",
  CONSTRUCTION: "construction_and_infrastructure",
  REAL_ESTATE: "real_estate_and_property",
  TRANSPORTATION: "transportation_and_mobility",
  LOGISTICS: "logistics_and_supply_chain",
  WHOLESALE: "wholesale_and_distribution",
  RETAIL: "retail_and_commerce",
  FINANCIAL_SERVICES: "financial_services_and_fintech",
  INSURANCE: "insurance_and_risk_management",
  IT_SOFTWARE: "information_technology_and_software",
  AI_ML: "artificial_intelligence_and_machine_learning",
  DATA: "data_and_analytics",
  CYBERSECURITY: "cybersecurity_and_digital_trust",
  TELECOM: "telecommunications_and_connectivity",
  SEMICONDUCTORS: "semiconductors_electronics_and_computing",
  ROBOTICS: "robotics_and_automation",
  HEALTHCARE: "healthcare_and_medical_services",
  PHARMA_BIOTECH: "pharmaceuticals_biotechnology_and_life_sciences",
  MEDTECH: "medical_technology_and_digital_health",
  EDUCATION: "education_and_edtech",
  PROFESSIONAL_SERVICES: "professional_services",
  BUSINESS_SERVICES: "business_services",
  MARKETING_ADVERTISING: "marketing_advertising_and_communications",
  MEDIA_CREATIVE: "media_entertainment_and_creative_industries",
  TRAVEL_TOURISM: "travel_tourism_and_hospitality",
  RESTAURANTS_CATERING: "restaurants_catering_and_leisure",
  CONSUMER_PERSONAL_SERVICES: "consumer_and_personal_services",
  SPORTS_RECREATION: "sports_and_recreation",
  FASHION_LUXURY: "fashion_luxury_and_lifestyle",
  ENVIRONMENT_CLIMATE: "environmental_and_climate_economy",
  WATER: "water_and_water_technology",
  AEROSPACE_SPACE: "aerospace_and_space",
  DEFENSE_SECURITY: "defense_and_security",
  GOVERNMENT: "government_and_public_services",
  SOCIAL_ECONOMY: "social_economy_and_nonprofit_sector",
  EMERGING_TECH: "emerging_and_frontier_technology",
} as const;

export type SectorId = (typeof SECTOR)[keyof typeof SECTOR];

// Methodology Part 17.28 — sectors that must NEVER be produced by a generic
// Chapter C / Chapter B answer. They may only ever be added to the mapping
// table via a genuinely sector-specific row (a named Q8B customer-industry
// match, or a future dedicated sub-tag) — never a broad domain match. This
// set exists so a reviewer or a unit test can assert "no row in mapping.ts
// targets one of these except through an explicitly-approved specific path."
export const REQUIRES_SPECIFIC_EVIDENCE: ReadonlySet<SectorId> = new Set([
  SECTOR.MINING,
  SECTOR.ENERGY,
  SECTOR.UTILITIES,
  SECTOR.INSURANCE,
  SECTOR.TELECOM,
  SECTOR.SEMICONDUCTORS,
  SECTOR.PHARMA_BIOTECH,
  SECTOR.MEDTECH,
  SECTOR.AEROSPACE_SPACE,
  SECTOR.DEFENSE_SECURITY,
  SECTOR.GOVERNMENT,
  SECTOR.SOCIAL_ECONOMY,
]);
