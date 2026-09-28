// My Path / Discover — the Answer -> Signal -> Sector -> Sub-sector ->
// Evidence Class -> Constraint mapping table.
//
// This is the literal implementation of "MarraUp Entrepreneur Journey -
// Discovery Methodology v1.0", Part 17 (17.3 through 17.29). Every row here
// must trace back to a specific sub-part of that document — the comments
// above each block name it so a reviewer can check this file against the
// frozen methodology line by line.
//
// Core rule (locked in the methodology before this table was written):
// an answer receives a sector tag only when the answer itself provides
// credible evidence of relevance to that sector. Preferences and generic
// resources may modify compatibility but must never manufacture affinity.
// Conservative on purpose: 3 well-supported directions beats 5 padded ones.

import type { EvidenceClass, Domain } from "./tags";
import { SECTOR, type SectorId } from "./sectors";

export interface MappingRow {
  /** Stable id, e.g. "Q13-commercial-machinery". Matches Part 17 table IDs. */
  id: string;
  /** The raw answer tag this row fires on, e.g. "COMMERCIAL_EXPERIENCE_MACHINERY". */
  tag: string;
  sectorId: SectorId;
  /** Free-text sub-sector hint shown in the explanation; not a taxonomy id. */
  subSector?: string;
  evidenceClass: EvidenceClass;
  /**
   * Groups rows that trace back to one underlying fact, so the ranking
   * engine's Step 4 (independent supporting signals) never double-counts
   * one fact just because it produced several mapping rows. Part 17.31.
   */
  independenceGroup: string;
}

const domainSuffix = (d: Domain) => d;

// ---------------------------------------------------------------------
// 17.4 — Q7 physical resources: land / workshop / commercial premises / kitchen
// ---------------------------------------------------------------------
const q7Rows: MappingRow[] = [
  { id: "Q7-land-agri", tag: "LAND_ACCESS", sectorId: SECTOR.AGRICULTURE, subSector: "Farming / agricultural production", evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "land_access" },
  { id: "Q7-land-environment", tag: "LAND_ACCESS", sectorId: SECTOR.ENVIRONMENT_CLIMATE, subSector: "Land restoration / conservation", evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "land_access" },
  { id: "Q7-land-realestate", tag: "LAND_ACCESS", sectorId: SECTOR.REAL_ESTATE, subSector: "Land / property development", evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "land_access" },

  { id: "Q7-workshop-manufacturing", tag: "WORKSHOP_ACCESS", sectorId: SECTOR.MANUFACTURING, subSector: "Small-scale manufacturing / fabrication", evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "workshop_access" },
  { id: "Q7-workshop-construction", tag: "WORKSHOP_ACCESS", sectorId: SECTOR.CONSTRUCTION, subSector: "Building maintenance / fit-out", evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "workshop_access" },
  { id: "Q7-workshop-transport", tag: "WORKSHOP_ACCESS", sectorId: SECTOR.TRANSPORTATION, subSector: "Vehicle repair & maintenance", evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "workshop_access" },
  { id: "Q7-workshop-professional", tag: "WORKSHOP_ACCESS", sectorId: SECTOR.PROFESSIONAL_SERVICES, subSector: "Technical services", evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "workshop_access" },

  { id: "Q7-premises-retail", tag: "COMMERCIAL_PREMISES", sectorId: SECTOR.RETAIL, evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "commercial_premises" },
  { id: "Q7-premises-food-service", tag: "COMMERCIAL_PREMISES", sectorId: SECTOR.RESTAURANTS_CATERING, subSector: "Food service", evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "commercial_premises" },
  { id: "Q7-premises-personal-services", tag: "COMMERCIAL_PREMISES", sectorId: SECTOR.CONSUMER_PERSONAL_SERVICES, evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "commercial_premises" },
  { id: "Q7-premises-professional", tag: "COMMERCIAL_PREMISES", sectorId: SECTOR.PROFESSIONAL_SERVICES, subSector: "Local office services", evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "commercial_premises" },
  { id: "Q7-premises-education", tag: "COMMERCIAL_PREMISES", sectorId: SECTOR.EDUCATION, subSector: "Training center / tutoring", evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "commercial_premises" },
  // Deliberately absent (Part 17.4): COMMERCIAL_PREMISES -> Healthcare. Commercial
  // premises alone must never imply clinical healthcare.
];

