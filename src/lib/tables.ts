const isTestMode =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_USE_TEST_TABLES === "true"
    : process.env.NEXT_PUBLIC_USE_TEST_TABLES === "true";

const TABLE_MAP = {
  challenges: isTestMode ? "challenges_test" : "challenges",
  assignments: isTestMode ? "assignments_test" : "assignments",
  confirmations: isTestMode ? "confirmations_test" : "confirmations",
  scoreboard: isTestMode ? "scoreboard_test" : "scoreboard",
} as const;

type TableName = keyof typeof TABLE_MAP;

export function getTable(name: TableName): string {
  return TABLE_MAP[name];
}

export { isTestMode };
