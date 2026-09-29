"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { SECTION_SEQUENCE } from "@/src/lib/navigation/navigationTarget";
import { useLanguage } from "@/src/i18n";

interface SectionNavigationProps {
  currentSection: string;
}

export function SectionNavigation({ currentSection }: SectionNavigationProps) {
  const { lang } = useLanguage();

  const currentIndex = SECTION_SEQUENCE.findIndex((s) => s.id === currentSection);
  if (currentIndex === -1) return null;

  const prevSection = currentIndex > 0 ? SECTION_SEQUENCE[currentIndex - 1] : null;
  const nextSection = currentIndex < SECTION_SEQUENCE.length - 1 ? SECTION_SEQUENCE[currentIndex + 1] : null;

  const prevLabel = prevSection
    ? lang === "ja"
      ? `← ${prevSection.labelJA}`
      : `← ${prevSection.labelEN}`
    : "";

  const nextLabel = nextSection
    ? lang === "ja"
      ? `${nextSection.labelJA} →`
      : `${nextSection.labelEN} →`
    : "";

  return (
    <div className="mx-auto mt-16 max-w-7xl border-t border-slate-900/10 pt-8 dark:border-white/10 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        {/* Previous Section Control */}
        {prevSection ? (
          <Link
            href={prevSection.path}
            className="group inline-flex items-center gap-2 rounded-xl border border-slate-900/10 bg-white/60 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:border-cyan-500/50 hover:bg-cyan-500/10 hover:text-cyan-600 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-300 dark:hover:border-cyan-500/50 dark:hover:text-cyan-300 cursor-pointer"
            aria-label={`Go to previous section: ${prevSection.labelEN}`}
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1 text-cyan-500" />
            <span>{prevLabel}</span>
          </Link>
        ) : (
          <div aria-hidden="true" />
        )}

        {/* Next Section Control */}
        {nextSection ? (
          <Link
            href={nextSection.path}
            className="group inline-flex items-center gap-2 rounded-xl border border-slate-900/10 bg-white/60 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:border-cyan-500/50 hover:bg-cyan-500/10 hover:text-cyan-600 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-300 dark:hover:border-cyan-500/50 dark:hover:text-cyan-300 cursor-pointer ml-auto"
            aria-label={`Go to next section: ${nextSection.labelEN}`}
          >
            <span>{nextLabel}</span>
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1 text-cyan-500" />
          </Link>
        ) : (
          <div aria-hidden="true" />
        )}
      </div>
    </div>
  );
}