// ---------------------------------------------------------------------
// 17.5 — Q7 vehicle follow-up. Personal car / ordinary laptop are
// deliberately excluded from this array (Part 17.5/17.6 acceptance tests).
// ---------------------------------------------------------------------
const q7VehicleRows: MappingRow[] = [
  { id: "Q7-vehicle-van-transport", tag: "VEHICLE_VAN", sectorId: SECTOR.TRANSPORTATION, subSector: "Passenger / commercial vehicle transport", evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "vehicle_access" },
  { id: "Q7-vehicle-van-logistics", tag: "VEHICLE_VAN", sectorId: SECTOR.LOGISTICS, subSector: "Local delivery / distribution", evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "vehicle_access" },

  { id: "Q7-vehicle-truck-transport", tag: "VEHICLE_TRUCK", sectorId: SECTOR.TRANSPORTATION, subSector: "Freight transport", evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "vehicle_access" },
  { id: "Q7-vehicle-truck-logistics", tag: "VEHICLE_TRUCK", sectorId: SECTOR.LOGISTICS, subSector: "Freight delivery / distribution", evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "vehicle_access" },
  { id: "Q7-vehicle-truck-wholesale", tag: "VEHICLE_TRUCK", sectorId: SECTOR.WHOLESALE, subSector: "Distribution", evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "vehicle_access" },

  { id: "Q7-vehicle-agri", tag: "VEHICLE_AGRICULTURAL", sectorId: SECTOR.AGRICULTURE, subSector: "Farm operations / agricultural services", evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "vehicle_access" },

  { id: "Q7-vehicle-specialized-transport", tag: "VEHICLE_SPECIALIZED", sectorId: SECTOR.TRANSPORTATION, subSector: "Specialized transport", evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "vehicle_access" },
  { id: "Q7-vehicle-specialized-logistics", tag: "VEHICLE_SPECIALIZED", sectorId: SECTOR.LOGISTICS, subSector: "Cold-chain / specialized delivery", evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "vehicle_access" },
  { id: "Q7-vehicle-specialized-mobility", tag: "VEHICLE_SPECIALIZED", sectorId: SECTOR.CONSUMER_PERSONAL_SERVICES, subSector: "Taxi / mobility services", evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "vehicle_access" },

  { id: "Q7-vehicle-light-transport", tag: "VEHICLE_LIGHT", sectorId: SECTOR.TRANSPORTATION, subSector: "Local mobility / courier", evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "vehicle_access" },
  { id: "Q7-vehicle-light-logistics", tag: "VEHICLE_LIGHT", sectorId: SECTOR.LOGISTICS, subSector: "Last-mile delivery", evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "vehicle_access" },
  // VEHICLE_PERSONAL and VEHICLE_OTHER: intentionally NO rows (acceptance test 1).
];

