export interface NavAction {
  route: string;
  label: string;
}

export interface ChatHistoryItem {
  role: "user" | "assistant";
  content: string;
}

export interface ChatMessage {
  id: string;
  question: string;
  answer: string | null;
  navAction?: NavAction | null;
  error?: string | null;
  isLoading?: boolean;
}

export const getQuickPrompts = (lang: string): string[] => {
  return lang === "ja"
    ? [
        "スジャンについて教えて",
        "どんなプロジェクトを開発しましたか？",
        "プロジェクトページを開いて",
        "スキルを教えて",
        "経歴を見せて",
        "履歴書を見る",
      ]
    : [
        "Tell me about Sujan",
        "What projects has he built?",
        "Take me to the Projects page",
        "What are his skills?",
        "Show his experience",
        "Show resume",
      ];
};
