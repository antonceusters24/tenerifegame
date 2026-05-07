"use client";

import { useEffect, useRef, useState } from "react";

export default function PullToRefresh() {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const isPulling = useRef(false);

  const THRESHOLD = 80;

  useEffect(() => {
    // Only activate in standalone mode (home screen app)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.navigator as any).standalone === true;

    if (!isStandalone) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
        isPulling.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling.current) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0 && window.scrollY === 0) {
        setPulling(true);
        setPullDistance(Math.min(dy * 0.5, THRESHOLD + 20));
        // Move page content down
        document.body.style.transform = `translateY(${Math.min(dy * 0.5, THRESHOLD + 20)}px)`;
        document.body.style.transition = "none";
        if (dy > 10) e.preventDefault();
      } else {
        setPulling(false);
        setPullDistance(0);
        document.body.style.transform = "";
      }
    };

    const handleTouchEnd = () => {
      if (pullDistance >= THRESHOLD) {
        window.location.reload();
      } else {
        // Snap back with animation
        document.body.style.transition = "transform 0.3s ease";
        document.body.style.transform = "";
      }
      isPulling.current = false;
      setPulling(false);
      setPullDistance(0);
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [pullDistance]);

  if (!pulling) return null;

  const progress = Math.min(pullDistance / THRESHOLD, 1);

  return (
    <div
      className="fixed left-0 right-0 z-[9999] flex items-center justify-center pointer-events-none"
      style={{ top: `${pullDistance - 44}px` }}
    >
      <div
        className={`h-8 w-8 rounded-full border-2 border-amber-400 border-t-transparent ${progress >= 1 ? "animate-spin" : ""}`}
        style={{
          transform: progress < 1 ? `rotate(${progress * 360}deg)` : undefined,
          opacity: progress,
        }}
      />
    </div>
  );
}