// ---------------------------------------------------------------------
// 17.6 — Q7 computer equipment + other physical resources
// ---------------------------------------------------------------------
const q7ComputerAndOtherRows: MappingRow[] = [
  { id: "Q7-computer-it", tag: "COMPUTER_PROFESSIONAL", sectorId: SECTOR.IT_SOFTWARE, evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "computer_access" },
  { id: "Q7-computer-data", tag: "COMPUTER_PROFESSIONAL", sectorId: SECTOR.DATA, evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "computer_access" },
  { id: "Q7-computer-media", tag: "COMPUTER_PROFESSIONAL", sectorId: SECTOR.MEDIA_CREATIVE, evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "computer_access" },
  { id: "Q7-computer-marketing", tag: "COMPUTER_PROFESSIONAL", sectorId: SECTOR.MARKETING_ADVERTISING, evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "computer_access" },
  { id: "Q7-computer-professional-services", tag: "COMPUTER_PROFESSIONAL", sectorId: SECTOR.PROFESSIONAL_SERVICES, evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "computer_access" },
  // COMPUTER_ORDINARY: intentionally NO rows (acceptance test 2).

  { id: "Q7-machinery-manufacturing", tag: "MACHINERY_ACCESS", sectorId: SECTOR.MANUFACTURING, subSector: "Production / fabrication", evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "machinery_access" },
  { id: "Q7-machinery-manufacturing-equipment", tag: "MACHINERY_ACCESS", sectorId: SECTOR.MANUFACTURING, subSector: "Machinery / equipment manufacturing", evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "machinery_access" },
  { id: "Q7-machinery-construction", tag: "MACHINERY_ACCESS", sectorId: SECTOR.CONSTRUCTION, subSector: "Construction equipment / services", evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "machinery_access" },
  { id: "Q7-machinery-agri", tag: "MACHINERY_ACCESS", sectorId: SECTOR.AGRICULTURE, subSector: "Agricultural machinery / services", evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "machinery_access" },
  { id: "Q7-machinery-mining", tag: "MACHINERY_ACCESS", sectorId: SECTOR.MINING, subSector: "Mining equipment / services", evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "machinery_access" },
  { id: "Q7-machinery-energy", tag: "MACHINERY_ACCESS", sectorId: SECTOR.ENERGY, subSector: "Energy equipment / services", evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "machinery_access" },
  { id: "Q7-machinery-water", tag: "MACHINERY_ACCESS", sectorId: SECTOR.WATER, subSector: "Water equipment / services", evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "machinery_access" },
  // Restraint (17.6): MACHINERY_ACCESS never maps to Robotics, Semiconductors,
  // AI & ML, or Aerospace & Space — those require domain-specific evidence.

  { id: "Q7-warehouse-logistics", tag: "WAREHOUSE_ACCESS", sectorId: SECTOR.LOGISTICS, subSector: "Warehousing", evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "warehouse_access" },
  { id: "Q7-warehouse-wholesale", tag: "WAREHOUSE_ACCESS", sectorId: SECTOR.WHOLESALE, subSector: "Distribution", evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "warehouse_access" },
  { id: "Q7-warehouse-retail", tag: "WAREHOUSE_ACCESS", sectorId: SECTOR.RETAIL, subSector: "Inventory / distribution", evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "warehouse_access" },
  { id: "Q7-warehouse-manufacturing", tag: "WAREHOUSE_ACCESS", sectorId: SECTOR.MANUFACTURING, subSector: "Production / storage", evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "warehouse_access" },
];

// Kitchen access fix: give it real rows (Food + Restaurants/Catering), not
// the placeholder "NONE" row above. Written separately for clarity.
const q7KitchenRows: MappingRow[] = [
  { id: "Q7-kitchen-food-production", tag: "KITCHEN_ACCESS", sectorId: SECTOR.AGRICULTURE, subSector: "Food production (agribusiness)", evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "kitchen_access" },
  { id: "Q7-kitchen-restaurants", tag: "KITCHEN_ACCESS", sectorId: SECTOR.RESTAURANTS_CATERING, subSector: "Restaurants / catering / prepared food", evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "kitchen_access" },
  // Deliberately NOT mapped to Travel/Tourism/Hospitality (17.4) — a kitchen
  // signals food production/service, not hospitality.
];

