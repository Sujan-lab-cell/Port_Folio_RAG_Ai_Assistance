import { ChatHistoryItem } from "@/src/components/AI/types";

export type ConversationEntityType =
  | "project"
  | "company"
  | "internship"
  | "person"
  | "education"
  | "page";

export interface ConversationEntity {
  name: string;
  type: ConversationEntityType;
  route?: string;
  aliases?: string[];
}

export interface ConversationResolution {
  originalQuery: string;
  resolvedQuery: string;
  wasResolved: boolean;
  confidence: "high" | "medium" | "low";
  entity?: {
    name: string;
    type: ConversationEntityType;
  };
}

export const KNOWN_ENTITIES: ConversationEntity[] = [
  // Projects
  {
    name: "GeoSentinel",
    type: "project",
    route: "/projects/geosentinel",
    aliases: [
      "geosentinel",
      "geosentinel — ai landslide detection system",
      "landslide detection system",
      "landslide project",
      "yolov8 segmentation",
    ],
  },
  {
    name: "SmartQ Generator",
    type: "project",
    route: "/projects/smartq-generator",
    aliases: ["smartq generator", "smartq", "t5 transformer question generator"],
  },
  {
    name: "Hybrid AI Invoice Parser",
    type: "project",
    route: "/projects/invoice-data-to-json-parser",
    aliases: [
      "hybrid ai invoice parser",
      "invoice parser",
      "invoice data to json parser",
      "invoice parser project",
      "invoice to json",
    ],
  },
  {
    name: "Colorectal Polyp Temporal Validation Framework",
    type: "project",
    route: "/projects/colorectal-polyp-temporal-validation",
    aliases: [
      "colorectal polyp",
      "colorectal polyp temporal validation",
      "adaptive temporal validation framework",
      "polyp project",
      "medical ai project",
    ],
  },
  {
    name: "AI Human Face Generation",
    type: "project",
    route: "/projects/ai-face-generation",
    aliases: ["wgan", "wgan-gp", "ai face generation", "human face generation", "face generator"],
  },
  {
    name: "FlyRank Search Performance Prediction",
    type: "project",
    route: "/projects/flyrank-search-performance-prediction",
    aliases: ["flyrank search performance prediction", "flyrank project", "search prediction"],
  },
  {
    name: "E-Commerce Sales Dashboard",
    type: "project",
    route: "/projects/ecommerce-dashboard",
    aliases: ["e-commerce sales dashboard", "ecommerce dashboard", "sales dashboard", "power bi dashboard"],
  },
  {
    name: "Car & Pedestrian Detection",
    type: "project",
    route: "/projects/car-pedestrian-detection",
    aliases: ["car & pedestrian detection", "car and pedestrian detection", "pedestrian detection"],
  },
  {
    name: "Banking Management System",
    type: "project",
    route: "/projects/banking-management-system",
    aliases: ["banking management system", "banking system"],
  },
  {
    name: "AI-Based Text Anomaly Detection System",
    type: "project",
    route: "/projects/text-anomaly-detection",
    aliases: ["text anomaly detection", "ai-based text anomaly detection"],
  },

  // Companies & Internships
  {
    name: "FlyRank AI",
    type: "company",
    route: "/experience",
    aliases: ["flyrank ai", "flyrank", "flyrank.ai"],
  },
  {
    name: "ISIRI Technologies",
    type: "company",
    route: "/experience",
    aliases: ["isiri technologies", "isiri", "ayuslab", "ayushcare"],
  },
  {
    name: "EdiGlobe",
    type: "company",
    route: "/experience",
    aliases: ["ediglobe", "zhagaram"],
  },

  // Person
  {
    name: "Sujan K S",
    type: "person",
    route: "/about",
    aliases: ["sujan", "sujan k s", "sujan's"],
  },

  // Education
  {
    name: "NMAMIT",
    type: "education",
    route: "/about",
    aliases: ["nmamit", "n.m.a.m. institute of technology", "nmam institute of technology"],
  },

  // Pages
  { name: "About", type: "page", route: "/about", aliases: ["about page", "about me", "bio page"] },
  { name: "Skills", type: "page", route: "/skills", aliases: ["skills page", "tech stack page"] },
  { name: "Projects", type: "page", route: "/projects", aliases: ["projects page"] },
  { name: "Experience", type: "page", route: "/experience", aliases: ["experience page", "internships page"] },
  { name: "Achievements", type: "page", route: "/achievements", aliases: ["achievements page", "certifications page"] },
  { name: "Blog", type: "page", route: "/blog", aliases: ["blog page", "articles page"] },
];

/**
  Extract entities mentioned in a given text string.
 */
