"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { X, Send, Trash2, Zap, Maximize2, Minimize2 } from "lucide-react";
import { useLanguage } from "@/src/i18n";
import { ChatMessage } from "./types";
import { AIMessage } from "./AIMessage";
import { AISuggestions } from "./AISuggestions";

interface AIChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (prompt: string) => void;
  onClearMessages: () => void;
}

export function AIChatWindow({
  isOpen,
  onClose,
  isExpanded = false,
  onToggleExpand,
  messages,
  isLoading,
  onSendMessage,
  onClearMessages,
}: AIChatWindowProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { lang } = useLanguage();

  const titleText = lang === "ja" ? "AIポートフォリオアシスタント" : "AI Portfolio Assistant";
  const placeholderText = lang === "ja" ? "スジャンについて何でも聞いてください..." : "Ask anything about Sujan...";
  const sendButtonText = lang === "ja" ? "送信" : "Send";
  const clearTooltip = lang === "ja" ? "履歴をクリア" : "Clear chat history";
  const expandTooltip = isExpanded
    ? lang === "ja"
      ? "標準サイズに戻す"
      : "Collapse view"
    : lang === "ja"
    ? "大画面表示"
    : "Expand view";

  // Auto-scroll on new messages or loading state
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isExpanded]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput("");
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{
        layout: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
        opacity: { duration: 0.2 },
      }}
      className={`fixed z-50 flex flex-col rounded-2xl border border-cyan-500/30 bg-slate-950/95 shadow-[0_0_45px_rgba(34,211,238,0.25)] backdrop-blur-xl overflow-hidden pointer-events-auto ${
        isExpanded
          ? "bottom-4 sm:bottom-6 right-4 sm:right-6 md:right-8 w-[calc(100vw-2rem)] sm:w-[680px] md:w-[760px] lg:w-[840px] h-[720px] max-h-[86vh]"
          : "bottom-20 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[410px] md:w-[440px] h-[520px] max-h-[78vh]"
      }`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-slate-900/80 backdrop-blur-md select-none">
        <div className="flex items-center gap-2.5">
          <div className="relative h-8 w-8 overflow-hidden rounded-xl border border-cyan-400/50 shadow-md shrink-0">
            <Image
              src="/images/ai_robot_assistant.jpg"
              alt="AI Robot"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold font-mono text-cyan-300 tracking-wide uppercase">
                {titleText}
              </h3>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
              <Zap size={10} className="text-amber-400 shrink-0" />
              <span>RAG Core Active</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={onClearMessages}
              disabled={isLoading}
              title={clearTooltip}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-cyan-300 disabled:opacity-40 cursor-pointer"
            >
              <Trash2 size={15} />
            </button>
          )}

          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              title={expandTooltip}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-cyan-300 cursor-pointer"
              aria-label={expandTooltip}
            >
              {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
          )}

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white cursor-pointer"
            aria-label="Close assistant"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Scrollable Conversation Body */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-transparent select-text"
      >
        {messages.length === 0 ? (
          <AISuggestions onSelectPrompt={onSendMessage} disabled={isLoading} />
        ) : (
          messages.map((item) => <AIMessage key={item.id} message={item} />)
        )}
      </div>

      {/* Fixed Input Footer */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-white/10 bg-slate-900/90 p-3 flex items-center gap-2 backdrop-blur-md"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholderText}
          disabled={isLoading}
          className="min-w-0 flex-1 rounded-xl border border-cyan-500/30 bg-slate-950/80 px-3.5 py-2 text-xs font-mono text-white placeholder-slate-400 outline-none transition focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-mono font-bold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-40 cursor-pointer shrink-0 shadow-md shadow-cyan-500/20"
        >
          <span>{sendButtonText}</span>
          <Send size={13} />
        </button>
      </form>
    </motion.div>
  );
}
