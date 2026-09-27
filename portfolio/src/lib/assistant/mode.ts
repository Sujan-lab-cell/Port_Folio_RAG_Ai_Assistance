export type AssistantMode = "rag" | "rule";

/**
 * Returns the configured AI Assistant mode from environment variables.
 * - "rag": Uses full Supabase vector retrieval + Grok LLM pipeline.
 * - "rule": Uses serverless rule-based response matching fallback.
 * 
 * Defaults to "rag" if process.env.AI_ASSISTANT_MODE is undefined or invalid.
 */
export function getAssistantMode(): AssistantMode {
  const envMode = process.env.AI_ASSISTANT_MODE?.trim().toLowerCase();
  if (envMode === "rule") {
    return "rule";
  }
  return "rag";
}