// ---------------------------------------------------------------------
// 17.8 — Q8B named customer industry (the ONLY source of customer-network
// sector tags; Q8A generic answers produce none — see 17.7).
// ---------------------------------------------------------------------
const q8bRows: MappingRow[] = [
  { id: "Q8B-agri-food", tag: "CUSTOMER_NETWORK_AGRICULTURE_FOOD", sectorId: SECTOR.AGRICULTURE, evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "customer_network" },
  { id: "Q8B-manufacturing", tag: "CUSTOMER_NETWORK_MANUFACTURING", sectorId: SECTOR.MANUFACTURING, evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "customer_network" },
  { id: "Q8B-construction", tag: "CUSTOMER_NETWORK_CONSTRUCTION", sectorId: SECTOR.CONSTRUCTION, evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "customer_network" },
  { id: "Q8B-retail-trade-retail", tag: "CUSTOMER_NETWORK_RETAIL_TRADE", sectorId: SECTOR.RETAIL, evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "customer_network" },
  { id: "Q8B-retail-trade-wholesale", tag: "CUSTOMER_NETWORK_RETAIL_TRADE", sectorId: SECTOR.WHOLESALE, evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "customer_network" },
  { id: "Q8B-finance-business-financial", tag: "CUSTOMER_NETWORK_FINANCE_BUSINESS", sectorId: SECTOR.FINANCIAL_SERVICES, evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "customer_network" },
  { id: "Q8B-finance-business-professional", tag: "CUSTOMER_NETWORK_FINANCE_BUSINESS", sectorId: SECTOR.PROFESSIONAL_SERVICES, evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "customer_network" },
  { id: "Q8B-technology", tag: "CUSTOMER_NETWORK_TECHNOLOGY", sectorId: SECTOR.IT_SOFTWARE, evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "customer_network" },
  { id: "Q8B-healthcare", tag: "CUSTOMER_NETWORK_HEALTHCARE", sectorId: SECTOR.HEALTHCARE, evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "customer_network" },
  { id: "Q8B-education", tag: "CUSTOMER_NETWORK_EDUCATION", sectorId: SECTOR.EDUCATION, evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "customer_network" },
  { id: "Q8B-government", tag: "CUSTOMER_NETWORK_GOVERNMENT", sectorId: SECTOR.GOVERNMENT, evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "customer_network" },
  { id: "Q8B-hospitality-travel", tag: "CUSTOMER_NETWORK_HOSPITALITY", sectorId: SECTOR.TRAVEL_TOURISM, evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "customer_network" },
  { id: "Q8B-hospitality-restaurants", tag: "CUSTOMER_NETWORK_HOSPITALITY", sectorId: SECTOR.RESTAURANTS_CATERING, evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "customer_network" },
  { id: "Q8B-transport-logistics-transport", tag: "CUSTOMER_NETWORK_TRANSPORT_LOGISTICS", sectorId: SECTOR.TRANSPORTATION, evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "customer_network" },
  { id: "Q8B-transport-logistics-logistics", tag: "CUSTOMER_NETWORK_TRANSPORT_LOGISTICS", sectorId: SECTOR.LOGISTICS, evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "customer_network" },
];

// ---------------------------------------------------------------------
// 17.12-17.20 — Chapter C domain evidence. Generated programmatically per
// domain from a small declarative spec, so the "commercial > practical >
// knowledge > ability > aspiration" structure can't drift between domains.
// Sub-tag-gated sectors (IT's Data/Cybersecurity, Retail's Wholesale, etc.)
// are listed separately as `subTagRows` below and only fire when that
// specific sub-tag was selected — never from the bare domain tag.
// ---------------------------------------------------------------------
interface DomainSpec {
  domain: Domain;
  /** Sectors produced by ANY evidence level (Commercial/Practical/Knowledge/Ability/Aspiration) selected for this domain, i.e. the domain's base sector(s). */
  baseSectors: { sectorId: SectorId; subSector?: string }[];
  /** Sectors produced only at Commercial or Practical level (stronger claim required). */
  experienceOnlySectors?: { sectorId: SectorId; subSector?: string }[];
}

