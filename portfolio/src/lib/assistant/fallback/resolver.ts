import { fallbackKnowledge } from "./knowledge";
import { extractNavigationMetadata } from "@/src/lib/navigation/navigationTarget";

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

export interface CloudFallbackResponse {
  answer: string;
  navigation?: {
    section: string;
    target?: string;
  };
  isFallback: true;
}

/**
 * Serverless Cloud LLM fallback resolver (Tier 2).
 * Uses Groq API (or xAI API) with native fetch() to generate grounded portfolio answers
 * when local RAG microservices are unavailable (e.g. on Vercel deployment).
 */
export async function resolveCloudFallbackQuery(
  query: string,
  language: string = "en",
  history?: Array<{ role: "user" | "assistant"; content: string }>
): Promise<CloudFallbackResponse | null> {
  const apiKey = process.env.GROQ_API_KEY || process.env.XAI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    // Missing API key: controlled return null to allow Tier 3 rule fallback to run
    return null;
  }

  const facts = fallbackKnowledge.facts;
  const entitySummary = fallbackKnowledge.entityRoutes
    .map((e) => `- ${e.name} (${e.type}, Path: ${e.path}, Aliases: ${e.aliases.join(", ")})`)
    .join("\n");

  const systemPrompt = `You are Sujan K S's Portfolio AI Assistant.
Answer user questions accurately, concisely, and naturally using ONLY the portfolio knowledge provided below.

PORTFOLIO KNOWLEDGE:
- Name: ${facts.name}
- Role: ${facts.role}
- Location: ${facts.location}
- Education: ${facts.education.degree} at ${facts.education.institution} (${facts.education.years}), CGPA: ${facts.education.cgpa}
- Expected Graduation: ${facts.graduationYear}
- Total Projects Built: ${facts.projectsCount} (${facts.majorAreas.join(", ")})
- Japanese Language Learning: ${facts.japaneseLearning}

KEY PROJECTS & EXPERIENCE CASE STUDIES:
${entitySummary}

STRICT INSTRUCTIONS:
1. Rely strictly on the portfolio knowledge provided above. Never invent, hallucinate, or assume facts, projects, internships, metrics, dates, or achievements not present.
2. If the user's question cannot be answered using the provided knowledge, clearly state: "The requested information is not available in Sujan's portfolio knowledge base."
3. Respond in the user's requested language (${language === "ja" ? "Japanese" : "English"}).
4. Keep answers concise, factual, and direct for a web portfolio chatbot.`;

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt },
  ];

  if (Array.isArray(history)) {
    for (const item of history.slice(-6)) {
      if (item && (item.role === "user" || item.role === "assistant") && typeof item.content === "string") {
        messages.push({ role: item.role, content: item.content });
      }
    }
  }

  messages.push({ role: "user", content: query });

  try {
    const isGroq = apiKey.startsWith("gsk_");
    const endpoint = isGroq
      ? "https://api.groq.com/openai/v1/chat/completions"
      : "https://api.x.ai/v1/chat/completions";
    const model = isGroq ? "qwen/qwen3.8-27b" : "grok-2-latest";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.warn(`Groq/Cloud LLM API returned non-200 status: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const answer = data?.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      return null;
    }

    const navigation = extractNavigationMetadata(query, language);

    return {
      answer,
      navigation,
      isFallback: true,
    };
  } catch (err) {
    console.warn("Cloud LLM fallback execution failed:", err);
    return null;
  }
}

/**
 * Lightweight serverless fallback resolver for Vercel deployment architecture (Tier 3).
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
