export const GAME_DATES = [
  "2026-04-28",
  "2026-04-29",
  "2026-04-30",
  "2026-05-01",
  "2026-05-02",
  "2026-05-03",
];

export function getLocalDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function getCurrentDay(): number | null {
  const today = getLocalDateString();
  const index = GAME_DATES.indexOf(today);
  return index >= 0 ? index + 1 : null;
}

export function getGameStatus(): "before" | "active" | "after" {
  const today = getLocalDateString();
  if (today < GAME_DATES[0]) return "before";
  if (today > GAME_DATES[GAME_DATES.length - 1]) return "after";
  return "active";
}

export function getDaysUntilStart(): number {
  const start = new Date(GAME_DATES[0] + "T00:00:00");
  const now = new Date();
  return Math.max(
    0,
    Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );
}

export function isServerGamePeriod(): boolean {
  const now = new Date();
  const start = new Date(GAME_DATES[0] + "T00:00:00Z");
  const end = new Date(GAME_DATES[GAME_DATES.length - 1] + "T23:59:59Z");
  start.setDate(start.getDate() - 1);
  end.setDate(end.getDate() + 1);
  return now >= start && now <= end;
}
