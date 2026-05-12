import { redirect } from "next/navigation";
import { getCurrentUser } from "../actions";
import { createClient } from "@/lib/supabase-server";
import { getTable } from "@/lib/tables";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (user.role !== "admin") redirect("/dashboard");
  if (!user.pin_changed) redirect("/change-pin");

  const supabase = await createClient();

  // Get assignments with challenge and user info
  const { data: assignments } = await supabase
    .from(getTable("assignments"))
    .select("*, challenges:challenge_id(id, title, difficulty, points, bonus_description, bonus_points, created_by_admin, categories(name)), users:user_id(name, emoji)")
    .order("day", { ascending: true });

  // Get players
  const { data: players } = await supabase
    .from("users")
    .select("id, name, emoji")
    .eq("role", "player")
    .order("name");

  // Count total challenges by this admin (to show "X waiting to be drawn")
  const adminName = user.name.replace(" (Admin)", "");
  const { count: totalMyChallenges } = await supabase
    .from(getTable("challenges"))
    .select("id", { count: "exact", head: true })
    .eq("created_by_admin", adminName);

  return (
    <AdminClient
      user={user}
      assignments={assignments || []}
      players={players || []}
      totalMyChallenges={totalMyChallenges || 0}
    />
  );
}