export function extractEntitiesFromText(text: string): ConversationEntity[] {
  if (!text || typeof text !== "string") return [];
  const lower = text.toLowerCase();
  const found: ConversationEntity[] = [];

  for (const entity of KNOWN_ENTITIES) {
    const candidates = [entity.name, ...(entity.aliases || [])];
    for (const alias of candidates) {
      const aliasLower = alias.toLowerCase();
      let isMatch = false;

      if (aliasLower.length <= 4) {
        const regex = new RegExp(`\\b${aliasLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
        isMatch = regex.test(text);
      } else {
        isMatch = lower.includes(aliasLower);
      }

      if (isMatch) {
        if (!found.some((e) => e.name === entity.name)) {
          found.push(entity);
        }
        break;
      }
    }
  }

  return found;
}

/**
  Extract distinct entities mentioned across recent conversation history,
  ordered from most recently mentioned to oldest.
 */
export function extractEntitiesFromHistory(history: ChatHistoryItem[]): ConversationEntity[] {
  if (!history || history.length === 0) return [];
  const entities: ConversationEntity[] = [];

  // Iterate backwards (most recent messages first)
  for (let i = history.length - 1; i >= 0; i--) {
    const item = history[i];
    if (item.content) {
      const extracted = extractEntitiesFromText(item.content);
      for (const ent of extracted) {
        if (!entities.some((e) => e.name === ent.name)) {
          entities.push(ent);
        }
      }
    }
  }

  return entities;
}

/**
  Resolves ambiguous pronouns/references in a user query using conversation history & recency.
  Returns ConversationResolution with confidence and optional resolved query string.
 */
export function resolveConversationalQuery(
  query: string,
  history: ChatHistoryItem[]
): ConversationResolution {
  const trimmedQuery = query.trim();

  if (!trimmedQuery || !history || history.length === 0) {
    return {
      originalQuery: trimmedQuery,
      resolvedQuery: trimmedQuery,
      wasResolved: false,
      confidence: "low",
    };
  }

  // Rule 1: Explicit entity in current query takes absolute precedence
  const explicitEntitiesInQuery = extractEntitiesFromText(trimmedQuery).filter(
    (e) => e.type === "project" || e.type === "company" || e.type === "education"
  );
  if (explicitEntitiesInQuery.length > 0) {
    return {
      originalQuery: trimmedQuery,
      resolvedQuery: trimmedQuery,
      wasResolved: false,
      confidence: "low",
    };
  }

  // Rule 2: Do NOT collapse plural references e.g. "them", "these", "those"
  const pluralRegex = /\b(them|these|those)\b/i;
  if (pluralRegex.test(trimmedQuery)) {
    return {
      originalQuery: trimmedQuery,
      resolvedQuery: trimmedQuery,
      wasResolved: false,
      confidence: "low",
    };
  }

  // Extract entities from history (already ordered from most recent to oldest)
  const historyEntities = extractEntitiesFromHistory(history);

  if (historyEntities.length === 0) {
    return {
      originalQuery: trimmedQuery,
      resolvedQuery: trimmedQuery,
      wasResolved: false,
      confidence: "low",
    };
  }

  // Rule 3: Check specific noun references ("this project", "that project", "the project")
  const projectRefRegex = /\b(this|that|the)\s+project\b/gi;
  if (projectRefRegex.test(trimmedQuery)) {
    const recentProjectEntities = historyEntities.filter((e) => e.type === "project");

    if (recentProjectEntities.length > 0) {
      // Use the MOST RECENT project entity
      const entity = recentProjectEntities[0];
      const resolvedQuery = trimmedQuery
        .replace(projectRefRegex, entity.name)
        .replace(/\s+/g, " ")
        .trim();

      return {
        originalQuery: trimmedQuery,
        resolvedQuery,
        wasResolved: true,
        confidence: "high",
        entity: {
          name: entity.name,
          type: entity.type,
        },
      };
    }
  }

  // Rule 4: Check company/internship references ("this company", "that internship", "there")
  const companyRefRegex = /\b(this|that|the)\s+(company|internship|role|job)\b/gi;
  const thereRefRegex = /\bthere\b/gi;

  if (companyRefRegex.test(trimmedQuery)) {
    const recentCompanyEntities = historyEntities.filter(
      (e) => e.type === "company" || e.type === "internship"
    );

    if (recentCompanyEntities.length > 0) {
      // Use the MOST RECENT company/internship entity
      const entity = recentCompanyEntities[0];
      const resolvedQuery = trimmedQuery
        .replace(companyRefRegex, entity.name)
        .replace(/\s+/g, " ")
        .trim();

      return {
        originalQuery: trimmedQuery,
        resolvedQuery,
        wasResolved: true,
        confidence: "high",
        entity: {
          name: entity.name,
          type: entity.type,
        },
      };
    }
  }

  if (thereRefRegex.test(trimmedQuery)) {
    const recentPlaceEntities = historyEntities.filter(
      (e) => e.type === "company" || e.type === "internship" || e.type === "education"
    );

    if (recentPlaceEntities.length > 0) {
      // Use the MOST RECENT place/company entity
      const entity = recentPlaceEntities[0];
      const resolvedQuery = trimmedQuery
        .replace(thereRefRegex, `at ${entity.name}`)
        .replace(/\s+/g, " ")
        .trim();

      return {
        originalQuery: trimmedQuery,
        resolvedQuery,
        wasResolved: true,
        confidence: "high",
        entity: {
          name: entity.name,
          type: entity.type,
        },
      };
    }
  }

  // Rule 5: Check general pronoun "it"
  const pronounItRegex = /\bit\b/gi;
  if (pronounItRegex.test(trimmedQuery)) {
    const isProjectContextQuery = /\bproject\b/i.test(trimmedQuery);
    const recentCandidateEntities = isProjectContextQuery
      ? historyEntities.filter((e) => e.type === "project")
      : historyEntities.filter((e) => e.type === "project" || e.type === "company");

    if (recentCandidateEntities.length > 0) {
      // Use the MOST RECENT candidate entity
      const entity = recentCandidateEntities[0];
      const resolvedQuery = trimmedQuery
        .replace(pronounItRegex, entity.name)
        .replace(/\s+/g, " ")
        .trim();

      return {
        originalQuery: trimmedQuery,
        resolvedQuery,
        wasResolved: true,
        confidence: "high",
        entity: {
          name: entity.name,
          type: entity.type,
        },
      };
    }
  }

  // Rule 6: Default fallback -> Return original query unchanged
  return {
    originalQuery: trimmedQuery,
    resolvedQuery: trimmedQuery,
    wasResolved: false,
    confidence: "low",
  };
}
