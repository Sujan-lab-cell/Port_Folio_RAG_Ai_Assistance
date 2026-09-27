"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Sparkles, User, ExternalLink, FileText, Compass, ArrowRight } from "lucide-react";
import { ChatMessage } from "./types";
import { useLanguage } from "@/src/i18n";

interface AIMessageProps {
  message: ChatMessage;
}

function parseInline(text: string): React.ReactNode[] {
  // Normalize links wrapped in malformed asterisks e.g. *[file.pdf](file.pdf)** or **[link](url)**
  const preCleaned = text.replace(/\*+\[([^\]]+)\]\(([^)]+)\)\*+/g, "[$1]($2)");

  // Regex pattern matching:
  // 1. Links: [label](url)
  // 2. Bold: **text**
  // 3. Inline code: `code`
  // 4. Italics: *text* or _text_
  const pattern = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|_[^_]+_)/g;
  const parts = preCleaned.split(pattern);

  return parts.map((part, i) => {
    if (!part) return null;

    // 1. Link matching: [label](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const [, rawLabel, url] = linkMatch;
      const isPdf =
        url.toLowerCase().endsWith(".pdf") ||
        rawLabel.toLowerCase().endsWith(".pdf") ||
        rawLabel.toLowerCase().includes("resume");

      let cleanLabel = rawLabel.trim();
      if (isPdf) {
        if (cleanLabel.toLowerCase().includes("japanese") || cleanLabel.toLowerCase().includes("inter")) {
          cleanLabel = "📄 View Japanese Resume";
        } else if (cleanLabel.includes("_") || cleanLabel.endsWith(".pdf") || cleanLabel.toLowerCase() === "resume") {
          cleanLabel = "📄 View Resume";
        }
      }

      return (
        <a
          key={i}
          href={url.startsWith("/") || url.startsWith("http") ? url : `/${url}`}
          target={url.startsWith("http") || isPdf ? "_blank" : "_self"}
          rel="noopener noreferrer"
          className={
            isPdf
              ? "inline-flex items-center gap-1.5 rounded-lg bg-cyan-950/90 border border-cyan-400/60 px-2.5 py-1 font-mono text-[11px] font-semibold text-cyan-200 shadow-sm hover:bg-cyan-500/30 hover:border-cyan-300 hover:text-white transition my-1 cursor-pointer"
              : "inline-flex items-center gap-1 font-semibold text-cyan-300 underline underline-offset-2 hover:text-cyan-100 transition"
          }
        >
          {isPdf ? (
            <>
              <FileText size={13} className="text-cyan-400 shrink-0" />
              <span>{cleanLabel}</span>
              <ExternalLink size={11} className="text-cyan-400 opacity-80 shrink-0" />
            </>
          ) : (
            <>
              <span>{cleanLabel}</span>
              <ExternalLink size={11} className="inline shrink-0 opacity-80" />
            </>
          )}
        </a>
      );
    }

    // 2. Bold matching: **text**
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      const inner = part.slice(2, -2);
      return (
        <strong key={i} className="font-semibold text-cyan-200">
          {parseInline(inner)}
        </strong>
      );
    }

    // 3. Code matching: `code`
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <code
          key={i}
          className="rounded bg-cyan-950/80 px-1.5 py-0.5 font-mono text-[11px] text-cyan-300 border border-cyan-500/30"
        >
          {inner}
        </code>
      );
    }

    // 4. Italic matching: *text* or _text_
    if (
      (part.startsWith("*") && part.endsWith("*") && part.length >= 2) ||
      (part.startsWith("_") && part.endsWith("_") && part.length >= 2)
    ) {
      const inner = part.slice(1, -1);
      return (
        <em key={i} className="italic text-slate-300">
          {parseInline(inner)}
        </em>
      );
    }

    return part;
  });
}