const domainSpecs: DomainSpec[] = [
  {
    domain: "FOOD_AGRICULTURE",
    baseSectors: [
      { sectorId: SECTOR.AGRICULTURE, subSector: "Farming / agricultural production" },
    ],
    experienceOnlySectors: [
      { sectorId: SECTOR.RESTAURANTS_CATERING, subSector: "Food service / catering" },
    ],
  },
  {
    domain: "MACHINERY",
    baseSectors: [
      { sectorId: SECTOR.TRANSPORTATION, subSector: "Vehicle repair & maintenance" },
      { sectorId: SECTOR.MANUFACTURING, subSector: "Machinery / equipment repair" },
    ],
    experienceOnlySectors: [
      { sectorId: SECTOR.CONSTRUCTION, subSector: "Equipment maintenance / repair" },
      { sectorId: SECTOR.WHOLESALE, subSector: "Automotive / equipment parts" },
    ],
  },
  {
    domain: "CONSTRUCTION",
    baseSectors: [{ sectorId: SECTOR.CONSTRUCTION, subSector: "Construction services / building maintenance" }],
    experienceOnlySectors: [
      { sectorId: SECTOR.REAL_ESTATE, subSector: "Property development / services" },
      { sectorId: SECTOR.MANUFACTURING, subSector: "Construction materials" },
    ],
  },
  {
    domain: "IT",
    // Base: IT & Software only. AI/Data/Cybersecurity require sub-tags (below).
    baseSectors: [{ sectorId: SECTOR.IT_SOFTWARE }],
  },
  {
    domain: "PROFESSIONAL",
    baseSectors: [{ sectorId: SECTOR.PROFESSIONAL_SERVICES }],
    experienceOnlySectors: [{ sectorId: SECTOR.BUSINESS_SERVICES, subSector: "Business support / advisory" }],
    // Financial Services requires the Finance sub-tag (below) — generic
    // professional-services experience alone must not surface it.
  },
  {
    domain: "RETAIL",
    // Base: Retail only when no specific sub-tag chosen. Wholesale/Logistics
    // require sub-tags (below).
    baseSectors: [{ sectorId: SECTOR.RETAIL }],
  },
  {
    domain: "EDUCATION",
    baseSectors: [{ sectorId: SECTOR.EDUCATION }],
    // Business Services (corporate training) requires the sub-tag (below).
  },
  {
    domain: "HEALTH_PERSONAL",
    baseSectors: [{ sectorId: SECTOR.CONSUMER_PERSONAL_SERVICES }],
    // Sports & Recreation requires the fitness sub-tag (below).
    // ABSOLUTE GUARDRAIL (17.19): Healthcare is never in this list, at any
    // evidence level, under any circumstance, in v1.
  },
  {
    domain: "CREATIVE",
    baseSectors: [{ sectorId: SECTOR.MEDIA_CREATIVE }],
    // Marketing & Advertising requires the advertising sub-tag (below).
  },
];

const levelTagPrefixByClass: { prefix: string; evidenceClass: EvidenceClass; experienceLevel: boolean }[] = [
  { prefix: "COMMERCIAL_EXPERIENCE_", evidenceClass: "COMMERCIAL_EXPERIENCE", experienceLevel: true },
  { prefix: "PRACTICAL_EXPERIENCE_", evidenceClass: "PRACTICAL_EXPERIENCE", experienceLevel: true },
  { prefix: "KNOWLEDGE_", evidenceClass: "FORMAL_KNOWLEDGE", experienceLevel: false },
  { prefix: "ABILITY_", evidenceClass: "SELF_ASSESSED_ABILITY", experienceLevel: false },
  { prefix: "ASPIRATION_", evidenceClass: "ASPIRATION", experienceLevel: false },
];

function buildDomainRows(): MappingRow[] {
  const rows: MappingRow[] = [];
  for (const spec of domainSpecs) {
    for (const level of levelTagPrefixByClass) {
      const tag = `${level.prefix}${domainSuffix(spec.domain)}`;
      const group = `domain_${spec.domain.toLowerCase()}`;
      for (const s of spec.baseSectors) {
        rows.push({
          id: `${tag}->${s.sectorId}`,
          tag,
          sectorId: s.sectorId,
          subSector: s.subSector,
          evidenceClass: level.evidenceClass,
          independenceGroup: group,
        });
      }
      if (level.experienceLevel && spec.experienceOnlySectors) {
        for (const s of spec.experienceOnlySectors) {
          rows.push({
            id: `${tag}->${s.sectorId}(exp-only)`,
            tag,
            sectorId: s.sectorId,
            subSector: s.subSector,
            evidenceClass: level.evidenceClass,
            independenceGroup: group,
          });
        }
      }
    }
  }
  return rows;
}

