"use client";

import { SECTION_SEQUENCE } from "./navigationTarget";

const HIGHLIGHT_CLASS = "ai-target-highlight";
const HIGHLIGHT_DURATION = 3500;

export function scrollToAndHighlightTarget(targetId: string): boolean {
  if (typeof window === "undefined" || !targetId) return false;

  const normalizedId = targetId.toLowerCase().trim();
  const element =
    document.getElementById(targetId) ||
    document.getElementById(normalizedId) ||
    document.querySelector(`[data-target-id="${normalizedId}"]`);

  if (element) {
    element.scrollIntoView({ behavior: "smooth", block: "center" });

    element.classList.remove(HIGHLIGHT_CLASS);
    // Trigger reflow
    void element.offsetWidth;
    element.classList.add(HIGHLIGHT_CLASS);

    setTimeout(() => {
      element.classList.remove(HIGHLIGHT_CLASS);
    }, HIGHLIGHT_DURATION);

    return true;
  }

  return false;
}

export function navigateToSection(sectionId: string, itemId?: string, routerPush?: (url: string) => void) {
  if (typeof window === "undefined") return;

  const normalizedSection = sectionId.toLowerCase().trim();
  const sectionInfo = SECTION_SEQUENCE.find((s) => s.id === normalizedSection);
  const targetRoute = sectionInfo ? sectionInfo.path : `/${normalizedSection}`;
  const currentPath = window.location.pathname;

  if (itemId) {
    sessionStorage.setItem("pendingTargetId", itemId);
  } else {
    sessionStorage.removeItem("pendingTargetId");
  }

  const isSameRoute =
    currentPath === targetRoute ||
    (currentPath === "/" && targetRoute === "/") ||
    (currentPath.startsWith(targetRoute) && targetRoute !== "/");

  if (isSameRoute) {
    if (itemId) {
      setTimeout(() => {
        scrollToAndHighlightTarget(itemId);
        sessionStorage.removeItem("pendingTargetId");
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  } else {
    if (routerPush) {
      routerPush(targetRoute);
    } else {
      window.location.href = targetRoute;
    }
  }
}

/**
 * Hook or helper to check and process any pending highlight target stored in sessionStorage
 * after route navigation.
 */
export function processPendingHighlight() {
  if (typeof window === "undefined") return;
  const pendingId = sessionStorage.getItem("pendingTargetId");
  if (pendingId) {
    // Retry finding element as DOM mounts
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      const success = scrollToAndHighlightTarget(pendingId);
      if (success || attempts > 15) {
        clearInterval(interval);
        sessionStorage.removeItem("pendingTargetId");
      }
    }, 200);
  }
}