function FormattedMarkdown({ content }: { content: string | null }) {
  if (!content) return null;

  const lines = content.split("\n");

  return (
    <div className="space-y-1 text-slate-200 leading-relaxed font-sans text-xs">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        if (trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("*")) {
          const bulletText = trimmed.replace(/^[\bullet\-\*]\s*/, "");
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1 my-0.5">
              <span className="text-cyan-400 font-bold shrink-0 mt-0.5">•</span>
              <span className="flex-1 min-w-0">{parseInline(bulletText)}</span>
            </div>
          );
        }

        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
          const [, num, itemText] = numMatch;
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1 my-0.5">
              <span className="font-mono font-bold text-cyan-400 shrink-0 mt-0.5">{num}.</span>
              <span className="flex-1 min-w-0">{parseInline(itemText)}</span>
            </div>
          );
        }

        if (trimmed.startsWith("#")) {
          const headingText = trimmed.replace(/^#+\s*/, "");
          return (
            <div key={idx} className="font-mono font-bold text-cyan-300 text-xs sm:text-sm mt-2 mb-1">
              {parseInline(headingText)}
            </div>
          );
        }

        return (
          <p key={idx} className="my-0.5">
            {parseInline(line)}
          </p>
        );
      })}
    </div>
  );
}

export function AIMessage({ message }: AIMessageProps) {
  const router = useRouter();
  const { lang } = useLanguage();
  const loadingText = lang === "ja" ? "回答を生成しています..." : "Generating grounded response...";

  return (
    <div className="space-y-3">
      {/* User Question Bubble (Right aligned) */}
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-400/80">
          <span>{lang === "ja" ? "あなた" : "You"}</span>
          <User size={12} className="text-cyan-400" />
        </div>
        <div className="rounded-2xl rounded-tr-xs bg-gradient-to-r from-cyan-600/30 to-indigo-600/30 border border-cyan-400/40 px-3.5 py-2.5 text-xs text-cyan-100 shadow-sm max-w-[85%] break-words">
          {message.question}
        </div>
      </div>

      {/* AI Assistant Answer Bubble (Left aligned) */}
      <div className="flex flex-col items-start gap-1">
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
          <div className="relative h-4 w-4 overflow-hidden rounded-full border border-cyan-400/40">
            <Image
              src="/images/ai_robot_assistant.jpg"
              alt="AI"
              fill
              className="object-cover"
            />
          </div>
          <span className="text-cyan-300 font-semibold">
            {lang === "ja" ? "AIアシスタント" : "AI Assistant"}
          </span>
        </div>

        <div className="rounded-2xl rounded-tl-xs bg-slate-900/90 border border-slate-800 p-3.5 text-xs text-slate-200 shadow-md max-w-[92%] w-full break-words">
          {message.isLoading ? (
            <div className="flex items-center gap-2 text-cyan-400 font-mono py-1">
              <Sparkles size={14} className="animate-spin text-cyan-400 shrink-0" />
              <span className="text-xs">{loadingText}</span>
            </div>
          ) : message.error ? (
            <div className="text-rose-400 font-mono text-xs">
              {message.error}
            </div>
          ) : (
            <>
              <FormattedMarkdown content={message.answer} />
              {message.navAction && (
                <div className="mt-3 pt-2.5 border-t border-cyan-500/20 flex items-center">
                  <button
                    onClick={() => router.push(message.navAction!.route)}
                    className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/60 bg-gradient-to-r from-cyan-500/20 via-cyan-600/15 to-indigo-500/20 px-3.5 py-2 font-mono text-xs font-bold text-cyan-200 shadow-md shadow-cyan-500/10 hover:border-cyan-300 hover:bg-cyan-500/30 hover:text-white hover:scale-105 transition duration-200 cursor-pointer"
                  >
                    <Compass size={14} className="text-cyan-400 animate-pulse shrink-0" />
                    <span>{message.navAction.label}</span>
                    <ArrowRight size={13} className="text-cyan-300 shrink-0" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