// Sub-tag-gated rows (17.15-17.20 "crucial correction" / sub-tag rule,
// 17.29 specificity rule). These fire on a DIFFERENT, more specific tag
// than the bare domain tag — the UI only emits the sub-tag when the user
// actually selected it inside a Commercial/Practical answer.
const subTagRows: MappingRow[] = [
  // IT sub-tags
  { id: "Q15-subtag-data", tag: "IT_SUBTAG_DATA", sectorId: SECTOR.DATA, evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "domain_it_subtag" },
  { id: "Q15-subtag-cybersecurity", tag: "IT_SUBTAG_CYBERSECURITY", sectorId: SECTOR.CYBERSECURITY, evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "domain_it_subtag" },
  { id: "Q15-subtag-ai", tag: "IT_SUBTAG_AI_ML", sectorId: SECTOR.AI_ML, evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "domain_it_subtag" },

  // Professional -> Financial Services, gated on Finance sub-tag
  { id: "Q16-subtag-finance", tag: "PROFESSIONAL_SUBTAG_FINANCE", sectorId: SECTOR.FINANCIAL_SERVICES, evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "domain_professional_subtag" },

  // Retail sub-tags
  { id: "Q17-subtag-wholesale-1", tag: "RETAIL_SUBTAG_WHOLESALE", sectorId: SECTOR.WHOLESALE, evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "domain_retail_subtag" },
  { id: "Q17-subtag-import-export", tag: "RETAIL_SUBTAG_IMPORT_EXPORT", sectorId: SECTOR.WHOLESALE, evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "domain_retail_subtag" },
  { id: "Q17-subtag-distribution-wholesale", tag: "RETAIL_SUBTAG_DISTRIBUTION", sectorId: SECTOR.WHOLESALE, evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "domain_retail_subtag" },
  { id: "Q17-subtag-distribution-logistics", tag: "RETAIL_SUBTAG_DISTRIBUTION", sectorId: SECTOR.LOGISTICS, evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "domain_retail_subtag" },
  { id: "Q17-subtag-sales-services-business", tag: "RETAIL_SUBTAG_SALES_SERVICES", sectorId: SECTOR.BUSINESS_SERVICES, evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "domain_retail_subtag" },
  { id: "Q17-subtag-sales-services-professional", tag: "RETAIL_SUBTAG_SALES_SERVICES", sectorId: SECTOR.PROFESSIONAL_SERVICES, evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "domain_retail_subtag" },

  // Education -> Business Services, gated on corporate-training sub-tag
  { id: "Q18-subtag-corporate-training", tag: "EDUCATION_SUBTAG_CORPORATE_TRAINING", sectorId: SECTOR.BUSINESS_SERVICES, evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "domain_education_subtag" },

  // Health & Personal -> Sports & Recreation, gated on fitness sub-tag
  { id: "Q19-subtag-fitness", tag: "HEALTH_PERSONAL_SUBTAG_FITNESS", sectorId: SECTOR.SPORTS_RECREATION, evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "domain_health_personal_subtag" },

  // Creative -> Marketing & Advertising, gated on advertising sub-tag
  { id: "Q20-subtag-advertising", tag: "CREATIVE_SUBTAG_ADVERTISING", sectorId: SECTOR.MARKETING_ADVERTISING, evidenceClass: "SPECIFIC_ACCESS", independenceGroup: "domain_creative_subtag" },
];

