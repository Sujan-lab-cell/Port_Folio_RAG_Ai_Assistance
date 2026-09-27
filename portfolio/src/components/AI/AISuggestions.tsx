"use client";

import React from "react";
import { Bot } from "lucide-react";
import { useLanguage } from "@/src/i18n";
import { getQuickPrompts } from "./types";

interface AISuggestionsProps {
  onSelectPrompt: (prompt: string) => void;
  disabled?: boolean;
}

export function AISuggestions({ onSelectPrompt, disabled }: AISuggestionsProps) {
  const { lang } = useLanguage();

  const greetingText =
    lang === "ja"
      ? "「こんにちは！スジャンのAIアシスタントです。何でも質問してください！」"
      : "“Hi! I’m Sujan’s AI Assistant — Ask me anything about his work!”";

  const suggestedHeader = lang === "ja" ? "おすすめの質問:" : "Suggested Questions:";
  const prompts = getQuickPrompts(lang);

  return (
    <div className="flex flex-col items-center justify-center p-4 text-center space-y-4 my-auto">
      <div className="relative flex items-center justify-center h-14 w-14 rounded-2xl border border-cyan-500/40 bg-cyan-500/10 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
        <Bot size={28} className="text-cyan-300" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-400" />
        </span>
      </div>

      <div>
        <p className="text-xs sm:text-sm font-medium text-slate-200 leading-relaxed max-w-xs">
          {greetingText}
        </p>
      </div>

      <div className="w-full space-y-2 pt-2 border-t border-white/10">
        <p className="text-[11px] font-mono text-cyan-400 font-medium text-left px-1">
          {suggestedHeader}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {prompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => onSelectPrompt(prompt)}
              disabled={disabled}
              className="rounded-lg border border-cyan-500/30 bg-cyan-950/40 px-2.5 py-1.5 text-xs font-medium text-cyan-200 transition hover:border-cyan-400 hover:bg-cyan-500/20 hover:text-white disabled:opacity-40 cursor-pointer text-left backdrop-blur-sm"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
