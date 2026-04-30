export const GAME_DATES = [
  "2026-05-12",
  "2026-05-13",
  "2026-05-14",
  "2026-05-15",
  "2026-05-16",
  "2026-05-17",
  "2026-05-18",
];

export const TRIP_START = "2026-05-12";

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
