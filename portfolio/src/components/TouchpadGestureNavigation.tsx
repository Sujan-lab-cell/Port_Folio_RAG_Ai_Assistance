"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SECTION_SEQUENCE } from "@/src/lib/navigation/navigationTarget";
import { navigateToSection } from "@/src/lib/navigation/navigation";

export function getCurrentSectionIndex(pathname: string): number {
  if (pathname === "/" || pathname === "") return 0;

  const index = SECTION_SEQUENCE.findIndex((section) => {
    if (section.path === "/") return false;
    return pathname === section.path || pathname.startsWith(section.path + "/");
  });

  return index !== -1 ? index : 0;
}

function isInsideHorizontallyScrollableElement(target: HTMLElement | null): boolean {
  let el = target;
  while (el && el !== document.body && el !== document.documentElement) {
    const style = window.getComputedStyle(el);
    const overflowX = style.overflowX;
    if (
      (overflowX === "auto" || overflowX === "scroll") &&
      el.scrollWidth > el.clientWidth + 5
    ) {
      return true;
    }
    el = el.parentElement;
  }
  return false;
}

export function TouchpadGestureNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  // Use refs so event handlers always access up-to-date state without re-binding unnecessarily
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  const routerRef = useRef(router);
  routerRef.current = router;

  const isCooldownRef = useRef(false);
  const deltaXAccRef = useRef(0);
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Touch event tracking refs for touchscreens
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const handleSwipe = (direction: "next" | "previous") => {
      const currentIndex = getCurrentSectionIndex(pathnameRef.current);
      let targetIndex = currentIndex;

      if (direction === "next") {
        targetIndex = currentIndex + 1;
      } else if (direction === "previous") {
        targetIndex = currentIndex - 1;
      }

      // Edge cases: Home + left (do nothing), Contact + right (do nothing)
      if (targetIndex < 0 || targetIndex >= SECTION_SEQUENCE.length) {
        return;
      }

      const targetSection = SECTION_SEQUENCE[targetIndex];
      if (targetSection) {
        navigateToSection(targetSection.id, undefined, (url: string) => {
          routerRef.current.push(url);
        });
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (isCooldownRef.current) return;

      const target = e.target as HTMLElement | null;
      if (isInsideHorizontallyScrollableElement(target)) {
        return;
      }

      const absX = Math.abs(e.deltaX);
      const absY = Math.abs(e.deltaY);

      // 1. Ignore tiny horizontal movement or noise
      if (absX < 4 && absY < 4) return;

      // 2. DO NOT BREAK NORMAL SCROLLING:
      // If vertical movement is dominant (or significant compared to horizontal),
      // allow normal vertical scrolling to happen without intervention.
      if (absY >= absX * 0.8) {
        deltaXAccRef.current = 0;
        return;
      }

      // 3. Clear horizontal gesture when horizontal movement is clearly intentional
      if (absX > absY * 1.5) {
        deltaXAccRef.current += e.deltaX;

        if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
        resetTimerRef.current = setTimeout(() => {
          deltaXAccRef.current = 0;
        }, 250);

        const SWIPE_THRESHOLD = 60;

        if (deltaXAccRef.current <= -SWIPE_THRESHOLD) {
          // SWIPE RIGHT (fingers move right -> deltaX < 0) -> NEXT section
          if (e.cancelable) e.preventDefault();

          isCooldownRef.current = true;
          deltaXAccRef.current = 0;
          if (resetTimerRef.current) clearTimeout(resetTimerRef.current);

          handleSwipe("next");

          cooldownTimerRef.current = setTimeout(() => {
            isCooldownRef.current = false;
          }, 700);
        } else if (deltaXAccRef.current >= SWIPE_THRESHOLD) {
          // SWIPE LEFT (fingers move left -> deltaX > 0) -> PREVIOUS section
          if (e.cancelable) e.preventDefault();

          isCooldownRef.current = true;
          deltaXAccRef.current = 0;
          if (resetTimerRef.current) clearTimeout(resetTimerRef.current);

          handleSwipe("previous");

          cooldownTimerRef.current = setTimeout(() => {
            isCooldownRef.current = false;
          }, 700);
        }
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current || isCooldownRef.current) return;

      const target = e.target as HTMLElement | null;
      if (isInsideHorizontallyScrollableElement(target)) {
        touchStartRef.current = null;
        return;
      }

      if (e.changedTouches.length > 0) {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const diffX = endX - touchStartRef.current.x;
        const diffY = endY - touchStartRef.current.y;

        const absX = Math.abs(diffX);
        const absY = Math.abs(diffY);

        // Only trigger touch horizontal gesture if horizontal movement is clearly dominant and large
        if (absX > absY * 2 && absX > 80) {
          if (diffX > 0) {
            // SWIPE RIGHT (finger moves right) -> NEXT section
            isCooldownRef.current = true;
            handleSwipe("next");
            cooldownTimerRef.current = setTimeout(() => {
              isCooldownRef.current = false;
            }, 700);
          } else if (diffX < 0) {
            // SWIPE LEFT (finger moves left) -> PREVIOUS section
            isCooldownRef.current = true;
            handleSwipe("previous");
            cooldownTimerRef.current = setTimeout(() => {
              isCooldownRef.current = false;
            }, 700);
          }
        }
      }

      touchStartRef.current = null;
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);

      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    };
  }, []);

  return null;
}
