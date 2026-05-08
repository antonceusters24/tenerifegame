"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keydown",
  "scroll",
  "touchstart",
  "touchmove",
  "click",
] as const;

// Pages where idle timeout should NOT apply
const PUBLIC_PATHS = ["/", "/change-pin"];

export default function IdleTimeout() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = useCallback(async () => {
    try {
      const res = await fetch("/api/idle-logout", { method: "POST" });
      if (res.ok) {
        router.push("/");
      }
    } catch {
      // Fallback: redirect anyway
      router.push("/");
    }
  }, [router]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(handleLogout, IDLE_TIMEOUT_MS);
  }, [handleLogout]);

  useEffect(() => {
    // Don't run on public pages
    if (PUBLIC_PATHS.includes(pathname)) return;

    resetTimer();

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, resetTimer, { passive: true });
    }

    // Also reset on visibility change (user switches back to tab/app)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        // Check if we've been hidden long enough to expire
        resetTimer();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, resetTimer);
      }
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [pathname, resetTimer]);

  // Track last activity time in localStorage so we can check on visibility change
  useEffect(() => {
    if (PUBLIC_PATHS.includes(pathname)) return;

    const trackActivity = () => {
      localStorage.setItem("lastActivity", Date.now().toString());
    };

    // Set initial activity timestamp
    trackActivity();

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, trackActivity, { passive: true });
    }

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        const last = localStorage.getItem("lastActivity");
        if (last) {
          const elapsed = Date.now() - parseInt(last, 10);
          if (elapsed >= IDLE_TIMEOUT_MS) {
            handleLogout();
          }
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, trackActivity);
      }
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [pathname, handleLogout]);

  return null;
}