// ---------------------------------------------------------------------
// 17.25 — Q25 "type of work" supporting-compatibility tags. Every row here
// is capped at GENERAL_COMPATIBILITY — never a stronger class, regardless
// of how many are selected (Part 8 Step 2 / Part 17.25 rule).
// ---------------------------------------------------------------------
const q25Rows: MappingRow[] = [
  { id: "Q25-making", tag: "WORK_MAKING", sectorId: SECTOR.MANUFACTURING, evidenceClass: "GENERAL_COMPATIBILITY", independenceGroup: "work_type" },
  { id: "Q25-making-food", tag: "WORK_MAKING", sectorId: SECTOR.AGRICULTURE, evidenceClass: "GENERAL_COMPATIBILITY", independenceGroup: "work_type" },
  { id: "Q25-making-fashion", tag: "WORK_MAKING", sectorId: SECTOR.FASHION_LUXURY, evidenceClass: "GENERAL_COMPATIBILITY", independenceGroup: "work_type" },

  { id: "Q25-fixing-manufacturing", tag: "WORK_FIXING", sectorId: SECTOR.MANUFACTURING, evidenceClass: "GENERAL_COMPATIBILITY", independenceGroup: "work_type" },
  { id: "Q25-fixing-construction", tag: "WORK_FIXING", sectorId: SECTOR.CONSTRUCTION, evidenceClass: "GENERAL_COMPATIBILITY", independenceGroup: "work_type" },
  { id: "Q25-fixing-transport", tag: "WORK_FIXING", sectorId: SECTOR.TRANSPORTATION, evidenceClass: "GENERAL_COMPATIBILITY", independenceGroup: "work_type" },

  { id: "Q25-selling-retail", tag: "WORK_SELLING", sectorId: SECTOR.RETAIL, evidenceClass: "GENERAL_COMPATIBILITY", independenceGroup: "work_type" },
  { id: "Q25-selling-wholesale", tag: "WORK_SELLING", sectorId: SECTOR.WHOLESALE, evidenceClass: "GENERAL_COMPATIBILITY", independenceGroup: "work_type" },
  { id: "Q25-selling-marketing", tag: "WORK_SELLING", sectorId: SECTOR.MARKETING_ADVERTISING, evidenceClass: "GENERAL_COMPATIBILITY", independenceGroup: "work_type" },
  { id: "Q25-selling-business", tag: "WORK_SELLING", sectorId: SECTOR.BUSINESS_SERVICES, evidenceClass: "GENERAL_COMPATIBILITY", independenceGroup: "work_type" },

  { id: "Q25-teaching", tag: "WORK_TEACHING", sectorId: SECTOR.EDUCATION, evidenceClass: "GENERAL_COMPATIBILITY", independenceGroup: "work_type" },

  { id: "Q25-analysis-professional", tag: "WORK_ANALYSIS", sectorId: SECTOR.PROFESSIONAL_SERVICES, evidenceClass: "GENERAL_COMPATIBILITY", independenceGroup: "work_type" },
  { id: "Q25-analysis-data", tag: "WORK_ANALYSIS", sectorId: SECTOR.DATA, evidenceClass: "GENERAL_COMPATIBILITY", independenceGroup: "work_type" },
  { id: "Q25-analysis-finance", tag: "WORK_ANALYSIS", sectorId: SECTOR.FINANCIAL_SERVICES, evidenceClass: "GENERAL_COMPATIBILITY", independenceGroup: "work_type" },

  { id: "Q25-operations-logistics", tag: "WORK_OPERATIONS", sectorId: SECTOR.LOGISTICS, evidenceClass: "GENERAL_COMPATIBILITY", independenceGroup: "work_type" },
  { id: "Q25-operations-manufacturing", tag: "WORK_OPERATIONS", sectorId: SECTOR.MANUFACTURING, evidenceClass: "GENERAL_COMPATIBILITY", independenceGroup: "work_type" },
  { id: "Q25-operations-business", tag: "WORK_OPERATIONS", sectorId: SECTOR.BUSINESS_SERVICES, evidenceClass: "GENERAL_COMPATIBILITY", independenceGroup: "work_type" },
  { id: "Q25-operations-hospitality", tag: "WORK_OPERATIONS", sectorId: SECTOR.TRAVEL_TOURISM, evidenceClass: "GENERAL_COMPATIBILITY", independenceGroup: "work_type" },

  { id: "Q25-designing-media", tag: "WORK_CREATING", sectorId: SECTOR.MEDIA_CREATIVE, evidenceClass: "GENERAL_COMPATIBILITY", independenceGroup: "work_type" },
  { id: "Q25-designing-marketing", tag: "WORK_CREATING", sectorId: SECTOR.MARKETING_ADVERTISING, evidenceClass: "GENERAL_COMPATIBILITY", independenceGroup: "work_type" },
  { id: "Q25-designing-fashion", tag: "WORK_CREATING", sectorId: SECTOR.FASHION_LUXURY, evidenceClass: "GENERAL_COMPATIBILITY", independenceGroup: "work_type" },

  { id: "Q25-people-consumer", tag: "WORK_PEOPLE", sectorId: SECTOR.CONSUMER_PERSONAL_SERVICES, evidenceClass: "GENERAL_COMPATIBILITY", independenceGroup: "work_type" },
  { id: "Q25-people-education", tag: "WORK_PEOPLE", sectorId: SECTOR.EDUCATION, evidenceClass: "GENERAL_COMPATIBILITY", independenceGroup: "work_type" },
  { id: "Q25-people-business", tag: "WORK_PEOPLE", sectorId: SECTOR.BUSINESS_SERVICES, evidenceClass: "GENERAL_COMPATIBILITY", independenceGroup: "work_type" },

  { id: "Q25-technology-it", tag: "WORK_TECHNOLOGY", sectorId: SECTOR.IT_SOFTWARE, evidenceClass: "GENERAL_COMPATIBILITY", independenceGroup: "work_type" },
  { id: "Q25-technology-data", tag: "WORK_TECHNOLOGY", sectorId: SECTOR.DATA, evidenceClass: "GENERAL_COMPATIBILITY", independenceGroup: "work_type" },
  { id: "Q25-technology-ai", tag: "WORK_TECHNOLOGY", sectorId: SECTOR.AI_ML, evidenceClass: "GENERAL_COMPATIBILITY", independenceGroup: "work_type" },

  { id: "Q25-logistics-logistics", tag: "WORK_LOGISTICS", sectorId: SECTOR.LOGISTICS, evidenceClass: "GENERAL_COMPATIBILITY", independenceGroup: "work_type" },
  { id: "Q25-logistics-transport", tag: "WORK_LOGISTICS", sectorId: SECTOR.TRANSPORTATION, evidenceClass: "GENERAL_COMPATIBILITY", independenceGroup: "work_type" },

  { id: "Q25-technical-it", tag: "WORK_TECHNICAL", sectorId: SECTOR.IT_SOFTWARE, evidenceClass: "GENERAL_COMPATIBILITY", independenceGroup: "work_type" },
  { id: "Q25-technical-manufacturing", tag: "WORK_TECHNICAL", sectorId: SECTOR.MANUFACTURING, evidenceClass: "GENERAL_COMPATIBILITY", independenceGroup: "work_type" },
  { id: "Q25-technical-construction", tag: "WORK_TECHNICAL", sectorId: SECTOR.CONSTRUCTION, evidenceClass: "GENERAL_COMPATIBILITY", independenceGroup: "work_type" },
];

// ---------------------------------------------------------------------
// Assemble the full table. Deliberately NO rows exist anywhere in this file
// for: VEHICLE_PERSONAL, VEHICLE_OTHER, COMPUTER_ORDINARY, any Q8A-only
// generic relationship tag, any Q9 language tag, any Q10 reach tag on its
// own, any Q11 access-only tag on its own, any Q21-Q24 preference tag, or
// any Q26 user_preferences tag. Their absence IS the noise-control rule —
// see engine.test.ts for the acceptance tests this guarantees.
// ---------------------------------------------------------------------
export const MAPPING_TABLE: MappingRow[] = [
  ...q7Rows,
  ...q7KitchenRows,
  ...q7VehicleRows,
  ...q7ComputerAndOtherRows,
  ...q8bRows,
  ...buildDomainRows(),
  ...subTagRows,
  ...q25Rows,
];

// Fast lookup: tag -> rows
export const MAPPING_BY_TAG: Map<string, MappingRow[]> = (() => {
  const m = new Map<string, MappingRow[]>();
  for (const row of MAPPING_TABLE) {
    const list = m.get(row.tag) ?? [];
    list.push(row);
    m.set(row.tag, list);
  }
  return m;
})();
