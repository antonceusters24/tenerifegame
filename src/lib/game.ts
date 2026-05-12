import { isTestMode } from "./tables";

// Production game dates
const PROD_GAME_DATES = [
  "2026-05-12",
  "2026-05-13",
  "2026-05-14",
  "2026-05-15",
  "2026-05-16",
  "2026-05-17",
  "2026-05-18",
];

const PROD_TRIP_START = "2026-05-12";
const PROD_ACTIVATION_TIME = "2026-05-12T16:00:00Z"; // 18:00 Belgian time (1h before flight)
const PROD_CHALLENGES_START = "2026-05-13T08:00:00Z";
const PROD_GAME_END = "2026-05-19T03:00:00Z"; // 4:00 AM Tenerife — last challenges expired

// Test game dates (shifted so today May 12 = before game)
function buildTestDates(): string[] {
  const dates: string[] = [];
  const start = new Date("2026-05-14");
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

const TEST_GAME_DATES = buildTestDates();
const TEST_TRIP_START = TEST_GAME_DATES[0];
const TEST_ACTIVATION_TIME = "2026-05-14T10:30:00Z";
const TEST_CHALLENGES_START = TEST_GAME_DATES[1] + "T08:00:00Z"; // 9 AM Canary, same as prod
const TEST_GAME_END = TEST_GAME_DATES[TEST_GAME_DATES.length - 1] + "T23:00:00Z";

// Export the right set based on test mode
export const GAME_DATES = isTestMode ? TEST_GAME_DATES : PROD_GAME_DATES;
export const TRIP_START = isTestMode ? TEST_TRIP_START : PROD_TRIP_START;
export const ACTIVATION_TIME = isTestMode ? TEST_ACTIVATION_TIME : PROD_ACTIVATION_TIME;
const CHALLENGES_START = isTestMode ? TEST_CHALLENGES_START : PROD_CHALLENGES_START;
const GAME_END = isTestMode ? TEST_GAME_END : PROD_GAME_END;

// Challenge day resets at 4:00 AM Tenerife time (so nights out still count for that day)
export const CHALLENGE_RESET_HOUR = 4;
export const CHALLENGE_RESET_MINUTE = 0;

export function getLocalDateString(): string {
  // Returns the "game day" date string, accounting for reset time boundary
  // Before reset time Tenerife = still counts as previous day
  const now = new Date();
  const tenerife = new Date(now.toLocaleString("en-US", { timeZone: "Atlantic/Canary" }));
  const currentMinutes = tenerife.getHours() * 60 + tenerife.getMinutes();
  const resetMinutes = CHALLENGE_RESET_HOUR * 60 + CHALLENGE_RESET_MINUTE;
  if (currentMinutes < resetMinutes) {
    tenerife.setDate(tenerife.getDate() - 1);
  }
  return `${tenerife.getFullYear()}-${String(tenerife.getMonth() + 1).padStart(2, "0")}-${String(tenerife.getDate()).padStart(2, "0")}`;
}

export function getNextResetTime(): Date {
  // Returns the next reset time in Tenerife as a Date object
  const now = new Date();
  const tenerife = new Date(now.toLocaleString("en-US", { timeZone: "Atlantic/Canary" }));
  const currentMinutes = tenerife.getHours() * 60 + tenerife.getMinutes();
  const resetMinutes = CHALLENGE_RESET_HOUR * 60 + CHALLENGE_RESET_MINUTE;
  const target = new Date(tenerife);
  if (currentMinutes < resetMinutes) {
    target.setHours(CHALLENGE_RESET_HOUR, CHALLENGE_RESET_MINUTE, 0, 0);
  } else {
    target.setDate(target.getDate() + 1);
    target.setHours(CHALLENGE_RESET_HOUR, CHALLENGE_RESET_MINUTE, 0, 0);
  }
  // Convert back: compute offset between tenerife representation and real now
  const offsetMs = now.getTime() - tenerife.getTime();
  return new Date(target.getTime() + offsetMs);
}

export function getCurrentDay(): number | null {
  const now = new Date();
  if (now < new Date(ACTIVATION_TIME)) return null;
  const today = getLocalDateString();
  const index = GAME_DATES.indexOf(today);
  return index >= 0 ? index + 1 : null;
}

export function getGameStatus(): "before" | "active" | "after" {
  const now = new Date();
  if (now < new Date(ACTIVATION_TIME)) return "before";
  if (now >= new Date(GAME_END)) return "after";
  return "active";
}

export function getDaysUntilStart(): number {
  const target = new Date(ACTIVATION_TIME);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function challengesAvailable(): boolean {
  return new Date() >= new Date(CHALLENGES_START);
}

export function isServerGamePeriod(): boolean {
  const now = new Date();
  const start = new Date(ACTIVATION_TIME);
  const end = new Date(GAME_DATES[GAME_DATES.length - 1] + "T23:59:59Z");
  end.setDate(end.getDate() + 1);
  return now >= start && now <= end;
}
