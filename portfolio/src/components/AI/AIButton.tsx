"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { useLanguage } from "@/src/i18n";

interface AIButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export function AIButton({ isOpen, onClick }: AIButtonProps) {
  const { lang } = useLanguage();
  const tooltipText = lang === "ja" ? "AIアシスタント" : "AI Assistant";

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 md:bottom-6 md:right-6 z-50 flex items-center justify-center group cursor-pointer pointer-events-auto"
      aria-label="Toggle AI Portfolio Assistant"
      title={tooltipText}
    >
      {/* Outer Halo Glow & Pulse */}
      <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-teal-400 opacity-60 blur-md group-hover:opacity-100 transition duration-500 animate-pulse" />

      {/* Button Avatar Outer Ring */}
      <div className="relative flex items-center justify-center h-12 w-12 sm:h-13 sm:w-13 md:h-14 md:w-14 rounded-full border-2 border-cyan-400/90 bg-slate-950 p-0.5 shadow-[0_0_25px_rgba(34,211,238,0.5)] transition duration-300 group-hover:border-cyan-300">
        <div className="relative h-full w-full rounded-full overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center">
          <Image
            src="/images/ai_robot_assistant.jpg"
            alt="AI Assistant"
            fill
            className="object-cover object-center transition-transform duration-300 group-hover:scale-110"
          />
        </div>

        {/* Status Indicator / Badge */}
        <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-950 border border-cyan-400/80 shadow-md">
          {isOpen ? (
            <X size={12} className="text-cyan-300" />
          ) : (
            <Sparkles size={11} className="text-cyan-300 animate-spin" />
          )}
        </div>
      </div>
    </motion.button>
  );
}
