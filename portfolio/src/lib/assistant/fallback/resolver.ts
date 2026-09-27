import { fallbackKnowledge } from "./knowledge";

export type FallbackResult =
  | {
      type: "answer";
      answer: string;
    }
  | {
      type: "navigation";
      answer: string;
      route: string;
      label: string;
    }
  | {
      type: "unsupported";
      answer: string;
      route?: string;
      label?: string;
    };

/**
 * Lightweight serverless fallback resolver for Vercel deployment architecture.
 * Evaluates queries against structured fallback knowledge without requiring RAG microservices.
 */
export function resolveFallbackQuery(query: string): FallbackResult {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return {
      type: "unsupported",
      answer: "Please ask a question about Sujan's projects, background, skills, or experience.",
      route: "/about",
      label: "About Me",
    };
  }

  const facts = fallbackKnowledge.facts;

  // 1. Basic Facts Matching
  if (normalized.includes("cgpa") || normalized.includes("gpa") || normalized.includes("grade")) {
    return {
      type: "answer",
      answer: `Sujan has a CGPA of ${facts.education.cgpa} in his ${facts.education.degree} at ${facts.education.institution}.`,
    };
  }

  if (
    normalized.includes("study") ||
    normalized.includes("studied") ||
    normalized.includes("education") ||
    normalized.includes("university") ||
    normalized.includes("college") ||
    normalized.includes("degree") ||
    normalized.includes("nmamit")
  ) {
    return {
      type: "answer",
      answer: `Sujan is pursuing a ${facts.education.degree} at ${facts.education.institution} (${facts.education.years}) with a CGPA of ${facts.education.cgpa}.`,
    };
  }

  if (
    (normalized.includes("how many") || normalized.includes("number of") || normalized.includes("count")) &&
    normalized.includes("project")
  ) {
    return {
      type: "answer",
      answer: `Sujan has built ${facts.projectsCount} projects across ${facts.majorAreas.join(", ")}.`,
    };
  }

  if (
    normalized.includes("where is") ||
    normalized.includes("where does sujan live") ||
    normalized.includes("location") ||
    normalized.includes("based in") ||
    normalized.includes("mangalore")
  ) {
    return {
      type: "answer",
      answer: `Sujan K S is based in ${facts.location}.`,
    };
  }

  if (normalized.includes("japanese") || normalized.includes("jlpt")) {
    return {
      type: "answer",
      answer: facts.japaneseLearning,
    };
  }

  // 2. Entity Route Matching (Specific Project / Company Case Studies)
  for (const entity of fallbackKnowledge.entityRoutes) {
    const matched =
      normalized.includes(entity.name.toLowerCase()) ||
      entity.aliases.some((alias) => normalized.includes(alias.toLowerCase()));

    if (matched) {
      if (entity.type === "project") {
        return {
          type: "navigation",
          answer: `Here is the ${entity.name} project case study.`,
          route: entity.path,
          label: entity.name,
        };
      } else {
        return {
          type: "navigation",
          answer: `You can view Sujan's work at ${entity.name} on the Experience page.`,
          route: entity.path,
          label: "Work Experience",
        };
      }
    }
  }

  // 3. Page Route Matching (General Portfolio Section Navigation)
  for (const route of fallbackKnowledge.pageRoutes) {
    const matched =
      normalized.includes(route.key.toLowerCase()) ||
      route.aliases.some((alias) => normalized.includes(alias.toLowerCase()));

    if (matched) {
      return {
        type: "navigation",
        answer: `Navigating to the ${route.label} page.`,
        route: route.path,
        label: route.label,
      };
    }
  }

  // 4. Unsupported / Complex Query Fallback
  return {
    type: "unsupported",
    answer: "I don't have detailed RAG technical breakdowns in fallback mode. You can explore Sujan's projects and technical blog for more details.",
    route: "/projects",
    label: "Projects Portfolio",
  };
}
