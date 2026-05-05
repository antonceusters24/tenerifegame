import { redirect } from "next/navigation";
import { getCurrentUser } from "../actions";
import { createClient } from "@/lib/supabase-server";
import { getTable } from "@/lib/tables";
import { Assignment, PendingConfirmation } from "@/lib/types";
import { getCurrentDay, GAME_DATES } from "@/lib/game";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (user.role === "admin") redirect("/admin");
  if (!user.pin_changed) redirect("/change-pin");

  const supabase = await createClient();

  // Auto-expire old active assignments from previous days (backup for cron)
  const currentDay = getCurrentDay();
  if (currentDay && currentDay > 1) {
    const expiredDays = Array.from({ length: currentDay - 1 }, (_, i) => i + 1);
    await supabase
      .from(getTable("assignments"))
      .update({ status: "expired", completed_at: new Date().toISOString() })
      .eq("status", "active")
      .in("day", expiredDays);
  }

  const { data: assignments } = await supabase
    .from(getTable("assignments"))
    .select(`*, ${getTable("challenges")}(*, categories(*))`)
    .eq("user_id", user.id)
    .order("day", { ascending: true });

  // Pending assignments from OTHER players (for peer confirmation)
  const { data: pendingConfirmations } = await supabase
    .from(getTable("assignments"))
    .select(
      `*, ${getTable("challenges")}(title, description, points, difficulty, created_by_admin, bonus_description, bonus_points, categories(name)), users(name)`
    )
    .eq("status", "pending")
    .neq("user_id", user.id);

  // Normalize nested challenge data (key might be "challenges_test" when using test tables)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const normalizedAssignments = ((assignments as any[]) || []).map((a) => {
    const challenges = a.challenges || a.challenges_test || null;
    return { ...a, challenges };
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const normalizedPending = ((pendingConfirmations as any[]) || []).map((a) => {
    const challenges = a.challenges || a.challenges_test || null;
    return { ...a, challenges };
  });

  // All players with their emojis
  const { data: players } = await supabase
    .from("users")
    .select("name, emoji, avatar_url")
    .eq("role", "player")
    .order("name");

  // End-screen ranks
  const [{ data: scoreRows }, { data: cfRows }] = await Promise.all([
    supabase.from(getTable("scoreboard")).select("user_id, name, total_points").order("total_points", { ascending: false }),
    supabase.from("chinese_fucking_scores").select("player_name, wins, points"),
  ]);

  let endStats: { challengeRank: number; cfRank: number; totalPlayers: number } | undefined;
  let podiumPlayers: { name: string; avatar_url: string | null; emoji: string; total_points: number }[] = [];
  let cfPodiumPlayers: { name: string; avatar_url: string | null; emoji: string; total_points: number }[] = [];
  if (scoreRows && scoreRows.length > 0) {
    const challengeRank = scoreRows.findIndex((s) => s.user_id === user.id) + 1 || scoreRows.length;
    const sortedCf = [...(cfRows || [])].sort((a, b) => b.wins - a.wins || b.points - a.points);
    const cfIdx = sortedCf.findIndex((s) => s.player_name === user.name);
    const cfRank = cfIdx >= 0 ? cfIdx + 1 : sortedCf.length;
    endStats = { challengeRank, cfRank, totalPlayers: scoreRows.length };
    podiumPlayers = scoreRows.slice(0, 4).map((s) => {
      const p = (players || []).find((pl) => pl.name === s.name);
      return {
        name: s.name,
        avatar_url: p?.avatar_url ?? null,
        emoji: p?.emoji ?? "🎮",
        total_points: s.total_points,
      };
    });
    cfPodiumPlayers = sortedCf.slice(0, 4).map((s) => {
      const p = (players || []).find((pl) => pl.name === s.player_name);
      return {
        name: s.player_name,
        avatar_url: p?.avatar_url ?? null,
        emoji: p?.emoji ?? "🎮",
        total_points: s.points ?? 0,
      };
    });
  }

  return (
    <DashboardClient
      user={user}
      assignments={(normalizedAssignments as unknown as Assignment[]) || []}
      pendingConfirmations={
        (normalizedPending as unknown as PendingConfirmation[]) || []
      }
      players={players || []}
      endStats={endStats}
      podiumPlayers={podiumPlayers}
      cfPodiumPlayers={cfPodiumPlayers}
    />
  );
}
