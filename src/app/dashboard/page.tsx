import { redirect } from "next/navigation";
import { getCurrentUser } from "../actions";
import { createClient } from "@/lib/supabase-server";
import { Assignment, PendingConfirmation } from "@/lib/types";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (user.role === "admin") redirect("/admin");
  if (!user.pin_changed) redirect("/change-pin");

  const supabase = await createClient();

  const { data: assignments } = await supabase
    .from("assignments")
    .select("*, challenges(*, categories(*))")
    .eq("user_id", user.id)
    .order("day", { ascending: true });

  // Pending assignments from OTHER players (for peer confirmation)
  const { data: pendingConfirmations } = await supabase
    .from("assignments")
    .select(
      "*, challenges(title, description, points, difficulty, categories(name)), users(name)"
    )
    .eq("status", "pending")
    .neq("user_id", user.id);

  // All players with their emojis
  const { data: players } = await supabase
    .from("users")
    .select("name, emoji")
    .eq("role", "player")
    .order("name");

  return (
    <DashboardClient
      user={user}
      assignments={(assignments as unknown as Assignment[]) || []}
      pendingConfirmations={
        (pendingConfirmations as unknown as PendingConfirmation[]) || []
      }
      players={players || []}
    />
  );
}
