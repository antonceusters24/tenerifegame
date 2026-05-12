import { redirect } from "next/navigation";
import { getCurrentUser } from "../../actions";
import { createClient } from "@/lib/supabase-server";
import { getTable } from "@/lib/tables";
import AdminChallengesClient from "./AdminChallengesClient";

export default async function AdminChallengesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (user.role !== "admin") redirect("/dashboard");
  if (!user.pin_changed) redirect("/change-pin");

  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  const { data: challenges } = await supabase
    .from(getTable("challenges"))
    .select("*, categories(*)")
    .order("created_at", { ascending: false });

  // Get admin names for the creator dropdown
  const { data: admins } = await supabase
    .from("users")
    .select("name")
    .eq("role", "admin");

  const adminNames = (admins || []).map((a) => a.name.replace(" (Admin)", ""));

  // Get assigned challenge IDs to mark them as locked
  const { data: assignments } = await supabase
    .from(getTable("assignments"))
    .select("challenge_id, status, users:user_id(name)")
    .order("day", { ascending: true });

  // Build a map of challenge_id -> assignment info
  const assignedMap: Record<string, { status: string; playerName: string }[]> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (assignments || []).forEach((a: any) => {
    if (!assignedMap[a.challenge_id]) assignedMap[a.challenge_id] = [];
    const name = Array.isArray(a.users) ? a.users[0]?.name : a.users?.name;
    assignedMap[a.challenge_id].push({
      status: a.status,
      playerName: name?.replace(" (Admin)", "") || "?",
    });
  });

  return (
    <AdminChallengesClient
      user={user}
      categories={categories || []}
      challenges={challenges || []}
      adminNames={adminNames}
      assignedMap={assignedMap}
    />
  );
}
