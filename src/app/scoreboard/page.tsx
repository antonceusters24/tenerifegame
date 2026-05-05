import { redirect } from "next/navigation";
import { getCurrentUser } from "../actions";
import { createClient } from "@/lib/supabase-server";
import { getTable } from "@/lib/tables";
import { ScoreboardEntry } from "@/lib/types";
import ScoreboardClient from "./ScoreboardClient";

export default async function ScoreboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const supabase = await createClient();
  const { data: scores } = await supabase.from(getTable("scoreboard")).select("*");

  // Get all assignments with challenge details for all players
  const { data: allAssignments } = await supabase
    .from(getTable("assignments"))
    .select(`*, ${getTable("challenges")}(title, points, bonus_points, difficulty, categories(name)), users(name)`)
    .order("day", { ascending: true });

  // Chinese Fucking sessions
  const { data: cfSessions } = await supabase
    .from("cf_sessions")
    .select("*")
    .order("created_at", { ascending: true });

  // All players with their emojis and avatars
  const { data: players } = await supabase
    .from("users")
    .select("name, emoji, avatar_url")
    .eq("role", "player");

  const entries = (scores as unknown as ScoreboardEntry[]) || [];
  const emojiMap: Record<string, string> = {};
  const avatarMap: Record<string, string | null> = {};
  (players || []).forEach((p) => {
    emojiMap[p.name] = p.emoji || "🎮";
    avatarMap[p.name] = p.avatar_url || null;
  });

  // Normalize nested data: when using test tables, the key might be "challenges_test" instead of "challenges"
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const normalizedAssignments = ((allAssignments as any[]) || []).map((a) => {
    const challenges = a.challenges || a.challenges_test || null;
    return { ...a, challenges };
  });

  return (
    <ScoreboardClient
      user={user}
      entries={entries}
      allAssignments={normalizedAssignments}
      cfSessions={cfSessions || []}
      emojiMap={emojiMap}
      avatarMap={avatarMap}
    />
  );
}
