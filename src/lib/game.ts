export const GAME_DATES = [
  "2026-05-12", // Dag 1 — aankomst
  "2026-05-13", // Dag 2
  "2026-05-14", // Dag 3
  "2026-05-15", // Dag 4
  "2026-05-16", // Dag 5
  "2026-05-17", // Dag 6
  "2026-05-18", // Dag 7 — finaal gevecht
];

export const TRIP_START = "2026-05-12";

// Activation:   12 mei 17:00 UTC  → countdown ends, day 1 starts (no challenges yet)
// Challenges:   13 mei 08:00 UTC  → day 1 challenges unlock
// Game end:     18 mei 23:00 UTC  → end screen shows
export const ACTIVATION_TIME = "2026-05-12T17:00:00Z";
const CHALLENGES_START = "2026-05-13T08:00:00Z";
const GAME_END = "2026-05-18T23:00:00Z";

export function getLocalDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
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
