import { redirect } from "next/navigation";
import { getCurrentUser } from "../actions";
import { createClient } from "@/lib/supabase-server";
import { ScoreboardEntry } from "@/lib/types";
import ScoreboardClient from "./ScoreboardClient";

export default async function ScoreboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const supabase = await createClient();
  const { data: scores } = await supabase.from("scoreboard").select("*");

  // Get all assignments with challenge details for all players
  const { data: allAssignments } = await supabase
    .from("assignments")
    .select("*, challenges(title, points, difficulty, categories(name)), users(name)")
    .order("day", { ascending: true });

  // Chinese Fucking scores
  const { data: cfScores } = await supabase
    .from("chinese_fucking_scores")
    .select("*");

  const entries = (scores as ScoreboardEntry[]) || [];

  return (
    <ScoreboardClient
      user={user}
      entries={entries}
      allAssignments={allAssignments || []}
      cfScores={cfScores || []}
    />
  );
}
